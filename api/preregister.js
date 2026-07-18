// Vercel Serverless Function (Node.js runtime, sin dependencias externas).
// Recibe el pre-registro y lo envía por correo usando la API REST de Resend.
//
// Configuración requerida en el proyecto de Vercel (Settings > Environment Variables):
//   RESEND_API_KEY   API key de https://resend.com (plan gratuito disponible)
//   NOTIFY_EMAIL     correo que recibe los pre-registros (opcional, por defecto
//                     dicapacidad.colombia@gmail.com)
//   RESEND_FROM      remitente verificado en Resend (opcional, por defecto
//                     "Inclusive Talks <onboarding@resend.dev>", válido solo para pruebas)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_TIPOS = ['persona', 'empresa', 'institucion'];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Método no permitido.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};

  const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : '';
  const correo = typeof body.correo === 'string' ? body.correo.trim() : '';
  const tipo = VALID_TIPOS.includes(body.tipo) ? body.tipo : 'persona';
  const honeypot = typeof body.sitio_web === 'string' ? body.sitio_web.trim() : '';

  // Honeypot: si un bot llena este campo oculto, respondemos éxito falso sin procesar nada.
  if (honeypot) {
    return res.status(200).json({ ok: true });
  }

  if (!nombre || nombre.length > 200) {
    return res.status(400).json({ ok: false, error: 'Nombre inválido.' });
  }

  if (!correo || correo.length > 200 || !EMAIL_RE.test(correo)) {
    return res.status(400).json({ ok: false, error: 'Correo electrónico inválido.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('Falta configurar la variable de entorno RESEND_API_KEY en Vercel.');
    return res.status(500).json({
      ok: false,
      error: 'El formulario aún no está configurado. Escríbenos directamente a dicapacidad.colombia@gmail.com.'
    });
  }

  const notifyEmail = process.env.NOTIFY_EMAIL || 'dicapacidad.colombia@gmail.com';
  const fromEmail = process.env.RESEND_FROM || 'Inclusive Talks <onboarding@resend.dev>';

  const tipoLabel = { persona: 'Persona', empresa: 'Empresa', institucion: 'Institución' }[tipo];

  const html = `
    <h2>Nuevo pre-registro, Inclusive Talks</h2>
    <p><strong>Nombre:</strong> ${escapeHtml(nombre)}</p>
    <p><strong>Correo:</strong> ${escapeHtml(correo)}</p>
    <p><strong>Viene como:</strong> ${escapeHtml(tipoLabel)}</p>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [notifyEmail],
        reply_to: correo,
        subject: `Pre-registro Inclusive Talks: ${nombre}`,
        html: html
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Error de Resend:', response.status, errText);
      return res.status(502).json({ ok: false, error: 'No se pudo enviar el pre-registro.' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Error al llamar a Resend:', err);
    return res.status(502).json({ ok: false, error: 'No se pudo enviar el pre-registro.' });
  }
};
