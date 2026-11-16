/* Validación de escarapelas · Inclusive Talks
   La credencial viaja en el fragmento de la URL (#), que el navegador nunca envía
   al servidor: así el número de documento no queda en los registros. Esta página
   la lee y la manda por POST a /api/validar. */
(function () {
  'use strict';

  var caja = document.getElementById('validacion');
  var estado = document.getElementById('validacion-estado');
  if (!caja || !estado) return;

  function pintar(clase, titulo, detalle) {
    caja.setAttribute('data-estado', clase);
    estado.textContent = titulo;
    if (detalle) {
      var p = document.createElement('p');
      p.className = 'validacion__detalle';
      p.textContent = detalle;
      caja.appendChild(p);
    }
  }

  var credencial = window.location.hash.replace(/^#/, '');
  if (!credencial) {
    pintar('vacio', 'No hay nada que validar.', 'Escanea el código QR de una escarapela.');
    return;
  }

  fetch('/api/validar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credencial: credencial })
  })
    .then(function (r) { return r.json(); })
    .then(function (r) {
      if (r.valido) {
        pintar('valida', 'Escarapela válida', r.tipo + ' · Documento ' + r.documento);
        var nota = document.createElement('p');
        nota.className = 'validacion__detalle';
        nota.textContent = 'Compara este número con el documento de identidad de la persona.';
        caja.appendChild(nota);
      } else {
        pintar('invalida', 'Escarapela no válida', r.mensaje);
      }
    })
    .catch(function () {
      pintar('error', 'No pudimos validarla', 'Revisa la conexión e inténtalo de nuevo.');
    });
})();
