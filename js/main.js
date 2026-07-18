(function () {
  'use strict';

  var announcer = document.getElementById('a11y-announcer');
  function announce(msg) {
    if (!announcer) return;
    announcer.textContent = '';
    window.setTimeout(function () { announcer.textContent = msg; }, 50);
  }

  /* ---------- Modal: postulación de alianza institucional ---------- */
  var alianzaDialog = document.getElementById('alianza-dialog');
  var alianzaOpenBtn = document.getElementById('alianza-open-btn');
  var alianzaCloseBtn = document.getElementById('alianza-close-btn');
  var alianzaForm = document.getElementById('alianza-form');

  if (alianzaDialog && alianzaOpenBtn && typeof alianzaDialog.showModal === 'function') {
    var alianzaLastTrigger = null;

    alianzaOpenBtn.addEventListener('click', function () {
      alianzaLastTrigger = alianzaOpenBtn;
      alianzaDialog.showModal();
      var firstField = document.getElementById('alianza-nombre');
      if (firstField) firstField.focus();
    });

    if (alianzaCloseBtn) {
      alianzaCloseBtn.addEventListener('click', function () {
        alianzaDialog.close();
      });
    }

    alianzaDialog.addEventListener('click', function (evt) {
      var box = alianzaDialog.getBoundingClientRect();
      var inside = evt.clientX >= box.left && evt.clientX <= box.right && evt.clientY >= box.top && evt.clientY <= box.bottom;
      if (!inside) alianzaDialog.close();
    });

    alianzaDialog.addEventListener('close', function () {
      if (alianzaLastTrigger) alianzaLastTrigger.focus();
    });
  } else if (alianzaOpenBtn) {
    alianzaOpenBtn.setAttribute('href', 'mailto:dicapacidad.colombia@gmail.com?subject=Alianza%20institucional%20Inclusive%20Talks');
  }

  if (alianzaForm) {
    var af = {
      nombre: document.getElementById('alianza-nombre'),
      empresa: document.getElementById('alianza-empresa'),
      cargo: document.getElementById('alianza-cargo'),
      correo: document.getElementById('alianza-correo'),
      telefono: document.getElementById('alianza-telefono')
    };
    var afErrors = {
      nombre: document.getElementById('alianza-error-nombre'),
      empresa: document.getElementById('alianza-error-empresa'),
      cargo: document.getElementById('alianza-error-cargo'),
      correo: document.getElementById('alianza-error-correo'),
      telefono: document.getElementById('alianza-error-telefono')
    };
    var afStatus = document.getElementById('alianza-form-status');
    var afSubmitBtn = document.getElementById('alianza-submit');
    var afSubmitLabel = document.getElementById('alianza-submit-label');

    var AF_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    var AF_PHONE_RE = /^[0-9+()\s-]{7,20}$/;

    function afShowError(field, msg) {
      afErrors[field].textContent = msg;
      afErrors[field].hidden = false;
      af[field].setAttribute('aria-invalid', 'true');
    }

    function afClearError(field) {
      afErrors[field].textContent = '';
      afErrors[field].hidden = true;
      af[field].removeAttribute('aria-invalid');
    }

    function afValidate() {
      var valid = true;

      if (!af.nombre.value.trim()) { afShowError('nombre', 'Escribe tu nombre completo.'); valid = false; }
      else afClearError('nombre');

      if (!af.empresa.value.trim()) { afShowError('empresa', 'Escribe el nombre de tu empresa o institución.'); valid = false; }
      else afClearError('empresa');

      if (!af.cargo.value.trim()) { afShowError('cargo', 'Escribe tu cargo.'); valid = false; }
      else afClearError('cargo');

      if (!af.correo.value.trim()) { afShowError('correo', 'Escribe tu correo electrónico.'); valid = false; }
      else if (!AF_EMAIL_RE.test(af.correo.value.trim())) { afShowError('correo', 'Escribe un correo electrónico válido.'); valid = false; }
      else afClearError('correo');

      if (!af.telefono.value.trim()) { afShowError('telefono', 'Escribe un número de contacto.'); valid = false; }
      else if (!AF_PHONE_RE.test(af.telefono.value.trim())) { afShowError('telefono', 'Escribe un número de contacto válido.'); valid = false; }
      else afClearError('telefono');

      return valid;
    }

    alianzaForm.addEventListener('submit', function (evt) {
      evt.preventDefault();

      if (!afValidate()) {
        afStatus.textContent = 'Revisa los campos marcados antes de continuar.';
        afStatus.setAttribute('data-state', 'error');
        var firstInvalid = alianzaForm.querySelector('[aria-invalid="true"]');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      var formData = new FormData(alianzaForm);
      var payload = {
        nombre: formData.get('nombre').toString().trim(),
        empresa: formData.get('empresa').toString().trim(),
        cargo: formData.get('cargo').toString().trim(),
        correo: formData.get('correo').toString().trim(),
        telefono: formData.get('telefono').toString().trim(),
        sitio_web: formData.get('sitio_web')
      };

      afSubmitBtn.disabled = true;
      afSubmitLabel.textContent = 'Enviando...';
      afStatus.removeAttribute('data-state');
      afStatus.textContent = '';

      fetch('/api/alianza', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (data) {
            return { ok: res.ok, data: data };
          });
        })
        .then(function (result) {
          if (result.ok) {
            afStatus.textContent = 'Listo. Recibimos la postulación de ' + payload.empresa + ' y te contactaremos a ' + payload.correo + '.';
            afStatus.setAttribute('data-state', 'success');
            alianzaForm.reset();
          } else {
            throw new Error((result.data && result.data.error) || 'No se pudo enviar la postulación.');
          }
        })
        .catch(function () {
          afStatus.textContent = 'Hubo un problema al enviar el formulario. Escríbenos directamente a dicapacidad.colombia@gmail.com.';
          afStatus.setAttribute('data-state', 'error');
        })
        .finally(function () {
          afSubmitBtn.disabled = false;
          afSubmitLabel.textContent = 'Enviar postulación';
        });
    });
  }

  /* ---------- Menú móvil ---------- */
  var navToggle = document.getElementById('nav-toggle');
  var primaryNav = document.getElementById('primary-nav');

  if (navToggle && primaryNav) {
    navToggle.addEventListener('click', function () {
      var isOpen = primaryNav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    primaryNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        primaryNav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Barra de accesibilidad ---------- */
  var toolbarToggle = document.getElementById('a11y-toggle');
  var toolbarPanel = document.getElementById('a11y-panel');

  if (toolbarToggle && toolbarPanel) {
    toolbarToggle.addEventListener('click', function () {
      var isOpen = toolbarPanel.hasAttribute('hidden') === false;
      if (isOpen) {
        toolbarPanel.setAttribute('hidden', '');
        toolbarToggle.setAttribute('aria-expanded', 'false');
      } else {
        toolbarPanel.removeAttribute('hidden');
        toolbarToggle.setAttribute('aria-expanded', 'true');
      }
    });

    document.addEventListener('click', function (evt) {
      if (!toolbarPanel.contains(evt.target) && evt.target !== toolbarToggle && !toolbarToggle.contains(evt.target)) {
        if (!toolbarPanel.hasAttribute('hidden')) {
          toolbarPanel.setAttribute('hidden', '');
          toolbarToggle.setAttribute('aria-expanded', 'false');
        }
      }
    });

    document.addEventListener('keydown', function (evt) {
      if (evt.key === 'Escape' && !toolbarPanel.hasAttribute('hidden')) {
        toolbarPanel.setAttribute('hidden', '');
        toolbarToggle.setAttribute('aria-expanded', 'false');
        toolbarToggle.focus();
      }
    });
  }

  /* --- Zoom de texto --- */
  var ZOOM_STEPS = [1, 1.15, 1.3, 1.5];
  var zoomIndex = 0;

  try {
    var savedZoom = window.localStorage.getItem('it_zoom_index');
    if (savedZoom !== null) {
      zoomIndex = Math.min(parseInt(savedZoom, 10) || 0, ZOOM_STEPS.length - 1);
    }
  } catch (e) { /* localStorage no disponible */ }

  var btnZoom = document.getElementById('btn-zoom');
  var zoomValueEl = document.getElementById('zoom-value');

  function applyZoom() {
    var pct = Math.round(ZOOM_STEPS[zoomIndex] * 100);
    document.documentElement.style.setProperty('--zoom', String(ZOOM_STEPS[zoomIndex]));
    if (zoomValueEl) zoomValueEl.textContent = pct + '%';
    if (btnZoom) btnZoom.setAttribute('aria-label', 'Cambiar tamaño del texto. Tamaño actual: ' + pct + ' por ciento');
    try { window.localStorage.setItem('it_zoom_index', String(zoomIndex)); } catch (e) {}
  }

  if (btnZoom) {
    applyZoom();
    btnZoom.addEventListener('click', function () {
      zoomIndex = (zoomIndex + 1) % ZOOM_STEPS.length;
      applyZoom();
      announce('Tamaño de texto: ' + Math.round(ZOOM_STEPS[zoomIndex] * 100) + ' por ciento');
    });
  }

  /* --- Alto contraste --- */
  var btnContraste = document.getElementById('btn-contraste');
  var contrasteLabel = document.getElementById('contraste-label');
  var htmlEl = document.documentElement;

  function setContrast(on) {
    if (on) {
      htmlEl.setAttribute('data-contrast', 'high');
    } else {
      htmlEl.removeAttribute('data-contrast');
    }
    if (btnContraste) btnContraste.setAttribute('aria-pressed', String(on));
    if (contrasteLabel) contrasteLabel.textContent = on ? 'Desactivar alto contraste' : 'Activar alto contraste';
    try { window.localStorage.setItem('it_contrast', on ? '1' : '0'); } catch (e) {}
  }

  var initialContrast = false;
  try { initialContrast = window.localStorage.getItem('it_contrast') === '1'; } catch (e) {}
  if (btnContraste) {
    setContrast(initialContrast);
    btnContraste.addEventListener('click', function () {
      var isOn = btnContraste.getAttribute('aria-pressed') === 'true';
      setContrast(!isOn);
      announce(!isOn ? 'Alto contraste activado' : 'Alto contraste desactivado');
    });
  }

  /* --- Dictado (lectura en voz alta) --- */
  var btnDictado = document.getElementById('btn-dictado');
  var dictadoLabel = document.getElementById('dictado-label');
  var synth = window.speechSynthesis;

  function stopDictado() {
    if (synth) synth.cancel();
    if (btnDictado) btnDictado.setAttribute('aria-pressed', 'false');
    if (dictadoLabel) dictadoLabel.textContent = 'Activar dictado';
  }

  if (btnDictado && synth) {
    btnDictado.addEventListener('click', function () {
      var isOn = btnDictado.getAttribute('aria-pressed') === 'true';

      if (isOn) {
        stopDictado();
        announce('Dictado detenido');
        return;
      }

      var main = document.getElementById('main-content');
      var text = main ? main.innerText : document.body.innerText;
      var utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-CO';
      utterance.rate = 1;

      utterance.onend = function () { stopDictado(); };
      utterance.onerror = function () { stopDictado(); };

      synth.cancel();
      synth.speak(utterance);

      btnDictado.setAttribute('aria-pressed', 'true');
      if (dictadoLabel) dictadoLabel.textContent = 'Detener dictado';
      announce('Leyendo el contenido de la página en voz alta');
    });
  } else if (btnDictado) {
    btnDictado.disabled = true;
    if (dictadoLabel) dictadoLabel.textContent = 'Dictado no disponible';
  }

  /* ---------- Formulario de pre-registro ---------- */
  var form = document.getElementById('preregistro-form');

  if (form) {
    var nombreInput = document.getElementById('field-nombre');
    var correoInput = document.getElementById('field-correo');
    var errorNombre = document.getElementById('error-nombre');
    var errorCorreo = document.getElementById('error-correo');
    var statusEl = document.getElementById('form-status');
    var submitBtn = document.getElementById('form-submit');
    var submitLabel = document.getElementById('form-submit-label');

    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function showFieldError(input, errorEl, message) {
      errorEl.textContent = message;
      errorEl.hidden = false;
      input.setAttribute('aria-invalid', 'true');
    }

    function clearFieldError(input, errorEl) {
      errorEl.textContent = '';
      errorEl.hidden = true;
      input.removeAttribute('aria-invalid');
    }

    function validate() {
      var valid = true;

      if (!nombreInput.value.trim()) {
        showFieldError(nombreInput, errorNombre, 'Escribe tu nombre completo.');
        valid = false;
      } else {
        clearFieldError(nombreInput, errorNombre);
      }

      if (!correoInput.value.trim()) {
        showFieldError(correoInput, errorCorreo, 'Escribe tu correo electrónico.');
        valid = false;
      } else if (!EMAIL_RE.test(correoInput.value.trim())) {
        showFieldError(correoInput, errorCorreo, 'Escribe un correo electrónico válido.');
        valid = false;
      } else {
        clearFieldError(correoInput, errorCorreo);
      }

      return valid;
    }

    form.addEventListener('submit', function (evt) {
      evt.preventDefault();

      if (!validate()) {
        statusEl.textContent = 'Revisa los campos marcados antes de continuar.';
        statusEl.setAttribute('data-state', 'error');
        var firstInvalid = form.querySelector('[aria-invalid="true"]');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      var formData = new FormData(form);
      var payload = {
        nombre: formData.get('nombre').toString().trim(),
        correo: formData.get('correo').toString().trim(),
        tipo: formData.get('tipo'),
        sitio_web: formData.get('sitio_web')
      };

      submitBtn.disabled = true;
      submitLabel.textContent = 'Enviando...';
      statusEl.removeAttribute('data-state');
      statusEl.textContent = '';

      fetch('/api/preregister', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (data) {
            return { ok: res.ok, data: data };
          });
        })
        .then(function (result) {
          if (result.ok) {
            form.reset();
            statusEl.textContent = 'Listo. Te escribiremos a ' + payload.correo + ' cuando tengamos novedades.';
            statusEl.setAttribute('data-state', 'success');
          } else {
            throw new Error((result.data && result.data.error) || 'No se pudo enviar el formulario.');
          }
        })
        .catch(function () {
          statusEl.textContent = 'Hubo un problema al enviar el formulario. Escríbenos directamente a dicapacidad.colombia@gmail.com.';
          statusEl.setAttribute('data-state', 'error');
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitLabel.textContent = 'Quiero enterarme primero';
        });
    });

    nombreInput.addEventListener('blur', function () {
      if (nombreInput.value.trim()) clearFieldError(nombreInput, errorNombre);
    });
    correoInput.addEventListener('blur', function () {
      if (EMAIL_RE.test(correoInput.value.trim())) clearFieldError(correoInput, errorCorreo);
    });
  }
})();
