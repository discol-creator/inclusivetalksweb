// Vercel Serverless Function (Node.js runtime, sin dependencias externas).
// Recibe la postulación de alianza institucional y la envía por correo usando
// la API REST de Resend. Comparte configuración con api/preregister.js:
//   RESEND_API_KEY   API key de https://resend.com (plan gratuito disponible)
//   NOTIFY_EMAIL     correo que recibe las postulaciones (opcional, por defecto
//                     dicapacidad.colombia@gmail.com)
//   RESEND_FROM      remitente verificado en Resend (opcional, por defecto
//                     "Inclusive Talks <onboarding@resend.dev>", válido solo para pruebas)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+()\s-]{7,20}$/;

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
  const empresa = typeof body.empresa === 'string' ? body.empresa.trim() : '';
  const cargo = typeof body.cargo === 'string' ? body.cargo.trim() : '';
  const correo = typeof body.correo === 'string' ? body.correo.trim() : '';
  const telefono = typeof body.telefono === 'string' ? body.telefono.trim() : '';
  const honeypot = typeof body.sitio_web === 'string' ? body.sitio_web.trim() : '';

  // Honeypot: si un bot llena este campo oculto, respondemos éxito falso sin procesar nada.
  if (honeypot) {
    return res.status(200).json({ ok: true });
  }

  if (!nombre || nombre.length > 200) {
    return res.status(400).json({ ok: false, error: 'Nombre inválido.' });
  }

  if (!empresa || empresa.length > 200) {
    return res.status(400).json({ ok: false, error: 'Empresa o institución inválida.' });
  }

  if (!cargo || cargo.length > 200) {
    return res.status(400).json({ ok: false, error: 'Cargo inválido.' });
  }

  if (!correo || correo.length > 200 || !EMAIL_RE.test(correo)) {
    return res.status(400).json({ ok: false, error: 'Correo electrónico inválido.' });
  }

  if (!telefono || telefono.length > 30 || !PHONE_RE.test(telefono)) {
    return res.status(400).json({ ok: false, error: 'Número de contacto inválido.' });
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

  const html = `
    <h2>Nueva postulación de alianza institucional, Inclusive Talks</h2>
    <p><strong>Nombre:</strong> ${escapeHtml(nombre)}</p>
    <p><strong>Empresa o institución:</strong> ${escapeHtml(empresa)}</p>
    <p><strong>Cargo:</strong> ${escapeHtml(cargo)}</p>
    <p><strong>Correo:</strong> ${escapeHtml(correo)}</p>
    <p><strong>Teléfono:</strong> ${escapeHtml(telefono)}</p>
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
        subject: `Postulación de alianza: ${empresa}`,
        html: html
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Error de Resend:', response.status, errText);
      return res.status(502).json({ ok: false, error: 'No se pudo enviar la postulación.' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Error al llamar a Resend:', err);
    return res.status(502).json({ ok: false, error: 'No se pudo enviar la postulación.' });
  }
};
