// Firma de escarapelas. El QR lleva una credencial firmada, no un número suelto:
// así se puede comprobar que la escarapela la emitimos nosotros y no la fabricó cualquiera.
//
// Formato de la credencial:  <datos en base64url>.<firma en base64url>
//   datos = "1|a|1020304050"   (versión | tipo: a=asistente, p=ponente | documento)
//
// La clave sale de ESCARAPELA_SECRET y, si no está, se deriva de APPS_SCRIPT_TOKEN,
// para no obligar a configurar otra variable. Nunca se firma con el token tal cual.

import { createHmac, timingSafeEqual } from 'node:crypto';

const VERSION = '1';
const TIPOS = { asistente: 'a', ponente: 'p' };
const TIPOS_INVERSO = { a: 'asistente', p: 'ponente' };
const LARGO_FIRMA = 16;

const aBase64Url = (texto) => Buffer.from(texto, 'utf8').toString('base64url');
const deBase64Url = (texto) => Buffer.from(texto, 'base64url').toString('utf8');

function clave() {
  const secreto = process.env.ESCARAPELA_SECRET || process.env.APPS_SCRIPT_TOKEN;
  if (!secreto) return null;
  return createHmac('sha256', secreto).update('escarapela-v1').digest();
}

function firmar(datos, llave) {
  return createHmac('sha256', llave).update(datos).digest('base64url').slice(0, LARGO_FIRMA);
}

/** Credencial firmada para el QR. Devuelve null si no hay clave configurada. */
export function credencial({ tipo, documento }) {
  const llave = clave();
  if (!llave) return null;
  const letra = TIPOS[tipo];
  if (!letra) throw new Error(`Tipo de escarapela desconocido: ${tipo}`);
  const datos = aBase64Url(`${VERSION}|${letra}|${documento}`);
  return `${datos}.${firmar(datos, llave)}`;
}

/** URL que se codifica en el QR. El dato va en el fragmento (#): no llega al servidor ni a sus registros. */
export function urlDeValidacion({ urlBase, tipo, documento }) {
  const cred = credencial({ tipo, documento });
  if (!cred) return null;
  return `${String(urlBase).replace(/\/+$/, '')}/validar#${cred}`;
}

/** Comprueba una credencial. Devuelve { valido, motivo?, tipo?, documento? }. */
export function verificar(cred) {
  const llave = clave();
  if (!llave) return { valido: false, motivo: 'sin-clave' };
  if (typeof cred !== 'string' || !cred.includes('.')) return { valido: false, motivo: 'formato' };

  const [datos, firma] = cred.split('.');
  const esperada = firmar(datos, llave);
  const a = Buffer.from(firma || '', 'utf8');
  const b = Buffer.from(esperada, 'utf8');
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { valido: false, motivo: 'firma' };

  let partes;
  try {
    partes = deBase64Url(datos).split('|');
  } catch {
    return { valido: false, motivo: 'formato' };
  }
  const [version, letra, documento] = partes;
  if (version !== VERSION) return { valido: false, motivo: 'version' };
  if (!TIPOS_INVERSO[letra]) return { valido: false, motivo: 'formato' };

  return { valido: true, tipo: TIPOS_INVERSO[letra], documento };
}

export const TIPOS_VALIDOS = Object.keys(TIPOS);
