/* Vistas · Entrenamientos: sesiones, tipos de tareas, base de datos de tareas */
/* =========================================================
   SESIONES DE ENTRENO
========================================================= */
function newTareaBlock(){ return {calentJuego:10, calent2:5, tecnificarTiempo:15, tarea2:10, tarea3:10, tarea4:30, vc1:9, vc2:1}; }
function addSesion(){
  state.sesiones.push({id:uid(), lugar:"", fecha:"", hora:"", mesociclo:"", tareas: newTareaBlock(), objetivos:""});
  save(); renderSesiones(); toast("Sesión añadida");
}
function sesionTotalTiempo(t){
  return (+t.calentJuego||0)+(+t.calent2||0)+(+t.tecnificarTiempo||0)+(+t.tarea2||0)+(+t.tarea3||0)+(+t.tarea4||0)+(+t.vc1||0)+(+t.vc2||0);
}
function renderSesiones(){
  document.getElementById("sesTotal").textContent = `(${state.sesiones.length} sesiones)`;
  const list = document.getElementById("sesionesList");
  list.innerHTML="";
  if(state.sesiones.length===0){
    list.appendChild(el("div",{class:"empty-state"},[el("div",{class:"big"},"🏟️"),el("div",{},"Aún no has añadido ninguna sesión de entreno.")]));
    return;
  }
  state.sesiones.forEach((s,idx)=>{
    const card = el("div",{class:"card"});
    const head = el("div",{style:"display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:12px;"});
    head.appendChild(el("h2",{style:"margin:0;"}, "Sesión "+(idx+1)+" · "+sesionTotalTiempo(s.tareas)+" min"));
    head.appendChild(el("button",{class:"btn danger sm", onclick:()=>{state.sesiones.splice(idx,1); save(); renderSesiones(); toast("Sesión eliminada");}},"Eliminar"));
    card.appendChild(head);

    const meta = el("div",{class:"grid cols-4"});
    [["lugar","Lugar","text"],["fecha","Fecha","date"],["hora","Hora","text"],["mesociclo","Mesociclo","text"]].forEach(([key,label,type])=>{
      const w = el("div");
      w.appendChild(el("label",{class:"field"},label));
      const inp = el("input",{class:"plain", type, value:s[key]||""});
      inp.addEventListener("input",()=>{s[key]=inp.value; save();});
      w.appendChild(inp);
      meta.appendChild(w);
    });
    card.appendChild(meta);

    const tbl = el("table",{class:"dt", style:"margin-top:14px;"});
    tbl.appendChild(el("thead",{},el("tr",{},["Bloque","Tiempo (min)"].map(h=>el("th",{},h)))));
    const tbody = el("tbody");
    [["calentJuego","Calentamiento · juego"],["calent2","Calentamiento · estiramientos"],
      ["tecnificarTiempo","Tecnificar · tarea 1"],["tarea2","Parte principal · tarea 2"],
      ["tarea3","Parte principal · tarea 3"],["tarea4","Parte principal · tarea 4 (partido)"],
      ["vc1","Vuelta a la calma · juego"],["vc2","Vuelta a la calma · feedback"]].forEach(([key,label])=>{
      const tr = el("tr");
      tr.appendChild(el("td",{},label));
      tr.appendChild(inputCell(s.tareas[key], v=>{s.tareas[key]=v; save(); renderSesiones();}, "number"));
      tbody.appendChild(tr);
    });
    tbl.appendChild(tbody);
    card.appendChild(el("div",{class:"table-wrap"}, tbl));

    if(state.tareasDB.length){
      const impW = el("div",{style:"margin-top:12px;"});
      impW.appendChild(el("label",{class:"field"},"Traer tarea de tu base de datos"));
      const sel = el("select",{class:"plain"});
      sel.appendChild(el("option",{value:""},"— Selecciona una tarea —"));
      state.tareasDB.forEach(t=>sel.appendChild(el("option",{value:t.id}, t.nombre||"(sin nombre)")));
      sel.addEventListener("change",()=>{
        const t = state.tareasDB.find(x=>x.id===sel.value);
        if(t){
          s.objetivos = (s.objetivos? s.objetivos+"\n":"") + `• ${t.nombre} (${t.tiempo||0} min) — ${t.descripcion||""}`;
          save(); renderSesiones(); toast("Tarea incorporada a la sesión");
        }
      });
      impW.appendChild(sel);
      card.appendChild(impW);
    }

    const objW = el("div",{style:"margin-top:12px;"});
    objW.appendChild(el("label",{class:"field"},"Objetivos de la sesión"));
    const ta = el("textarea",{}, s.objetivos||"");
    ta.value = s.objetivos||"";
    ta.addEventListener("input",()=>{s.objetivos=ta.value; save();});
    objW.appendChild(ta);
    card.appendChild(objW);

    list.appendChild(card);
  });
}

/* =========================================================
   TIPOS DE TAREAS (referencia)
========================================================= */
const TIPOS_TAREAS = {
  "Entrenamiento coadyuvante":["Preventivas individuales","Preventivas colectivas","Restauración entrenos","Restauración partidos","Restauración lesiones","Adaptación a cargas","Mejora del cuerpo","HIIT","Desplazamientos","Luchas","Acciones con balón","Saltos","Fuerza","Resistencia","Velocidad"],
  "Optimizador · físico/técnico":["Calentamiento","Juegos de calentamiento","Juegos socioafectivos","Calentamientos partidos","Fuerza","A.D.M.","Resistencia","Velocidad","Rondos condicionales","Circuitos condicionales","Coordinación","Pase-control","Posesión-conducción","Finalización"],
  "Optimizador · táctico/mental":["Apertura","Contraataques","Ataque rápido","Ataque posicional","Transición ofensiva","Balance","Temporización y repliegues","Defensa rápida","Defensa posicional","Transición defensiva","ABP","Faltas","Corner","Bandas","Situaciones especiales","5x4","4x3","Partidos condicionales","Modelados","Vuelta a la calma","Fundamentos","Psico-concentración","Psico-relajación","Psico-flow","Psico-objetivos","Psico-motivación","Volu-constancia","Volu-decisión","Volu-iniciativa","Volu-independencia"]
};
function renderTiposTareas(){
  const grid = document.getElementById("tiposTareasGrid");
  grid.innerHTML="";
  Object.entries(TIPOS_TAREAS).forEach(([cat,items])=>{
    const card = el("div",{class:"card hoverable"});
    card.appendChild(el("h2",{},cat));
    const list = el("div",{style:"display:flex;flex-direction:column;gap:6px;"});
    items.forEach(it=>list.appendChild(el("div",{style:"font-size:12.5px;color:var(--ink-dim);padding:5px 8px;background:var(--card-2);border-radius:6px;"}, it)));
    card.appendChild(list);
    grid.appendChild(card);
  });
}

/* =========================================================
   BASE DE DATOS DE TAREAS (catálogo propio)
========================================================= */
const TIPOLOGIAS_FLAT = Object.values(TIPOS_TAREAS).flat();
function addTareaDB(){
  state.tareasDB.push({id:uid(), nombre:"", descripcion:"", tiempo:10, variables:"", tipologia:TIPOLOGIAS_FLAT[0]});
  save(); renderBaseTareas(); toast("Tarea añadida al catálogo");
}
function renderBaseTareas(){
  document.getElementById("baseTareasCount").textContent = `(${state.tareasDB.length} tareas guardadas)`;
  const tbl = document.getElementById("tblBaseTareas");
  tbl.innerHTML="";
  tbl.appendChild(el("thead",{},el("tr",{},["Tarea","Descripción","Tiempo (min)","Variables","Tipología",""].map(h=>el("th",{},h)))));
  const tbody = el("tbody");
  if(state.tareasDB.length===0){
    const tr = el("tr");
    const td = el("td",{style:"text-align:center;color:var(--ink-faint);padding:24px;"},"Todavía no has guardado ninguna tarea. Pulsa \"+ Añadir tarea\" para crear tu primer ejercicio reutilizable.");
    td.setAttribute("colspan",6);
    tr.appendChild(td); tbody.appendChild(tr);
  }
  state.tareasDB.forEach(t=>{
    const tr = el("tr");
    tr.appendChild(inputCell(t.nombre, v=>t.nombre=v, "text", {placeholder:"Nombre de la tarea"}));
    tr.appendChild(inputCell(t.descripcion, v=>t.descripcion=v, "text", {placeholder:"Descripción y objetivo", style:"min-width:220px;"}));
    tr.appendChild(inputCell(t.tiempo, v=>t.tiempo=v, "number", {style:"width:70px;"}));
    tr.appendChild(inputCell(t.variables, v=>t.variables=v, "text", {placeholder:"Variables posibles"}));
    tr.appendChild(selectCell(t.tipologia, TIPOLOGIAS_FLAT, v=>t.tipologia=v));
    tr.appendChild(el("td",{}, el("button",{class:"rowdel", onclick: async ()=>{
      const ok = await customConfirm("¿Eliminar esta tarea del catálogo?", {danger:true});
      if(ok){
        state.tareasDB = state.tareasDB.filter(x=>x.id!==t.id);
        save(); renderBaseTareas(); toast("Tarea eliminada");
      }
    }},"✕")));
    tbody.appendChild(tr);
  });
  tbl.appendChild(tbody);
}
