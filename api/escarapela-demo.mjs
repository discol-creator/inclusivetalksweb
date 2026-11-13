// Vista previa de la escarapela con datos de ejemplo, para revisar el diseño sin
// escribir en la hoja ni enviar correos. Desactivada en producción.
//
//   /api/escarapela-demo
//   /api/escarapela-demo?nombre=María Fernanda Restrepo&organizacion=Alcaldía de Medellín, asesora&codigo=MR07-42

import { generarEscarapela } from './_escarapela.mjs';
import { normalizarCodigo, CODIGO_RE } from './_campos.mjs';

export default async function handler(req, res) {
  if (process.env.VERCEL_ENV === 'production') {
    return res.status(404).json({ ok: false, error: 'No disponible.' });
  }

  const { nombre, organizacion, codigo } = req.query || {};
  const codigoLimpio = normalizarCodigo(codigo || 'FB07-42');

  try {
    const png = await generarEscarapela({
      nombre: String(nombre || 'Francisco José Barragán').slice(0, 120),
      organizacion: organizacion === undefined ? 'Discapacidad Colombia, director' : String(organizacion).slice(0, 160),
      codigo: CODIGO_RE.test(codigoLimpio) ? codigoLimpio : 'FB07-42'
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(png);
  } catch (err) {
    console.error('Falló la vista previa de la escarapela:', err?.message, err?.stack);
    return res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
}
