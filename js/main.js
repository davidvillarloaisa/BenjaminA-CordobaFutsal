/* =========================================================
   ARRANQUE
========================================================= */
(async function init(){
  // Cualquier error se muestra en pantalla (así se ve el motivo sin abrir la consola).
  window.addEventListener("error", (e)=>{ toast("Error: " + (e.message || "desconocido"), "warn"); });
  window.addEventListener("unhandledrejection", (e)=>{
    const msg = (e.reason && (e.reason.message || e.reason.code)) || String(e.reason);
    toast("Error (async): " + msg, "warn");
  });

  wireStaticButtons();
  initResponsiveTables();

  try{
    state = await loadStateAsync();
  }catch(e){
    console.error(e);
    const local = readLocal();
    state = local ? mergeState(local) : defaultState();
    toast("No se pudieron cargar los datos de la nube; se usan los de este navegador.", "warn");
  }
  if(hasCloud){
    try{ subscribeCloud(); }catch(e){ handleCloudError(e); }
    if(pendingInitialPush) save();     // primera vez: crea el documento en Firestore con los datos actuales
  }

  // Aviso de portada y pie según el modo de guardado
  const notice = document.getElementById("shareNotice");
  const footer = document.getElementById("footerNote");
  let noticeHTML, footerText;
  if(hasCloud){
    noticeHTML = `<div class="notice gold"><b>🔗 Sincronizado con Firebase:</b>&nbsp;cualquier persona con el enlace de esta web ve y edita los mismos datos en directo.</div>`;
    footerText = "Córdoba Futsal · Sala de Mando — cada cambio se guarda y se sincroniza al instante. La copia de seguridad es opcional.";
  }else if(firebaseConfigured()){
    noticeHTML = `<div class="notice warn"><b>⚠ Sin conexión con Firebase:</b>&nbsp;trabajando en modo local. Tus cambios se guardan en este navegador.</div>`;
    footerText = "Córdoba Futsal · Sala de Mando — modo local (Firebase no respondió).";
  }else{
    noticeHTML = "";
    footerText = "Córdoba Futsal · Sala de Mando — cada cambio se guarda solo en este navegador. Con Firebase configurado se comparte en directo.";
  }
  if(notice) notice.innerHTML = noticeHTML;
  if(footer) footer.textContent = footerText;
  const refresh = document.getElementById("refreshBtn");
  if(refresh) refresh.style.display = fsDoc ? "" : "none";

  document.getElementById("loadOverlay").remove();
  document.getElementById("app").classList.remove("is-loading");
  try{ renderView("inicio"); }catch(e){ toast("Error al dibujar la pantalla: " + e.message, "warn"); }
  setupReveal();
  updateSaveStatusUI(false);
})();
