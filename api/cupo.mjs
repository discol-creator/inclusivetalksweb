// Consulta cuántas inscripciones van y si todavía hay cupo.
// La página la llama al cargar para cerrarse sola cuando el evento se llena.
// El tope vive en el Apps Script (CUPO_MAXIMO): aquí no se duplica.

const CACHE_SEGUNDOS = 30;   // evita ir al Apps Script en cada visita

let cache = null;            // { hasta, datos }

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Método no permitido.' });
  }

  if (cache && cache.hasta > Date.now()) {
    return res.status(200).json(cache.datos);
  }

  if (!process.env.APPS_SCRIPT_URL) {
    // Sin configurar: que la página no bloquee a nadie.
    return res.status(200).json({ ok: false, abierto: true, motivo: 'sin-configurar' });
  }

  try {
    const respuesta = await fetch(`${process.env.APPS_SCRIPT_URL}?accion=cupo`, {
      method: 'GET',
      redirect: 'follow'
    });
    if (!respuesta.ok) throw new Error(`estado ${respuesta.status}`);

    const datos = JSON.parse(await respuesta.text());
    if (!datos.ok) throw new Error('respuesta inesperada');

    const salida = {
      ok: true,
      abierto: datos.abierto !== false,
      inscritos: datos.inscritos,
      cupo: datos.cupo,
      disponibles: Math.max(0, datos.cupo - datos.inscritos)
    };
    cache = { hasta: Date.now() + CACHE_SEGUNDOS * 1000, datos: salida };
    return res.status(200).json(salida);
  } catch (err) {
    console.error('No se pudo consultar el cupo:', err?.message);
    // Ante la duda, se deja pasar: el Apps Script vuelve a revisar el cupo al guardar.
    return res.status(200).json({ ok: false, abierto: true, motivo: 'sin-respuesta' });
  }
}
