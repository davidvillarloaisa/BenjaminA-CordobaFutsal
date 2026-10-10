/* =========================================================
   GUARDADO
   - Todo cambio se guarda al instante en el navegador (localStorage).
   - Si Firebase está configurado (js/firebase-config.js), además se envía a
     Firestore: agrupado (una escritura por pausa) y SOLO el apartado que
     cambió, para que dos personas editando apartados distintos no se pisen.
   - Los cambios de otras personas llegan en directo (onSnapshot) y se
     aplican sin interrumpir lo que estás escribiendo.
========================================================= */
const SAVE_DELAY = 400;               // ms de pausa antes de guardar
const TIMEOUT = "__timeout__";

let lastSavedOK = true;
let writeDebounce = null, writeInFlight = null, pendingResolvers = [];
let saveTimer = null;
let cloudMode = "off";                // off | connecting | online | pending | error
let fsDoc = null;                     // referencia al documento de Firestore
let hasCloud = false;                 // true si hay conexión con Firebase configurada
let remoteExists = null;              // true / false / null (desconocido)
let pendingInitialPush = false;
let synced = {};                      // última versión conocida en la nube, por apartado
let lastCloudToast = 0;

/* ---------- utilidades ---------- */
function withTimeout(p, ms){ return Promise.race([p, new Promise(r=>setTimeout(()=>r(TIMEOUT), ms))]); }
function cleanCopy(v){ return JSON.parse(JSON.stringify(v)); }
/* JSON con claves ordenadas: Firestore devuelve los mapas ordenados alfabéticamente,
   así la comparación local/nube no da falsos cambios. */
function stableStringify(v){
  if(v === null || typeof v !== "object") return JSON.stringify(v);
  if(Array.isArray(v)) return "["+v.map(stableStringify).join(",")+"]";
  return "{"+Object.keys(v).sort().filter(k=>v[k]!==undefined).map(k=>JSON.stringify(k)+":"+stableStringify(v[k])).join(",")+"}";
}
function topKeys(obj){
  const m = {};
  Object.keys(obj||{}).forEach(k=>{ if(k.charAt(0)!=="_") m[k] = stableStringify(obj[k]); });
  return m;
}
function isTypingNow(){
  const a = document.activeElement;
  return !!a && (a.tagName==="INPUT" || a.tagName==="TEXTAREA" || a.tagName==="SELECT");
}

/* ---------- almacenamiento local ---------- */
function readLocal(){
  try{ const raw = localStorage.getItem(LS_KEY); return raw ? JSON.parse(raw) : null; }
  catch(e){ return null; }
}
function writeLocal(){
  try{ localStorage.setItem(LS_KEY, JSON.stringify(state)); return true; }
  catch(e){ return false; }
}

/* ---------- Firebase ---------- */
function firebaseConfigured(){
  const c = window.FIREBASE_CONFIG || {};
  const bad = /^(TU_|YOUR_|XXXX)/i;
  return !!(c.apiKey && c.projectId && !bad.test(c.apiKey) && !bad.test(c.projectId));
}
function loadScript(src){
  return new Promise((resolve, reject)=>{
    const s = document.createElement("script");
    const t = setTimeout(()=>reject(new Error("Tiempo agotado cargando "+src)), 8000);
    s.src = src;
    s.onload = ()=>{ clearTimeout(t); resolve(); };
    s.onerror = ()=>{ clearTimeout(t); reject(new Error("No se pudo cargar "+src)); };
    document.head.appendChild(s);
  });
}
async function initFirebase(){
  if(!firebaseConfigured()){ cloudMode = "off"; return false; }
  try{
    cloudMode = "connecting";
    const base = "https://www.gstatic.com/firebasejs/"+(window.FIREBASE_SDK_VERSION||"10.12.5")+"/";
    if(!window.firebase){
      await loadScript(base+"firebase-app-compat.js");
      await loadScript(base+"firebase-firestore-compat.js");
      if(window.FIREBASE_USE_ANONYMOUS_AUTH) await loadScript(base+"firebase-auth-compat.js");
    }
    if(!firebase.apps.length) firebase.initializeApp(window.FIREBASE_CONFIG);
    if(window.FIREBASE_USE_ANONYMOUS_AUTH) await firebase.auth().signInAnonymously();
    const db = firebase.firestore();
    try{ await db.enablePersistence({synchronizeTabs:true}); }catch(e){ /* sin caché offline en este navegador: no pasa nada */ }
    fsDoc = db.collection(window.FIREBASE_COLLECTION || "equipos").doc(window.FIREBASE_DOC_ID || "equipo");
    cloudMode = "online";
    return true;
  }catch(e){
    console.error(e);
    cloudMode = "error";
    handleCloudError(e);
    return false;
  }
}
function handleCloudError(e){
  const code = (e && e.code) || "";
  let msg = "Firebase: " + ((e && e.message) || "error desconocido");
  if(code === "permission-denied") msg = "Firebase rechazó el acceso. Revisa las reglas de Firestore (ver LEEME.md).";
  else if(code === "unavailable" || /offline/i.test(msg)) msg = "Sin conexión con Firebase. Tus cambios se guardan en este navegador y se enviarán al volver.";
  else if(code === "auth/operation-not-allowed" || code === "auth/admin-restricted-operation") msg = "Activa el acceso Anónimo en Firebase Authentication o pon FIREBASE_USE_ANONYMOUS_AUTH en false.";
  const now = Date.now();
  if(now - lastCloudToast > 30000){ lastCloudToast = now; toast(msg, "warn"); }
}

/* Carga inicial: la nube si existe; si no, lo guardado en este navegador; si no, datos de ejemplo. */
async function loadStateAsync(){
  const local = readLocal();
  hasCloud = await initFirebase();
  if(!hasCloud) return local ? mergeState(local) : defaultState();

  let status = "unknown", data = null;
  try{
    const snap = await withTimeout(fsDoc.get(), 8000);
    if(snap !== TIMEOUT){
      status = snap.exists ? "exists" : "missing";
      if(snap.exists) data = snap.data();
    }
  }catch(e){ handleCloudError(e); }

  if(status === "exists"){
    remoteExists = true;
    synced = topKeys(data);
    return mergeState(data);
  }
  const st = local ? mergeState(local) : defaultState();
  if(status === "missing"){ remoteExists = false; synced = {}; pendingInitialPush = true; }  // se subirá todo al primer guardado
  else { remoteExists = null; synced = topKeys(st); }                                          // sin conexión: solo se enviará lo que cambies
  return st;
}

/* ---------- fusión de cambios (3 vías) ----------
   base   = lo último que sabíamos de la nube
   local  = lo que hay ahora en esta pantalla
   remote = lo que hay ahora en la nube
   Si solo cambió uno de los lados, gana ese. Si cambiaron los dos, se fusiona elemento a elemento
   (usando el "id" de jugadores, sesiones, tareas…) y, en un mismo valor, gana lo local.
   Siempre se modifica "local" en el sitio, para no romper los campos que estás editando. */
function isObj(v){ return v !== null && typeof v === "object" && !Array.isArray(v); }
function eq(a,b){ return stableStringify(a) === stableStringify(b); }
function hasIds(a){ return Array.isArray(a) && a.length > 0 && a.every(x=>isObj(x) && x.id !== undefined); }

function adopt(local, remote){                       // deja "local" igual que "remote", conservando los objetos existentes
  if(remote === undefined) return undefined;
  if(isObj(local) && isObj(remote)){
    Object.keys(local).forEach(k=>{ if(!(k in remote)) delete local[k]; });
    Object.keys(remote).forEach(k=>{ local[k] = adopt(local[k], remote[k]); });
    return local;
  }
  if(Array.isArray(local) && Array.isArray(remote)){
    if(hasIds(remote)){
      const L = new Map(local.filter(x=>isObj(x) && x.id !== undefined).map(x=>[x.id, x]));
      const out = remote.map(r=> L.has(r.id) ? adopt(L.get(r.id), r) : cloneData(r));
      local.splice(0, local.length, ...out);
    }else{
      local.splice(0, local.length, ...cloneData(remote));
    }
    return local;
  }
  return cloneData(remote);
}
function mergeArrays(base, local, remote){
  if(!hasIds(local) && !hasIds(remote)) return local;          // listas simples (p.ej. ideas): gana lo tuyo
  const byId = (arr)=> new Map((Array.isArray(arr)?arr:[]).filter(x=>isObj(x) && x.id !== undefined).map(x=>[x.id, x]));
  const B = byId(base), L = byId(local), R = byId(remote);
  const ids = [...remote.map(x=>x && x.id), ...local.map(x=>x && x.id)].filter((v,i,arr)=> v !== undefined && arr.indexOf(v) === i);
  const out = [];
  ids.forEach(id=>{
    const b = B.get(id), l = L.get(id), r = R.get(id);
    if(l && r) out.push(merge3(b, l, r));                      // está en los dos: se fusiona
    else if(l && !r){ if(b && eq(l, b)) return; out.push(l); } // otro lo borró (y tú no lo tocaste) → se borra; si lo añadiste/editaste tú → se queda
    else if(r && !l){ if(b) return; out.push(cloneData(r)); }  // tú lo borraste → sigue borrado; si lo añadió otro → se añade
  });
  local.splice(0, local.length, ...out);
  return local;
}
function merge3(base, local, remote){
  if(eq(local, remote)) return local;
  if(eq(local, base)) return adopt(local, remote);             // tú no habías cambiado nada: adoptar lo de la nube
  if(eq(remote, base)) return local;                           // la nube no había cambiado: mantener lo tuyo
  if(isObj(local) && isObj(remote)){
    const b = isObj(base) ? base : {};
    new Set([...Object.keys(local), ...Object.keys(remote)]).forEach(k=>{
      const m = merge3(b[k], local[k], remote[k]);
      if(m === undefined) delete local[k]; else local[k] = m;
    });
    return local;
  }
  if(Array.isArray(local) && Array.isArray(remote)) return mergeArrays(base, local, remote);
  return local;                                                // mismo valor cambiado por los dos: gana lo tuyo
}

/* ---------- guardar ---------- */
function save(silent){
  updateSaveStatusUI(true);
  return new Promise((resolve)=>{
    pendingResolvers.push(resolve);
    clearTimeout(writeDebounce);
    writeDebounce = setTimeout(()=>{ writeDebounce = null; flushSave(silent); }, SAVE_DELAY);
  });
}
async function flushSave(silent){
  if(writeInFlight){ await writeInFlight; }          // nunca dos escrituras a la vez
  const resolvers = pendingResolvers; pendingResolvers = [];
  writeInFlight = (async ()=>{
    const okLocal = writeLocal();
    if(!okLocal) toast("No cabe en la memoria de este navegador. Exporta una copia de seguridad.", "warn");
    let okCloud = true;
    if(fsDoc) okCloud = await pushToCloud();
    lastSavedOK = okLocal && okCloud;
    updateSaveStatusUI(false);
  })();
  await writeInFlight;
  writeInFlight = null;
  resolvers.forEach(r=>r());
  flushRender();
}
function fullPayload(){
  const p = cleanCopy(state);
  Object.keys(p).forEach(k=>{ if(k.charAt(0)==="_") delete p[k]; });
  p._updatedAt = firebase.firestore.FieldValue.serverTimestamp();
  return p;
}
/* Escritura con transacción: lee la nube justo antes de escribir y, si otra persona cambió ese
   apartado mientras tanto, fusiona en vez de pisar. */
async function transactionalPush(changed){
  const db = firebase.firestore();
  const merged = [];
  const r = await db.runTransaction(async (tx)=>{
    merged.length = 0;
    const snap = await tx.get(fsDoc);
    if(!snap.exists){ tx.set(fsDoc, fullPayload()); return "set"; }
    const data = snap.data();
    const remote = topKeys(data);
    const payload = {};
    changed.forEach(k=>{
      if(remote[k] !== undefined && remote[k] !== synced[k]){            // alguien cambió este apartado desde que lo leímos
        const base = synced[k] !== undefined ? JSON.parse(synced[k]) : undefined;
        state[k] = merge3(base, state[k], cloneData(data[k]));
        merged.push(k);
      }
      payload[k] = cleanCopy(state[k]);
    });
    payload._updatedAt = firebase.firestore.FieldValue.serverTimestamp();
    tx.update(fsDoc, payload);
    return "update";
  });
  return {r, merged};
}
async function pushToCloud(){
  const cur = topKeys(state);
  const changed = Object.keys(cur).filter(k => cur[k] !== synced[k]);
  if(!changed.length && remoteExists) return true;

  const size = JSON.stringify(state).length;
  if(size > 900000) toast("Los datos se acercan al límite de 1 MB de un documento de Firestore. Avisa para repartirlos en varios documentos.", "warn");

  try{
    let res = null;
    if(remoteExists === false){
      const r = await withTimeout(fsDoc.set(fullPayload()), 10000);
      if(r === TIMEOUT){ cloudMode = "pending"; changed.forEach(k=>{ synced[k] = cur[k]; }); return true; }
    }else{
      try{
        res = await withTimeout(transactionalPush(changed), 10000);
      }catch(e){
        const code = (e && e.code) || "";
        if(code === "unavailable" || code === "failed-precondition" || code === "deadline-exceeded" || code === "aborted") res = TIMEOUT;   // sin conexión
        else throw e;
      }
      if(res === TIMEOUT){                                   // sin conexión: se encola y Firestore lo enviará al volver
        const payload = {};
        changed.forEach(k=>{ payload[k] = cleanCopy(state[k]); });
        payload._updatedAt = firebase.firestore.FieldValue.serverTimestamp();
        fsDoc.update(payload).catch(()=>{});
        cloudMode = "pending";
        changed.forEach(k=>{ synced[k] = cur[k]; });
        return true;
      }
    }
    // éxito: lo que acabamos de escribir pasa a ser "lo último conocido de la nube"
    const after = topKeys(state);
    changed.forEach(k=>{ synced[k] = after[k] !== undefined ? after[k] : cur[k]; });
    remoteExists = true; cloudMode = "online";
    if(res && res.merged && res.merged.length){ needsRender = true; flushRender(); toast("Se han fusionado cambios de otra persona con los tuyos."); }
    return true;
  }catch(e){
    cloudMode = "error";
    handleCloudError(e);
    return false;
  }
}

/* ---------- recibir cambios de otras personas ---------- */
let needsRender = false;
function renderNow(){ needsRender = false; renderView(currentViewName()); renderInicio(); }
function flushRender(){ if(needsRender && !isTypingNow()) renderNow(); }

function subscribeCloud(){
  if(!fsDoc) return;
  fsDoc.onSnapshot((snap)=>{
    if(!snap.exists) return;
    if(snap.metadata.hasPendingWrites) return;   // es el eco de lo que acabamos de escribir
    processRemote(snap.data());
  }, (err)=>{ cloudMode = "error"; handleCloudError(err); });
}
function processRemote(data){
  const remote = topKeys(data);
  const cur = topKeys(state);
  let changedAny = false, mergedAny = false;
  Object.keys(remote).forEach(k=>{
    if(remote[k] === synced[k]) return;                       // la nube no ha cambiado en este apartado
    const base = synced[k] !== undefined ? JSON.parse(synced[k]) : undefined;
    if(cur[k] === synced[k]){
      state[k] = adopt(state[k], cloneData(data[k]));          // tú no tenías cambios aquí: se aplica lo de la nube
    }else{
      state[k] = merge3(base, state[k], cloneData(data[k]));   // cambios en los dos lados: se fusionan
      mergedAny = true;
    }
    synced[k] = remote[k];
    changedAny = true;
  });
  remoteExists = true;
  if(changedAny){
    needsRender = true;
    flushRender();                                             // si estás escribiendo, se dibuja al soltar el campo
    toast("Datos actualizados con los últimos cambios del equipo");
  }
  if(mergedAny) save(true);                                    // sube el resultado de la fusión
  return changedAny;
}
async function manualRefresh(){
  if(!fsDoc){ toast("Firebase no está configurado: la web funciona en modo local (ver LEEME.md)."); return; }
  try{
    const snap = await withTimeout(fsDoc.get({source:"server"}), 8000);
    if(snap === TIMEOUT){ toast("No hay conexión con Firebase.", "warn"); return; }
    if(snap.exists){ if(!processRemote(snap.data())) toast("Ya tienes lo último."); }
  }catch(e){ handleCloudError(e); }
}

/* ---------- indicador de estado ---------- */
function updateSaveStatusUI(inProgress){
  const el = document.getElementById("saveStatus");
  if(!el) return;
  clearTimeout(saveTimer);
  if(inProgress){ el.textContent = hasCloud ? "Guardando y sincronizando…" : "Guardando…"; return; }
  if(!lastSavedOK){ el.textContent = "⚠ Error al guardar"; return; }
  el.textContent = hasCloud
    ? (cloudMode === "pending" ? "Guardado · se sincronizará al conectar" : "Guardado y sincronizado")
    : "Guardado en este navegador";
  saveTimer = setTimeout(()=>{
    el.textContent = hasCloud ? "Sincronizado con la nube · en directo" : "Todo guardado en este navegador";
  }, 2200);
}

/* ---------- red de seguridad al cerrar / cambiar de pestaña ---------- */
window.addEventListener("beforeunload", ()=>{ writeLocal(); });
document.addEventListener("visibilitychange", ()=>{
  if(document.visibilityState === "hidden"){
    writeLocal();
    if(writeDebounce){ clearTimeout(writeDebounce); writeDebounce = null; flushSave(true); }   // sube lo pendiente ya
  }else{
    flushRender();
  }
});
document.addEventListener("focusout", ()=>{ setTimeout(flushRender, 250); });
