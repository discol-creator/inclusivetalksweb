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
