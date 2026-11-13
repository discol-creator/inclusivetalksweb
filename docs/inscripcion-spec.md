# Especificación · Inscripción Inclusive Talks Medellín 2026

Fuente de verdad: proyecto "Inclusive Talks · Evidencia de Impacto" (Bloque C, aprobado el 2026-11-13). Acompaña al prompt para Claude Code. En contenido gana este archivo; en estilo visual gana la landing.

## 1. Flujo (lo único que hay que construir)

1. La persona llena el formulario en la landing.
2. La función `/api/inscripcion` (Vercel) valida y envía los datos a un Apps Script de Google, que guarda la fila en la pestaña `Inscripción` de la hoja maestra.
3. Si se guardó, la función genera la escarapela en PNG con su nombre, organización y código.
4. La función envía con Resend un correo de confirmación con la escarapela adjunta.
5. La landing muestra la pantalla de confirmación.

Si falla el correo, la inscripción igual queda guardada: se muestra la confirmación y se registra el error sin datos personales.

Fuera de alcance: check-in, encuestas pre y post, compromisos.

Archivos que acompañan esta spec en `docs/`:
- `escarapela-asistente.html`: plantilla de la escarapela (diseño de Claude Design).
- `apps-script-inscripcion.gs`: código del Apps Script (lo instala la persona usuaria en la hoja; Claude Code no lo toca).

## 2. Variables de entorno (ya creadas en Vercel)

| Variable | Para qué |
|---|---|
| `APPS_SCRIPT_URL` | URL de la app web del Apps Script |
| `APPS_SCRIPT_TOKEN` | Clave compartida; debe coincidir con `TOKEN` en el Apps Script |
| `RESEND_API_KEY` | Clave de Resend |
| `EMAIL_FROM` | Remitente verificado en Resend, ej. `Inclusive Talks <inscripciones@dominio.co>` |

## 3. Campos del formulario

El orden visual es el orden de las columnas en la hoja. Los textos de las opciones deben ser idénticos (tildes incluidas), porque la hoja cuenta sobre ellos.

| Campo (clave JSON) | Control | Obligatorio | Opciones / validación |
|---|---|---|---|
| Nombre completo (`nombre`) | text, `autocomplete="name"` | Sí | 3 a 120 caracteres |
| Correo electrónico (`correo`) | email, `autocomplete="email"` | Sí | Se guarda en minúsculas |
| Código personal (`codigo`) | text, `autocapitalize="characters"` | Sí | `^[A-Z]{2}(0[1-9]\|[12][0-9]\|3[01])-[0-9]{2}$`. Pasar a mayúsculas, quitar tildes y espacios, Ñ→N |
| Ciudad (`ciudad`) | select | Sí | Medellín; Otro municipio del Valle de Aburrá; Otro municipio de Antioquia; Cali; Otro municipio del Valle del Cauca; Bogotá D.C.; Otra ciudad de Colombia; Fuera de Colombia |
| Rango de edad (`edad`) | radios | Sí | 18 a 28 años; 29 a 39 años; 40 a 49 años; 50 a 59 años; 60 años o más; Prefiero no decir |
| Género (`genero`) | radios | Sí | Mujer; Hombre; Persona no binaria; Prefiero autodescribirme (abre texto y se guarda lo escrito); Prefiero no decir |
| Sector (`sector`) | radios | Sí | Empresa privada; Gobierno o entidad pública; Corporación de elección popular (Congreso, Asamblea, Concejo); Academia; Sociedad civil, ONG u organización de PcD; Medios de comunicación; Ciudadanía (a título personal) |
| Organización y cargo (`organizacion`) | text | No | Ayuda: "Ej.: Alcaldía de Medellín, asesora. Déjalo vacío si vienes a título personal" |
| ¿Necesitas algún ajuste de accesibilidad? (`ajustes`) | checkboxes + Otro con texto | No | Intérprete de Lengua de Señas Colombiana (LSC); Subtitulado en vivo; Audiodescripción; Material en formato accesible (digital legible o macrotipo); Acceso sin escalones y espacio para silla de ruedas; Silla reservada cerca del escenario; Persona de apoyo o guía en el recinto; Zona tranquila (baja estimulación sensorial); Otro. Se envían unidas con `", "` |
| Autorización de datos personales (`autorizacionDatos`) | checkbox | Sí | Valor: "Autorizo el tratamiento de mis datos según el aviso anterior" |
| Autorización de imagen (`autorizacionImagen`) | checkbox | No | Valor: "Autorizo el uso de mi imagen y voz en fotos, video y transmisión del evento, sin fines comerciales" |

La función agrega `token` (= `APPS_SCRIPT_TOKEN`) y `versionAviso: "aviso-v1-2026-11"` antes de enviar al Apps Script.

Ayuda del código personal: "Inicial de tu nombre + inicial de tu apellido + día en que naciste + guion + últimos 2 números de tu celular. Ejemplo: FB07-42. Guárdalo: lo pedirán el ingreso y las encuestas del evento."

## 4. Llamada al Apps Script

- `POST` a `APPS_SCRIPT_URL` con cuerpo JSON y `redirect: "follow"` (Google responde con una redirección).
- Respuestas: `{ok:true}`; `{ok:false,error:"correo-duplicado"}` → mostrar "Ya estás inscrita o inscrito con este correo"; `{ok:false,error:"codigo-duplicado"}` → "Ese código ya está en uso. Escríbenos a dicapacidad.colombia@gmail.com y te ayudamos"; cualquier otro error → "No pudimos guardar tu inscripción. Inténtalo de nuevo en unos minutos".
- Validar todo de nuevo en el servidor antes de llamar al Apps Script.

## 5. Escarapela

- Reproducir `docs/escarapela-asistente.html` como imagen PNG de 800 × 1200 px (el diseño es de 400 × 600; generar a 2x para impresión).
- Variables: `{{nombre}}`, `{{organizacion}}` (si está vacío, ocultar la línea), `{{codigo}}` y `{{qr}}` (QR que codifica solo el código personal, ej. `FB07-42`).
- Generarla en el servidor (por ejemplo con `@vercel/og` o `satori` + `resvg`) y adjuntarla al correo como `escarapela-inclusive-talks.png`. No publicarla en una URL abierta, porque lleva datos personales.
- Fuentes: Poppins 700/800 e Inter 400/500/600 (Google Fonts). Colores: fondo #F2F8FC, acento #0EA5E9, texto #1A1A1A, secundario #595959.
- Nombres largos: reducir el tamaño del nombre hasta que quepa en dos líneas como máximo.

## 6. Correo de confirmación (Resend)

Asunto: **Tu inscripción a Inclusive Talks Medellín está confirmada**

Cuerpo (HTML simple y accesible, más versión en texto plano):

> Hola, {{primer nombre}}:
>
> Ya estás inscrita o inscrito en Inclusive Talks, segunda edición.
>
> **Fecha:** viernes 4 de diciembre de 2026
> **Hora:** [completar]
> **Lugar:** Salón Azul, Centro Comercial Premium Plaza, Medellín
>
> **Tu código personal: {{codigo}}**
> Lo usarás para registrar tu ingreso y responder las encuestas del evento.
>
> Te adjuntamos tu escarapela. Puedes llevarla impresa o mostrarla en el celular.
>
> {{si pidió ajustes}} Recibimos tu solicitud de estos ajustes de accesibilidad: {{ajustes}}. Si necesitamos más información, te escribiremos.
>
> ¿Preguntas? Escríbenos a dicapacidad.colombia@gmail.com.
>
> Tratamos tus datos según la Ley 1581 de 2012. Consulta el aviso de privacidad: {{URL}}/privacidad

El correo `dicapacidad.colombia@gmail.com` se escribe así, sin la "s". No corregirlo.

## 7. Textos legales

Aviso corto, visible arriba del formulario (no en un modal):

> Discapacidad Colombia (NIT [completar], dicapacidad.colombia@gmail.com) tratará tus datos según la Ley 1581 de 2012 para gestionar tu inscripción, tu ingreso y tus ajustes de accesibilidad, enviarte información y encuestas del evento, y elaborar estadísticas anónimas. Los datos se guardan en servicios de Google, que pueden estar fuera de Colombia. Puedes conocer, actualizar, rectificar o suprimir tus datos y revocar esta autorización escribiendo al correo. [Aviso completo](/privacidad). Solo para mayores de 18 años.

Página `/privacidad`:

> Discapacidad Colombia, NIT [completar], con domicilio en [completar] y correo dicapacidad.colombia@gmail.com, es responsable del tratamiento de los datos que entregues en este formulario, conforme a la Ley 1581 de 2012 y el Decreto 1377 de 2013 (compilado en el Decreto 1074 de 2015).
>
> Finalidades: (1) gestionar tu inscripción y tu ingreso a Inclusive Talks Medellín 2026; (2) preparar los ajustes de accesibilidad que pidas; (3) enviarte información logística del evento y tu escarapela; (4) invitarte a encuestas de evaluación antes y después del evento y a seguimientos a los 3, 6 y 12 meses; (5) elaborar estadísticas agregadas y anónimas para informes a patrocinadores, aliados y autoridades. Nunca entregaremos a terceros datos que te identifiquen.
>
> Código personal: el código que crees une tus respuestas entre formularios sin usar tu nombre. Los análisis se hacen con el código.
>
> Almacenamiento y envíos: los datos se guardan en servicios de Google LLC y los correos se envían con Resend; ambos actúan como encargados del tratamiento y pueden alojar los datos fuera de Colombia. Los conservaremos hasta el [completar, sugerido 31/12/2027]; después se eliminarán o anonimizarán.
>
> Tus derechos (art. 8, Ley 1581 de 2012): conocer, actualizar y rectificar tus datos; pedir prueba de esta autorización; saber qué uso se les da; revocar la autorización o pedir su supresión; acceder a ellos gratis; y presentar quejas ante la Superintendencia de Industria y Comercio. Escríbenos a dicapacidad.colombia@gmail.com. Política de Tratamiento de Datos: [enlace].
>
> Uso de imagen: durante el evento tomaremos fotografías y video, y habrá transmisión en vivo. Solo publicaremos tu imagen y tu voz si lo autorizas, sin fines comerciales, y puedes revocarlo en cualquier momento escribiendo al correo. Si no autorizas, al ingresar recibirás una identificación visible para que el equipo evite captarte en primer plano.
>
> Este formulario es para mayores de 18 años. Si quieres inscribir a una persona menor de edad, su representante legal debe escribirnos al correo indicado.

Los `[completar]` se dejan visibles; no inventar NIT, dirección, hora ni fechas.

## 8. Accesibilidad y seguridad (mínimos)

- Etiquetas visibles, `fieldset` + `legend` en radios y checkboxes, errores junto al campo con `aria-describedby` y un resumen de errores arriba que recibe el foco.
- Operable con teclado, foco visible, contraste 4,5:1, funciona a 360 px y con zoom al 200 %. Obligatorios marcados con texto.
- Sin CAPTCHA: campo trampa oculto y tiempo mínimo de 3 segundos antes de enviar.
- Ninguna clave en el cliente; no registrar datos personales en logs ni en analítica.
- Confirmación con el foco en el título: "¡Listo, ya estás inscrita o inscrito!", el código en grande y "Te enviamos tu escarapela a {{correo}}".

## 9. Criterios de aceptación

1. Una inscripción válida crea una fila en `Inscripción` (columnas A a N) y llega el correo con la escarapela adjunta y los datos correctos.
2. Correo o código repetido muestra el mensaje correcto, no guarda fila y no envía correo.
3. La escarapela se ve igual al diseño, con nombre, organización, QR legible y código.
4. axe o Lighthouse sin errores críticos de accesibilidad; prueba con teclado y con lector de pantalla.
5. Llenar el formulario toma menos de 2 minutos en el celular.
6. Probado en la vista previa de Vercel antes de pasar a producción.
