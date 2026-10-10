/* Interfaz común: avisos, diálogos, helpers de tabla y anillos de progreso */
/* =========================================================
   NOTIFICACIONES
========================================================= */
function toast(msg, type){
  const host = document.getElementById("toastHost");
  const t = document.createElement("div");
  t.className = "toast"+(type==="warn"?" warn":"");
  t.textContent = msg;
  host.appendChild(t);
  setTimeout(()=>{ t.classList.add("out"); setTimeout(()=>t.remove(), 260); }, 2400);
}

/* Diálogos propios: los confirm()/prompt() nativos del navegador están
   deshabilitados dentro del artefacto (sandbox de seguridad), así que
   se sustituyen por este mini-modal. Ambas funciones devuelven una
   promesa, igual que si fueran versiones "await" de las nativas. */
function customConfirm(message, opts={}){
  return new Promise(resolve=>{
    const mask = el("div",{class:"modal-mask"});
    const box = el("div",{class:"modal-box"});
    box.appendChild(el("p",{}, message));
    const actions = el("div",{class:"modal-actions"});
    const cancelBtn = el("button",{class:"btn sm"}, opts.cancelLabel || "Cancelar");
    const okBtn = el("button",{class:"btn sm "+(opts.danger?"danger":"primary")}, opts.okLabel || "Eliminar");
    const close = (result)=>{ mask.remove(); document.removeEventListener("keydown", onKey); resolve(result); };
    cancelBtn.addEventListener("click",()=>close(false));
    okBtn.addEventListener("click",()=>close(true));
    mask.addEventListener("click",(e)=>{ if(e.target===mask) close(false); });
    function onKey(e){ if(e.key==="Escape") close(false); if(e.key==="Enter") close(true); }
    document.addEventListener("keydown", onKey);
    actions.appendChild(cancelBtn); actions.appendChild(okBtn);
    box.appendChild(actions);
    mask.appendChild(box);
    document.body.appendChild(mask);
    okBtn.focus();
  });
}
function customPrompt(message, defaultValue=""){
  return new Promise(resolve=>{
    const mask = el("div",{class:"modal-mask"});
    const box = el("div",{class:"modal-box"});
    box.appendChild(el("p",{}, message));
    const input = el("input",{class:"plain", type:"text", value: defaultValue});
    box.appendChild(input);
    const actions = el("div",{class:"modal-actions"});
    const cancelBtn = el("button",{class:"btn sm"}, "Cancelar");
    const okBtn = el("button",{class:"btn sm primary"}, "Aceptar");
    const close = (result)=>{ mask.remove(); document.removeEventListener("keydown", onKey); resolve(result); };
    cancelBtn.addEventListener("click",()=>close(null));
    okBtn.addEventListener("click",()=>close(input.value));
    mask.addEventListener("click",(e)=>{ if(e.target===mask) close(null); });
    function onKey(e){ if(e.key==="Escape") close(null); if(e.key==="Enter") close(input.value); }
    document.addEventListener("keydown", onKey);
    actions.appendChild(cancelBtn); actions.appendChild(okBtn);
    box.appendChild(actions);
    mask.appendChild(box);
    document.body.appendChild(mask);
    input.focus(); input.select();
  });
}

/* =========================================================
   HELPERS UI
========================================================= */
function el(tag, attrs={}, children=[]){
  const e = document.createElement(tag);
  for(const k in attrs){
    if(k==="class") e.className=attrs[k];
    else if(k==="html") e.innerHTML=attrs[k];
    else if(k.startsWith("on")) e.addEventListener(k.slice(2), attrs[k]);
    else e.setAttribute(k, attrs[k]);
  }
  (Array.isArray(children)?children:[children]).forEach(c=>{
    if(c==null) return;
    e.appendChild(typeof c==="string"?document.createTextNode(c):c);
  });
  return e;
}
function inputCell(value, onChange, type="text", opts={}){
  const inp = el("input",{type, value: value ?? "", ...opts});
  inp.addEventListener("input",()=>{onChange(inp.value); save();});
  return el("td",{}, inp);
}
function selectCell(value, options, onChange){
  const sel = el("select",{});
  options.forEach(o=>{
    const op = el("option",{value:o}, o);
    if(o===value) op.selected = true;
    sel.appendChild(op);
  });
  sel.addEventListener("change",()=>{onChange(sel.value); save(); renderView(currentViewName());});
  return el("td",{}, sel);
}

function ringSVG(pct, valueLabel, caption, sub){
  pct = Math.max(0, Math.min(100, pct));
  const r = 30, c = 2*Math.PI*r;
  const offset = c - (pct/100)*c;
  const wrap = el("div",{class:"ring-wrap"});
  const ring = el("div",{class:"ring"});
  ring.innerHTML = `<svg viewBox="0 0 74 74"><circle class="bg" cx="37" cy="37" r="${r}"></circle><circle class="fg" cx="37" cy="37" r="${r}" stroke-dasharray="${c}" stroke-dashoffset="${c}"></circle></svg>`;
  ring.appendChild(el("div",{class:"val"}, valueLabel));
  wrap.appendChild(ring);
  const label = el("div",{class:"ring-label"});
  label.innerHTML = `<b>${caption}</b>${sub||""}`;
  wrap.appendChild(label);
  requestAnimationFrame(()=>requestAnimationFrame(()=>{ ring.querySelector(".fg").style.strokeDashoffset = offset; }));
  return wrap;
}

/* =========================================================
   TABLAS RESPONSIVE
   En pantallas pequeñas las tablas con clase "stack" se muestran como tarjetas
   (una por fila, con el nombre de la columna delante de cada dato). Aquí se
   rellena ese nombre automáticamente cada vez que la tabla se vuelve a dibujar.
========================================================= */
function labelStackTable(t){
  const ths = [...t.querySelectorAll("thead th")].map(th=>th.textContent.trim());
  t.querySelectorAll("tbody tr").forEach(tr=>{
    [...tr.children].forEach((td,i)=>{
      if(td.hasAttribute("colspan")) return;
      const lab = ths[i] || "";
      if(td.dataset.label !== lab) td.dataset.label = lab;
    });
  });
}
function initResponsiveTables(){
  document.querySelectorAll("table.stack").forEach(t=>{
    let queued = false;
    new MutationObserver(()=>{
      if(queued) return;
      queued = true;
      queueMicrotask(()=>{ queued = false; labelStackTable(t); });
    }).observe(t, {childList:true, subtree:true});
  });
}
