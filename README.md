# Inclusive Talks — Landing de próximo lanzamiento

Landing "coming soon" para la segunda edición de Inclusive Talks (Medellín, 2026).
Sitio estático (HTML, CSS y JS sin frameworks ni build) más dos funciones serverless
en Vercel: una para el formulario de pre-registro y otra para la postulación de
alianzas institucionales.

## Stack técnico

- **Frontend:** HTML5 semántico + CSS3 (sin preprocesadores) + JavaScript vanilla (sin dependencias). Cero build step.
- **Backend de los formularios:** dos funciones serverless de Vercel (Node.js, sin dependencias npm) que envían cada envío por correo usando la API REST de [Resend](https://resend.com):
  - `api/preregister.js`: formulario de inscripción previa (sección "Inscripción previa").
  - `api/alianza.js`: formulario de postulación de alianza institucional (modal que abre el botón "Quiero postular a mi institución" en la sección "Alianzas institucionales"). Pide nombre, empresa o institución, cargo, correo y número de contacto.
- **Tipografía:** Plus Jakarta Sans (Google Fonts), geométrica y bold, cercana a la identidad ya definida.
- **Hosting:** Vercel (proyecto estático + 2 funciones en `/api`).
- **Imágenes:** fotografías de banco gratuito (Unsplash), descargadas localmente y optimizadas en formato JPG. Ver "Créditos de imágenes" abajo.

No hay base de datos: cada envío se manda como correo a la casilla de
Discapacidad Colombia. Si más adelante se necesita una lista exportable (CSV,
CRM, Google Sheets), se puede añadir sin tocar el frontend.

## Cómo correr en local

No requiere instalación de dependencias para ver el sitio:

```bash
npx serve .
```

o simplemente abre `index.html` en el navegador (el formulario no funcionará sin
el servidor de funciones; para probarlo end to end usa el CLI de Vercel):

```bash
npm i -g vercel
vercel dev
```

## Desplegar en Vercel

1. Sube esta carpeta a un repositorio de Git (GitHub, GitLab o Bitbucket).
2. En [vercel.com](https://vercel.com), "Add New Project" e importa el repositorio.
   Vercel detecta automáticamente que es un proyecto estático con una carpeta `api/`.
3. Antes del primer deploy funcional del formulario, configura las variables de
   entorno en **Project Settings > Environment Variables**:

   | Variable | Requerida | Descripción |
   |---|---|---|
   | `RESEND_API_KEY` | Sí | API key de tu cuenta de [resend.com](https://resend.com) (tiene plan gratuito). La usan ambas funciones. |
   | `NOTIFY_EMAIL` | No | Correo que recibe los pre-registros y las postulaciones de alianza. Por defecto `dicapacidad.colombia@gmail.com`. |
   | `RESEND_FROM` | No | Remitente verificado en Resend (por ejemplo `Inclusive Talks <hola@inclusivetalks.co>` una vez verifiques un dominio propio en Resend). Mientras no tengas dominio propio, usa el valor por defecto `onboarding@resend.dev`, válido solo para pruebas de bajo volumen. |

4. Haz deploy. Sin `RESEND_API_KEY` configurada, el sitio se ve y navega
   perfecto, pero ambos formularios responderán con un mensaje pidiendo
   escribir directamente al correo (no fallan en silencio).

### Alternativa sin Resend

Si prefieres no depender de Resend, `api/preregister.js` y `api/alianza.js` son
archivos independientes sin dependencias: se puede reemplazar fácilmente el
bloque que llama a la API de Resend en cada uno por cualquier otro proveedor de
correo transaccional, un webhook a Zapier/Make, o una escritura a Google Sheets
vía Apps Script.

## Inscripción al evento (Medellín, 4 de diciembre de 2026)

Páginas y archivos:

| Archivo | Para qué |
|---|---|
| `inscripcion.html` | Formulario de inscripción (`/inscripcion`) |
| `privacidad.html` | Aviso de privacidad (`/privacidad`) |
| `js/inscripcion.js` | Validación en el navegador y pantalla de confirmación |
| `api/inscripcion.mjs` | Función que valida, guarda en la hoja, genera la escarapela y envía el correo |
| `api/_campos.mjs` | Opciones del formulario y validación del servidor (los textos deben ser idénticos a los del HTML) |
| `api/_escarapela.mjs` | Genera la escarapela en PNG de 800 × 1200 px |
| `api/escarapela-demo.mjs` | Vista previa de la escarapela, desactivada en producción |
| `api/cupo.mjs` | Consulta cuántas inscripciones van y si queda cupo |
| `api/_firma.mjs` | Firma y comprueba la credencial que lleva el QR |
| `api/validar.mjs` | Comprueba una escarapela escaneada |
| `validar.html` + `js/validar.js` | Página `/validar` que muestra el resultado del escaneo |
| `api/fonts/` | Poppins e Inter en TTF, necesarias para dibujar el PNG |
| `docs/apps-script-inscripcion.gs` | Código que va en la hoja de Google (Extensiones > Apps Script) |

Flujo: el formulario llama a `/api/inscripcion`, que revalida todo, envía la fila al Apps Script de la
hoja maestra (pestaña `Inscripción`, columnas A a N), genera la escarapela con el nombre, la
organización y un QR con el número de documento, y manda el correo de confirmación con Resend. Si el correo falla, la
inscripción igual queda guardada.

Variables de entorno (Vercel > Settings > Environment Variables, marcadas para **Production** y **Preview**):

| Variable | Para qué |
|---|---|
| `APPS_SCRIPT_URL` | URL de la app web del Apps Script |
| `APPS_SCRIPT_TOKEN` | Clave compartida; debe ser igual a `TOKEN` en el Apps Script. También firma los QR si no hay `ESCARAPELA_SECRET` |
| `RESEND_API_KEY` | Clave de Resend (la misma del pre-registro) |
| `EMAIL_FROM` | Remitente verificado en Resend. Si falta se usa `RESEND_FROM` |
| `ESCARAPELA_SECRET` | Opcional. Clave para firmar los QR; si falta se deriva de `APPS_SCRIPT_TOKEN` |
| `SITE_URL` | Opcional. Dominio para los QR generados desde los scripts; en la web se detecta solo |

La sección de pre-registro de la landing quedó dentro de un `<template>` en `index.html`: el navegador
no la muestra. Para recuperarla, quita las dos etiquetas `<template>` que la envuelven.

### Escarapelas

Hay dos tipos: `asistente` y `ponente`. Cambian solo en la pastilla del encabezado.

Para revisar una sin escribir en la hoja ni enviar correos:

- **En una vista previa de Vercel** (no necesita Node, y usa el mismo entorno que producción):
  `/api/escarapela-demo?nombre=Nombre Apellido&organizacion=Entidad, cargo&documento=1020304050`
- **En local**, con Node 22 y `npm install` hechos:
  `npm run escarapela -- ponente "Nombre Apellido" "Entidad, cargo" 1020304050`

Cada archivo queda en `escarapelas/<tipo>/<documento>-<nombre>.png`. Esa carpeta está en
`.gitignore`: las escarapelas llevan datos personales y no van al repositorio.

### Respaldo de las escarapelas

No se guarda ninguna imagen en ningún servicio, ni en el servidor ni en la nube. No hace falta:
la escarapela se deduce por completo de la fila de la hoja (nombre, organización y documento),
así que **el respaldo es la hoja misma**. Para volver a tenerlas todas:

1. En Google Sheets: Archivo > Descargar > Valores separados por comas (.csv)
2. `npm run escarapelas -- inscripciones.csv`

Regenera una por fila en `escarapelas/asistente/`. Para los ponentes, con su propio CSV:
`npm run escarapelas -- ponentes.csv ponente`

### Cupo del evento

El tope está en **una sola línea**, en `docs/apps-script-inscripcion.gs`:

```js
const CUPO_MAXIMO = 60;
```

Para cambiarlo: hoja de cálculo > Extensiones > Apps Script, cambia el número, guarda
(Cmd+S) y publica una versión nueva (Implementar > Gestionar implementaciones > editar >
Nueva versión). No hay que tocar nada más: la web lee el tope y el conteo desde ahí.

Cómo se comporta:

- El Apps Script revisa el cupo **dentro de su candado**, así que dos personas que envíen a
  la vez no pueden colarse las dos en el último puesto.
- La página consulta `/api/cupo` al cargar. Si está lleno, oculta el formulario y muestra el
  aviso de inscripciones cerradas. Si queda cupo, muestra cuántos.
- Si la consulta falla o el Apps Script no responde, **el formulario sigue disponible**: más
  vale una inscripción de más que cerrarle la puerta a todo el mundo por un fallo de red.
  El Apps Script vuelve a revisar el cupo al guardar, que es donde cuenta.

### Validación del QR

El QR no lleva el número de documento suelto: lleva una URL a `/validar` con una credencial
firmada (HMAC-SHA256). Quien escanee con la cámara del celular ve si la escarapela es auténtica
y qué documento le corresponde, para contrastarlo con la cédula de la persona. Una escarapela
fabricada por fuera no pasa la comprobación.

El dato viaja en el fragmento de la URL (después de `#`), que el navegador nunca envía al
servidor: el número de documento no queda en los registros de Vercel.

## Contenido y fuente de la verdad

Todo el texto, cifras y estructura de niveles de alianza provienen de:

- `~/Desktop/Inclusive Talks/Inclusive_Talks_Info_Landing.md`
- `~/Desktop/Inclusive Talks/Brief/Design.pdf`

No se inventaron datos ni cifras. El logo oficial no se recibió como archivo
de imagen (PNG/SVG/AI); se reconstruyó como wordmark tipográfico fiel a como
aparece en `Design.pdf` (texto bold geométrico + acento circular azul), lo
que además da mejor accesibilidad y nitidez a cualquier resolución que una
imagen rasterizada. Si luego aparece el archivo vectorial oficial, basta con
reemplazar el marcado `.logo` en `index.html` por un `<img>`/`<svg>` con el
mismo texto alternativo.

Los niveles de alianza de patrocinio comercial que aparecen en `Design.pdf`
("Voz Fundadora", "Voz Estratégica", "Voz Aliada", "Voz Comunidad") no se
usaron: el documento de información explícitamente indica que la fase actual
busca respaldo institucional, no patrocinio comercial, así que se usaron los
cuatro niveles institucionales del brief (Aliado Fundador, de Gobierno,
Académico y de Sociedad Civil).

## Accesibilidad (WCAG 2.1 AA)

- Jerarquía semántica de encabezados (un solo `h1` visualmente oculto describe
  la página; los títulos visibles de cada sección son `h2`, las tarjetas de
  ejes/alianzas usan `h3`).
- Contraste verificado: el azul de marca (`#0EA5E9`) no se usa como color de
  texto sobre fondos claros porque no alcanza 3:1. Para texto grande (cifras,
  títulos) se usa una variante más oscura (`#0369A1`, ratio ~5.9:1 sobre
  blanco). El azul de marca se reserva para fondos, íconos y texto sobre fondo
  oscuro, donde sí cumple AA.
- Navegación completa por teclado, con foco visible (`:focus-visible`) en todos
  los controles interactivos, incluida la barra de accesibilidad.
- Enlace "Saltar al contenido principal" como primer elemento del `body`.
- Formulario con `label` asociado a cada campo, `fieldset`/`legend` para el
  grupo de radios "Vienes como", mensajes de error con `role="alert"` y
  `aria-invalid`, y confirmación de envío en una región `aria-live`.
- Imágenes decorativas (las tres fotografías de banco) con `alt=""` porque no
  representan al evento real; ningún texto alternativo falso.
- `prefers-reduced-motion` respetado: el scroll suave y la animación del
  indicador "En preparación" se desactivan.
- Barra de accesibilidad flotante con tres controles: tamaño de texto (zoom),
  lectura en voz alta del contenido principal (dictado, vía Web Speech API) y
  alto contraste (tema con negro puro, blanco puro y azul más oscuro para
  maximizar contraste). Las preferencias de zoom y contraste persisten en
  `localStorage`.

## Créditos de imágenes

Fotografías de [Unsplash](https://unsplash.com), bajo la Unsplash License
(uso libre, no se requiere atribución, se incluye igualmente por buena
práctica):

- `images/hero-audience.jpg`: fondo del hero.
- `images/ejes-portrait.jpg`: sección "Los tres ejes".
- `images/alianzas-handshake.jpg`: descargada para uso futuro en la sección de alianzas.

Son fotografías genéricas de banco, no fotografías reales de Inclusive Talks;
por eso llevan `alt=""` (decorativas) y no se presentan como material propio
del evento.
