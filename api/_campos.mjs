// Opciones y validación de la inscripción. Los textos deben ser idénticos a los del
// formulario (tildes incluidas), porque la hoja de cálculo cuenta sobre ellos.

export const CIUDADES = [
  'Medellín',
  'Otro municipio del Valle de Aburrá',
  'Otro municipio de Antioquia',
  'Cali',
  'Otro municipio del Valle del Cauca',
  'Bogotá D.C.',
  'Otra ciudad de Colombia',
  'Fuera de Colombia'
];

export const EDADES = [
  '18 a 28 años',
  '29 a 39 años',
  '40 a 49 años',
  '50 a 59 años',
  '60 años o más',
  'Prefiero no decir'
];

export const GENEROS = [
  'Mujer',
  'Hombre',
  'Persona no binaria',
  'Prefiero autodescribirme',
  'Prefiero no decir'
];

export const SECTORES = [
  'Empresa privada',
  'Gobierno o entidad pública',
  'Corporación de elección popular (Congreso, Asamblea, Concejo)',
  'Academia',
  'Sociedad civil, ONG u organización de PcD',
  'Medios de comunicación',
  'Ciudadanía (a título personal)'
];

export const AJUSTES = [
  'Intérprete de Lengua de Señas Colombiana (LSC)',
  'Subtitulado en vivo',
  'Audiodescripción',
  'Material en formato accesible (digital legible o macrotipo)',
  'Acceso sin escalones y espacio para silla de ruedas',
  'Silla reservada cerca del escenario',
  'Persona de apoyo o guía en el recinto',
  'Zona tranquila (baja estimulación sensorial)',
  'Otro'
];

export const AUTORIZACION_DATOS = 'Autorizo el tratamiento de mis datos según el aviso anterior';
export const AUTORIZACION_IMAGEN = 'Autorizo el uso de mi imagen y voz en fotos, video y transmisión del evento, sin fines comerciales';
export const VERSION_AVISO = 'aviso-v1-2026-11';

export const CODIGO_RE = /^[A-Z]{2}(0[1-9]|[12][0-9]|3[01])-[0-9]{2}$/;
const CORREO_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Mayúsculas, sin tildes ni espacios, Ñ → N. */
export function normalizarCodigo(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .toUpperCase();
}

const texto = (valor) => (typeof valor === 'string' ? valor.trim().replace(/\s+/g, ' ') : '');

/**
 * Revalida lo que llega del navegador. Devuelve { datos } o { errores }.
 * Las claves de `errores` coinciden con los campos del formulario.
 */
export function validar(cuerpo) {
  const errores = {};
  const datos = {};

  const nombre = texto(cuerpo.nombre);
  if (nombre.length < 3 || nombre.length > 120) {
    errores.nombre = 'Escribe tu nombre completo (entre 3 y 120 caracteres).';
  } else {
    datos.nombre = nombre;
  }

  const correo = texto(cuerpo.correo).toLowerCase();
  if (!correo || correo.length > 200 || !CORREO_RE.test(correo)) {
    errores.correo = 'Escribe un correo electrónico válido.';
  } else {
    datos.correo = correo;
  }

  const codigo = normalizarCodigo(cuerpo.codigo);
  if (!CODIGO_RE.test(codigo)) {
    errores.codigo = 'Revisa el formato. Ejemplo: FB07-42 (dos letras, día de 01 a 31, guion y dos números).';
  } else {
    datos.codigo = codigo;
  }

  const unaOpcion = (clave, lista, mensaje) => {
    const valor = texto(cuerpo[clave]);
    if (!lista.includes(valor)) errores[clave] = mensaje;
    else datos[clave] = valor;
  };

  unaOpcion('ciudad', CIUDADES, 'Elige la ciudad desde donde vienes.');
  unaOpcion('edad', EDADES, 'Elige un rango de edad.');
  unaOpcion('sector', SECTORES, 'Elige el sector que mejor te representa.');
  unaOpcion('genero', GENEROS, 'Elige una opción de género.');

  // "Prefiero autodescribirme" guarda lo que la persona escribió.
  if (datos.genero === 'Prefiero autodescribirme') {
    const propio = texto(cuerpo.generoTexto);
    if (!propio || propio.length > 60) {
      errores.genero = 'Escribe cómo te identificas (hasta 60 caracteres).';
      delete datos.genero;
    } else {
      datos.genero = propio;
    }
  }

  const organizacion = texto(cuerpo.organizacion);
  if (organizacion.length > 160) {
    errores.organizacion = 'Usa 160 caracteres o menos.';
  } else {
    datos.organizacion = organizacion;
  }

  // Ajustes de accesibilidad: lista opcional; "Otro" se reemplaza por el texto escrito.
  const pedidos = Array.isArray(cuerpo.ajustes) ? cuerpo.ajustes.map(texto) : [];
  if (pedidos.some((valor) => !AJUSTES.includes(valor))) {
    errores.ajustes = 'Hubo un problema con los ajustes seleccionados. Vuelve a marcarlos.';
  } else {
    const otro = texto(cuerpo.ajustesOtro);
    if (pedidos.includes('Otro') && (!otro || otro.length > 160)) {
      errores.ajustes = 'Cuéntanos qué otro ajuste necesitas (hasta 160 caracteres).';
    } else {
      datos.ajustes = pedidos
        .map((valor) => (valor === 'Otro' ? `Otro: ${otro}` : valor))
        .join(', ');
    }
  }

  if (texto(cuerpo.autorizacionDatos) !== AUTORIZACION_DATOS) {
    errores.autorizacionDatos = 'Necesitamos tu autorización para procesar la inscripción.';
  } else {
    datos.autorizacionDatos = AUTORIZACION_DATOS;
  }

  datos.autorizacionImagen = texto(cuerpo.autorizacionImagen) === AUTORIZACION_IMAGEN ? AUTORIZACION_IMAGEN : '';

  return Object.keys(errores).length ? { errores } : { datos };
}
