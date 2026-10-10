/* Datos fijos: equipo propio y calendario de la liga (22 jornadas reales de la ficha del club) */
const OWN_TEAM = "C.D. CÓRDOBA FUTSAL PATRIMONIO";

/* =========================================================
   DATOS DE COMPETICIÓN (reales, de la ficha del club).
   El equipo del usuario (Córdoba Futsal Patrimonio, Benjamín A) se resalta
   automáticamente en el calendario y la clasificación mediante OWN_TEAM.
========================================================= */
function buildJornadas(){
  const equipos = ["C.D. MARISTAS SEVILLA","C.D. SAN FELIPE NERI","C.D. SALESIANOS TRINIDAD","C.D. CADISTA DE LA ISLA",
    "C.D. LA SALLE","C.D. RAUL NAVAS","C.D. CÓRDOBA FUTSAL PATRIMONIO","C.D. FUTBOL SALA POZOBLANCO",
    "C.D. MARQUÉS DE NERVIÓN","C.D. XEREZ FUTSAL","A.D. SAN FRANCISCO DE PAULA","C.D. DECORSENECA TRANSPORTES LUIS CIRERA"];
  const raw = [
    ["27-09-2026",[[0,1],[2,3],[4,5],[6,7],[8,9],[10,11]]],["04-10-2026",[[1,10],[3,0],[5,2],[7,4],[9,6],[11,8]]],
    ["11-10-2026",[[1,3],[0,5],[2,7],[4,9],[6,11],[10,8]]],["18-10-2026",[[3,10],[5,1],[7,0],[9,2],[11,4],[8,6]]],
    ["25-10-2026",[[3,5],[1,7],[0,9],[2,11],[4,8],[10,6]]],["01-11-2026",[[5,10],[7,3],[9,1],[11,0],[8,2],[6,4]]],
    ["08-11-2026",[[5,7],[3,9],[1,11],[0,8],[2,6],[10,4]]],["15-11-2026",[[7,10],[9,5],[11,3],[8,1],[6,0],[4,2]]],
    ["22-11-2026",[[7,9],[5,11],[3,8],[1,6],[0,4],[10,2]]],["29-11-2026",[[10,9],[11,7],[8,5],[6,3],[4,1],[2,0]]],
    ["20-12-2026",[[9,11],[7,8],[5,6],[3,4],[1,2],[0,10]]],["24-01-2027",[[1,0],[3,2],[5,4],[7,6],[9,8],[11,10]]],
    ["31-01-2027",[[10,1],[0,3],[2,5],[4,7],[6,9],[8,11]]],["07-02-2027",[[3,1],[5,0],[7,2],[9,4],[11,6],[8,10]]],
    ["14-02-2027",[[10,3],[1,5],[0,7],[2,9],[4,11],[6,8]]],["21-02-2027",[[5,3],[7,1],[9,0],[11,2],[8,4],[6,10]]],
    ["07-03-2027",[[10,5],[3,7],[1,9],[0,11],[2,8],[4,6]]],["14-03-2027",[[7,5],[9,3],[11,1],[8,0],[6,2],[10,4]]],
    ["04-04-2027",[[10,7],[5,9],[3,11],[1,8],[0,6],[2,4]]],["11-04-2027",[[9,7],[11,5],[8,3],[6,1],[4,0],[2,10]]],
    ["02-05-2027",[[9,10],[7,11],[5,8],[3,6],[1,4],[0,2]]],["09-05-2027",[[11,9],[8,7],[6,5],[10,3],[4,1],[2,0]]]
  ];
  const jornadas=[];
  raw.forEach((j,idx)=>{
    const partidos = j[1].map(p=>({id:uid(),local:equipos[p[0]],visitante:equipos[p[1]],golesL:"",golesV:""}));
    jornadas.push({id:uid(),numero:idx+1,fecha:j[0],vuelta: idx<11?"Primera vuelta":"Segunda vuelta", partidos});
  });
  return jornadas;
}
