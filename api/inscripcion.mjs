// Inscripción a Inclusive Talks Medellín 2026.
// Flujo: valida → guarda la fila en la hoja (Apps Script) → genera la escarapela → envía el correo (Resend).
//
// Variables de entorno (Vercel > Settings > Environment Variables, marcadas para Production y Preview):
//   APPS_SCRIPT_URL    URL de la app web del Apps Script de la hoja
//   APPS_SCRIPT_TOKEN  clave compartida; debe ser igual a TOKEN en el Apps Script
//   RESEND_API_KEY     clave de Resend (ya usada por el pre-registro)
//   EMAIL_FROM         remitente verificado; si falta se usa RESEND_FROM y, en últimas, el de pruebas

import { validar, VERSION_AVISO } from './_campos.mjs';
import { generarEscarapela } from './_escarapela.mjs';

const CORREO_CONTACTO = 'dicapacidad.colombia@gmail.com'; // se escribe así, sin la "s". No corregir.
const TIEMPO_MINIMO_MS = 3000;

const MENSAJES_HOJA = {
  'correo-duplicado': 'Ya estás inscrita o inscrito con este correo',
  'documento-duplicado': `Ese número de documento ya está registrado. Escríbenos a ${CORREO_CONTACTO} y te ayudamos`
};
const MENSAJE_HOJA_GENERICO = 'No pudimos guardar tu inscripción. Inténtalo de nuevo en unos minutos';

function escaparHtml(valor) {
  return String(valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const primerNombre = (nombre) => nombre.split(' ')[0];

/** Guarda la fila en la hoja. Devuelve { ok } o { mensaje } con el texto para la persona. */
async function guardarEnHoja(datos) {
  const respuesta = await fetch(process.env.APPS_SCRIPT_URL, {
    method: 'POST',
    redirect: 'follow', // Google responde con una redirección
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...datos,
      token: process.env.APPS_SCRIPT_TOKEN,
      versionAviso: VERSION_AVISO
    })
  });

  if (!respuesta.ok) {
    console.error('Apps Script respondió con estado', respuesta.status);
    return { mensaje: MENSAJE_HOJA_GENERICO };
  }

  let resultado;
  try {
    resultado = JSON.parse(await respuesta.text());
  } catch {
    console.error('Apps Script devolvió una respuesta que no es JSON');
    return { mensaje: MENSAJE_HOJA_GENERICO };
  }

  if (resultado.ok) return { ok: true };

  console.error('Apps Script rechazó la inscripción:', resultado.error);
  return { mensaje: MENSAJES_HOJA[resultado.error] || MENSAJE_HOJA_GENERICO };
}

function correoConfirmacion({ datos, urlPrivacidad }) {
  const nombre = escaparHtml(primerNombre(datos.nombre));
  const documento = escaparHtml(datos.documento);

  const parrafoAjustes = datos.ajustes
    ? `<p style="margin:0 0 16px">Recibimos tu solicitud de estos ajustes de accesibilidad: ${escaparHtml(datos.ajustes)}. Si necesitamos más información, te escribiremos.</p>`
    : '';

  const html = `<!doctype html>
<html lang="es"><body style="margin:0;padding:24px;background:#F2F8FC;font-family:Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#1A1A1A">
<div style="max-width:560px;margin:0 auto;background:#FFFFFF;border-radius:16px;padding:28px">
  <p style="margin:0 0 16px">Hola, ${nombre}:</p>
  <p style="margin:0 0 16px">Ya estás inscrita o inscrito en Inclusive Talks, segunda edición.</p>
  <p style="margin:0 0 16px">
    <strong>Fecha:</strong> viernes 4 de diciembre de 2026<br>
    <strong>Hora:</strong> 10:00 a. m.<br>
    <strong>Lugar:</strong> Salón Azul, Centro Comercial Premium Plaza, Medellín
  </p>
  <p style="margin:0 0 8px"><strong style="font-size:18px">Tu número de documento: ${documento}</strong></p>
  <p style="margin:0 0 16px">Con él registramos tu ingreso y enlazamos tus respuestas a las encuestas del evento.</p>
  <p style="margin:0 0 16px">Te adjuntamos tu escarapela. Puedes llevarla impresa o mostrarla en el celular.</p>
  ${parrafoAjustes}
  <p style="margin:0 0 16px">¿Preguntas? Escríbenos a <a href="mailto:${CORREO_CONTACTO}" style="color:#0369A1">${CORREO_CONTACTO}</a>.</p>
  <p style="margin:0;font-size:14px;color:#595959">Tratamos tus datos según la Ley 1581 de 2012. Consulta el aviso de privacidad: <a href="${urlPrivacidad}" style="color:#0369A1">${urlPrivacidad}</a></p>
</div>
</body></html>`;

  const texto = [
    `Hola, ${primerNombre(datos.nombre)}:`,
    '',
    'Ya estás inscrita o inscrito en Inclusive Talks, segunda edición.',
    '',
    'Fecha: viernes 4 de diciembre de 2026',
    'Hora: 10:00 a. m.',
    'Lugar: Salón Azul, Centro Comercial Premium Plaza, Medellín',
    '',
    `Tu número de documento: ${datos.documento}`,
    'Con él registramos tu ingreso y enlazamos tus respuestas a las encuestas del evento.',
    '',
    'Te adjuntamos tu escarapela. Puedes llevarla impresa o mostrarla en el celular.',
    ...(datos.ajustes
      ? ['', `Recibimos tu solicitud de estos ajustes de accesibilidad: ${datos.ajustes}. Si necesitamos más información, te escribiremos.`]
      : []),
    '',
    `¿Preguntas? Escríbenos a ${CORREO_CONTACTO}.`,
    '',
    `Tratamos tus datos según la Ley 1581 de 2012. Consulta el aviso de privacidad: ${urlPrivacidad}`
  ].join('\n');

  return { html, texto };
}

async function enviarCorreo({ datos, escarapela, urlPrivacidad }) {
  const remitente = process.env.EMAIL_FROM
    || process.env.RESEND_FROM
    || 'Inclusive Talks <onboarding@resend.dev>';

  const { html, texto } = correoConfirmacion({ datos, urlPrivacidad });

  const adjuntos = escarapela
    ? [{ filename: 'escarapela-inclusive-talks.png', content: escarapela.toString('base64') }]
    : [];

  const respuesta = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: remitente,
      to: [datos.correo],
      reply_to: CORREO_CONTACTO,
      subject: 'Tu inscripción a Inclusive Talks Medellín está confirmada',
      html,
      text: texto,
      attachments: adjuntos
    })
  });

  if (!respuesta.ok) {
    // Sin datos personales en el log: solo el estado que devolvió Resend.
    console.error('Resend respondió con estado', respuesta.status);
    return false;
  }
  return true;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Método no permitido.' });
  }

  let cuerpo = req.body;
  if (typeof cuerpo === 'string') {
    try { cuerpo = JSON.parse(cuerpo); } catch { cuerpo = {}; }
  }
  cuerpo = cuerpo || {};

  // Anti-bot sin CAPTCHA: campo trampa y tiempo mínimo de diligenciamiento.
  if (typeof cuerpo.sitio_web === 'string' && cuerpo.sitio_web.trim()) {
    return res.status(200).json({ ok: true });
  }
  if (!(Number(cuerpo.tiempo) >= TIEMPO_MINIMO_MS)) {
    return res.status(400).json({ ok: false, error: 'Tómate unos segundos más y vuelve a enviar el formulario.' });
  }

  const { datos, errores } = validar(cuerpo);
  if (errores) {
    return res.status(400).json({ ok: false, error: 'Revisa los campos marcados.', errores });
  }

  if (!process.env.APPS_SCRIPT_URL || !process.env.APPS_SCRIPT_TOKEN) {
    console.error('Faltan APPS_SCRIPT_URL o APPS_SCRIPT_TOKEN en las variables de entorno.');
    return res.status(500).json({
      ok: false,
      error: `El formulario aún no está configurado. Escríbenos a ${CORREO_CONTACTO}.`
    });
  }

  let guardado;
  try {
    guardado = await guardarEnHoja(datos);
  } catch (err) {
    console.error('No se pudo contactar al Apps Script:', err?.message);
    guardado = { mensaje: MENSAJE_HOJA_GENERICO };
  }
  if (!guardado.ok) {
    return res.status(409).json({ ok: false, error: guardado.mensaje });
  }

  // Desde aquí la inscripción ya quedó guardada: nunca devolvemos error a la persona.
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const urlPrivacidad = `https://${host}/privacidad`;

  let escarapela = null;
  try {
    escarapela = await generarEscarapela({
      nombre: datos.nombre,
      organizacion: datos.organizacion,
      documento: datos.documento
    });
  } catch (err) {
    console.error('No se pudo generar la escarapela:', err?.message);
  }

  let correoEnviado = false;
  try {
    if (process.env.RESEND_API_KEY) {
      correoEnviado = await enviarCorreo({ datos, escarapela, urlPrivacidad });
    } else {
      console.error('Falta RESEND_API_KEY en las variables de entorno.');
    }
  } catch (err) {
    console.error('No se pudo enviar el correo:', err?.message);
  }

  return res.status(200).json({
    ok: true,
    documento: datos.documento,
    correo: datos.correo,
    correoEnviado
  });
}
