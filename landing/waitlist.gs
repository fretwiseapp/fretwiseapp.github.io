/**
 * Fretwise — Waitlist backend (Google Apps Script → Google Sheet)
 * ---------------------------------------------------------------
 * Costo 0, escala a miles de emails. La data queda en una hoja tuya.
 *
 * DEPLOY (una sola vez, ~6 clicks — es lo único que no puedo hacer yo por vos
 * porque requiere tu login de Google):
 *
 *   1. Andá a https://sheets.new  → creá una hoja nueva, nombrala "Fretwise Waitlist".
 *   2. Menú  Extensiones → Apps Script.
 *   3. Borrá el código de ejemplo, pegá TODO este archivo, y guardá (Ctrl+S).
 *   4. (Opcional) Ejecutá la función `setup` una vez para crear el encabezado
 *      — la primera vez te va a pedir autorizar permisos; aceptá.
 *   5. Botón azul  Implementar → Nueva implementación → tipo "Aplicación web".
 *         · Ejecutar como:  Yo (tu cuenta)
 *         · Quién tiene acceso:  Cualquier usuario
 *      Implementar → Autorizar → copiá la "URL de la aplicación web" (termina en /exec).
 *   6. Pegámela en el chat y yo la cableo en la landing y pusheo.
 *
 * Para ver los suscriptos: abrís la hoja. Eso es todo.
 */

var SHEET_NAME = 'waitlist';

/** Corré esto una vez para dejar la hoja lista con encabezados. */
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['fecha', 'email', 'origen', 'referrer', 'user_agent']);
    sheet.getRange('A1:E1').setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(30000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) setup();

    var data = {};
    try { data = JSON.parse(e.postData.contents); } catch (err) {}

    // Honeypot: si el campo trampa viene lleno, es un bot. Devolvemos ok y no guardamos.
    if (data.company) return json({ ok: true });

    var email = String(data.email || '').trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return json({ ok: false, error: 'invalid_email' });
    }

    // Dedup: no guardamos el mismo email dos veces.
    var last = sheet.getLastRow();
    if (last > 1) {
      var existing = sheet.getRange(2, 2, last - 1, 1).getValues();
      for (var i = 0; i < existing.length; i++) {
        if (String(existing[i][0]).trim().toLowerCase() === email) {
          return json({ ok: true, duplicate: true });
        }
      }
    }

    sheet.appendRow([
      new Date(),
      email,
      String(data.source || '').slice(0, 60),
      String(data.ref || '').slice(0, 300),
      String(data.ua || '').slice(0, 300)
    ]);
    return json({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

/** Ping de salud: abrir la URL en el navegador debe devolver {ok:true}. */
function doGet() {
  return json({ ok: true, service: 'fretwise-waitlist' });
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
