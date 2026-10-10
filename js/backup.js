/* Copia de seguridad opcional (exportar / importar .json) */
/* =========================================================
   COPIA DE SEGURIDAD (exportar / importar)
========================================================= */
function exportBackup(){
  const blob = new Blob([JSON.stringify(state, null, 2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const fecha = new Date().toISOString().slice(0,10);
  a.href = url;
  a.download = `cordoba_futsal_copia_${fecha}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast("Copia de seguridad descargada");
}
function wireBackup(){
  const input = document.getElementById("fileImportInput");
  if(!input) return;
  input.addEventListener("change", (e)=>{
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = async ()=>{
    try{
      const parsed = JSON.parse(reader.result);
      const ok = await customConfirm("Vas a reemplazar los datos actuales por los de esta copia de seguridad. ¿Continuar?", {okLabel:"Reemplazar", danger:true});
      if(!ok) return;
      state = mergeState(parsed);
      save();
      toast("Copia de seguridad importada");
      renderView(currentViewName());
      renderInicio();
    }catch(err){
      toast("El archivo no es una copia de seguridad válida", "warn");
    }
  };
  reader.readAsText(file);
  e.target.value = "";
});
}
