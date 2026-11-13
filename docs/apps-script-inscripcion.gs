// Inclusive Talks · Recibe inscripciones desde la landing y las guarda en la pestaña "Inscripción".
// Dónde va: en la hoja maestra de Google Sheets > Extensiones > Apps Script. Pegar todo y guardar.
// Antes de implementar: cambia TOKEN por una clave larga y ponla igual en Vercel (APPS_SCRIPT_TOKEN).
// Configuración del proyecto > Zona horaria: (GMT-05:00) Bogotá.

const HOJA = 'Inscripción';
const TOKEN = 'CAMBIA-ESTA-CLAVE-LARGA';

function doPost(e) {
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return responder({ ok: false, error: 'formato' });
  }
  if (data.token !== TOKEN) return responder({ ok: false, error: 'no-autorizado' });

  const hoja = SpreadsheetApp.getActive().getSheetByName(HOJA);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ultima = hoja.getLastRow();
    if (ultima > 1) {
      const filas = hoja.getRange(2, 3, ultima - 1, 2).getValues(); // C = correo, D = documento
      for (const [correo, documento] of filas) {
        if (String(correo).trim().toLowerCase() === data.correo) return responder({ ok: false, error: 'correo-duplicado' });
        if (String(documento).trim().toUpperCase() === data.documento) return responder({ ok: false, error: 'documento-duplicado' });
      }
    }
    // Orden A a N: no cambiarlo, la hoja calcula indicadores sobre estas columnas.
    hoja.appendRow([
      new Date(),                    // A Marca temporal
      data.nombre,                   // B Nombre completo
      data.correo,                   // C Correo electrónico
      data.documento,                // D Número de documento
      data.ciudad,                   // E Ciudad
      data.edad,                     // F Rango de edad
      data.genero,                   // G Género
      data.sector,                   // H Sector
      data.organizacion || '',       // I Organización y cargo
      data.ajustes || '',            // J Ajustes de accesibilidad (separados por ", ")
      data.autorizacionDatos,        // K Autorización de datos personales
      data.autorizacionImagen || '', // L Autorización de imagen
      data.versionAviso,             // M Versión del aviso
      'landing'                      // N Origen
    ]);
    return responder({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

function responder(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
