// TEMPORAL. Dice qué variables de entorno ve la función y con qué remitente enviaría,
// para localizar una mal escrita o que no llegó al despliegue.
// Nunca expone valores: solo nombres y longitudes. Borrar cuando esté confirmado.

const ESPERADAS = [
  'APPS_SCRIPT_URL',
  'APPS_SCRIPT_TOKEN',
  'RESEND_API_KEY',
  'RESEND_FROM',
  'EMAIL_FROM',
  'NOTIFY_EMAIL',
  'ESCARAPELA_SECRET'
];

export default async function handler(req, res) {
  const presentes = {};
  for (const nombre of ESPERADAS) {
    const valor = process.env[nombre];
    presentes[nombre] = valor ? `definida (${valor.length} caracteres)` : 'FALTA';
  }

  // Nombres parecidos: delata un espacio de más o una letra cambiada al pegar.
  const parecidas = Object.keys(process.env)
    .filter((n) => /SCRIPT|RESEND|EMAIL|ESCARAPELA|SITE/i.test(n))
    .sort();

  // El remitente que usaría el correo de inscripción, con su misma cadena de respaldo.
  // Es lo que de verdad decide si a un inscrito le llega la escarapela.
  const remitente = process.env.EMAIL_FROM
    || process.env.RESEND_FROM
    || 'Inclusive Talks <onboarding@resend.dev>';

  // Intenta dibujar una escarapela de verdad. Es la pieza que nunca se ha ejecutado
  // en Vercel: si falla aquí, el correo sale sin adjunto y nadie se entera.
  let escarapela;
  const inicio = Date.now();
  try {
    const { generarEscarapela } = await import('./_escarapela.mjs');
    const png = await generarEscarapela({
      nombre: 'Prueba Diagnostico',
      organizacion: 'Prueba',
      documento: '99999999',
      tipo: 'asistente'
    });
    escarapela = `ok · ${(png.length / 1024).toFixed(1)} KB · ${Date.now() - inicio} ms`;
  } catch (err) {
    escarapela = `FALLA · ${err?.message || err}`;
  }

  return res.status(200).json({
    escarapela,
    remitenteQueSeUsaria: remitente,
    enviaACualquiera: !remitente.includes('onboarding@resend.dev'),
    esperadas: presentes,
    nombresParecidosQueSiVeLaFuncion: parecidas,
    entorno: process.env.VERCEL_ENV || 'desconocido',
    despliegue: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'desconocido'
  });
}
