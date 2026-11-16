// Regenera en bloque las escarapelas a partir de un CSV exportado de la hoja.
// Es la forma de "respaldarlas" sin pagar almacenamiento: no se guarda ninguna imagen
// en ningún servicio; la fuente de verdad es la hoja, y desde ella se vuelven a crear
// idénticas cuando haga falta.
//
// En Google Sheets: Archivo > Descargar > Valores separados por comas (.csv)
//
//   npm run escarapelas -- inscripciones.csv
//   npm run escarapelas -- ponentes.csv ponente
//
// Columnas que busca (por nombre de encabezado, en cualquier orden):
//   "Nombre completo", "Número de documento", "Organización y cargo"

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { generarEscarapela } from '../api/_escarapela.mjs';
import { normalizarDocumento, DOCUMENTO_RE } from '../api/_campos.mjs';
import { TIPOS_VALIDOS } from '../api/_firma.mjs';

const [rutaCsv, tipo = 'asistente'] = process.argv.slice(2);

if (!rutaCsv) {
  console.error('Falta el archivo CSV. Ejemplo: npm run escarapelas -- inscripciones.csv');
  process.exit(1);
}
if (!TIPOS_VALIDOS.includes(tipo)) {
  console.error(`Tipo "${tipo}" desconocido. Usa uno de: ${TIPOS_VALIDOS.join(', ')}`);
  process.exit(1);
}

/** Lector de CSV que respeta comillas y comas dentro de los campos. */
function leerCsv(texto) {
  const filas = [];
  let fila = [], campo = '', entreComillas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (entreComillas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') entreComillas = false;
      else campo += c;
    } else if (c === '"') entreComillas = true;
    else if (c === ',') { fila.push(campo); campo = ''; }
    else if (c === '\n') { fila.push(campo); filas.push(fila); fila = []; campo = ''; }
    else if (c !== '\r') campo += c;
  }
  if (campo || fila.length) { fila.push(campo); filas.push(fila); }
  return filas.filter((f) => f.some((v) => v.trim()));
}

const comoArchivo = (texto) => texto
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();

const filas = leerCsv(readFileSync(rutaCsv, 'utf8'));
if (filas.length < 2) {
  console.error('El CSV no tiene filas de datos.');
  process.exit(1);
}

const encabezados = filas[0].map((h) => h.trim().toLowerCase());
const columna = (nombre) => encabezados.findIndex((h) => h === nombre.toLowerCase());
const iNombre = columna('Nombre completo');
const iDocumento = columna('Número de documento');
const iOrganizacion = columna('Organización y cargo');

if (iNombre === -1 || iDocumento === -1) {
  console.error('El CSV debe tener las columnas "Nombre completo" y "Número de documento".');
  console.error('Encontradas:', filas[0].join(' | '));
  process.exit(1);
}

const carpeta = new URL(`../escarapelas/${tipo}/`, import.meta.url);
mkdirSync(carpeta, { recursive: true });

let hechas = 0;
const saltadas = [];

for (const fila of filas.slice(1)) {
  const nombre = (fila[iNombre] || '').trim();
  const documento = normalizarDocumento(fila[iDocumento] || '');
  const organizacion = iOrganizacion === -1 ? '' : (fila[iOrganizacion] || '').trim();

  if (!nombre || !DOCUMENTO_RE.test(documento)) {
    saltadas.push(`${nombre || '(sin nombre)'} · documento "${fila[iDocumento] || ''}"`);
    continue;
  }

  const png = await generarEscarapela({ nombre, organizacion, documento, tipo });
  writeFileSync(new URL(`${documento}-${comoArchivo(nombre)}.png`, carpeta), png);
  hechas++;
  process.stdout.write(`\r${hechas} escarapelas generadas…`);
}

console.log(`\n${hechas} escarapelas en ${decodeURIComponent(carpeta.pathname)}`);
if (saltadas.length) {
  console.log(`\n${saltadas.length} filas saltadas por datos incompletos:`);
  saltadas.forEach((s) => console.log('  ·', s));
}
