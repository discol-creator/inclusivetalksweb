// Genera una escarapela en un PNG, sin tocar la hoja ni enviar correos.
// Requiere Node 22 y haber corrido antes: npm install
//
//   npm run escarapela
//   npm run escarapela -- asistente "María Fernanda Restrepo" "Alcaldía de Medellín, asesora" 1020304050
//   npm run escarapela -- ponente "Ana Ruiz" "Universidad de Antioquia, investigadora" 71628394
//   npm run escarapela -- asistente "Juan Pérez" "" 1017234567      (sin organización)
//
// Cada archivo queda en escarapelas/<tipo>/<documento>-<nombre>.png

import { mkdirSync, writeFileSync } from 'node:fs';
import { generarEscarapela } from '../api/_escarapela.mjs';
import { normalizarDocumento, DOCUMENTO_RE } from '../api/_campos.mjs';
import { TIPOS_VALIDOS } from '../api/_firma.mjs';

const [tipo = 'asistente',
       nombre = 'Francisco José Barragán',
       organizacion = 'Discapacidad Colombia, director',
       documento = '1020304050'] = process.argv.slice(2);

if (!TIPOS_VALIDOS.includes(tipo)) {
  console.error(`Tipo "${tipo}" desconocido. Usa uno de: ${TIPOS_VALIDOS.join(', ')}`);
  process.exit(1);
}

const documentoLimpio = normalizarDocumento(documento);
if (!DOCUMENTO_RE.test(documentoLimpio)) {
  console.error(`El documento "${documento}" no es válido: se esperan de 5 a 15 letras o números.`);
  process.exit(1);
}

// Nombre de archivo sin tildes ni espacios, para que sirva en cualquier sistema.
const comoArchivo = (texto) => texto
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();

const inicio = Date.now();
const png = await generarEscarapela({ nombre, organizacion, documento: documentoLimpio, tipo });

const carpeta = new URL(`../escarapelas/${tipo}/`, import.meta.url);
mkdirSync(carpeta, { recursive: true });
const salida = new URL(`${documentoLimpio}-${comoArchivo(nombre)}.png`, carpeta);
writeFileSync(salida, png);

console.log(`Tipo         : ${tipo}`);
console.log(`Nombre       : ${nombre}`);
console.log(`Organización : ${organizacion || '(vacía, la línea se oculta)'}`);
console.log(`Documento    : ${documentoLimpio}`);
console.log(`Archivo      : ${decodeURIComponent(salida.pathname)}`);
console.log(`Tamaño       : ${(png.length / 1024).toFixed(1)} KB · ${Date.now() - inicio} ms`);
