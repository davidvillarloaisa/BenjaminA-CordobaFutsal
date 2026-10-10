/* Vistas · General: inicio, pretemporada, plantilla, contactos, calendario, ropa, economía */
/* =========================================================
   INICIO
========================================================= */
function renderInicio(){
  document.getElementById("stJugadores").textContent = state.players.length;
  document.getElementById("stPartidos").textContent = state.jornadas.length;
  document.getElementById("stSesiones").textContent = state.sesiones.length;

  const standings = computeStandings();
  const own = standings.find(r=>r.equipo===OWN_TEAM);
  const pos = own ? (standings.indexOf(own)+1) : "—";
  document.getElementById("stPosicion").textContent = pos + (typeof pos==="number" ? "º / "+standings.length : "");

  let paidCells=0,totalCells=0;
  state.players.forEach(p=>{
    const row = state.economia[p.id] || {};
    ["sep","oct","nov","dic","ene","feb","mar","abr","may"].forEach(m=>{ totalCells++; if(row[m]==="X") paidCells++; });
  });
  const econPct = totalCells? Math.round(paidCells/totalCells*100) : 0;

  let planWorked=0, planTotal=0;
  Object.values(state.planEvolutivo).forEach(rec=>{
    ["sep","oct","nov","dic","ene","feb","mar","abr","may"].forEach(m=>{ planTotal++; if(rec[m]) planWorked++; });
  });
  const planPct = planTotal? Math.round(planWorked/planTotal*100) : 0;

  const convTotal = state.convocatorias.length * Math.max(state.players.length,1);
  let convDone=0;
  state.convocatorias.forEach(c=>{ state.players.forEach(p=>{ if((state.convData[c.id]||{})[p.id]) convDone++; }); });
  const convPct = convTotal? Math.round(convDone/convTotal*100) : 0;

  const rings = document.getElementById("heroRings");
  rings.innerHTML="";
  rings.appendChild(ringSVG(econPct, econPct+"%", "Cuotas al día", " · pagos"));
  rings.appendChild(ringSVG(planPct, planPct+"%", "Plan evolutivo", " · contenidos"));
  rings.appendChild(ringSVG(convPct, convPct+"%", "Convocatorias", " · asistencia"));
  const jornadasJugadas = state.jornadas.filter(j=>j.partidos.some(p=>p.golesL!=="" && p.golesV!=="")).length;
  rings.appendChild(ringSVG(state.jornadas.length? Math.round(jornadasJugadas/state.jornadas.length*100):0, jornadasJugadas+"/"+state.jornadas.length, "Liga disputada", " · jornadas"));
}

/* =========================================================
   PRETEMPORADA
========================================================= */
function renderPretemporada(){
  const fields = [
    ["fechaInicio","Fecha de inicio","date"],["nJugadores","Nº de jugadores","number"],
    ["competicion","Competición","text"],["semanas","Semanas de temporada","number"],
    ["entrenador","Entrenador","text"],["entrenador2","2º entrenador","text"],
    ["delegado","Delegado","text"],["prepFisico","Preparador físico","text"],["auxiliar","Auxiliar","text"]
  ];
  const form = document.getElementById("pretForm");
  form.innerHTML="";
  fields.forEach(([key,label,type])=>{
    const wrap = el("div",{});
    wrap.appendChild(el("label",{class:"field"}, label));
    const input = el("input",{class:"plain", type, value: state.pretemporada[key] ?? ""});
    input.addEventListener("input",()=>{state.pretemporada[key]=input.value; save(); renderPretemporada();});
    wrap.appendChild(input);
    form.appendChild(wrap);
  });
  const res = document.getElementById("pretResumen");
  res.innerHTML="";
  res.appendChild(el("div",{},`Jugadores en plantilla: `+state.players.length));
  res.appendChild(el("div",{},`Jornadas de competición: `+state.jornadas.length));
  res.appendChild(el("div",{},`Sesiones programadas: `+state.sesiones.length));
  if(state.pretemporada.entrenador) res.appendChild(el("div",{},`Entrenador: `+state.pretemporada.entrenador));
}

/* =========================================================
   PLANTILLA
========================================================= */
const PUESTOS = ["PORTERO","CIERRE","ALA-CIERRE","ALA","ALA-PIVOT","PIVOT","UNIVERSAL"];
const PIES = ["DERECHO","ZURDO","AMBIDIESTRO"];

function renderPlantilla(){
  document.getElementById("plantillaCount").textContent = `(${state.players.length} jugadores)`;
  const tbl = document.getElementById("tblPlantilla");
  tbl.innerHTML = "";
  tbl.appendChild(el("thead",{},el("tr",{},["Dorsal","Nombre","Apellidos","Puesto","Pie","Fecha nac.","DNI","Teléfono",""].map(h=>el("th",{},h)))));
  const tbody = el("tbody");
  state.players.forEach(p=>{
    const tr = el("tr");
    tr.appendChild(inputCell(p.dorsal, v=>p.dorsal=v, "number"));
    tr.appendChild(inputCell(p.nombre, v=>{p.nombre=v.toUpperCase();}, "text"));
    tr.appendChild(inputCell(p.apellidos, v=>{p.apellidos=v.toUpperCase();}, "text"));
    tr.appendChild(selectCell(p.puesto, PUESTOS, v=>p.puesto=v));
    tr.appendChild(selectCell(p.pie, PIES, v=>p.pie=v));
    tr.appendChild(inputCell(p.fecha, v=>p.fecha=v, "date"));
    tr.appendChild(inputCell(p.dni, v=>p.dni=v, "text"));
    tr.appendChild(inputCell(p.telefono, v=>p.telefono=v, "tel"));
    const del = el("button",{class:"rowdel", title:"Eliminar jugador", onclick: async ()=>{
      const ok = await customConfirm("¿Eliminar a "+(p.nombre||"este jugador")+"? Esta acción no se puede deshacer.", {danger:true});
      if(ok){
        state.players = state.players.filter(x=>x.id!==p.id);
        save(); renderPlantilla(); toast("Jugador eliminado");
      }
    }},"✕");
    tr.appendChild(el("td",{},del));
    tbody.appendChild(tr);
  });
  tbl.appendChild(tbody);
}
function addPlayer(){
  const nextDorsal = state.players.length ? Math.max(...state.players.map(p=>+p.dorsal||0))+1 : 1;
  state.players.push({id:uid(),dorsal:nextDorsal,nombre:"",apellidos:"",puesto:"UNIVERSAL",pie:"DERECHO",fecha:"",anio:"",dni:"",telefono:"",contacto1:"",tel1:"",contacto2:"",tel2:"",emailJugador:"",emailTutor:""});
  save(); renderPlantilla(); toast("Jugador añadido");
}

/* =========================================================
   DATOS JUGADORES (contactos)
========================================================= */
function renderContactos(){
  const tbl = document.getElementById("tblContactos");
  tbl.innerHTML="";
  tbl.appendChild(el("thead",{},el("tr",{},["Nombre","Apellidos","Contacto 1","Tel. 1","Contacto 2","Tel. 2","Email jugador","Email tutor"].map(h=>el("th",{},h)))));
  const tbody = el("tbody");
  state.players.forEach(p=>{
    const tr = el("tr");
    tr.appendChild(el("td",{}, p.nombre||"—"));
    tr.appendChild(el("td",{}, p.apellidos||"—"));
    tr.appendChild(inputCell(p.contacto1, v=>p.contacto1=v.toUpperCase()));
    tr.appendChild(inputCell(p.tel1, v=>p.tel1=v, "tel"));
    tr.appendChild(inputCell(p.contacto2, v=>p.contacto2=v.toUpperCase()));
    tr.appendChild(inputCell(p.tel2, v=>p.tel2=v, "tel"));
    tr.appendChild(inputCell(p.emailJugador, v=>p.emailJugador=v, "email"));
    tr.appendChild(inputCell(p.emailTutor, v=>p.emailTutor=v, "email"));
    tbody.appendChild(tr);
  });
  tbl.appendChild(tbody);
}

/* =========================================================
   CALENDARIO
========================================================= */
const MESES_CAL = [
  ["septiembre",2026,8],["octubre",2026,9],["noviembre",2026,10],["diciembre",2026,11],
  ["enero",2027,0],["febrero",2027,1],["marzo",2027,2],["abril",2027,3],
  ["mayo",2027,4],["junio",2027,5],["julio",2027,6],["agosto",2027,7]
];
const FESTIVOS = ["2026-10-12","2026-11-01","2026-12-06","2026-12-07","2026-12-08","2026-12-25",
  "2027-01-01","2027-01-06","2027-03-25","2027-03-26","2027-05-01","2027-08-15"];

function renderCalendario(){
  const grid = document.getElementById("calGrid");
  grid.innerHTML="";
  const today = new Date().toISOString().slice(0,10);
  MESES_CAL.forEach(([nombre,year,monthIdx])=>{
    const card = el("div",{class:"calendar-month"});
    card.appendChild(el("h4",{},nombre+" "+year));
    const table = el("table",{class:"cal"});
    table.appendChild(el("tr",{}, ["L","M","X","J","V","S","D"].map(d=>el("th",{},d))));
    const first = new Date(year,monthIdx,1);
    let startDow = first.getDay(); startDow = startDow===0?6:startDow-1;
    const daysInMonth = new Date(year,monthIdx+1,0).getDate();
    let row = el("tr");
    for(let i=0;i<startDow;i++) row.appendChild(el("td",{class:"empty"},""));
    for(let d=1; d<=daysInMonth; d++){
      const dateObj = new Date(year,monthIdx,d);
      const iso = dateObj.toISOString().slice(0,10);
      const dow = dateObj.getDay();
      let cls="";
      if(dow===0||dow===6) cls="weekend";
      if(FESTIVOS.includes(iso)) cls="festivo";
      if(iso===today) cls="today";
      row.appendChild(el("td",{class:cls}, String(d)));
      if((startDow+d)%7===0){ table.appendChild(row); row=el("tr"); }
    }
    if(row.children.length) table.appendChild(row);
    card.appendChild(table);
    grid.appendChild(card);
  });
}

/* =========================================================
   ROPA
========================================================= */
const ROPA_ITEMS = [["camiseta","Camiseta"],["polo","Polo"],["pantPaseo","Pant. paseo"],["pantEntre","Pant. entreno"],
  ["chaqueta","Chaqueta"],["pantalon","Pantalón"],["sudadera","Sudadera"],["entrenoLargo","Entreno largo"]];

function renderRopa(){
  const tbl = document.getElementById("tblRopa");
  tbl.innerHTML="";
  tbl.appendChild(el("thead",{},el("tr",{},["Jugador",...ROPA_ITEMS.map(i=>i[1])].map(h=>el("th",{},h)))));
  const tbody = el("tbody");
  state.players.forEach(p=>{
    if(!state.ropa[p.id]) state.ropa[p.id]={};
    const row = state.ropa[p.id];
    const tr = el("tr");
    tr.appendChild(el("td",{},(p.nombre||"—")+" "+(p.apellidos||"")));
    ROPA_ITEMS.forEach(([key])=>{ tr.appendChild(inputCell(row[key], v=>row[key]=v, "text", {placeholder:"talla"})); });
    tbody.appendChild(tr);
  });
  tbl.appendChild(tbody);
}

/* =========================================================
   ECONOMÍA
========================================================= */
const ECON_COLS = [["ropa1","Ropa 1"],["sep","Sep"],["oct","Oct"],["nov","Nov"],["dic","Dic"],
  ["ropa2","Ropa 2"],["loteria","Lotería"],["ene","Ene"],["feb","Feb"],["mar","Mar"],["abr","Abr"],["may","May"]];

function renderEconomia(){
  const tbl = document.getElementById("tblEconomia");
  tbl.innerHTML="";
  tbl.appendChild(el("thead",{},el("tr",{},["Jugador",...ECON_COLS.map(c=>c[1])].map(h=>el("th",{},h)))));
  const tbody = el("tbody");
  let paid=0,total=0;
  state.players.forEach(p=>{
    if(!state.economia[p.id]) state.economia[p.id]={};
    const row = state.economia[p.id];
    const tr = el("tr");
    tr.appendChild(el("td",{},(p.nombre||"—")+" "+(p.apellidos||"")));
    ECON_COLS.forEach(([key])=>{
      total++;
      const val = row[key]||"";
      if(val==="X") paid++;
      const td = el("td",{class:"num"});
      const btn = el("button",{class:"btn sm", style:"width:100%;justify-content:center;"+(val==="X"?"background:var(--green-ok);border-color:var(--green-ok);color:#08130a;":val==="B"?"background:var(--amber);border-color:var(--amber);color:#1a1400;":"")},
        val||"—");
      btn.addEventListener("click",()=>{
        row[key] = val===""?"X": val==="X"?"B":"";
        save(); renderEconomia();
      });
      td.appendChild(btn);
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  tbl.appendChild(tbody);
  document.getElementById("econSummary").innerHTML = `Cuotas marcadas como pagadas: <b>${paid}</b> / ${total}`;
}
