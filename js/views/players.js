/* Vistas · Jugadores: valoraciones (radar) y scouting */
/* =========================================================
   VALORACIONES (ficha jugadores + radar)
========================================================= */
const VAL_FASES = [["inicial","Inicial"],["intermedia","Intermedia"],["final","Final"]];
const VAL_CATS = [["fisico","Físico"],["tecnica","Técnica"],["tactica","Táctica"],["psico","Psico"],["lider","Líder"]];
const FASE_COLORS = {inicial:"#7a8fd1", intermedia:"#d19a3d", final:"#d4a24c"};

function radarPoints(values, cx, cy, r){
  const n = values.length;
  return values.map((v,i)=>{
    const angle = (Math.PI*2*i/n) - Math.PI/2;
    const rr = (Math.max(0,Math.min(10,v))/10) * r;
    return [cx + rr*Math.cos(angle), cy + rr*Math.sin(angle)];
  });
}
function radarSVG(dataByFase){
  const size = 190, cx=size/2, cy=size/2, r=68;
  let svg = `<svg viewBox="0 0 ${size} ${size}" width="190" height="190">`;
  [0.25,0.5,0.75,1].forEach(f=>{
    const pts = radarPoints(VAL_CATS.map(()=>10*f), cx, cy, r).map(p=>p.join(",")).join(" ");
    svg += `<polygon points="${pts}" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="1"/>`;
  });
  VAL_CATS.forEach((c,i)=>{
    const angle = (Math.PI*2*i/VAL_CATS.length) - Math.PI/2;
    const x2 = cx + r*Math.cos(angle), y2 = cy + r*Math.sin(angle);
    svg += `<line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}" stroke="rgba(255,255,255,.08)" stroke-width="1"/>`;
    const lx = cx + (r+16)*Math.cos(angle), ly = cy + (r+16)*Math.sin(angle);
    svg += `<text x="${lx}" y="${ly}" fill="#a7b6ac" font-size="9" font-family="Inter" text-anchor="middle" dominant-baseline="middle">${c[1]}</text>`;
  });
  Object.entries(dataByFase).forEach(([fase,vals])=>{
    if(vals.every(v=>v===0)) return;
    const pts = radarPoints(vals, cx, cy, r).map(p=>p.join(",")).join(" ");
    svg += `<polygon points="${pts}" fill="${FASE_COLORS[fase]}22" stroke="${FASE_COLORS[fase]}" stroke-width="1.6"/>`;
  });
  svg += `</svg>`;
  return svg;
}

function renderValoraciones(){
  const list = document.getElementById("valoracionesList");
  list.innerHTML="";
  if(state.players.length===0){
    list.appendChild(el("div",{class:"empty-state"},[el("div",{class:"big"},"🧾"),el("div",{},"Añade jugadores en Plantilla para empezar a valorarlos.")]));
    return;
  }
  state.players.forEach(p=>{
    if(!state.valoraciones[p.id]) state.valoraciones[p.id]={inicial:{},intermedia:{},final:{}};
    const val = state.valoraciones[p.id];
    const card = el("div",{class:"card hoverable"});
    card.appendChild(el("h2",{}, (p.nombre||"Jugador")+" "+(p.apellidos||"")+" · "+(p.puesto||"")));

    const radarRow = el("div",{class:"radar-card"});
    const dataByFase = {};
    VAL_FASES.forEach(([fkey])=>{
      if(!val[fkey]) val[fkey]={};
      dataByFase[fkey] = VAL_CATS.map(([ckey])=> +val[fkey][ckey] || 0);
    });
    radarRow.appendChild(el("div",{html: radarSVG(dataByFase)}));
    const legend = el("div",{class:"radar-legend"});
    VAL_FASES.forEach(([fkey,flabel])=>{
      const li = el("div",{class:"li"});
      li.appendChild(el("div",{class:"sw", style:`background:${FASE_COLORS[fkey]};`}));
      const avgArr = dataByFase[fkey].filter(v=>v>0);
      const avg = avgArr.length? (avgArr.reduce((a,b)=>a+b,0)/avgArr.length).toFixed(1) : "—";
      li.appendChild(el("div",{}, `${flabel} · media ${avg}`));
      legend.appendChild(li);
    });
    radarRow.appendChild(legend);
    card.appendChild(radarRow);

    const tbl = el("table",{class:"dt", style:"margin-top:14px;"});
    tbl.appendChild(el("thead",{},el("tr",{},["Categoría",...VAL_FASES.map(f=>f[1])].map(h=>el("th",{},h)))));
    const tbody = el("tbody");
    VAL_CATS.forEach(([ckey,clabel])=>{
      const tr = el("tr");
      tr.appendChild(el("td",{},clabel));
      VAL_FASES.forEach(([fkey])=>{
        tr.appendChild(inputCell(val[fkey][ckey], v=>{val[fkey][ckey]=v; save(); renderValoraciones();}, "number", {min:0,max:10,style:"width:56px;"}));
      });
      tbody.appendChild(tr);
    });
    tbl.appendChild(tbody);
    card.appendChild(el("div",{class:"table-wrap"}, tbl));

    list.appendChild(card);
  });
}

/* =========================================================
   SCOUTING
========================================================= */
function addScouting(){
  state.scouting.push({id:uid(),nombre:"",apellidos:"",dorsal:"",equipo:"",psico:"",tecnica:"",tactica:"",fisico:"",lider:""});
  save(); renderScouting(); toast("Jugador de scouting añadido");
}
function renderScouting(){
  const tbl = document.getElementById("tblScouting");
  tbl.innerHTML="";
  tbl.appendChild(el("thead",{},el("tr",{},["Nombre","Apellidos","Dorsal","Equipo","Psico","Técnica","Táctica","Físico","Líder","Media",""].map(h=>el("th",{},h)))));
  const tbody = el("tbody");
  state.scouting.forEach(s=>{
    const tr = el("tr");
    tr.appendChild(inputCell(s.nombre, v=>s.nombre=v));
    tr.appendChild(inputCell(s.apellidos, v=>s.apellidos=v));
    tr.appendChild(inputCell(s.dorsal, v=>s.dorsal=v, "number", {style:"width:56px;"}));
    tr.appendChild(inputCell(s.equipo, v=>s.equipo=v));
    ["psico","tecnica","tactica","fisico","lider"].forEach(k=>{
      tr.appendChild(inputCell(s[k], v=>{s[k]=v; save(); renderScouting();}, "number", {min:0,max:10,style:"width:52px;"}));
    });
    const vals = ["psico","tecnica","tactica","fisico","lider"].map(k=>+s[k]||0).filter(v=>v>0);
    tr.appendChild(el("td",{class:"calc"}, vals.length? (vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1) : "—"));
    tr.appendChild(el("td",{}, el("button",{class:"rowdel", onclick: async ()=>{
      const ok = await customConfirm("¿Eliminar este jugador de scouting?", {danger:true});
      if(ok){
        state.scouting=state.scouting.filter(x=>x.id!==s.id); save(); renderScouting(); toast("Eliminado");
      }
    }},"✕")));
    tbody.appendChild(tr);
  });
  tbl.appendChild(tbody);
}
