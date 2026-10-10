/* =========================================================
   CONFIGURACIÓN · FIREBASE
   ---------------------------------------------------------
   Mientras apiKey siga con el texto de ejemplo ("TU_API_KEY"), la web
   funciona en MODO LOCAL (los datos se guardan en este navegador).

   Para sincronizar entre dispositivos y compañeros:
     1. Crea un proyecto en https://console.firebase.google.com
     2. Compilación > Firestore Database > Crear base de datos
     3. Configuración del proyecto > Tus apps > Web (</>) > Registrar app
     4. Copia aquí el objeto "firebaseConfig" que te muestra Firebase
     5. Pega las reglas de firestore.rules en Firestore > Reglas > Publicar
   (Pasos detallados en LEEME.md)
========================================================= */
// Configuración de Firebase para Córdoba Futsal
const firebaseConfig = {
  apiKey: "AIzaSyB4AlnegsfGINn0v6BFJmRJmtxBqweqQ9E",
  authDomain: "benjaminacordobafutsal.firebaseapp.com",
  projectId: "benjaminacordobafutsal",
  storageBucket: "benjaminacordobafutsal.firebasestorage.app",
  messagingSenderId: "916618689725",
  appId: "1:916618689725:web:94d0a741b11a97366e0bd4",
  measurementId: "G-G7ZLTCZ3KX"
};

const FIREBASE_USE_ANONYMOUS_AUTH = false;

/* Dónde se guardan los datos del equipo dentro de Firestore: coleccion/documento.
   Si llevas varios equipos, cambia FIREBASE_DOC_ID (por ejemplo "cordoba-futsal-alevin-2627"). */
window.FIREBASE_COLLECTION = "equipos";
window.FIREBASE_DOC_ID = "cordoba-futsal-benjamin-a-2627";

/* true = la web inicia sesión como "anónimo" en Firebase Authentication (activa antes
   "Anónimo" en Authentication > Método de acceso) y puedes exigir login en las reglas. */
window.FIREBASE_USE_ANONYMOUS_AUTH = false;

/* Versión del SDK de Firebase que se descarga (compat, funciona también abriendo index.html sin servidor). */
window.FIREBASE_SDK_VERSION = "10.12.5";

/* Clave del almacenamiento local del navegador (copia de seguridad automática y modo sin conexión). */
window.LOCAL_STORAGE_KEY = "cordobafutsal_salademando_benjaminA_2627";
