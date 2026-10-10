/* Vistas · Partidos: competiciones, clasificación, convocatorias, plan de partido, minutos, puntuación */
/* =========================================================
   COMPETICIONES
========================================================= */
function renderCompeticiones(){
  const tbl = document.getElementById("tblJornadas");
  tbl.innerHTML="";
  tbl.appendChild(el("thead",{},el("tr",{},["Jornada","","Local","","Visitante",""].map(h=>el("th",{},h)))));
  const tbody = el("tbody");
  state.jornadas.forEach(j=>{
    const trHead = el("tr");
    const th = el("td",{style:"background:#101c16;color:var(--gold);font-family:'Oswald';font-size:11px;letter-spacing:.05em;"}, `JORNADA ${j.numero} · ${j.fecha} · ${j.vuelta}`);
    th.setAttribute("colspan",6);
    trHead.appendChild(th);
    tbody.appendChild(trHead);
    j.partidos.forEach(p=>{
      const tr = el("tr", (p.local===OWN_TEAM||p.visitante===OWN_TEAM)?{style:"background:rgba(201,161,61,.08);"}:{});
      tr.appendChild(el("td",{},""));
      tr.appendChild(el("td",{},""));
      tr.appendChild(el("td",{style:"font-size:12px;"+(p.local===OWN_TEAM?"color:var(--gold);font-weight:700;":"")}, p.local));
      tr.appendChild(inputCell(p.golesL, v=>{p.golesL=v; save(); renderCompeticiones();}, "number", {style:"width:46px;text-align:center;"}));
      tr.appendChild(el("td",{style:"font-size:12px;"+(p.visitante===OWN_TEAM?"color:var(--gold);font-weight:700;":"")}, p.visitante));
      tr.appendChild(inputCell(p.golesV, v=>{p.golesV=v; save(); renderCompeticiones();}, "number", {style:"width:46px;text-align:center;"}));
      tbody.appendChild(tr);
    });
  });
  tbl.appendChild(tbody);
}

/* =========================================================
   CLASIFICACIÓN (calculada)
========================================================= */
function computeStandings(){
  const table = {};
  state.jornadas.forEach(j=>{
    j.partidos.forEach(p=>{
      [p.local,p.visitante].forEach(eq=>{ if(!table[eq]) table[eq]={equipo:eq,pj:0,pg:0,pe:0,pp:0,gf:0,gc:0,pts:0}; });
      if(p.golesL!=="" && p.golesV!=="" && p.golesL!=null && p.golesV!=null){
        const gl=+p.golesL, gv=+p.golesV;
        const L=table[p.local], V=table[p.visitante];
        L.pj++; V.pj++; L.gf+=gl; L.gc+=gv; V.gf+=gv; V.gc+=gl;
        if(gl>gv){L.pg++;L.pts+=3;V.pp++;}
        else if(gl<gv){V.pg++;V.pts+=3;L.pp++;}
        else{L.pe++;V.pe++;L.pts++;V.pts++;}
      }
    });
  });
  return Object.values(table).sort((a,b)=> b.pts-a.pts || (b.gf-b.gc)-(a.gf-a.gc) || b.gf-a.gf);
}
function renderClasificacion(){
  const standings = computeStandings();
  const tbl = document.getElementById("tblStandings");
  tbl.innerHTML="";
  tbl.appendChild(el("thead",{},el("tr",{},["#","Equipo","PJ","PG","PE","PP","GF","GC","DG","Pts"].map((h,i)=>el("th",{class:i===1?"name":""},h)))));
  const tbody = el("tbody");
  if(standings.every(r=>r.pj===0)){
    const tr = el("tr");
    const td = el("td",{style:"text-align:center;color:var(--ink-faint);padding:26px;"},"Aún no hay resultados registrados. Ve a Competiciones e introduce los goles de cada partido.");
    td.setAttribute("colspan",10);
    tr.appendChild(td); tbody.appendChild(tr);
  } else {
    standings.forEach((r,i)=>{
      const tr = el("tr",{class:i===0?"podium-1":i===1?"podium-2":i===2?"podium-3":""});
      tr.appendChild(el("td",{}, el("span",{class:"rank"}, String(i+1))));
      tr.appendChild(el("td",{class:"name"}, r.equipo));
      tr.appendChild(el("td",{}, String(r.pj)));
      tr.appendChild(el("td",{}, String(r.pg)));
      tr.appendChild(el("td",{}, String(r.pe)));
      tr.appendChild(el("td",{}, String(r.pp)));
      tr.appendChild(el("td",{}, String(r.gf)));
      tr.appendChild(el("td",{}, String(r.gc)));
      tr.appendChild(el("td",{}, (r.gf-r.gc>=0?"+":"")+(r.gf-r.gc)));
      tr.appendChild(el("td",{class:"pts"}, String(r.pts)));
      tbody.appendChild(tr);
    });
  }
  tbl.appendChild(tbody);
}

/* =========================================================
   CONVOCATORIAS
========================================================= */
async function addConvocatoria(){
  const fecha = await customPrompt("Fecha de la jornada (DD-MM-AAAA):", "");
  if(fecha===null) return;
  const id = uid();
  state.convocatorias.push({id, fecha: fecha||("Jornada "+(state.convocatorias.length+1))});
  state.convData[id]={}; state.minData[id]={}; state.scoreData[id]={};
  save(); renderConvocatorias(); toast("Jornada añadida a convocatorias");
}
function renderConvocatorias(){
  const tbl = document.getElementById("tblConvocatorias");
  tbl.innerHTML="";
  tbl.appendChild(el("thead",{},el("tr",{},["Jugador", ...state.convocatorias.map(c=>c.fecha), "Total"].map(h=>el("th",{},h)))));
  const tbody = el("tbody");
  state.players.forEach(p=>{
    const tr = el("tr");
    tr.appendChild(el("td",{},(p.nombre||"—")+" "+(p.apellidos||"")));
    let total=0;
    state.convocatorias.forEach(c=>{
      if(!state.convData[c.id]) state.convData[c.id]={};
      const checked = !!state.convData[c.id][p.id];
      if(checked) total++;
      const td = el("td",{class:"num"});
      const cb = el("input",{type:"checkbox", class:"chk"});
      cb.checked = checked;
      cb.addEventListener("change",()=>{state.convData[c.id][p.id]=cb.checked; save(); renderConvocatorias();});
      td.appendChild(cb);
      tr.appendChild(td);
    });
    tr.appendChild(el("td",{class:"calc"}, String(total)));
    tbody.appendChild(tr);
  });
  tbl.appendChild(tbody);
}

/* =========================================================
   PLAN DE PARTIDO
========================================================= */
function renderPlanPartidoView(){
  const sel = document.getElementById("ppSelect");
  sel.innerHTML="";
  if(state.convocatorias.length===0){
    sel.appendChild(el("option",{},"— Añade una convocatoria primero —"));
    document.getElementById("ppContent").innerHTML="";
    return;
  }
  state.convocatorias.forEach(c=>sel.appendChild(el("option",{value:c.id}, c.fecha)));
  renderPlanPartido();
}
function renderPlanPartido(){
  const sel = document.getElementById("ppSelect");
  const convId = sel.value || (state.convocatorias[0] && state.convocatorias[0].id);
  const content = document.getElementById("ppContent");
  content.innerHTML="";
  if(!convId) return;
  if(!state.planPartido[convId]) state.planPartido[convId] = {parte1:"", parte2:""};
  const pp = state.planPartido[convId];
  const grid = el("div",{class:"grid cols-2"});
  [["parte1","1ª Parte"],["parte2","2ª Parte"]].forEach(([key,label])=>{
    const card = el("div",{class:"card"});
    card.appendChild(el("h2",{},label));
    card.appendChild(el("p",{class:"hint"},"Titulares, cambios por bloques de tiempo y observaciones."));
    const ta = el("textarea",{style:"min-height:140px;"}, pp[key]||"");
    ta.value = pp[key]||"";
    ta.placeholder = "Ej: 0-5' Titulares: ...\n5-10' Cambio 1: ...";
    ta.addEventListener("input",()=>{pp[key]=ta.value; save();});
    card.appendChild(ta);
    grid.appendChild(card);
  });
  content.appendChild(grid);
}

/* =========================================================
   MINUTOS
========================================================= */
function renderMinutos(){
  const tbl = document.getElementById("tblMinutos");
  tbl.innerHTML="";
  tbl.appendChild(el("thead",{},el("tr",{},["Jugador", ...state.convocatorias.map(c=>c.fecha), "Total"].map(h=>el("th",{},h)))));
  const tbody = el("tbody");
  state.players.forEach(p=>{
    const tr = el("tr");
    tr.appendChild(el("td",{},(p.nombre||"—")+" "+(p.apellidos||"")));
    let total=0;
    state.convocatorias.forEach(c=>{
      if(!state.minData[c.id]) state.minData[c.id]={};
      const v = state.minData[c.id][p.id] || 0;
      total += (+v)||0;
      tr.appendChild(inputCell(v, val=>{state.minData[c.id][p.id]=val; save(); renderMinutos();}, "number", {style:"width:60px;"}));
    });
    tr.appendChild(el("td",{class:"calc"}, String(total)));
    tbody.appendChild(tr);
  });
  tbl.appendChild(tbody);
}

/* =========================================================
   PUNTUACIÓN
========================================================= */
function renderPuntuacion(){
  const tbl = document.getElementById("tblPuntuacion");
  tbl.innerHTML="";
  tbl.appendChild(el("thead",{},el("tr",{},["Jugador", ...state.convocatorias.map(c=>c.fecha), "Media"].map(h=>el("th",{},h)))));
  const tbody = el("tbody");
  state.players.forEach(p=>{
    const tr = el("tr");
    tr.appendChild(el("td",{},(p.nombre||"—")+" "+(p.apellidos||"")));
    let sum=0,count=0;
    state.convocatorias.forEach(c=>{
      if(!state.scoreData[c.id]) state.scoreData[c.id]={};
      const v = state.scoreData[c.id][p.id];
      if(v!==undefined && v!==""){ sum+=(+v); count++; }
      tr.appendChild(inputCell(v, val=>{state.scoreData[c.id][p.id]=val; save(); renderPuntuacion();}, "number", {min:0,max:10,style:"width:56px;"}));
    });
    tr.appendChild(el("td",{class:"calc"}, count? (sum/count).toFixed(2) : "—"));
    tbody.appendChild(tr);
  });
  tbl.appendChild(tbody);
}
