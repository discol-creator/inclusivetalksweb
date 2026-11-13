// Vista previa de la escarapela con datos de ejemplo, para revisar el diseño sin
// escribir en la hoja ni enviar correos. Desactivada en producción.
//
//   /api/escarapela-demo
//   /api/escarapela-demo?nombre=María Fernanda Restrepo&organizacion=Alcaldía de Medellín, asesora&documento=1020304050

import { generarEscarapela } from './_escarapela.mjs';
import { normalizarDocumento, DOCUMENTO_RE } from './_campos.mjs';

export default async function handler(req, res) {
  if (process.env.VERCEL_ENV === 'production') {
    return res.status(404).json({ ok: false, error: 'No disponible.' });
  }

  const { nombre, organizacion, documento } = req.query || {};
  const documentoLimpio = normalizarDocumento(documento || '1020304050');

  try {
    const png = await generarEscarapela({
      nombre: String(nombre || 'Francisco José Barragán').slice(0, 120),
      organizacion: organizacion === undefined ? 'Discapacidad Colombia, director' : String(organizacion).slice(0, 160),
      documento: DOCUMENTO_RE.test(documentoLimpio) ? documentoLimpio : '1020304050'
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(png);
  } catch (err) {
    console.error('Falló la vista previa de la escarapela:', err?.message, err?.stack);
    return res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
}
