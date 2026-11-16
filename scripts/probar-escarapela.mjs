// Genera una escarapela de prueba en un archivo PNG, sin tocar la hoja ni enviar correos.
// Requiere Node 22 y haber corrido antes: npm install
//
//   npm run escarapela
//   npm run escarapela -- "María Fernanda Restrepo" "Alcaldía de Medellín, asesora" 1020304050
//   npm run escarapela -- "Ana Ruiz" "" 71628394        (sin organización)

import { writeFileSync } from 'node:fs';
import { generarEscarapela } from '../api/_escarapela.mjs';
import { normalizarDocumento, DOCUMENTO_RE } from '../api/_campos.mjs';

const [nombre = 'Francisco José Barragán',
       organizacion = 'Discapacidad Colombia, director',
       documento = '1020304050'] = process.argv.slice(2);

const documentoLimpio = normalizarDocumento(documento);
if (!DOCUMENTO_RE.test(documentoLimpio)) {
  console.error(`El documento "${documento}" no es válido: se esperan de 5 a 15 letras o números.`);
  process.exit(1);
}

const inicio = Date.now();
const png = await generarEscarapela({ nombre, organizacion, documento: documentoLimpio });
const salida = new URL('../escarapela-prueba.png', import.meta.url);
writeFileSync(salida, png);

console.log(`Nombre       : ${nombre}`);
console.log(`Organización : ${organizacion || '(vacía, la línea se oculta)'}`);
console.log(`Documento    : ${documentoLimpio}  (va dentro del QR)`);
console.log(`Archivo      : ${salida.pathname}`);
console.log(`Tamaño       : ${(png.length / 1024).toFixed(1)} KB · ${Date.now() - inicio} ms`);
