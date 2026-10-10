/* Vistas · Planificación: plan evolutivo, ideas iniciales, mesociclos */
/* =========================================================
   PLAN EVOLUTIVO
========================================================= */
const PLAN_EVOLUTIVO_DATA = {
  "PSICOMOTRICES":["Habilidades motrices básicas (saltos, giros, desplazamientos, equilibrio)","Lateralidad","Coordinación (espacio-temporal, óculo-pédica, dinámico-general)","Fintas (concepto general y en situación de juego)","Lucha, cargas","(P) Cruz","(P) Velocidad de reacción y agilidad"],
  "TÉCNICOS":["Posición defensiva","Marcaje (orientación, oponente directo o no)","Controles y recepciones","Controles orientados","Conducciones con distintas superficies","Pases con las distintas superficies y distancias","Disparos con las distintas superficies","Cortes específicos (trayectoria y ritmo para engañar defensor)","(P) Posición base (baja, media, alta)","(P) Intercepciones (agarre y desvíos)","(P) Dominio del balón (pies y manos)","(P) Saque (bolos, cadera, alto)","(P) Saque a objeto móvil"],
  "TÁCTICOS":["Principios generales de mantener, progresar y finalizar","Dualidades (pared, paralela, bloqueo)","Superioridades (2x1 y 3x2)","Defensas individuales","Defensas zonales, mixtas","Segundo palo (pase, timming, desplazamiento)","Creación de espacio para recibir","Existencia tercer hombre (ataque y defensa)","Balón presionado-no presionado","Situaciones de 1x0, 1x1, 1x1+1","(P) Salidas (reducir ángulos y distancia)","(P) Gestión inferioridades","(P) Defensa del segundo palo"],
  "TÁCTICA COLECTIVA":["Reglamento","Roles, posiciones","Sistemas (3-1, 2-2, 4-0)","Defensa de balón parado (individual y zonal)","Rotación o jugadas prefabricadas","Acciones de estrategia-balón parado","Repliegues y despliegues","Comportamiento táctico (resultado, tiempo, contexto)","(P): Colocación en campo","(P) Comunicación","(P) Anticipaciones, incorporaciones y salidas de presión"]
};
const MESES_PLAN = ["sep","oct","nov","dic","ene","feb","mar","abr","may"];
const CAT_COLORS = ["#d4a24c","#b5121f","#4f9d5c","#7a8fd1"];

function renderPlanEvolutivo(){
  const tbl = document.getElementById("tblPlanEvolutivo");
  tbl.innerHTML="";
  tbl.appendChild(el("thead",{},el("tr",{},["Contenido",...MESES_PLAN.map(m=>m.toUpperCase()),"Total"].map(h=>el("th",{},h)))));
  const tbody = el("tbody");
  const catTotals = {};
  Object.entries(PLAN_EVOLUTIVO_DATA).forEach(([cat, items], catIdx)=>{
    const catRow = el("tr");
    const catTd = el("td",{style:"background:#101c16;color:var(--gold);font-family:'Oswald';font-size:11px;text-transform:uppercase;letter-spacing:.06em;"}, cat);
    catTd.setAttribute("colspan", MESES_PLAN.length+2);
    catRow.appendChild(catTd);
    tbody.appendChild(catRow);
    catTotals[cat]=0;
    items.forEach((item, itemIdx)=>{
      const key = catIdx+"_"+itemIdx; // clave simple (Firestore no admite bien nombres largos con símbolos)
      if(!state.planEvolutivo[key]) state.planEvolutivo[key] = {};
      const rec = state.planEvolutivo[key];
      const tr = el("tr");
      tr.appendChild(el("td",{style:"min-width:260px;"}, item));
      let rowTotal = 0;
      MESES_PLAN.forEach(m=>{
        const td = el("td",{class:"num"});
        const cb = el("input",{type:"checkbox", class:"chk"});
        cb.checked = !!rec[m];
        if(cb.checked) rowTotal++;
        cb.addEventListener("change",()=>{ rec[m]=cb.checked; save(); renderPlanEvolutivo(); });
        td.appendChild(cb);
        tr.appendChild(td);
      });
      catTotals[cat]+=rowTotal;
      tr.appendChild(el("td",{class:"calc"}, String(rowTotal)));
      tbody.appendChild(tr);
    });
  });
  tbl.appendChild(tbody);

  const totalAll = Object.values(catTotals).reduce((a,b)=>a+b,0) || 0;
  const maxVal = Math.max(1,...Object.values(catTotals));

  const donutWrap = document.getElementById("planDonut");
  donutWrap.innerHTML="";
  let acc = 0;
  const stops = [];
  Object.entries(catTotals).forEach(([cat,val],i)=>{
    const pct = totalAll? (val/totalAll*100) : 0;
    stops.push(`${CAT_COLORS[i%CAT_COLORS.length]} ${acc}% ${acc+pct}%`);
    acc += pct;
  });
  const donut = el("div",{class:"donut", style: totalAll? `background:conic-gradient(${stops.join(",")});` : "background:rgba(255,255,255,.05);"});
  const hole = el("div",{class:"hole"});
  hole.appendChild(el("b",{}, String(totalAll)));
  hole.appendChild(el("span",{},"trabajos"));
  donut.appendChild(hole);
  donutWrap.appendChild(donut);
  const legend = el("div",{class:"donut-legend"});
  Object.entries(catTotals).forEach(([cat,val],i)=>{
    const pct = totalAll? Math.round(val/totalAll*100) : 0;
    const li = el("div",{class:"li"});
    li.appendChild(el("div",{class:"sw", style:`background:${CAT_COLORS[i%CAT_COLORS.length]};`}));
    li.appendChild(el("div",{}, `${cat} — ${val} (${pct}%)`));
    legend.appendChild(li);
  });
  donutWrap.appendChild(legend);

  const chart = document.getElementById("planChart");
  chart.innerHTML="";
  Object.entries(catTotals).forEach(([cat,val])=>{
    const bwrap = el("div",{class:"bwrap"});
    bwrap.appendChild(el("div",{class:"bval"}, String(val)));
    bwrap.appendChild(el("div",{class:"bar", style:`height:${Math.max(4,val/maxVal*100)}%;`}));
    bwrap.appendChild(el("div",{class:"blabel"}, cat.split(" ")[0]));
    chart.appendChild(bwrap);
  });
}

/* =========================================================
   IDEAS INICIALES
========================================================= */
const IDEAS_BLOCKS = [
  ["entrenos","Ideas de trabajo en entrenos"],["psico","Trabajo en el aspecto psicoevolutivo"],
  ["charlas","Charlas programadas"],["capitanes","Elección de capitanes y responsables"],
  ["convivencias","Programación de convivencias"],["otros","Otros"]
];
function renderIdeas(){
  const grid = document.getElementById("ideasGrid");
  grid.innerHTML="";
  IDEAS_BLOCKS.forEach(([key,label])=>{
    const card = el("div",{class:"card hoverable"});
    card.appendChild(el("h2",{},label));
    const list = el("div",{class:"mini-list"});
    if(!state.ideas[key]) state.ideas[key]=["","","","","","",""];
    state.ideas[key].forEach((val,idx)=>{
      const li = el("div",{class:"li"});
      li.appendChild(el("div",{class:"num"}, String(idx+1)));
      const ta = el("textarea",{}, val);
      ta.value = val;
      ta.addEventListener("input",()=>{state.ideas[key][idx]=ta.value; save();});
      li.appendChild(ta);
      list.appendChild(li);
    });
    card.appendChild(list);
    grid.appendChild(card);
  });
}

/* =========================================================
   MESOCICLOS
========================================================= */
let currentMeso = 0;
function renderMesociclos(){
  const tabsEl = document.getElementById("mesoTabs");
  tabsEl.innerHTML="";
  state.mesociclos.forEach((m,idx)=>{
    const btn = el("button",{class:"tab-btn"+(idx===currentMeso?" active":"")}, "MESOCICLO "+(idx+1));
    btn.addEventListener("click",()=>{currentMeso=idx; renderMesociclos();});
    tabsEl.appendChild(btn);
  });
  const content = document.getElementById("mesoContent");
  content.innerHTML="";
  const m = state.mesociclos[currentMeso];
  const card = el("div",{class:"card"});
  card.appendChild(el("h2",{}, "Mesociclo "+(currentMeso+1)));
  const grid = el("div",{class:"grid cols-2"});

  const col1 = el("div");
  const tw = el("div");
  tw.appendChild(el("label",{class:"field"},"Tipología"));
  const tsel = el("select",{class:"plain"});
  ["PREPARATORIO","COMPETICIÓN","TRANSICIÓN"].forEach(o=>{
    const op = el("option",{value:o},o); if(o===m.tipologia) op.selected=true; tsel.appendChild(op);
  });
  tsel.addEventListener("change",()=>{m.tipologia=tsel.value; save();});
  tw.appendChild(tsel);
  col1.appendChild(tw);

  const mw = el("div",{style:"margin-top:12px;"});
  mw.appendChild(el("label",{class:"field"},"Mes"));
  const msel = el("select",{class:"plain"});
  ["","Agosto","Septiembre","Octubre","Noviembre","Diciembre","Enero","Febrero","Marzo","Abril","Mayo"].forEach(o=>{
    const op = el("option",{value:o},o||"— Selecciona —"); if(o===m.mes) op.selected=true; msel.appendChild(op);
  });
  msel.addEventListener("change",()=>{m.mes=msel.value; save();});
  mw.appendChild(msel);
  col1.appendChild(mw);
  grid.appendChild(col1);

  const col2 = el("div");
  [["objColectivos","Objetivos colectivos"],["objGrupales","Objetivos grupales"],["objIndividuales","Objetivos individuales"]].forEach(([key,label])=>{
    const w = el("div",{style:"margin-bottom:10px;"});
    w.appendChild(el("label",{class:"field"},label));
    const ta = el("textarea",{},m[key]||"");
    ta.value = m[key]||"";
    ta.addEventListener("input",()=>{m[key]=ta.value; save();});
    w.appendChild(ta);
    col2.appendChild(w);
  });
  grid.appendChild(col2);

  card.appendChild(grid);
  content.appendChild(card);
}
