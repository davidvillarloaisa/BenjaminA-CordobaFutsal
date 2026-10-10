# Córdoba Futsal · Sala de Mando (Benjamín A · 26/27)

Web de gestión del equipo: plantilla, contactos, calendario, ropa, economía, plan evolutivo,
planificación mensual, sesiones de entreno, base de tareas, competición con clasificación automática,
convocatorias, minutos, puntuaciones, fichas de valoración (radar), scouting y protocolo de protección del menor.

Es una web estática (HTML + CSS + JavaScript, sin instalar nada) y es **totalmente responsive**
(móvil, tablet y escritorio).

## Cómo se organiza

```
index.html                 estructura de la página
favicon.ico                favicon (logo sin fondo)
manifest.webmanifest       permite "Añadir a pantalla de inicio" en el móvil
css/styles.css             todos los estilos y la parte responsive
assets/img/logo.png        logo sin fondo (214×235)  ·  logo-grande.png (x3)
assets/icons/              favicons e iconos PNG sin fondo (16 … 512, apple-touch-icon)
js/firebase-config.js      ← AQUÍ pegas tu configuración de Firebase
js/data.js                 datos fijos: equipo propio y 22 jornadas de la liga
js/state.js                estado de la app (todos los datos del equipo)
js/storage.js              guardado local + sincronización con Firebase Firestore
js/ui.js                   avisos, diálogos, helpers de tabla, tablas responsive
js/backup.js               copia de seguridad opcional (exportar/importar .json)
js/nav.js                  navegación, menú lateral y botones
js/views/*.js              cada apartado (general, planificación, entrenos, partidos, jugadores)
js/main.js                 arranque
firebase.json, .firebaserc, firestore.rules      para publicar con Firebase Hosting + reglas
```

## Usarla ya (sin Firebase)

Abre `index.html` con doble clic. Funciona en **modo local**: todo lo que escribes se guarda al instante
en ese navegador. Para compartirla con otras personas o dispositivos hace falta Firebase (siguiente apartado).

## Conectar Firebase (datos compartidos en directo)

1. Entra en <https://console.firebase.google.com> → **Crear un proyecto** (puedes desactivar Analytics).
2. **Compilación → Firestore Database → Crear base de datos** (modo producción, ubicación `eur3` o `europe-southwest1`).
3. **Configuración del proyecto (rueda dentada) → Tus apps → Web `</>`** → ponle un nombre → **Registrar app**.
4. Copia el objeto `firebaseConfig` que te enseña y pégalo en **`js/firebase-config.js`**
   (sustituye los valores `TU_...`). Esos datos son públicos por diseño; no son contraseñas.
5. En **Firestore → Reglas** pega el contenido de `firestore.rules` y pulsa **Publicar**.
6. Abre la web: arriba verás "🔗 Sincronizado con Firebase". La primera vez crea el documento
   `equipos/cordoba-futsal-benjamin-a-2627` con los datos actuales.

A partir de ahí, todo el que abra la web ve los mismos datos y los cambios llegan en directo.

### Cómo se comporta la sincronización
- Todo cambio se guarda primero en el navegador y, a los 0,4 s de pausa, se envía a Firestore.
- Solo se envía el **apartado** que has cambiado (plantilla, economía, ropa…).
- Si dos personas cambian el mismo apartado a la vez, se **fusiona** elemento a elemento (por jugador, sesión, etc.)
  y, si tocan exactamente el mismo dato, gana el último en guardar.
- Lo que estás escribiendo nunca se borra cuando llega un cambio de otra persona.
- Sin conexión sigue funcionando: se guarda en el navegador y se envía al volver.
- Botón **⟳ Actualizar** para forzar la lectura desde el servidor.

### Seguridad (importante)
Sin login, **cualquier persona que conozca la dirección de la web puede ver y editar los datos**
(incluidos datos personales de menores). Opciones para cerrarlo:
- No difundas el enlace fuera del cuerpo técnico.
- Activa **Authentication → Anónimo**, pon `FIREBASE_USE_ANONYMOUS_AUTH = true` y usa la "Opción B" de `firestore.rules`.
- Para control real por persona haría falta login con correo/Google (se puede añadir).
- Un documento de Firestore admite 1 MB; la web avisa si los datos se acercan a ese límite.

## Publicarla gratis

**Firebase Hosting** (mismo proyecto): instala Node.js, luego en esta carpeta:
```
npm i -g firebase-tools
firebase login
firebase use --add        # elige tu proyecto
firebase deploy
```
Te da una dirección tipo `tu-proyecto.web.app`.

**Netlify Drop**: arrastra la carpeta entera a <https://app.netlify.com/drop>.
**Cloudflare Pages / GitHub Pages**: sube la carpeta tal cual (no hay paso de compilación).
Si usas un dominio propio, en Firebase Console → Authentication → Configuración → Dominios autorizados
solo hace falta añadirlo si activas el acceso anónimo.

## Notas
- El logo original tenía fondo blanco; se ha recortado a PNG transparente. La imagen de partida es pequeña
  (214×235): para impresión o pantallas muy grandes conviene pedir al club el escudo en vector (SVG/PDF).
- Los nombres y datos de ejemplo (dos jugadores) se pueden borrar desde Plantilla.
