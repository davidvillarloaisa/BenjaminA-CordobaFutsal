/* =========================================================
   ESTADO DE LA APP (un único objeto con todos los datos del equipo)
========================================================= */
const LS_KEY = window.LOCAL_STORAGE_KEY || "cordobafutsal_salademando_benjaminA_2627";

function defaultState(){
  return {
    pretemporada:{fechaInicio:"",nJugadores:"",competicion:"",semanas:"",entrenador:"",entrenador2:"",delegado:"",prepFisico:"",auxiliar:""},
    players:[
      {id:uid(),dorsal:1,nombre:"JOSE",apellidos:"FERNANDEZ CASTRO",puesto:"PORTERO",pie:"DERECHO",fecha:"2017-04-08",anio:"2º AÑO",dni:"",telefono:"",contacto1:"",tel1:"",contacto2:"",tel2:"",emailJugador:"",emailTutor:""},
      {id:uid(),dorsal:2,nombre:"FELIPE",apellidos:"CUCU",puesto:"CIERRE",pie:"ZURDO",fecha:"2010-02-13",anio:"",dni:"",telefono:"",contacto1:"",tel1:"",contacto2:"",tel2:"",emailJugador:"",emailTutor:""}
    ],
    ropa:{}, economia:{},
    ideas:{entrenos:["","","","","","",""],psico:["","","","","","",""],charlas:["","","","","","",""],capitanes:["","","","","","",""],convivencias:["","","","","","",""],otros:["","","","","","",""]},
    planEvolutivo:{},
    mesociclos: Array.from({length:10},()=>({tipologia:"PREPARATORIO",mes:"",objColectivos:"",objGrupales:"",objIndividuales:""})),
    sesiones:[], tareasDB:[],
    jornadas: buildJornadas(),
    convocatorias:[], convData:{}, minData:{}, scoreData:{}, planPartido:{},
    valoraciones:{}, scouting:[]
  };
}
function uid(){return 'id'+Math.random().toString(36).slice(2,10);}
/* Copia profunda: así nunca se modifican datos que vengan de la nube o de la caché. */
function cloneData(d){ return d ? JSON.parse(JSON.stringify(d)) : d; }

/* Mezcla datos guardados con los valores por defecto (por si se añaden apartados nuevos en el futuro). */
function mergeState(data){ return Object.assign({}, defaultState(), cloneData(data)); }

let state = defaultState(); // se sustituye por los datos reales al arrancar (ver main.js)
