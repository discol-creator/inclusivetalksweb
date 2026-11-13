/* Formulario de inscripción · Inclusive Talks Medellín 2026
   Valida en el navegador, envía a /api/inscripcion y muestra la confirmación.
   El servidor vuelve a validar todo: esto solo evita viajes innecesarios. */
(function () {
  'use strict';

  var form = document.getElementById('inscripcion-form');
  if (!form) return;

  var TIEMPO_MINIMO_MS = 3000;            // anti-bot: nadie llena el formulario en menos de 3 segundos
  var abierto = Date.now();

  var statusEl = document.getElementById('inscripcion-status');
  var submitBtn = document.getElementById('inscripcion-submit');
  var submitLabel = document.getElementById('inscripcion-submit-label');
  var resumen = document.getElementById('resumen-errores');
  var resumenLista = document.getElementById('resumen-errores-lista');
  var confirmacion = document.getElementById('confirmacion');

  var CORREO_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var CODIGO_RE = /^[A-Z]{2}(0[1-9]|[12][0-9]|3[01])-[0-9]{2}$/;

  /* ---------- Utilidades ---------- */
  function id(valor) { return document.getElementById(valor); }
  function marcados(nombre) {
    return Array.prototype.slice.call(form.querySelectorAll('input[name="' + nombre + '"]:checked'));
  }
  function valorRadio(nombre) {
    var elegido = marcados(nombre)[0];
    return elegido ? elegido.value : '';
  }
  function normalizarCodigo(valor) {
    return String(valor || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '')
      .toUpperCase();
  }

  /* ---------- Errores ---------- */
  // Cada campo se describe con su párrafo de error y, cuando es un grupo, con su leyenda.
  var CAMPOS = {
    nombre: { error: 'e-nombre', foco: 'f-nombre', etiqueta: 'Nombre completo' },
    correo: { error: 'e-correo', foco: 'f-correo', etiqueta: 'Correo electrónico' },
    codigo: { error: 'e-codigo', foco: 'f-codigo', etiqueta: 'Código personal' },
    ciudad: { error: 'e-ciudad', foco: 'f-ciudad', etiqueta: 'Ciudad' },
    edad: { error: 'e-edad', grupo: 'edad', etiqueta: 'Rango de edad' },
    genero: { error: 'e-genero', grupo: 'genero', etiqueta: 'Género' },
    sector: { error: 'e-sector', grupo: 'sector', etiqueta: 'Sector' },
    organizacion: { error: 'e-organizacion', foco: 'f-organizacion', etiqueta: 'Organización y cargo' },
    ajustes: { error: 'e-ajustes', grupo: 'ajustes', etiqueta: 'Ajustes de accesibilidad' },
    autorizacionDatos: { error: 'e-autorizacionDatos', foco: 'f-autorizacion-datos', etiqueta: 'Autorización de datos personales' }
  };

  function primerControl(campo) {
    if (campo.foco) return id(campo.foco);
    return form.querySelector('input[name="' + campo.grupo + '"]');
  }

  function limpiarErrores() {
    Object.keys(CAMPOS).forEach(function (clave) {
      var campo = CAMPOS[clave];
      var errorEl = id(campo.error);
      if (errorEl) { errorEl.textContent = ''; errorEl.hidden = true; }
      var control = primerControl(campo);
      if (control && campo.foco) control.removeAttribute('aria-invalid');
    });
    resumen.hidden = true;
    resumenLista.innerHTML = '';
  }

  function pintarErrores(errores) {
    var claves = Object.keys(errores).filter(function (clave) { return CAMPOS[clave]; });
    if (!claves.length) return null;

    claves.forEach(function (clave) {
      var campo = CAMPOS[clave];
      var errorEl = id(campo.error);
      if (errorEl) { errorEl.textContent = errores[clave]; errorEl.hidden = false; }
      var control = primerControl(campo);
      if (control && campo.foco) control.setAttribute('aria-invalid', 'true');

      var item = document.createElement('li');
      var enlace = document.createElement('a');
      enlace.href = '#' + (campo.foco || (control && control.id) || campo.error);
      enlace.textContent = campo.etiqueta + ': ' + errores[clave];
      enlace.addEventListener('click', function (evt) {
        evt.preventDefault();
        if (control) control.focus();
      });
      item.appendChild(enlace);
      resumenLista.appendChild(item);
    });

    resumen.hidden = false;
    resumen.focus();
    return claves[0];
  }

  /* ---------- Campos "Otro" que abren un texto ---------- */
  function conectarOtro(nombreGrupo, valorQueAbre, contenedorId, campoId) {
    var contenedor = id(contenedorId);
    var campo = id(campoId);
    if (!contenedor || !campo) return;

    function revisar() {
      var abiertoAhora = marcados(nombreGrupo).some(function (entrada) { return entrada.value === valorQueAbre; });
      contenedor.hidden = !abiertoAhora;
      if (!abiertoAhora) campo.value = '';
    }

    form.querySelectorAll('input[name="' + nombreGrupo + '"]').forEach(function (entrada) {
      entrada.addEventListener('change', revisar);
    });
    revisar();
  }

  conectarOtro('genero', 'Prefiero autodescribirme', 'campo-genero-texto', 'f-genero-texto');
  conectarOtro('ajustes', 'Otro', 'campo-ajustes-texto', 'f-ajustes-texto');

  // El código se guarda en mayúsculas y sin tildes: se muestra así mientras se escribe.
  var campoCodigo = id('f-codigo');
  campoCodigo.addEventListener('blur', function () {
    campoCodigo.value = normalizarCodigo(campoCodigo.value);
  });

  /* ---------- Validación ---------- */
  function recoger() {
    return {
      nombre: id('f-nombre').value.trim().replace(/\s+/g, ' '),
      correo: id('f-correo').value.trim().toLowerCase(),
      codigo: normalizarCodigo(id('f-codigo').value),
      ciudad: id('f-ciudad').value,
      edad: valorRadio('edad'),
      genero: valorRadio('genero'),
      generoTexto: id('f-genero-texto').value.trim(),
      sector: valorRadio('sector'),
      organizacion: id('f-organizacion').value.trim().replace(/\s+/g, ' '),
      ajustes: marcados('ajustes').map(function (entrada) { return entrada.value; }),
      ajustesOtro: id('f-ajustes-texto').value.trim(),
      autorizacionDatos: id('f-autorizacion-datos').checked ? id('f-autorizacion-datos').value : '',
      autorizacionImagen: id('f-autorizacion-imagen').checked ? id('f-autorizacion-imagen').value : '',
      sitio_web: id('f-sitio-web').value,
      tiempo: Date.now() - abierto
    };
  }

  function validar(datos) {
    var errores = {};

    if (datos.nombre.length < 3 || datos.nombre.length > 120) {
      errores.nombre = 'Escribe tu nombre completo (entre 3 y 120 caracteres).';
    }
    if (!CORREO_RE.test(datos.correo)) {
      errores.correo = 'Escribe un correo electrónico válido.';
    }
    if (!CODIGO_RE.test(datos.codigo)) {
      errores.codigo = 'Revisa el formato. Ejemplo: FB07-42 (dos letras, día de 01 a 31, guion y dos números).';
    }
    if (!datos.ciudad) {
      errores.ciudad = 'Elige la ciudad desde donde vienes.';
    }
    if (!datos.edad) {
      errores.edad = 'Elige un rango de edad.';
    }
    if (!datos.genero) {
      errores.genero = 'Elige una opción de género.';
    } else if (datos.genero === 'Prefiero autodescribirme' && !datos.generoTexto) {
      errores.genero = 'Escribe cómo te identificas (hasta 60 caracteres).';
    }
    if (!datos.sector) {
      errores.sector = 'Elige el sector que mejor te representa.';
    }
    if (datos.ajustes.indexOf('Otro') !== -1 && !datos.ajustesOtro) {
      errores.ajustes = 'Cuéntanos qué otro ajuste necesitas (hasta 160 caracteres).';
    }
    if (!datos.autorizacionDatos) {
      errores.autorizacionDatos = 'Necesitamos tu autorización para procesar la inscripción.';
    }

    return errores;
  }

  /* ---------- Confirmación ---------- */
  function mostrarConfirmacion(respuesta) {
    form.parentNode.hidden = true;        // oculta la tarjeta del formulario
    confirmacion.hidden = false;
    id('confirmacion-codigo').textContent = respuesta.codigo;
    id('confirmacion-correo').textContent = 'Te enviamos tu escarapela a ' + respuesta.correo + '.';
    id('confirmacion-nota').hidden = respuesta.correoEnviado !== false;
    if (respuesta.correoEnviado === false) {
      id('confirmacion-correo').textContent =
        'Tu inscripción quedó guardada. Estamos teniendo problemas para enviar el correo a ' + respuesta.correo + '.';
    }
    var titulo = id('confirmacion-title');
    titulo.focus();
    titulo.scrollIntoView({ block: 'center' });
  }

  /* ---------- Envío ---------- */
  var enviando = false;

  form.addEventListener('submit', function (evt) {
    evt.preventDefault();
    if (enviando) return;

    limpiarErrores();
    var datos = recoger();
    var errores = validar(datos);

    if (Object.keys(errores).length) {
      statusEl.textContent = '';
      statusEl.removeAttribute('data-state');
      pintarErrores(errores);
      return;
    }

    if (datos.tiempo < TIEMPO_MINIMO_MS) {
      statusEl.textContent = 'Tómate unos segundos más y vuelve a enviar el formulario.';
      statusEl.setAttribute('data-state', 'error');
      return;
    }

    enviando = true;
    submitBtn.disabled = true;
    submitLabel.textContent = 'Enviando tu inscripción…';
    statusEl.textContent = 'Estamos guardando tu inscripción y preparando tu escarapela. Puede tardar unos segundos.';
    statusEl.setAttribute('data-state', '');

    fetch('/api/inscripcion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    })
      .then(function (respuesta) {
        return respuesta.json().then(function (cuerpo) { return { estado: respuesta.status, cuerpo: cuerpo }; });
      })
      .then(function (resultado) {
        if (resultado.cuerpo && resultado.cuerpo.ok) {
          statusEl.textContent = '';
          statusEl.removeAttribute('data-state');
          mostrarConfirmacion(resultado.cuerpo);
          return;
        }

        var cuerpo = resultado.cuerpo || {};
        if (cuerpo.errores) {
          pintarErrores(cuerpo.errores);
          statusEl.textContent = '';
          statusEl.removeAttribute('data-state');
        } else {
          statusEl.textContent = cuerpo.error || 'No pudimos guardar tu inscripción. Inténtalo de nuevo en unos minutos';
          statusEl.setAttribute('data-state', 'error');
        }
      })
      .catch(function () {
        statusEl.textContent = 'No pudimos guardar tu inscripción. Revisa tu conexión e inténtalo de nuevo en unos minutos';
        statusEl.setAttribute('data-state', 'error');
      })
      .finally(function () {
        enviando = false;
        submitBtn.disabled = false;
        submitLabel.textContent = 'Completar mi inscripción';
      });
  });
})();
