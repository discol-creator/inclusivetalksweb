// TEMPORAL. Dice qué variables de entorno ve la función, para localizar una mal
// escrita o que no llegó al despliegue. Nunca expone valores: solo nombres y longitudes.
// Borrar este archivo cuando la configuración esté confirmada.

const ESPERADAS = [
  'APPS_SCRIPT_URL',
  'APPS_SCRIPT_TOKEN',
  'RESEND_API_KEY',
  'EMAIL_FROM',
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

  return res.status(200).json({
    esperadas: presentes,
    nombresParecidosQueSiVeLaFuncion: parecidas,
    entorno: process.env.VERCEL_ENV || 'desconocido',
    despliegue: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'desconocido'
  });
}
