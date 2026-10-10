/* Navegación entre vistas, buscador del menú y cableado de botones */
/* =========================================================
   NAVEGACIÓN
========================================================= */
const viewTitles = {
  inicio:["Inicio","Cuadro de mando del equipo"],
  pretemporada:["Pretemporada","Contiene detalles del inicio del equipo en la temporada"],
  plantilla:["Plantilla","Descripción de los jugadores que formarán el equipo"],
  datosjugadores:["Datos jugadores","Datos relevantes de la plantilla y contacto"],
  calendario:["Calendario","Calendario de la temporada 26-27"],
  ropa:["Ropa","Apuntes de las necesidades de ropa para el equipo"],
  economia:["Economía","Relación de pagos realizados por los jugadores"],
  planevolutivo:["Plan evolutivo","Detalle de lo que se pide trabajar con los jugadores"],
  ideasiniciales:["Ideas iniciales","Apuntes personales del entrenador que no queremos perder"],
  mesociclos:["Planing mensual","Planificación inicial y mensual del equipo"],
  sesiones:["Sesiones de entreno","Programación detallada de entrenamientos"],
  tipostareas:["Tipos de tareas","Tipologías de tarea del club"],
  basetareas:["Base de datos de tareas","Tu catálogo propio y reutilizable de ejercicios"],
  competiciones:["Competiciones","Calendario de competiciones"],
  clasificacion:["Clasificación","Tabla de liga calculada automáticamente"],
  convocatorias:["Convocatorias","Resumen de convocatorias de la temporada"],
  planpartido:["Plan de partido","Planteamiento inicial de partido"],
  minutos:["Minutos","Minutos disputados por cada jugador"],
  puntuacion:["Puntuación","Valoración del desempeño de cada jugador"],
  valoraciones:["Ficha jugadores","Evolución de los jugadores a lo largo de la temporada"],
  scouting:["Scouting","Seguimiento de jugadores de otros equipos"],
  proteccion:["Protección del menor","Protocolo obligatorio Junta de Andalucía"]
};

function go(view){
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
  document.getElementById("view-"+view).classList.add("active");
  document.querySelectorAll(".nav-btn").forEach(b=>b.classList.toggle("active", b.dataset.view===view));
  document.getElementById("viewEyebrow").textContent = "Córdoba Futsal";
  document.getElementById("viewTitle").textContent = viewTitles[view][0];
  document.getElementById("viewSub").textContent = viewTitles[view][1];
  toggleDrawer(false);
  renderView(view);
  window.scrollTo(0,0);
  setupReveal();
}

/* Cableado de todos los botones estáticos del HTML (sin onclick en línea). */
function wireStaticButtons(){
  const byId = (id)=>document.getElementById(id);
  document.querySelectorAll(".nav-btn").forEach(b=>b.addEventListener("click",()=>go(b.dataset.view)));
  wireBackup();
  byId("exportBackupBtn") && byId("exportBackupBtn").addEventListener("click", exportBackup);
  byId("importBackupBtn") && byId("importBackupBtn").addEventListener("click", ()=>byId("fileImportInput").click());
  byId("mobileMenuBtn") && byId("mobileMenuBtn").addEventListener("click", ()=>toggleDrawer());
  byId("backdrop") && byId("backdrop").addEventListener("click", ()=>toggleDrawer(false));
  window.addEventListener("keydown", (e)=>{ if(e.key==="Escape") toggleDrawer(false); });
  byId("refreshBtn") && byId("refreshBtn").addEventListener("click", manualRefresh);
  byId("addPlayerBtn") && byId("addPlayerBtn").addEventListener("click", addPlayer);
  byId("addSesionBtn") && byId("addSesionBtn").addEventListener("click", addSesion);
  byId("addTareaDBBtn") && byId("addTareaDBBtn").addEventListener("click", addTareaDB);
  byId("addConvocatoriaBtn") && byId("addConvocatoriaBtn").addEventListener("click", addConvocatoria);
  byId("addScoutingBtn") && byId("addScoutingBtn").addEventListener("click", addScouting);
  const pp = byId("ppSelect");
  if(pp) pp.addEventListener("change", renderPlanPartido);
  const nav = byId("navSearch");
  if(nav) nav.addEventListener("input", ()=>filterNav(nav.value));
  document.querySelectorAll(".menu-tile[data-go]").forEach(t=>{
    t.addEventListener("click", ()=>go(t.dataset.go));
  });
}

function filterNav(query){
  query = query.trim().toLowerCase();
  document.querySelectorAll(".nav-btn").forEach(b=>{
    const label = b.textContent.trim().toLowerCase();
    b.classList.toggle("hidden", query.length>0 && !label.includes(query));
  });
  document.querySelectorAll(".nav-group").forEach(g=>{
    const visible = [...g.querySelectorAll(".nav-btn")].some(b=>!b.classList.contains("hidden"));
    g.style.display = visible ? "" : "none";
  });
}

function renderView(view){
  const map = {
    inicio:renderInicio, pretemporada:renderPretemporada, plantilla:renderPlantilla,
    datosjugadores:renderContactos, calendario:renderCalendario, ropa:renderRopa,
    economia:renderEconomia, planevolutivo:renderPlanEvolutivo, ideasiniciales:renderIdeas,
    mesociclos:renderMesociclos, sesiones:renderSesiones, tipostareas:renderTiposTareas,
    basetareas:renderBaseTareas,
    competiciones:renderCompeticiones, clasificacion:renderClasificacion, convocatorias:renderConvocatorias,
    planpartido:renderPlanPartidoView, minutos:renderMinutos, puntuacion:renderPuntuacion,
    valoraciones:renderValoraciones, scouting:renderScouting, proteccion:()=>{}
  };
  if(map[view]) map[view]();
}
function currentViewName(){
  const active = document.querySelector(".view.active");
  return active ? active.id.replace("view-","") : "inicio";
}

/* Scroll reveal para tarjetas de acceso rápido */
let revealObserver;
function setupReveal(){
  if(!revealObserver){
    revealObserver = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add("in"); revealObserver.unobserve(e.target); } });
    }, {threshold:.12});
  }
  document.querySelectorAll(".reveal:not(.in)").forEach(elm=>revealObserver.observe(elm));
}

/* Menú lateral como cajón en móvil/tablet: abre/cierra y bloquea el scroll de fondo */
function toggleDrawer(force){
  const sb = document.getElementById("sidebar");
  const bd = document.getElementById("backdrop");
  if(!sb) return;
  const open = typeof force === "boolean" ? force : !sb.classList.contains("open");
  sb.classList.toggle("open", open);
  if(bd) bd.classList.toggle("show", open);
  document.body.classList.toggle("no-scroll", open);
}
