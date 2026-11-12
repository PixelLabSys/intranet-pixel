/* Backoffice Pixel — Corte 1: acceso (contraseña + MFA), Banner, Menús, Administradores.
   Todo el contenido dinámico se pinta con createElement/textContent (PX.h). La seguridad real vive en las políticas RLS. */
(function () {
  'use strict';
  var h = PX.h, CFG = window.PX_CONFIG, app = document.getElementById('app');
  var BANNER_KEYS = ['banner_eyebrow', 'banner_title', 'banner_text'];
  var INACTIVITY_MS = 30 * 60 * 1000;

  // Un enlace de invitación o recuperación llega con #...type=invite|recovery: hay que pedir contraseña nueva.
  var needPassword = /[#&]type=(invite|recovery)\b/.test(location.hash);

  if (!CFG || !CFG.url || !CFG.anonKey) { app.append(center(card(h('p', null, 'El backoffice aún no está conectado a un proyecto Supabase.')))); return; }
  var sb = supabase.createClient(CFG.url, CFG.anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });

  /* ---------------- utilidades de interfaz ---------------- */
  function center(c) { return h('div', { class: 'center' }, c); }
  function card() { var c = h('div', { class: 'card' }, logos()); [].slice.call(arguments).forEach(function (x) { c.append(x); }); return c; }
  function logos() { var d = document.createElement('div'); d.append(h('img', { class: 'logo logo-claro', src: '../logo-claro.png', alt: 'Pixel Graphic' }), h('img', { class: 'logo logo-oscuro', src: '../logo-oscuro.png', alt: 'Pixel Graphic' })); return d; }
  function msg(kind, text) { return h('div', { class: 'msg ' + (kind || '') , role: kind === 'err' ? 'alert' : 'status' }, text); }
  function field(label, input) { return h('div', null, h('label', null, label), input); }
  function setMsg(box, kind, text) { box.textContent = ''; if (text) box.append(msg(kind, text)); }
  function show(node) { app.textContent = ''; app.append(node); }
  function friendly(e) { var m = (e && e.message) || ''; if (/Invalid login/i.test(m)) return 'Correo o contraseña incorrectos.'; if (/rate|too many/i.test(m)) return 'Demasiados intentos. Espera un momento.'; return m || 'Ocurrió un error. Intenta de nuevo.'; }
  function busy(btn, on) { btn.disabled = on; }

  /* ---------------- flujo de acceso ---------------- */
  async function start() {
    var s = (await sb.auth.getSession()).data.session;
    if (!s) return viewLogin();
    if (needPassword) return viewSetPassword();
    var aal = (await sb.auth.mfa.getAuthenticatorAssuranceLevel()).data;
    if (aal && aal.currentLevel === 'aal1' && aal.nextLevel === 'aal2') return viewMfaVerify();
    if (aal && aal.currentLevel === 'aal1') return viewMfaEnroll();
    var uid = s.user.id;
    var adm = await sb.from('admins').select('user_id').eq('user_id', uid).maybeSingle();
    if (!adm.data) return viewNoAdmin();
    viewShell(s.user);
  }

  function viewLogin() {
    var email = h('input', { type: 'email', autocomplete: 'username', required: true }), pw = h('input', { type: 'password', autocomplete: 'current-password', required: true });
    var out = h('div'), btn = h('button', { class: 'b pri full', type: 'submit' }, 'Entrar');
    var forgot = h('button', { class: 'link', type: 'button' }, 'Olvidé mi contraseña');
    forgot.onclick = async function () {
      if (!email.value) return setMsg(out, 'err', 'Escribe tu correo arriba y vuelve a pulsar.');
      await sb.auth.resetPasswordForEmail(email.value.trim(), { redirectTo: location.origin + location.pathname });
      setMsg(out, 'ok', 'Si el correo es de un administrador, recibirás un enlace para crear una contraseña nueva.'); // misma respuesta exista o no
    };
    var f = h('form', null, h('h1', null, 'Backoffice'), field('Correo', email), field('Contraseña', pw), btn, out, forgot);
    f.onsubmit = async function (e) {
      e.preventDefault(); busy(btn, true);
      var r = await sb.auth.signInWithPassword({ email: email.value.trim(), password: pw.value });
      busy(btn, false);
      if (r.error) return setMsg(out, 'err', friendly(r.error));
      start();
    };
    show(center(card(f)));
  }

  function viewSetPassword() {
    var p1 = h('input', { type: 'password', autocomplete: 'new-password', minlength: 12, required: true }), p2 = h('input', { type: 'password', autocomplete: 'new-password', required: true });
    var out = h('div'), btn = h('button', { class: 'b pri full', type: 'submit' }, 'Guardar contraseña');
    var f = h('form', null, h('h1', null, 'Crea tu contraseña'), h('p', { class: 'eyebrow' }, 'Mínimo 12 caracteres'), field('Contraseña nueva', p1), field('Repítela', p2), btn, out);
    f.onsubmit = async function (e) {
      e.preventDefault();
      if (p1.value.length < 12) return setMsg(out, 'err', 'Usa al menos 12 caracteres.');
      if (p1.value !== p2.value) return setMsg(out, 'err', 'Las contraseñas no coinciden.');
      busy(btn, true);
      var r = await sb.auth.updateUser({ password: p1.value });
      busy(btn, false);
      if (r.error) return setMsg(out, 'err', friendly(r.error));
      needPassword = false; history.replaceState(null, '', location.pathname); start();
    };
    show(center(card(f)));
  }

  async function viewMfaEnroll() {
    // Limpia factores sin verificar de intentos previos para poder inscribir uno nuevo.
    var lf = await sb.auth.mfa.listFactors();
    var stale = ((lf.data && lf.data.all) || []).filter(function (x) { return x.factor_type === 'totp' && x.status === 'unverified'; });
    for (var i = 0; i < stale.length; i++) await sb.auth.mfa.unenroll({ factorId: stale[i].id });
    var en = await sb.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Backoffice' });
    if (en.error) return show(center(card(msg('err', friendly(en.error)))));
    var factorId = en.data.id, out = h('div');
    var code = h('input', { type: 'text', inputmode: 'numeric', autocomplete: 'one-time-code', maxlength: 6, pattern: '[0-9]{6}', required: true });
    var btn = h('button', { class: 'b pri full', type: 'submit' }, 'Activar');
    var img = h('img', { class: 'qr', alt: 'Código QR para tu app de autenticación', src: en.data.totp.qr_code });
    var f = h('form', null, h('h1', null, 'Activa la verificación en dos pasos'),
      h('p', null, 'Escanea este código con Google Authenticator, Authy o similar, y escribe los 6 dígitos que te muestre.'), img,
      h('p', { class: 'eyebrow' }, 'Si no puedes escanear, clave manual:'), h('code', null, en.data.totp.secret), field('Código de 6 dígitos', code), btn, out);
    f.onsubmit = async function (e) {
      e.preventDefault(); busy(btn, true);
      var r = await sb.auth.mfa.challengeAndVerify({ factorId: factorId, code: code.value.trim() });
      busy(btn, false);
      if (r.error) return setMsg(out, 'err', 'Código incorrecto. Revisa la hora de tu teléfono e inténtalo otra vez.');
      start();
    };
    show(center(card(f)));
  }

  async function viewMfaVerify() {
    var lf = await sb.auth.mfa.listFactors();
    var fac = lf.data && lf.data.totp && lf.data.totp[0];
    if (!fac) return viewMfaEnroll();
    var code = h('input', { type: 'text', inputmode: 'numeric', autocomplete: 'one-time-code', maxlength: 6, pattern: '[0-9]{6}', required: true });
    var out = h('div'), btn = h('button', { class: 'b pri full', type: 'submit' }, 'Verificar');
    var out2 = h('button', { class: 'link', type: 'button' }, 'Cancelar y salir'); out2.onclick = logout;
    var f = h('form', null, h('h1', null, 'Verificación en dos pasos'), field('Código de tu app de autenticación', code), btn, out, out2);
    f.onsubmit = async function (e) {
      e.preventDefault(); busy(btn, true);
      var r = await sb.auth.mfa.challengeAndVerify({ factorId: fac.id, code: code.value.trim() });
      busy(btn, false);
      if (r.error) return setMsg(out, 'err', 'Código incorrecto o vencido.');
      start();
    };
    show(center(card(f)));
    code.focus();
  }

  function viewNoAdmin() {
    var b = h('button', { class: 'b full', type: 'button' }, 'Salir'); b.onclick = logout;
    show(center(card(h('h1', null, 'Sin acceso'), h('p', null, 'Esta cuenta no es administradora del backoffice. Pídele acceso a un administrador.'), b)));
  }

  async function logout() { await sb.auth.signOut(); location.hash = ''; viewLogin(); }

  /* ---------------- cierre por inactividad ---------------- */
  var idleTimer;
  function armIdle() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function () { logout(); }, INACTIVITY_MS);
  }
  ['click', 'keydown', 'pointerdown', 'touchstart'].forEach(function (ev) { document.addEventListener(ev, function () { if (idleTimer) armIdle(); }, { passive: true }); });

  /* ---------------- shell ---------------- */
  var current = 'banner';
  function viewShell(user) {
    armIdle();
    var main = h('main'), tabs = [
      ['banner', 'Banner', 'image'], ['menus', 'Menús', 'menu'], ['noticias', 'Noticias', 'megaphone'],
      ['calendario', 'Calendario', 'calendar'], ['herramientas', 'Herramientas', 'gear'], ['admins', 'Administradores', 'shield']
    ], btns = {};
    var aside = h('aside', null, logos());
    tabs.forEach(function (t) {
      var b = h('button', { class: 'tab', type: 'button' }, PX.svgIcon(t[2], 16), t[1]); btns[t[0]] = b;
      b.onclick = function () { go(t[0]); }; aside.append(b);
    });
    var out = h('button', { class: 'b', type: 'button' }, 'Cerrar sesión'); out.onclick = logout;
    var theme = h('button', { class: 'b', type: 'button' }, 'Cambiar tema');
    theme.onclick = function () { var d = document.documentElement.classList.toggle('dark'); try { localStorage.setItem('theme', d ? 'dark' : 'light'); } catch (e) {} };
    aside.append(h('div', { class: 'foot' }, h('span', null, user.email), theme, out));
    function go(k) {
      current = k; Object.keys(btns).forEach(function (x) { btns[x].classList.toggle('on', x === k); });
      main.textContent = '';
      var mods = { banner: modBanner, menus: modMenus, noticias: modNews, calendario: modCalendar, herramientas: modTools, admins: modAdmins };
      mods[k] ? mods[k](main, user) : modSoon(main, k);
    }
    show(h('div', { class: 'shell' }, aside, main));
    go(current);
  }
  function modSoon(root, k) { root.append(h('h1', null, 'Próximamente'), h('p', { class: 'soon' }, 'Este módulo se activa en un corte posterior, cuando valides el actual.')); }

  /* Campo de texto con barra de peso y color + vista previa (compartido por Banner y Noticias). */
  function weightField(label, input) {
    var prev = h('div', { class: 'rp' });
    function upd() { prev.textContent = ''; prev.appendChild(PX.rich(input.value)); if (!input.value) prev.textContent = 'Vista previa'; }
    // Aplica a la selección: quita solo las marcas del mismo tipo (peso o color) y pone la nueva.
    function apply(which, open, close) {
      var a = input.selectionStart, b = input.selectionEnd; if (a === b) { return; }
      var sel = PX.stripRich(input.value.slice(a, b), which);
      var rep = open ? open + sel + close : sel;
      input.value = input.value.slice(0, a) + rep + input.value.slice(b);
      input.focus(); input.setSelectionRange(a, a + rep.length); upd();
    }
    var bar = h('div', { class: 'tb' }), bar2 = h('div', { class: 'tb' });
    [['l', 'Ligero'], ['n', 'Normal'], ['b', 'Negrita']].forEach(function (x) {
      var bt = h('button', { class: 'b', type: 'button', style: 'font-weight:' + ({ l: 300, n: 400, b: 700 })[x[0]] }, x[1]);
      bt.onmousedown = function (e) { e.preventDefault(); };
      bt.onclick = function () { x[0] === 'n' ? apply('w') : apply('w', '[' + x[0] + ']', '[/' + x[0] + ']'); }; bar.append(bt);
    });
    bar.append(h('span', { class: 'hint' }, 'Selecciona texto y elige peso o color'));
    bar2.append(h('span', { class: 'hint' }, 'Color:'));
    var auto = h('button', { class: 'sw auto', type: 'button', title: 'Color automático', 'aria-label': 'Color automático' });
    auto.onmousedown = function (e) { e.preventDefault(); }; auto.onclick = function () { apply('c'); }; bar2.append(auto);
    Object.keys(PX.COLORS).forEach(function (k) {
      var sw = h('button', { class: 'sw', type: 'button', title: PX.COLOR_LABELS[k], 'aria-label': PX.COLOR_LABELS[k], style: 'background:' + PX.COLORS[k] });
      sw.onmousedown = function (e) { e.preventDefault(); };
      sw.onclick = function () { apply('c', '[c:' + k + ']', '[/c]'); }; bar2.append(sw);
    });
    input.addEventListener('input', upd); upd();
    return h('div', null, h('label', null, label), bar, bar2, input, prev);
  }

  /* ---------------- Banner ---------------- */
  function resizeImage(file, maxW) {
    // Re-codifica en JPEG: reduce peso y elimina metadatos EXIF (p. ej. ubicación).
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(file), im = new Image();
      im.onload = function () {
        var sc = Math.min(1, maxW / im.width), c = document.createElement('canvas');
        c.width = Math.round(im.width * sc); c.height = Math.round(im.height * sc);
        var ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(im, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) { b ? res(b) : rej(new Error('No se pudo procesar la imagen')); }, 'image/jpeg', 0.85);
      };
      im.onerror = function () { URL.revokeObjectURL(url); rej(new Error('El archivo no es una imagen válida (usa JPG, PNG o WebP).')); };
      im.src = url;
    });
  }

  async function modBanner(root) {
    root.append(h('p', { class: 'eyebrow' }, 'Portada'), h('h1', null, 'Banner'));
    var r = await sb.from('site_settings').select('key,value,updated_at');
    if (r.error) return root.append(msg('err', 'No se pudo cargar: ' + friendly(r.error)));
    var cur = {}; r.data.forEach(function (x) { cur[x.key] = x; });
    var out = h('div'), imgPath = (cur.banner_image && cur.banner_image.value) || '';
    var prev = h('div', { class: 'preview' }, 'Sin imagen (se muestra el fondo de píxeles)');
    function paint() {
      var u = PX.mediaUrl(CFG, imgPath); prev.textContent = '';
      if (u) { prev.style.backgroundImage = 'url("' + u + '")'; } else { prev.style.backgroundImage = ''; prev.textContent = 'Sin imagen (se muestra el fondo de píxeles)'; }
    }
    paint();
    var file = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp' });
    var rm = h('button', { class: 'b dng', type: 'button' }, 'Quitar imagen');
    var inputs = {};
    inputs.banner_eyebrow = h('input', { type: 'text', maxlength: 160, value: (cur.banner_eyebrow && cur.banner_eyebrow.value) || '' });
    inputs.banner_title = h('input', { type: 'text', maxlength: 160, value: (cur.banner_title && cur.banner_title.value) || '' });
    inputs.banner_text = h('textarea', { maxlength: 500 }); inputs.banner_text.value = (cur.banner_text && cur.banner_text.value) || '';
    var save = h('button', { class: 'b pri', type: 'button' }, 'Guardar textos');
    // Barra de pesos: aplica Ligero / Normal / Negrita al texto seleccionado (guarda marcas [l] [b]).
    async function setImage(newPath) {
      var old = imgPath, row = cur.banner_image;
      var q = row
        ? sb.from('site_settings').update({ value: newPath }).eq('key', 'banner_image').eq('updated_at', row.updated_at).select('key,value,updated_at')
        : sb.from('site_settings').insert({ key: 'banner_image', value: newPath }).select('key,value,updated_at');
      var u = await q;
      if (u.error) throw u.error;
      if (!u.data.length) throw new Error('Otra persona modificó el banner. Recarga la página y vuelve a intentarlo.');
      cur.banner_image = u.data[0]; imgPath = newPath; paint();
      if (old && old !== newPath) await sb.storage.from('media').remove([old]); // no deja archivos huérfanos
    }
    file.onchange = async function () {
      var f = file.files[0]; if (!f) return;
      setMsg(out, '', 'Procesando imagen…');
      try {
        var blob = await resizeImage(f, 1920), name = crypto.randomUUID() + '.jpg';
        var up = await sb.storage.from('media').upload(name, blob, { contentType: 'image/jpeg', upsert: false });
        if (up.error) throw up.error;
        try { await setImage(name); } catch (e) { await sb.storage.from('media').remove([name]); throw e; }
        setMsg(out, 'ok', 'Imagen actualizada. Ya se ve en la intranet.');
      } catch (e) { setMsg(out, 'err', friendly(e)); }
      file.value = '';
    };
    rm.onclick = async function () {
      if (!imgPath) return;
      if (!confirm('¿Quitar la imagen del banner? Volverá el fondo de píxeles.')) return;
      try { await setImage(''); setMsg(out, 'ok', 'Imagen quitada.'); } catch (e) { setMsg(out, 'err', friendly(e)); }
    };
    save.onclick = async function () {
      busy(save, true);
      try {
        for (var i = 0; i < BANNER_KEYS.length; i++) {
          var k = BANNER_KEYS[i], v = inputs[k].value.trim(), row = cur[k];
          if (row && row.value === v) continue;
          var q = row
            ? sb.from('site_settings').update({ value: v }).eq('key', k).eq('updated_at', row.updated_at).select('key,value,updated_at')
            : sb.from('site_settings').insert({ key: k, value: v }).select('key,value,updated_at');
          var u = await q;
          if (u.error) throw u.error;
          if (!u.data.length) throw new Error('Otra persona modificó el banner. Recarga la página y vuelve a intentarlo.');
          cur[k] = u.data[0];
        }
        setMsg(out, 'ok', 'Textos guardados.');
      } catch (e) { setMsg(out, 'err', friendly(e)); }
      busy(save, false);
    };
    root.append(
      h('div', { class: 'box' }, h('h2', null, 'Imagen'), prev, h('p', { class: 'eyebrow', style: 'margin-top:10px' }, 'JPG, PNG o WebP · se ajusta a 1920 px de ancho'), h('div', { class: 'actions' }, file, rm)),
      h('div', { class: 'box' }, h('h2', null, 'Textos'), weightField('Línea superior (pequeña)', inputs.banner_eyebrow), weightField('Título', inputs.banner_title), weightField('Texto', inputs.banner_text), h('div', { class: 'actions' }, save)),
      out);
  }

  /* ---------------- Menús ---------------- */
  var ZONES = { top: 'Menú superior (junto al logo)', quick: 'Accesos rápidos (barra bajo el banner)' };
  async function modMenus(root) {
    root.append(h('p', { class: 'eyebrow' }, 'Navegación'), h('h1', null, 'Menús'));
    var holder = h('div'), out = h('div'); root.append(holder, out);
    async function load() {
      var m = await sb.from('menu_items').select('*').order('position'), t = await sb.from('tools').select('id,name').order('name');
      if (m.error || t.error) return setMsg(out, 'err', 'No se pudo cargar: ' + friendly(m.error || t.error));
      draw(m.data, t.data);
    }
    function sibs(all, it) { return all.filter(function (x) { return x.zone === it.zone && (x.parent_id || null) === (it.parent_id || null); }).sort(function (a, b) { return a.position - b.position; }); }
    async function swap(all, it, dir) {
      var s = sibs(all, it), i = s.findIndex(function (x) { return x.id === it.id; }), o = s[i + dir]; if (!o) return;
      // Reasigna posiciones 0..n-1 con el intercambio aplicado, para que nunca haya empates.
      s[i] = o; s[i + dir] = it;
      for (var k = 0; k < s.length; k++) { if (s[k].position !== k) { var r = await sb.from('menu_items').update({ position: k }).eq('id', s[k].id); if (r.error) return setMsg(out, 'err', friendly(r.error)); } }
      load();
    }
    function draw(all, tools) {
      holder.textContent = '';
      Object.keys(ZONES).forEach(function (zone) {
        var box = h('div', { class: 'box' }, h('h2', null, ZONES[zone]));
        var roots = all.filter(function (x) { return x.zone === zone && !x.parent_id; }).sort(function (a, b) { return a.position - b.position; });
        function row(it, child) {
          var s = sibs(all, it), i = s.findIndex(function (x) { return x.id === it.id; });
          var up = h('button', { class: 'ib', type: 'button', 'aria-label': 'Subir', disabled: i === 0 }, PX.svgIcon('up', 14)), dn = h('button', { class: 'ib', type: 'button', 'aria-label': 'Bajar', disabled: i === s.length - 1 }, PX.svgIcon('down', 14));
          up.onclick = function () { swap(all, it, -1); }; dn.onclick = function () { swap(all, it, 1); };
          var ed = h('button', { class: 'ib', type: 'button', 'aria-label': 'Editar' }, PX.svgIcon('edit', 14)); ed.onclick = function () { form(all, tools, it, zone, null); };
          var vis = h('button', { class: 'b', type: 'button' }, it.visible ? 'Visible' : 'Oculto');
          vis.onclick = async function () { var r = await sb.from('menu_items').update({ visible: !it.visible }).eq('id', it.id).eq('updated_at', it.updated_at).select('id'); if (r.error) return setMsg(out, 'err', friendly(r.error)); if (!r.data.length) setMsg(out, 'err', 'Cambió mientras lo editabas. Se recargó la lista.'); load(); };
          var del = h('button', { class: 'ib', type: 'button', 'aria-label': 'Eliminar' }, PX.svgIcon('trash', 14));
          del.onclick = async function () {
            var kids = all.filter(function (x) { return x.parent_id === it.id; }).length;
            if (!confirm('¿Eliminar "' + it.label + '"' + (kids ? ' y sus ' + kids + ' submenús' : '') + '?')) return;
            var r = await sb.from('menu_items').delete().eq('id', it.id); if (r.error) return setMsg(out, 'err', friendly(r.error)); load();
          };
          var detail = it.kind === 'tool' ? 'Herramienta: ' + ((tools.filter(function (t) { return t.id === it.tool_id; })[0] || {}).name || '—') : (it.target || '');
          var parts = [h('div', { class: 'grow' }, h('div', null, it.label), h('div', { class: 'sub' }, detail)), h('span', { class: 'tag' }, it.kind), up, dn, ed, vis, del];
          var r = h('div', { class: 'row' + (child ? ' child' : '') }); parts.forEach(function (p) { r.append(p); }); return r;
        }
        if (!roots.length) box.append(h('p', { class: 'eyebrow' }, 'Sin elementos'));
        roots.forEach(function (it) {
          box.append(row(it, false));
          all.filter(function (x) { return x.parent_id === it.id; }).sort(function (a, b) { return a.position - b.position; }).forEach(function (k) { box.append(row(k, true)); });
        });
        var add = h('button', { class: 'b', type: 'button' }, '+ Agregar elemento'); add.onclick = function () { form(all, tools, null, zone, box); };
        box.append(h('div', { class: 'actions' }, add));
        holder.append(box);
      });
    }
    function form(all, tools, it, zone, box) {
      var isNew = !it, d = it || { zone: zone, kind: 'url', label: '', target: '', icon: '', visible: true, parent_id: null };
      var label = h('input', { type: 'text', maxlength: 60, value: d.label });
      var kind = h('select', null, h('option', { value: 'url' }, 'Enlace externo'), h('option', { value: 'anchor' }, 'Sección de esta página'), h('option', { value: 'tool' }, 'Herramienta'));
      kind.value = d.kind;
      var url = h('input', { type: 'url', placeholder: 'https://… o mailto:…', value: d.kind === 'url' ? (d.target || '') : '' });
      var anchor = h('select', null, h('option', { value: '#noticias' }, 'Noticias'), h('option', { value: '#calendario' }, 'Calendario'), h('option', { value: '#herramientas' }, 'Herramientas')); if (d.kind === 'anchor') anchor.value = d.target;
      var tool = h('select'); tools.forEach(function (t) { tool.append(h('option', { value: t.id }, t.name)); }); if (d.tool_id) tool.value = d.tool_id;
      var icon = h('select', null, h('option', { value: '' }, 'Sin ícono')); PX.ICON_KEYS.forEach(function (k) { icon.append(h('option', { value: k }, PX.ICON_LABELS[k] || k)); }); icon.value = d.icon || '';
      var parent = h('select', null, h('option', { value: '' }, 'Ninguno (nivel principal)'));
      if (d.zone === 'top') all.filter(function (x) { return x.zone === 'top' && !x.parent_id && x.id !== d.id; }).forEach(function (x) { parent.append(h('option', { value: x.id }, x.label)); });
      parent.value = d.parent_id || '';
      var hasKids = !isNew && all.some(function (x) { return x.parent_id === d.id; });
      var out2 = h('div'), fUrl = field('Dirección', url), fAnchor = field('Sección', anchor), fTool = field('Herramienta', tool);
      function sync() { fUrl.style.display = kind.value === 'url' ? '' : 'none'; fAnchor.style.display = kind.value === 'anchor' ? '' : 'none'; fTool.style.display = kind.value === 'tool' ? '' : 'none'; }
      kind.onchange = sync; sync();
      var save = h('button', { class: 'b pri', type: 'button' }, 'Guardar'), cancel = h('button', { class: 'b', type: 'button' }, 'Cancelar'); cancel.onclick = load;
      save.onclick = async function () {
        var rec = { label: label.value.trim(), kind: kind.value, icon: icon.value || null, parent_id: parent.value || null };
        if (!rec.label) return setMsg(out2, 'err', 'Escribe el nombre.');
        if (rec.kind === 'url') { var u = PX.safeUrl(url.value.trim()); if (!u) return setMsg(out2, 'err', 'La dirección debe empezar por https:// o mailto:'); rec.target = url.value.trim(); rec.tool_id = null; }
        else if (rec.kind === 'anchor') { rec.target = anchor.value; rec.tool_id = null; }
        else { if (!tool.value) return setMsg(out2, 'err', 'Elige una herramienta.'); rec.tool_id = tool.value; rec.target = null; }
        if (hasKids && rec.parent_id) return setMsg(out2, 'err', 'Este elemento tiene submenús: no puede ser a su vez un submenú.');
        busy(save, true); var r;
        if (isNew) {
          rec.zone = d.zone; rec.position = all.filter(function (x) { return x.zone === d.zone && (x.parent_id || null) === rec.parent_id; }).length;
          r = await sb.from('menu_items').insert(rec).select('id');
        } else {
          if ((d.parent_id || null) !== rec.parent_id) rec.position = all.filter(function (x) { return x.zone === d.zone && (x.parent_id || null) === rec.parent_id; }).length;
          r = await sb.from('menu_items').update(rec).eq('id', d.id).eq('updated_at', d.updated_at).select('id');
          if (!r.error && !r.data.length) { busy(save, false); setMsg(out2, 'err', 'Otra persona modificó este elemento. Se recargará la lista.'); return setTimeout(load, 1200); }
        }
        busy(save, false);
        if (r.error) return setMsg(out2, 'err', friendly(r.error));
        load();
      };
      var wrap = h('div', { class: 'box' }, h('h2', null, isNew ? 'Nuevo elemento — ' + ZONES[d.zone] : 'Editar elemento'), field('Nombre', label), h('div', { class: 'grid2' }, field('Tipo', kind), field('Ícono', icon)), fUrl, fAnchor, fTool);
      if (d.zone === 'top') wrap.append(field('Dentro de (submenú de)', parent));
      wrap.append(h('div', { class: 'actions' }, save, cancel), out2);
      holder.textContent = ''; holder.append(wrap);
    }
    load();
  }


  /* ---------------- Noticias ---------------- */
  async function modNews(root) {
    root.append(h('p', { class: 'eyebrow' }, 'Compañía'), h('h1', null, 'Noticias'));
    var featBox = h('div', { class: 'box' }), listBox = h('div', { class: 'box' }), formBox = h('div'), out = h('div');
    root.append(featBox, formBox, listBox, out);
    var all = [];
    var fmt = function (d) { return new Date(d + 'T00:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }); };
    async function load() {
      var r = await sb.from('news').select('*').order('published_on', { ascending: false }).order('updated_at', { ascending: false });
      if (r.error) return setMsg(out, 'err', 'No se pudo cargar: ' + friendly(r.error));
      all = r.data; drawFeatured(); drawList();
    }
    function drawFeatured() {
      featBox.textContent = ''; featBox.append(h('h2', null, 'Destacadas en la intranet'), h('p', { class: 'eyebrow' }, 'La intranet muestra solo estas 2 noticias. Deben estar publicadas.'));
      [1, 2].forEach(function (slot) {
        var cur = all.filter(function (n) { return n.featured_order === slot; })[0];
        var sel = h('select', null, h('option', { value: '' }, '— Sin noticia —'));
        all.filter(function (n) { return n.status === 'published'; }).forEach(function (n) { sel.append(h('option', { value: n.id }, PX.stripRich(n.title))); });
        sel.value = cur ? cur.id : '';
        sel.onchange = async function () {
          var r;
          if (sel.value) r = await sb.rpc('set_featured', { p_id: sel.value, p_slot: slot });
          else if (cur) r = await sb.rpc('unset_featured', { p_id: cur.id });
          if (r && r.error) setMsg(out, 'err', friendly(r.error)); else setMsg(out, 'ok', 'Destacadas actualizadas.');
          // Si la misma noticia estaba en el otro cupo, el servidor la reubica: recargar muestra el estado real.
          load();
        };
        featBox.append(field('Cupo ' + slot, sel));
      });
    }
    function drawList() {
      listBox.textContent = ''; listBox.append(h('h2', null, 'Todas las noticias'));
      var add = h('button', { class: 'b', type: 'button' }, '+ Nueva noticia'); add.onclick = function () { form(null); };
      if (!all.length) listBox.append(h('p', { class: 'eyebrow' }, 'Aún no hay noticias'));
      all.forEach(function (n) {
        var ed = h('button', { class: 'ib', type: 'button', 'aria-label': 'Editar' }, PX.svgIcon('edit', 14)); ed.onclick = function () { form(n); };
        var del = h('button', { class: 'ib', type: 'button', 'aria-label': 'Eliminar' }, PX.svgIcon('trash', 14));
        del.onclick = async function () {
          if (!confirm('¿Eliminar "' + PX.stripRich(n.title) + '"? No se puede deshacer.')) return;
          var r = await sb.from('news').delete().eq('id', n.id); if (r.error) return setMsg(out, 'err', friendly(r.error));
          if (n.image_path) await sb.storage.from('media').remove([n.image_path]);
          load();
        };
        var row = h('div', { class: 'row' }, h('div', { class: 'grow' }, h('div', null, PX.stripRich(n.title)), h('div', { class: 'sub' }, n.category + ' · ' + fmt(n.published_on))));
        if (n.featured_order) row.append(h('span', { class: 'tag' }, 'Destacada ' + n.featured_order));
        row.append(h('span', { class: 'tag' }, n.status === 'published' ? 'Publicada' : 'Borrador'), ed, del);
        listBox.append(row);
      });
      listBox.append(h('div', { class: 'actions' }, add));
    }
    function form(n) {
      var isNew = !n, d = n || { title: '', body: '', category: 'General', image_path: null, status: 'draft', published_on: new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }) };
      var title = h('input', { type: 'text', maxlength: 140, value: d.title });
      var body = h('textarea', { maxlength: 1200 }); body.value = d.body;
      var cat = h('input', { type: 'text', maxlength: 40, list: 'cats', value: d.category });
      var dl = h('datalist', { id: 'cats' }); ['Anuncios', 'Novedades', 'Eventos', 'General'].forEach(function (c) { dl.append(h('option', { value: c })); });
      var date = h('input', { type: 'date', value: d.published_on });
      var st = h('select', null, h('option', { value: 'draft' }, 'Borrador (no visible)'), h('option', { value: 'published' }, 'Publicada')); st.value = d.status;
      var imgPath = d.image_path || '', uploaded = [];
      var prev = h('div', { class: 'preview', style: 'aspect-ratio:16/9;background-size:contain;background-repeat:no-repeat' });
      function paint() { var u = PX.mediaUrl(CFG, imgPath); prev.textContent = ''; prev.style.backgroundImage = u ? 'url("' + u + '")' : ''; if (!u) prev.textContent = 'Sin imagen'; }
      paint();
      var file = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp' }), rm = h('button', { class: 'b dng', type: 'button' }, 'Quitar imagen');
      var out2 = h('div');
      file.onchange = async function () {
        var f = file.files[0]; if (!f) return; setMsg(out2, '', 'Procesando imagen…');
        try {
          var blob = await resizeImage(f, 1280), name = crypto.randomUUID() + '.jpg';
          var up = await sb.storage.from('media').upload(name, blob, { contentType: 'image/jpeg', upsert: false });
          if (up.error) throw up.error;
          uploaded.push(name); imgPath = name; paint(); setMsg(out2, 'ok', 'Imagen lista. Guarda la noticia para aplicarla.');
        } catch (e) { setMsg(out2, 'err', friendly(e)); }
        file.value = '';
      };
      rm.onclick = function () { imgPath = ''; paint(); };
      var save = h('button', { class: 'b pri', type: 'button' }, 'Guardar'), cancel = h('button', { class: 'b', type: 'button' }, 'Cancelar');
      async function cleanup(keep) { var junk = uploaded.filter(function (x) { return x !== keep; }); if (junk.length) await sb.storage.from('media').remove(junk); }
      cancel.onclick = async function () { await cleanup(null); formBox.textContent = ''; };
      save.onclick = async function () {
        var rec = { title: title.value.trim(), body: body.value.trim(), category: cat.value.trim() || 'General', published_on: date.value, status: st.value, image_path: imgPath || null };
        if (!PX.stripRich(rec.title)) return setMsg(out2, 'err', 'Escribe el título.');
        if (!rec.published_on) return setMsg(out2, 'err', 'Elige la fecha.');
        busy(save, true); var r;
        if (isNew) r = await sb.from('news').insert(rec).select('id');
        else {
          r = await sb.from('news').update(rec).eq('id', d.id).eq('updated_at', d.updated_at).select('id');
          if (!r.error && !r.data.length) { busy(save, false); return setMsg(out2, 'err', 'Otra persona modificó esta noticia. Cierra y vuelve a abrirla.'); }
        }
        busy(save, false);
        if (r.error) return setMsg(out2, 'err', friendly(r.error));
        await cleanup(rec.image_path);
        if (d.image_path && d.image_path !== rec.image_path) await sb.storage.from('media').remove([d.image_path]);
        formBox.textContent = ''; setMsg(out, 'ok', 'Noticia guardada.'); load();
      };
      formBox.textContent = '';
      formBox.append(h('div', { class: 'box' }, h('h2', null, isNew ? 'Nueva noticia' : 'Editar noticia'),
        weightField('Título', title), weightField('Texto', body),
        h('div', { class: 'grid2' }, field('Categoría', cat), field('Fecha', date)), dl, field('Estado', st),
        h('label', null, 'Imagen'), prev, h('div', { class: 'actions' }, file, rm),
        h('div', { class: 'actions' }, save, cancel), out2));
      formBox.firstChild.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    load();
  }


  /* ---------------- Calendario ---------------- */
  var MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  var TIPOS = { cumple: 'Cumpleaños', reunion: 'Reunión', capacitacion: 'Capacitación', otro: 'Otro' };
  var TIPO_ICON = { cumple: 'cake', reunion: 'meeting', capacitacion: 'training', otro: 'star' };
  async function modCalendar(root) {
    root.append(h('p', { class: 'eyebrow' }, 'Agenda'), h('h1', null, 'Calendario'));
    var formBox = h('div'), evBox = h('div', { class: 'box' }), bdBox = h('div', { class: 'box' }), out = h('div'), all = [], q = '';
    root.append(formBox, evBox, bdBox, out);
    async function load() {
      var r = await sb.from('events').select('*');
      if (r.error) return setMsg(out, 'err', 'No se pudo cargar: ' + friendly(r.error));
      all = r.data; draw();
    }
    function actions(e) {
      var vis = h('button', { class: 'b', type: 'button' }, e.visible ? 'Visible' : 'Oculto');
      vis.onclick = async function () { var r = await sb.from('events').update({ visible: !e.visible }).eq('id', e.id).eq('updated_at', e.updated_at).select('id'); if (r.error) setMsg(out, 'err', friendly(r.error)); else if (!r.data.length) setMsg(out, 'err', 'Cambió mientras lo editabas. Se recargó la lista.'); load(); };
      var ed = h('button', { class: 'ib', type: 'button', 'aria-label': 'Editar' }, PX.svgIcon('edit', 14)); ed.onclick = function () { form(e); };
      var del = h('button', { class: 'ib', type: 'button', 'aria-label': 'Eliminar' }, PX.svgIcon('trash', 14));
      del.onclick = async function () { if (!confirm('¿Eliminar "' + (e.type === 'cumple' ? e.person_name : e.title) + '"?')) return; var r = await sb.from('events').delete().eq('id', e.id); if (r.error) return setMsg(out, 'err', friendly(r.error)); load(); };
      return [vis, ed, del];
    }
    function draw() {
      var evs = all.filter(function (e) { return e.type !== 'cumple'; }).sort(function (a, b) { return b.event_date < a.event_date ? -1 : 1; });
      var bds = all.filter(function (e) { return e.type === 'cumple' && (!q || e.person_name.toLowerCase().indexOf(q) > -1); })
        .sort(function (a, b) { return (a.event_month - b.event_month) || (a.event_day - b.event_day); });
      evBox.textContent = ''; evBox.append(h('h2', null, 'Eventos (' + evs.length + ')'));
      if (!evs.length) evBox.append(h('p', { class: 'eyebrow' }, 'Sin eventos'));
      evs.forEach(function (e) {
        var row = h('div', { class: 'row' }, PX.svgIcon(TIPO_ICON[e.type], 16), h('div', { class: 'grow' }, h('div', null, e.title), h('div', { class: 'sub' }, new Date(e.event_date + 'T00:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) + (e.event_time ? ' · ' + e.event_time.slice(0, 5) : ''))), h('span', { class: 'tag' }, TIPOS[e.type]));
        actions(e).forEach(function (x) { row.append(x); }); evBox.append(row);
      });
      var add = h('button', { class: 'b', type: 'button' }, '+ Nuevo evento'); add.onclick = function () { form(null, 'reunion'); };
      evBox.append(h('div', { class: 'actions' }, add));
      bdBox.textContent = ''; bdBox.append(h('h2', null, 'Cumpleaños (' + all.filter(function (e) { return e.type === 'cumple'; }).length + ')'),
        h('p', { class: 'eyebrow' }, 'Se muestran cada año con la torta; solo se guarda día y mes. "Oculto" = la persona pidió no aparecer.'));
      var s = h('input', { type: 'text', placeholder: 'Buscar por nombre…', value: q }); s.oninput = function () { q = s.value.trim().toLowerCase(); draw(); s2(); };
      function s2() { var n = bdBox.querySelector('input'); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }
      bdBox.append(s);
      bds.forEach(function (e) {
        var row = h('div', { class: 'row' }, PX.svgIcon('cake', 16), h('div', { class: 'grow' }, h('div', null, e.person_name), h('div', { class: 'sub' }, e.event_day + ' de ' + MESES[e.event_month - 1])));
        actions(e).forEach(function (x) { row.append(x); }); bdBox.append(row);
      });
      var addb = h('button', { class: 'b', type: 'button' }, '+ Nuevo cumpleaños'); addb.onclick = function () { form(null, 'cumple'); };
      bdBox.append(h('div', { class: 'actions' }, addb));
    }
    function form(e, startType) {
      var isNew = !e, d = e || { type: startType, title: '', person_name: '', event_month: 1, event_day: 1, event_date: new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }), event_time: null, description: '', visible: true };
      var type = h('select'); Object.keys(TIPOS).forEach(function (k) { type.append(h('option', { value: k }, TIPOS[k])); }); type.value = d.type;
      var name = h('input', { type: 'text', maxlength: 100, value: d.person_name || '' });
      var month = h('select'); MESES.forEach(function (m, i) { month.append(h('option', { value: i + 1 }, m)); }); month.value = d.event_month || 1;
      var day = h('input', { type: 'number', min: 1, max: 31, value: d.event_day || 1 });
      var title = h('input', { type: 'text', maxlength: 120, value: d.type === 'cumple' ? '' : d.title });
      var date = h('input', { type: 'date', value: d.event_date || '' });
      var time = h('input', { type: 'time', value: d.event_time ? d.event_time.slice(0, 5) : '' });
      var desc = h('textarea', { maxlength: 500 }); desc.value = d.description || '';
      var vis = h('select', null, h('option', { value: '1' }, 'Visible en la intranet'), h('option', { value: '0' }, 'Oculto')); vis.value = d.visible ? '1' : '0';
      var fb = h('div', null, field('Persona', name), h('div', { class: 'grid2' }, field('Mes', month), field('Día', day))), fe = h('div', null, field('Título', title), h('div', { class: 'grid2' }, field('Fecha', date), field('Hora (opcional)', time)));
      function sync() { var c = type.value === 'cumple'; fb.style.display = c ? '' : 'none'; fe.style.display = c ? 'none' : ''; }
      type.onchange = sync; sync();
      var out2 = h('div'), save = h('button', { class: 'b pri', type: 'button' }, 'Guardar'), cancel = h('button', { class: 'b', type: 'button' }, 'Cancelar'); cancel.onclick = function () { formBox.textContent = ''; };
      save.onclick = async function () {
        var rec = { type: type.value, description: desc.value.trim(), visible: vis.value === '1' };
        if (rec.type === 'cumple') {
          var n = name.value.trim(), dd = parseInt(day.value, 10), mm = parseInt(month.value, 10);
          if (!n) return setMsg(out2, 'err', 'Escribe el nombre de la persona.');
          var max = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mm - 1];
          if (!(dd >= 1 && dd <= max)) return setMsg(out2, 'err', MESES[mm - 1] + ' tiene máximo ' + max + ' días.');
          Object.assign(rec, { person_name: n, event_month: mm, event_day: dd, title: ('Cumpleaños de ' + n).slice(0, 120), event_date: null, event_time: null });
        } else {
          if (!title.value.trim()) return setMsg(out2, 'err', 'Escribe el título.');
          if (!date.value) return setMsg(out2, 'err', 'Elige la fecha.');
          Object.assign(rec, { title: title.value.trim(), event_date: date.value, event_time: time.value || null, person_name: null, event_month: null, event_day: null });
        }
        busy(save, true); var r;
        if (isNew) r = await sb.from('events').insert(rec).select('id');
        else { r = await sb.from('events').update(rec).eq('id', d.id).eq('updated_at', d.updated_at).select('id'); if (!r.error && !r.data.length) { busy(save, false); return setMsg(out2, 'err', 'Otra persona modificó este evento. Cierra y vuelve a abrirlo.'); } }
        busy(save, false);
        if (r.error) return setMsg(out2, 'err', friendly(r.error));
        formBox.textContent = ''; setMsg(out, 'ok', 'Guardado.'); load();
      };
      formBox.textContent = '';
      formBox.append(h('div', { class: 'box' }, h('h2', null, isNew ? 'Nuevo' : 'Editar'), field('Tipo', type), fb, fe, field('Descripción (opcional)', desc), field('Estado', vis), h('div', { class: 'actions' }, save, cancel), out2));
      formBox.firstChild.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    load();
  }


  /* ---------------- Herramientas ---------------- */
  async function modTools(root) {
    root.append(h('p', { class: 'eyebrow' }, 'Accesos'), h('h1', null, 'Herramientas'));
    var formBox = h('div'), catBox = h('div', { class: 'box' }), toolBox = h('div'), out = h('div'), cats = [], tools = [], menus = [];
    root.append(formBox, catBox, toolBox, out);
    async function load() {
      var a = await sb.from('tool_categories').select('*').order('position'), b = await sb.from('tools').select('*').order('position'), c = await sb.from('menu_items').select('id,tool_id');
      if (a.error || b.error || c.error) return setMsg(out, 'err', 'No se pudo cargar: ' + friendly(a.error || b.error || c.error));
      cats = a.data; tools = b.data; menus = c.data; draw();
    }
    async function reorder(table, list, item, dir) {
      var i = list.findIndex(function (x) { return x.id === item.id; }), o = list[i + dir]; if (!o) return;
      list = list.slice(); list[i] = o; list[i + dir] = item;
      for (var k = 0; k < list.length; k++) if (list[k].position !== k) { var r = await sb.from(table).update({ position: k }).eq('id', list[k].id); if (r.error) return setMsg(out, 'err', friendly(r.error)); }
      load();
    }
    function visBtn(table, it) {
      var b = h('button', { class: 'b', type: 'button' }, it.visible ? 'Visible' : 'Oculta' + (table === 'tools' ? '' : ''));
      b.onclick = async function () { var r = await sb.from(table).update({ visible: !it.visible }).eq('id', it.id).eq('updated_at', it.updated_at).select('id'); if (r.error) setMsg(out, 'err', friendly(r.error)); else if (!r.data.length) setMsg(out, 'err', 'Cambió mientras lo editabas. Se recargó la lista.'); load(); };
      return b;
    }
    function ib(label, icon, fn, dis) { var b = h('button', { class: 'ib', type: 'button', 'aria-label': label, disabled: dis }, PX.svgIcon(icon, 14)); b.onclick = fn; return b; }
    function draw() {
      catBox.textContent = ''; catBox.append(h('h2', null, 'Categorías (pestañas)'));
      cats.forEach(function (c, i) {
        var n = tools.filter(function (t) { return t.category_id === c.id; }).length;
        var row = h('div', { class: 'row' }, h('div', { class: 'grow' }, h('div', null, c.label), h('div', { class: 'sub' }, n + ' herramientas')),
          ib('Subir', 'up', function () { reorder('tool_categories', cats, c, -1); }, i === 0), ib('Bajar', 'down', function () { reorder('tool_categories', cats, c, 1); }, i === cats.length - 1),
          ib('Renombrar', 'edit', function () { catForm(c); }), visBtn('tool_categories', c),
          ib('Eliminar', 'trash', async function () {
            if (n) return setMsg(out, 'err', 'La categoría "' + c.label + '" tiene ' + n + ' herramientas. Muévelas o elimínalas primero.');
            if (!confirm('¿Eliminar la categoría "' + c.label + '"?')) return;
            var r = await sb.from('tool_categories').delete().eq('id', c.id); if (r.error) return setMsg(out, 'err', friendly(r.error)); load();
          }));
        catBox.append(row);
      });
      var add = h('button', { class: 'b', type: 'button' }, '+ Nueva categoría'); add.onclick = function () { catForm(null); };
      catBox.append(h('div', { class: 'actions' }, add));

      toolBox.textContent = '';
      cats.forEach(function (c) {
        var box = h('div', { class: 'box' }, h('h2', null, c.label)), list = tools.filter(function (t) { return t.category_id === c.id; }).sort(function (a, b) { return a.position - b.position; });
        if (!list.length) box.append(h('p', { class: 'eyebrow' }, 'Sin herramientas'));
        list.forEach(function (t, i) {
          var uses = menus.filter(function (m) { return m.tool_id === t.id; }).length;
          box.append(h('div', { class: 'row' }, h('span', { class: 'ico', style: 'width:32px;height:32px;display:grid;place-items:center;color:var(--terracota)' }, PX.svgIcon(t.icon, 18)),
            h('div', { class: 'grow' }, h('div', null, t.name), h('div', { class: 'sub' }, t.url)),
            ib('Subir', 'up', function () { reorder('tools', list, t, -1); }, i === 0), ib('Bajar', 'down', function () { reorder('tools', list, t, 1); }, i === list.length - 1),
            ib('Editar', 'edit', function () { toolForm(t); }), visBtn('tools', t),
            ib('Eliminar', 'trash', async function () {
              if (!confirm('¿Eliminar "' + t.name + '"?' + (uses ? ' También desaparecerá de ' + uses + ' acceso(s) rápido(s) o menú(s) que la usan.' : ''))) return;
              var r = await sb.from('tools').delete().eq('id', t.id); if (r.error) return setMsg(out, 'err', friendly(r.error)); load();
            })));
        });
        var addt = h('button', { class: 'b', type: 'button' }, '+ Agregar herramienta'); addt.onclick = function () { toolForm(null, c.id); };
        box.append(h('div', { class: 'actions' }, addt)); toolBox.append(box);
      });
    }
    function catForm(c) {
      var name = h('input', { type: 'text', maxlength: 60, value: c ? c.label : '' }), out2 = h('div');
      var save = h('button', { class: 'b pri', type: 'button' }, 'Guardar'), cancel = h('button', { class: 'b', type: 'button' }, 'Cancelar'); cancel.onclick = function () { formBox.textContent = ''; };
      save.onclick = async function () {
        var v = name.value.trim(); if (!v) return setMsg(out2, 'err', 'Escribe el nombre.');
        var r = c ? await sb.from('tool_categories').update({ label: v }).eq('id', c.id).eq('updated_at', c.updated_at).select('id') : await sb.from('tool_categories').insert({ label: v, position: cats.length }).select('id');
        if (r.error) return setMsg(out2, 'err', friendly(r.error));
        if (c && !r.data.length) return setMsg(out2, 'err', 'Otra persona modificó esta categoría. Cierra y vuelve a abrirla.');
        formBox.textContent = ''; load();
      };
      formBox.textContent = ''; formBox.append(h('div', { class: 'box' }, h('h2', null, c ? 'Renombrar categoría' : 'Nueva categoría'), field('Nombre', name), h('div', { class: 'actions' }, save, cancel), out2));
      formBox.firstChild.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    function toolForm(t, catId) {
      var d = t || { name: '', icon: 'link', url: '', category_id: catId || (cats[0] && cats[0].id) };
      var name = h('input', { type: 'text', maxlength: 80, value: d.name }), url = h('input', { type: 'url', placeholder: 'https://…', value: d.url });
      var icon = h('select'); PX.ICON_KEYS.forEach(function (k) { icon.append(h('option', { value: k }, PX.ICON_LABELS[k] || k)); }); icon.value = d.icon;
      var pv = h('span', { class: 'ico', style: 'width:40px;height:40px;display:grid;place-items:center;color:var(--terracota);border:1px solid var(--border);border-radius:8px' });
      function paint() { pv.textContent = ''; pv.append(PX.svgIcon(icon.value, 22)); } icon.onchange = paint; paint();
      var cat = h('select'); cats.forEach(function (c) { cat.append(h('option', { value: c.id }, c.label)); }); cat.value = d.category_id;
      var out2 = h('div'), save = h('button', { class: 'b pri', type: 'button' }, 'Guardar'), cancel = h('button', { class: 'b', type: 'button' }, 'Cancelar'); cancel.onclick = function () { formBox.textContent = ''; };
      save.onclick = async function () {
        var rec = { name: name.value.trim(), icon: icon.value, url: url.value.trim(), category_id: cat.value };
        if (!rec.name) return setMsg(out2, 'err', 'Escribe el nombre.');
        if (!/^https:\/\/\S+$/.test(rec.url) || !PX.safeUrl(rec.url)) return setMsg(out2, 'err', 'La dirección debe empezar por https://');
        busy(save, true); var r;
        if (!t) { rec.position = tools.filter(function (x) { return x.category_id === rec.category_id; }).length; r = await sb.from('tools').insert(rec).select('id'); }
        else {
          if (t.category_id !== rec.category_id) rec.position = tools.filter(function (x) { return x.category_id === rec.category_id; }).length;
          r = await sb.from('tools').update(rec).eq('id', t.id).eq('updated_at', t.updated_at).select('id');
          if (!r.error && !r.data.length) { busy(save, false); return setMsg(out2, 'err', 'Otra persona modificó esta herramienta. Cierra y vuelve a abrirla.'); }
        }
        busy(save, false); if (r.error) return setMsg(out2, 'err', friendly(r.error));
        formBox.textContent = ''; setMsg(out, 'ok', 'Guardado.'); load();
      };
      formBox.textContent = '';
      formBox.append(h('div', { class: 'box' }, h('h2', null, t ? 'Editar herramienta' : 'Nueva herramienta'), field('Nombre', name), field('Enlace', url),
        h('div', { class: 'grid2' }, field('Categoría', cat), h('div', null, h('label', null, 'Ícono'), h('div', { class: 'actions', style: 'margin-top:0' }, icon, pv))),
        h('div', { class: 'actions' }, save, cancel), out2));
      formBox.firstChild.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    load();
  }

  /* ---------------- Administradores ---------------- */
  async function modAdmins(root, me) {
    root.append(h('p', { class: 'eyebrow' }, 'Acceso'), h('h1', null, 'Administradores'));
    var list = h('div', { class: 'box' }), out = h('div');
    var email = h('input', { type: 'email', placeholder: 'correo@pixelgraphic.co' }), inv = h('button', { class: 'b pri', type: 'button' }, 'Enviar invitación');
    inv.onclick = async function () {
      var v = email.value.trim(); if (!v) return;
      busy(inv, true);
      var r = await sb.functions.invoke('invite_admin', { body: { email: v } });
      busy(inv, false);
      if (r.error) { var m = 'No se pudo enviar la invitación.'; try { var j = await r.error.context.json(); if (j && j.error) m = j.error; } catch (e) {} return setMsg(out, 'err', m); }
      email.value = ''; setMsg(out, 'ok', 'Invitación enviada a ' + v + '. Debe abrir el enlace, crear su contraseña y activar la verificación en dos pasos.'); load();
    };
    root.append(h('div', { class: 'box' }, h('h2', null, 'Invitar a alguien'), field('Correo', email), h('div', { class: 'actions' }, inv)), list, out);
    async function load() {
      var r = await sb.from('admins').select('user_id,email,created_at').order('created_at');
      list.textContent = ''; list.append(h('h2', null, 'Administradores actuales'));
      if (r.error) return list.append(msg('err', friendly(r.error)));
      r.data.forEach(function (a) {
        var row = h('div', { class: 'row' }, h('div', { class: 'grow' }, h('div', null, a.email), h('div', { class: 'sub' }, new Date(a.created_at).toLocaleDateString('es-CO'))));
        if (a.user_id === me.id) row.append(h('span', { class: 'tag' }, 'Tú'));
        else {
          var del = h('button', { class: 'b dng', type: 'button' }, 'Quitar acceso');
          del.onclick = async function () {
            if (!confirm('¿Quitar el acceso de ' + a.email + '? Ya no podrá entrar al backoffice.')) return;
            var d = await sb.rpc('remove_admin', { p_user: a.user_id }); if (d.error) return setMsg(out, 'err', friendly(d.error)); load();
          };
          row.append(del);
        }
        list.append(row);
      });
    }
    load();
  }

  sb.auth.onAuthStateChange(function (ev) { if (ev === 'SIGNED_OUT') { clearTimeout(idleTimer); idleTimer = null; } });
  start();
})();
