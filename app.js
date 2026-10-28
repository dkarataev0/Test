(function () {
  'use strict';

  /* ---------- Справочники ---------- */
  var AUTOLOCK_MIN = 10, CLIP_CLEAR_SEC = 30, SOON_DAYS = 30;
  var CLIENT_STATUS = { active: 'Активный', paused: 'На паузе', archive: 'Архив' };
  var PROJECT_TYPE = { site: 'Сайт', landing: 'Лендинг', shop: 'Магазин', ads: 'Реклама', other: 'Другое' };
  var PROJECT_STATUS = { active: 'Активный', paused: 'На паузе', done: 'Завершён' };
  var LINK_CAT = { design: 'Макеты', docs: 'Документы', analytics: 'Аналитика', ads: 'Реклама', repo: 'Репозиторий', other: 'Другое' };

  var state = { db: null, route: { name: 'home' }, filter: 'active', hl: null, lastActive: Date.now(), shown: {} };
  var $root = document.getElementById('root');
  var $toasts = document.getElementById('toasts');
  var clipTimer = null, clipText = null, lockTimer = null;

  /* ---------- Утилиты ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function uid() { return (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2)); }
  function todayStr() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function daysUntil(s) {
    if (!s) return null;
    var p = s.split('-'); if (p.length !== 3) return null;
    var t = new Date(+p[0], +p[1] - 1, +p[2]), n = new Date(); n.setHours(0, 0, 0, 0);
    return Math.round((t - n) / 864e5);
  }
  function fmtDate(s) { if (!s) return ''; var p = s.split('-'); return p[2] + '.' + p[1] + '.' + p[0]; }
  function plural(n, a, b, c) { var m = Math.abs(n) % 100, k = m % 10; if (m > 10 && m < 20) return c; if (k > 1 && k < 5) return b; if (k === 1) return a; return c; }
  function dueLabel(d) {
    if (d < 0) return 'просрочено ' + (-d) + ' ' + plural(-d, 'день', 'дня', 'дней');
    if (d === 0) return 'сегодня';
    return 'через ' + d + ' ' + plural(d, 'день', 'дня', 'дней');
  }
  function dueChip(s) {
    var d = daysUntil(s);
    if (d == null || d > SOON_DAYS) return '';
    return '<span class="due' + (d < 0 ? ' late' : '') + '">' + esc(dueLabel(d)) + '</span>';
  }
  function safeUrl(u) {
    u = String(u || '').trim(); if (!u) return '';
    if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) u = 'https://' + u;
    try { var x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : ''; } catch (e) { return ''; }
  }
  function hostOf(u) { try { return new URL(safeUrl(u) || u).host.replace(/^www\./, ''); } catch (e) { return String(u || ''); } }
  function normStr(s) { return String(s || '').toLowerCase().replace(/ё/g, 'е'); }

  var ICONS = {
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeoff: '<path d="M3 3l18 18"/><path d="M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4"/><path d="M6.5 6.6C3.6 8.4 2 12 2 12s3.6 7 10 7c1.6 0 3-.4 4.2-1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    ext: '<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>',
    trash: '<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
    theme: '<circle cx="12" cy="12" r="8"/><path d="M12 4v16"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3"/>',
    wand: '<path d="M5 19L17 7"/><path d="M15 5l4 4"/><path d="M5 5v3M3.5 6.5h3M19 15v3M17.5 16.5h3"/>'
  };
  function ic(n) { return '<svg class="i" viewBox="0 0 24 24" aria-hidden="true">' + ICONS[n] + '</svg>'; }
  var LOGO = '<svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="6" fill="currentColor"/><path d="M7 24V10h7l2 3h9v11z" fill="none" stroke="var(--marker)" stroke-width="2" stroke-linejoin="round"/></svg>';

  function toast(text, opts) {
    opts = opts || {};
    var el = document.createElement('div');
    el.className = 'toast' + (opts.error ? ' err' : '');
    el.appendChild(document.createTextNode(text));
    if (opts.action) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = opts.action;
      b.onclick = function () { el.remove(); opts.onAction(); };
      el.appendChild(b);
    }
    $toasts.appendChild(el);
    setTimeout(function () { el.remove(); }, opts.action ? 8000 : (opts.error ? 7000 : 2600));
  }

  /* ---------- Буфер обмена ---------- */
  function writeClip(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    return new Promise(function (res, rej) {
      var t = document.createElement('textarea'); t.value = text; t.setAttribute('readonly', ''); t.className = 'sr';
      document.body.appendChild(t); t.select();
      try { document.execCommand('copy') ? res() : rej(new Error('copy')); } catch (e) { rej(e); } finally { t.remove(); }
    });
  }
  function clearClipboard() {
    if (clipText == null) return;
    var mine = clipText; clipText = null; clearTimeout(clipTimer);
    var wipe = function () { return writeClip(''); };
    try {
      navigator.permissions.query({ name: 'clipboard-read' }).then(function (p) {
        if (p.state === 'granted') navigator.clipboard.readText().then(function (cur) { if (cur === mine) wipe(); });
        else wipe();
      }).catch(function () { wipe().catch(function () {}); });
    } catch (e) { wipe().catch(function () {}); }
  }
  function copy(text, what, secret, btn) {
    writeClip(text).then(function () {
      if (btn) { btn.classList.add('copied'); setTimeout(function () { btn.classList.remove('copied'); }, 700); }
      if (secret) {
        clearTimeout(clipTimer); clipText = text;
        clipTimer = setTimeout(clearClipboard, CLIP_CLEAR_SEC * 1000);
        toast(what + ' скопирован. Буфер очистится через ' + CLIP_CLEAR_SEC + ' с');
      } else toast('Скопировано: ' + what);
    }).catch(function () { toast('Не удалось скопировать. Разрешите доступ к буферу обмена в настройках браузера.', { error: true }); });
  }

  /* ---------- Данные ---------- */
  function clientById(id) { return state.db.clients.find(function (c) { return c.id === id; }); }
  function projectOf(c, pid) { return c && c.projects.find(function (p) { return p.id === pid; }); }
  function commit(msg) {
    return Vault.save(state.db).then(function () { if (msg) toast(msg); }).catch(function (e) {
      toast('Не удалось сохранить: ' + (e && e.message ? e.message : 'ошибка хранилища') + '. Сделайте экспорт базы и обновите страницу.', { error: true });
      throw e;
    });
  }
  function mutate(msg, fn) { fn(); return commit(msg).then(render).catch(render); }
  function removeWithUndo(msg, fn) {
    var snap = JSON.stringify(state.db);
    fn();
    commit().then(function () {
      toast(msg, { action: 'Отменить', onAction: function () { state.db = JSON.parse(snap); commit('Восстановлено').then(render); } });
      render();
    }).catch(render);
  }
  function renewals(limit) {
    var out = [];
    state.db.clients.forEach(function (c) {
      if (c.status === 'archive') return;
      c.projects.forEach(function (p) {
        [['domainRenewal', 'Домен'], ['hostingRenewal', 'Хостинг']].forEach(function (k) {
          var d = daysUntil(p.tech && p.tech[k[0]]);
          if (d != null && d <= limit) out.push({ c: c, p: p, what: k[1], date: p.tech[k[0]], days: d });
        });
      });
    });
    return out.sort(function (a, b) { return a.days - b.days; });
  }
  function clientDue(c) {
    var min = null;
    c.projects.forEach(function (p) { ['domainRenewal', 'hostingRenewal'].forEach(function (k) {
      var d = daysUntil(p.tech && p.tech[k]); if (d != null && (min == null || d < min)) min = d; }); });
    return min != null && min <= SOON_DAYS ? min : null;
  }
  function touchRecent(id) {
    var r = (state.db.recent || []).filter(function (x) { return x !== id; }); r.unshift(id);
    state.db.recent = r.slice(0, 8);
    Vault.save(state.db).catch(function () {});
  }

  /* ---------- Маршрутизация ---------- */
  function parseRoute() {
    var h = location.hash.replace(/^#\/?/, ''), p = h.split('/');
    if (p[0] === 'c' && p[1]) return { name: 'client', cid: p[1], pid: p[2] === 'p' ? p[3] : null };
    if (p[0] === 'renewals') return { name: 'renewals' };
    return { name: 'home' };
  }
  function go(hash) { if (location.hash === hash) render(); else location.hash = hash; }
  window.addEventListener('hashchange', function () { if (state.db) { state.route = parseRoute(); state.shown = {}; render(); } });

  /* ---------- Экран входа ---------- */
  function gate(mode) {
    var setup = mode === 'setup';
    $root.innerHTML =
      '<main class="gate"><form id="gate-form" autocomplete="off" novalidate>' +
      '<h1><span class="logo">' + LOGO + '</span>Картотека клиентов</h1>' +
      (setup
        ? '<p>Придумайте мастер-пароль. Им шифруется вся база. Он нигде не сохраняется.</p>' +
          '<div class="warn">Если забудете мастер-пароль, данные не восстановить. Делайте экспорт базы и храните файл отдельно.</div>'
        : '<p class="muted">База зашифрована. Введите мастер-пароль, чтобы открыть её.</p>') +
      '<div class="fld"><label for="mp">Мастер-пароль</label><input id="mp" type="password" autocomplete="' + (setup ? 'new-password' : 'current-password') + '" autofocus>' +
      (setup ? '<span class="hint">Не короче 10 символов. Лучше фраза из нескольких слов.</span>' : '') + '<span class="err" id="mp-err" role="alert"></span></div>' +
      (setup ? '<div class="fld"><label for="mp2">Повторите мастер-пароль</label><input id="mp2" type="password" autocomplete="new-password"></div>' +
        '<label class="check"><input type="checkbox" id="demo" checked> Добавить демо-клиентов, чтобы посмотреть, как это работает</label>' : '') +
      '<button class="btn primary block" type="submit" id="gate-go">' + (setup ? 'Создать базу' : 'Открыть') + '</button>' +
      (setup ? '' : '<button class="link" type="button" id="reset">Забыли пароль? Сбросить базу</button>') +
      '</form></main>';
    var form = document.getElementById('gate-form'), err = document.getElementById('mp-err'), go1 = document.getElementById('gate-go');
    document.getElementById('mp').focus();
    form.onsubmit = function (e) {
      e.preventDefault();
      var pw = document.getElementById('mp').value; err.textContent = '';
      if (setup) {
        if (pw.length < 10) { err.textContent = 'Пароль короче 10 символов. Добавьте ещё несколько символов или слово.'; return; }
        if (pw !== document.getElementById('mp2').value) { err.textContent = 'Пароли не совпадают. Введите повторно.'; return; }
      } else if (!pw) { err.textContent = 'Введите мастер-пароль.'; return; }
      go1.disabled = true; go1.textContent = setup ? 'Создаю…' : 'Проверяю…';
      var p = setup
        ? (function () { var data = document.getElementById('demo').checked ? makeDemo() : { v: 1, clients: [], recent: [] };
            return Vault.create(pw, data).then(function () { return data; }); })()
        : Vault.unlock(pw);
      p.then(function (data) { open(data); }).catch(function (ex) {
        go1.disabled = false; go1.textContent = setup ? 'Создать базу' : 'Открыть';
        err.textContent = setup ? 'Не удалось создать базу: ' + (ex && ex.message) : 'Неверный мастер-пароль. Проверьте раскладку и Caps Lock.';
        document.getElementById('mp').select();
      });
    };
    var reset = document.getElementById('reset');
    if (reset) reset.onclick = function () {
      confirmBox({ title: 'Сбросить базу?', text: 'Все клиенты, ссылки и доступы будут удалены безвозвратно. Это нужно, только если мастер-пароль потерян. Если у вас есть файл экспорта, его можно будет импортировать в новую базу.', ok: 'Удалить всё', danger: true })
        .then(function (yes) { if (yes) Vault.wipe().then(function () { gate('setup'); }); });
    };
  }

  function open(data) {
    state.db = normalize(data); state.route = parseRoute(); state.shown = {}; state.lastActive = Date.now();
    startAutolock(); buildShell(); render();
  }
  function normalize(d) {
    d = d && typeof d === 'object' ? d : {};
    d.clients = Array.isArray(d.clients) ? d.clients : []; d.recent = Array.isArray(d.recent) ? d.recent : [];
    d.clients.forEach(function (c) {
      c.tags = Array.isArray(c.tags) ? c.tags : []; c.projects = Array.isArray(c.projects) ? c.projects : [];
      c.projects.forEach(function (p) {
        p.tech = p.tech || {}; p.links = p.links || []; p.accesses = p.accesses || []; p.log = p.log || [];
      });
    });
    return d;
  }

  /* ---------- Блокировка ---------- */
  function startAutolock() {
    clearInterval(lockTimer);
    lockTimer = setInterval(checkIdle, 5000);
  }
  function checkIdle() { if (state.db && Date.now() - state.lastActive > AUTOLOCK_MIN * 60000) lock(); }
  function lock() {
    clearInterval(lockTimer); clearClipboard();
    Vault.lock(); state.db = null; state.shown = {}; state.hl = null;
    document.querySelectorAll('dialog[open]').forEach(function (d) { d.close(); d.remove(); });
    gate('unlock');
  }
  ['pointerdown', 'keydown', 'touchstart', 'wheel'].forEach(function (ev) {
    document.addEventListener(ev, function () { state.lastActive = Date.now(); }, { passive: true, capture: true });
  });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) checkIdle(); });

  /* ---------- Каркас приложения ---------- */
  function buildShell() {
    $root.innerHTML =
      '<div class="app" id="app">' +
      '<header class="topbar">' +
      '<a class="brand" href="#/">' + LOGO + '<span>Картотека</span></a>' +
      '<button class="searchbtn" id="open-search" type="button" aria-label="Поиск">' + ic('search') + '<span class="grow">Клиент, домен, сервис, тег</span><kbd id="kbd-hint">Ctrl K</kbd></button>' +
      '<div class="tools">' +
      '<button class="iconbtn" id="btn-theme" type="button" aria-label="Сменить тему" title="Сменить тему">' + ic('theme') + '</button>' +
      '<button class="iconbtn" id="btn-menu" type="button" aria-label="Меню" aria-haspopup="true" aria-expanded="false" title="Меню">' + ic('menu') + '</button>' +
      '<button class="iconbtn" id="btn-lock" type="button" aria-label="Заблокировать" title="Заблокировать (L)">' + ic('lock') + '</button>' +
      '<div class="menu" id="menu" hidden></div>' +
      '</div></header>' +
      '<aside class="side" id="side" aria-label="Клиенты"></aside>' +
      '<main class="main" id="main" tabindex="-1"></main></div>';
    if (/Mac|iPhone|iPad/.test(navigator.platform)) document.getElementById('kbd-hint').textContent = '⌘ K';
  }

  function render() {
    if (!state.db) return;
    var app = document.getElementById('app'); if (!app) return;
    app.classList.toggle('show-main', state.route.name !== 'home');
    renderMenu(); renderSide(); renderMain();
    if (state.hl) {
      var el = document.querySelector('[data-id="' + state.hl + '"]');
      if (el) {
        var mn = document.getElementById('main'), er = el.getBoundingClientRect(), mr = mn.getBoundingClientRect();
        mn.scrollTop += er.top - mr.top - (mr.height - er.height) / 2; el.classList.add('hl');
      }
      state.hl = null;
    }
  }

  function renderMenu() {
    var due = renewals(SOON_DAYS).length, hasDemo = state.db.clients.some(function (c) { return c.demo; });
    document.getElementById('menu').innerHTML =
      '<button type="button" data-act="goto" data-to="#/renewals">' + ic('plus').replace(/<path[^>]*>/, '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>') + 'Продления' + (due ? ' · ' + due : '') + '</button>' +
      '<hr>' +
      '<button type="button" data-act="export">' + ic('ext') + 'Экспорт базы (зашифрованный файл)</button>' +
      '<button type="button" data-act="import">' + ic('copy') + 'Импорт из файла</button>' +
      '<button type="button" data-act="change-pw">' + ic('key') + 'Сменить мастер-пароль</button>' +
      (hasDemo ? '<button type="button" data-act="drop-demo">' + ic('trash') + 'Удалить демо-данные</button>' : '') +
      '<hr><button type="button" data-act="help">' + ic('search') + 'Горячие клавиши</button>' +
      '<button type="button" data-act="lock">' + ic('lock') + 'Заблокировать</button>';
  }

  function renderSide() {
    var side = document.getElementById('side'), db = state.db, f = state.filter;
    var counts = { active: 0, paused: 0, archive: 0, all: db.clients.length };
    db.clients.forEach(function (c) { counts[c.status] = (counts[c.status] || 0) + 1; });
    var list = db.clients.filter(function (c) { return f === 'all' || c.status === f; })
      .sort(function (a, b) { return a.name.localeCompare(b.name, 'ru'); });
    var html = '<div class="side-head"><div class="seg" role="group" aria-label="Фильтр по статусу">' +
      [['active', 'Активные'], ['paused', 'Пауза'], ['archive', 'Архив'], ['all', 'Все']].map(function (s) {
        return '<button type="button" data-act="filter" data-v="' + s[0] + '" aria-pressed="' + (f === s[0]) + '">' + s[1] + ' ' + counts[s[0]] + '</button>';
      }).join('') + '</div>' +
      '<div class="side-actions"><button class="btn primary" type="button" data-act="new-client">' + ic('plus') + 'Добавить клиента</button></div></div>';
    html += '<nav class="index" aria-label="Список клиентов">';
    if (!db.clients.length) html += '<div class="empty"><p>Клиентов пока нет. Добавьте первого.</p></div>';
    else if (!list.length) html += '<div class="empty"><p>В этом разделе клиентов нет.</p></div>';
    var cur = '';
    list.forEach(function (c) {
      var L = (c.name.trim()[0] || '#').toUpperCase();
      if (L !== cur) { cur = L; html += '<div class="letter" aria-hidden="true">' + esc(L) + '</div>'; }
      var due = clientDue(c), np = c.projects.length;
      html += '<a class="crow" href="#/c/' + esc(c.id) + '"' + (state.route.cid === c.id ? ' aria-current="page"' : '') + '>' +
        '<span class="dot ' + esc(c.status) + '" title="' + esc(CLIENT_STATUS[c.status]) + '"></span>' +
        '<span class="txt"><span class="nm">' + esc(c.name) + '</span>' +
        '<span class="sub">' + esc([c.company, np ? np + ' ' + plural(np, 'проект', 'проекта', 'проектов') : ''].filter(Boolean).join(' · ')) + '</span></span>' +
        (due != null ? '<span class="due' + (due < 0 ? ' late' : '') + '" title="Ближайшее продление">' + (due < 0 ? '!' : due + ' д') + '</span>' : '<span></span>') + '</a>';
    });
    side.innerHTML = html + '</nav>';
  }

  function renderMain() {
    var main = document.getElementById('main'), r = state.route;
    if (r.name === 'client') {
      var c = clientById(r.cid);
      if (!c) { main.innerHTML = '<div class="dossier"><button class="btn ghost back" data-act="goto" data-to="#/">' + ic('back') + 'Клиенты</button><p class="empty">Клиент не найден. Возможно, он удалён. Выберите другого в списке.</p></div>'; return; }
      main.innerHTML = clientHtml(c);
      if (state.recentFor !== c.id) { state.recentFor = c.id; touchRecent(c.id); }
    } else if (r.name === 'renewals') main.innerHTML = renewalsHtml();
    else main.innerHTML = homeHtml();
  }

  function homeHtml() {
    var rn = renewals(SOON_DAYS);
    return '<div class="dossier home"><h1>Картотека</h1><p class="lead">Откройте клиента в списке слева или нажмите <kbd>' + (/Mac|iPhone|iPad/.test(navigator.platform) ? '⌘ K' : 'Ctrl K') + '</kbd>, чтобы найти клиента, домен или сервис.</p>' +
      (state.db.clients.length ? '' : '<p class="empty">Клиентов пока нет. Добавьте первого.<button class="btn primary" data-act="new-client">' + ic('plus') + 'Добавить клиента</button></p>') +
      '<div class="sec-h"><h3>Продления в ближайшие ' + SOON_DAYS + ' дней</h3><span class="cnt">' + rn.length + '</span></div>' + renewTable(rn) + '</div>';
  }
  function renewalsHtml() {
    var rn = renewals(SOON_DAYS);
    return '<div class="dossier home"><button class="btn ghost back" data-act="goto" data-to="#/">' + ic('back') + 'Клиенты</button><h1>Продления</h1><p class="lead">Домены и хостинги, у которых срок наступает в течение ' + SOON_DAYS + ' дней, и просроченные. Архивные клиенты не учитываются.</p>' + renewTable(rn) + '</div>';
  }
  function renewTable(rn) {
    if (!rn.length) return '<p class="sec-empty">Ближайших продлений нет. Даты продления домена и хостинга задаются в карточке проекта.</p>';
    return '<table class="renew"><tbody>' + rn.map(function (x) {
      return '<tr><td class="mono">' + esc(fmtDate(x.date)) + '</td><td>' + dueChip(x.date) + '</td><td>' + esc(x.what) + '</td>' +
        '<td><a href="#/c/' + esc(x.c.id) + '/p/' + esc(x.p.id) + '">' + esc(x.c.name) + '</a> <span class="muted">· ' + esc(x.p.name) + '</span></td></tr>';
    }).join('') + '</tbody></table>';
  }

  /* образец: значение с копированием */
  function spec(label, value, what, opts) {
    if (!value) return '';
    opts = opts || {};
    return '<span class="spec">' + (label ? '<span class="spec-l">' + esc(label) + '</span>' : '') +
      '<button type="button" class="spec-v" data-act="copy" data-v="' + esc(value) + '" data-what="' + esc(what || label) + '" aria-label="Копировать: ' + esc(what || label) + '">' + esc(opts.show || value) + ic('copy') + '</button></span>';
  }

  function clientHtml(c) {
    var pid = state.route.pid, proj = projectOf(c, pid) || c.projects[0];
    var h = '<div class="dossier"><button class="btn ghost back" data-act="goto" data-to="#/">' + ic('back') + 'Клиенты</button>' +
      '<header class="dh"><div class="dh-row"><div><h1>' + esc(c.name) + '</h1>' + (c.company ? '<div class="company">' + esc(c.company) + '</div>' : '') + '</div>' +
      '<div class="dh-actions"><button class="btn" type="button" data-act="edit-client" data-id="' + esc(c.id) + '">' + ic('edit') + 'Изменить</button>' +
      '<button class="btn" type="button" data-act="new-project">' + ic('plus') + 'Добавить проект</button></div></div>' +
      '<div class="chips"><span class="chip"><span class="dot ' + esc(c.status) + '"></span>' + esc(CLIENT_STATUS[c.status]) + '</span>' +
      c.tags.map(function (t) { return '<span class="chip">' + esc(t) + '</span>'; }).join('') + '</div></header>';
    var ct = spec('Телефон', c.phone, 'телефон') + spec('Telegram', c.telegram, 'Telegram') + spec('Email', c.email, 'email');
    h += ct ? '<div class="contacts">' + ct + '</div>' : '<div class="contacts muted">Контактов нет. Добавьте телефон, Telegram или email в карточке клиента.</div>';
    if (c.notes) h += '<p class="notes">' + esc(c.notes) + '</p>';
    h += '<div class="tabs" role="tablist" aria-label="Проекты клиента">' + c.projects.map(function (p) {
      return '<a class="tab" role="tab" href="#/c/' + esc(c.id) + '/p/' + esc(p.id) + '" aria-selected="' + (p === proj) + '">' + esc(p.name) + '</a>';
    }).join('') + '<button class="tab add" type="button" data-act="new-project">+ Проект</button></div>';
    if (!proj) return h + '<p class="empty flush">У клиента нет проектов. Добавьте первый проект: в нём хранятся ссылки и доступы.</p></div>';
    return h + projectHtml(c, proj) + '</div>';
  }

  function projectHtml(c, p) {
    var t = p.tech, url = safeUrl(p.url);
    var h = '<div class="project" role="tabpanel" data-id="' + esc(p.id) + '"><div class="col">' +
      '<div class="ph"><h2>' + esc(p.name) + '</h2><span class="chip">' + esc(PROJECT_TYPE[p.type] || 'Другое') + '</span><span class="chip">' + esc(PROJECT_STATUS[p.status] || '') + '</span>' +
      '<span class="spacer"></span><button class="btn ghost" type="button" data-act="edit-project" data-id="' + esc(p.id) + '">' + ic('edit') + 'Изменить проект</button></div>' +
      (url ? '<div class="ph tight">' + spec('', p.url, 'адрес сайта') + '<a class="iconbtn" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer" aria-label="Открыть сайт" title="Открыть">' + ic('ext') + '</a></div>' : '') +
      '<section aria-labelledby="h-acc"><div class="sec-h"><h3 id="h-acc">Доступы</h3><span class="cnt">' + p.accesses.length + '</span><button class="btn" type="button" data-act="new-access">' + ic('plus') + 'Добавить доступ</button></div>' +
      (p.accesses.length ? p.accesses.map(accHtml).join('') : '<p class="sec-empty">Доступов пока нет. Добавьте логин и пароль от хостинга, админки или почты.</p>') + '</section>' +
      '<section aria-labelledby="h-lnk"><div class="sec-h"><h3 id="h-lnk">Ссылки</h3><span class="cnt">' + p.links.length + '</span><button class="btn" type="button" data-act="new-link">' + ic('plus') + 'Добавить ссылку</button></div>' +
      linksHtml(p) + '</section></div>' +
      '<div class="col"><section aria-labelledby="h-tech"><div class="sec-h"><h3 id="h-tech">Технический паспорт</h3></div><dl class="dl">' +
      '<dt>Хостинг</dt><dd>' + (esc(t.hosting) || '<span class="muted">не указан</span>') + '</dd>' +
      '<dt>Регистратор</dt><dd>' + (esc(t.registrar) || '<span class="muted">не указан</span>') + '</dd>' +
      '<dt>CMS / стек</dt><dd>' + (esc(t.stack) || '<span class="muted">не указан</span>') + '</dd>' +
      '<dt>Домен до</dt><dd>' + (t.domainRenewal ? '<span class="mono">' + esc(fmtDate(t.domainRenewal)) + '</span>' + dueChip(t.domainRenewal) : '<span class="muted">не указано</span>') + '</dd>' +
      '<dt>Хостинг до</dt><dd>' + (t.hostingRenewal ? '<span class="mono">' + esc(fmtDate(t.hostingRenewal)) + '</span>' + dueChip(t.hostingRenewal) : '<span class="muted">не указано</span>') + '</dd></dl></section>' +
      '<section aria-labelledby="h-log"><div class="sec-h"><h3 id="h-log">Журнал</h3><span class="cnt">' + p.log.length + '</span></div>' +
      '<form class="logform" data-form="log" autocomplete="off"><label class="sr" for="log-text">Новая запись</label><input id="log-text" type="text" placeholder="Что произошло? Например: сменил тариф хостинга" maxlength="500"><button class="btn" type="submit">Добавить</button></form>' +
      (p.log.length ? p.log.slice().sort(function (a, b) { return b.date.localeCompare(a.date); }).map(function (e) {
        return '<div class="logrow"><time datetime="' + esc(e.date) + '">' + esc(fmtDate(e.date)) + '</time><span>' + esc(e.text) + '</span>' +
          '<button class="iconbtn" type="button" data-act="del-log" data-id="' + esc(e.id) + '" aria-label="Удалить запись" title="Удалить">' + ic('trash') + '</button></div>';
      }).join('') : '<p class="sec-empty">Записей пока нет. Опишите первое событие.</p>') + '</section></div></div>';
    return h;
  }

  function accHtml(a) {
    var url = safeUrl(a.url), shown = !!state.shown[a.id];
    return '<div class="acc" data-id="' + esc(a.id) + '">' +
      '<div class="svc"><b>' + esc(a.service) + '</b>' + (url ? '<a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer" title="Открыть страницу входа">' + esc(hostOf(a.url)) + '</a>' : (a.url ? '<span class="mono muted small">' + esc(a.url) + '</span>' : '')) + '</div>' +
      '<div class="cred">' + (a.login ? spec('', a.login, 'логин') : '<span class="muted">без логина</span>') + '</div>' +
      '<div class="cred pwrow">' + (a.password
        ? '<button type="button" class="spec-v pw" data-act="copy-pw" data-id="' + esc(a.id) + '" aria-label="Копировать пароль">' + (shown ? esc(a.password) : '••••••••••') + ic('copy') + '</button>' +
          '<button type="button" class="iconbtn" data-act="toggle-pw" data-id="' + esc(a.id) + '" aria-pressed="' + shown + '" aria-label="' + (shown ? 'Скрыть пароль' : 'Показать пароль') + '" title="' + (shown ? 'Скрыть' : 'Показать') + '">' + ic(shown ? 'eyeoff' : 'eye') + '</button>'
        : '<span class="muted">без пароля</span>') + '</div>' +
      '<div class="actions">' + (url ? '<a class="iconbtn" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer" aria-label="Открыть страницу входа" title="Открыть">' + ic('ext') + '</a>' : '') +
      '<button class="iconbtn" type="button" data-act="edit-access" data-id="' + esc(a.id) + '" aria-label="Изменить доступ" title="Изменить">' + ic('edit') + '</button></div>' +
      ((a.note2fa || a.comment) ? '<div class="meta">' + (a.note2fa ? '2FA: ' + esc(a.note2fa) : '') + (a.note2fa && a.comment ? ' · ' : '') + esc(a.comment) + '</div>' : '') + '</div>';
  }

  function linksHtml(p) {
    if (!p.links.length) return '<p class="sec-empty">Ссылок пока нет. Добавьте Figma, Метрику, репозиторий или папку с документами.</p>';
    return Object.keys(LINK_CAT).map(function (cat) {
      var items = p.links.filter(function (l) { return (l.category || 'other') === cat; });
      if (!items.length) return '';
      return '<div class="cat">' + LINK_CAT[cat] + '</div>' + items.map(function (l) {
        var u = safeUrl(l.url);
        return '<div class="lnk" data-id="' + esc(l.id) + '"><a class="t" ' + (u ? 'href="' + esc(u) + '" target="_blank" rel="noopener noreferrer"' : '') + '>' + esc(l.title) + '<span>' + esc(hostOf(l.url)) + '</span></a>' +
          '<span class="actions"><button class="iconbtn" type="button" data-act="copy" data-v="' + esc(l.url) + '" data-what="ссылка «' + esc(l.title) + '»" aria-label="Копировать ссылку: ' + esc(l.title) + '" title="Копировать ссылку">' + ic('copy') + '</button>' +
          '<button class="iconbtn" type="button" data-act="edit-link" data-id="' + esc(l.id) + '" aria-label="Изменить ссылку: ' + esc(l.title) + '" title="Изменить">' + ic('edit') + '</button></span></div>';
      }).join('');
    }).join('');
  }

  /* ---------- Диалоги ---------- */
  function mkDialog(cls) {
    var d = document.createElement('dialog'); d.className = cls || 'sheet';
    document.body.appendChild(d);
    d.addEventListener('close', function () { d.remove(); });
    return d;
  }
  function confirmBox(o) {
    return new Promise(function (res) {
      var d = mkDialog('sheet confirm'), done = false;
      d.setAttribute('aria-labelledby', 'cf-t');
      d.innerHTML = '<form method="dialog"><header><h2 id="cf-t">' + esc(o.title) + '</h2></header><div class="body"><p>' + esc(o.text) + '</p></div>' +
        '<footer><button class="btn" value="no" type="submit">Отмена</button><button class="btn ' + (o.danger ? 'danger' : 'primary') + '" value="yes" type="submit">' + esc(o.ok) + '</button></footer></form>';
      d.addEventListener('close', function () { if (!done) { done = true; res(d.returnValue === 'yes'); } });
      d.showModal(); d.querySelector('button[value=no]').focus();
    });
  }

  function genPassword() {
    var cs = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789-_!@#$%^&*', out = '', arr = new Uint32Array(20);
    crypto.getRandomValues(arr);
    for (var i = 0; i < arr.length; i++) out += cs[arr[i] % cs.length];
    return out;
  }

  /* fields: [{n,label,type,opts,req,wide,hint,title}] */
  function formDialog(o) {
    var d = mkDialog('sheet'), v = o.values || {};
    d.setAttribute('aria-labelledby', 'fm-t');
    var body = o.fields.map(function (f) {
      if (f.section) return '<div class="sec-title">' + esc(f.section) + '</div>';
      var id = 'f-' + f.n, val = v[f.n] == null ? '' : v[f.n], input;
      if (f.type === 'select') input = '<select id="' + id + '" name="' + f.n + '">' + Object.keys(f.opts).map(function (k) { return '<option value="' + k + '"' + (k === val ? ' selected' : '') + '>' + esc(f.opts[k]) + '</option>'; }).join('') + '</select>';
      else if (f.type === 'textarea') input = '<textarea id="' + id + '" name="' + f.n + '" rows="3">' + esc(val) + '</textarea>';
      else if (f.type === 'password') input = '<div class="row"><input id="' + id + '" name="' + f.n + '" type="password" autocomplete="new-password" spellcheck="false" value="' + esc(val) + '">' +
        '<button type="button" class="iconbtn" data-fa="show" aria-label="Показать пароль" title="Показать">' + ic('eye') + '</button>' +
        '<button type="button" class="iconbtn" data-fa="gen" aria-label="Сгенерировать пароль" title="Сгенерировать пароль">' + ic('wand') + '</button></div>';
      else input = '<input id="' + id + '" name="' + f.n + '" type="' + (f.type || 'text') + '" value="' + esc(val) + '" autocomplete="off"' + (f.type === 'url' ? ' inputmode="url"' : '') + '>';
      return '<div class="fld' + (f.wide ? ' wide' : '') + '"><label for="' + id + '">' + esc(f.label) + (f.req ? ' *' : '') + '</label>' + input +
        (f.hint ? '<span class="hint">' + esc(f.hint) + '</span>' : '') + '<span class="err" role="alert"></span></div>';
    }).join('');
    d.innerHTML = '<form novalidate><header><h2 id="fm-t">' + esc(o.title) + '</h2></header><div class="body">' + body + '</div>' +
      '<footer>' + (o.onDelete ? '<button class="btn danger" type="button" data-fa="del">' + ic('trash') + 'Удалить</button>' : '') + '<span class="sp"></span>' +
      '<button class="btn" type="button" data-fa="cancel">Отмена</button><button class="btn primary" type="submit">Сохранить</button></footer></form>';
    var form = d.querySelector('form');
    d.addEventListener('click', function (e) {
      var b = e.target.closest('[data-fa]'); if (!b) return;
      var a = b.dataset.fa;
      if (a === 'cancel') d.close();
      else if (a === 'show') { var i = b.parentNode.querySelector('input'); var vis = i.type === 'password'; i.type = vis ? 'text' : 'password'; b.innerHTML = ic(vis ? 'eyeoff' : 'eye'); b.setAttribute('aria-label', vis ? 'Скрыть пароль' : 'Показать пароль'); }
      else if (a === 'gen') { var inp = b.parentNode.querySelector('input'); inp.value = genPassword(); inp.type = 'text'; toast('Пароль сгенерирован'); }
      else if (a === 'del') { d.close(); o.onDelete(); }
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var out = {}, ok = true, first = null;
      o.fields.forEach(function (f) {
        if (f.section) return;
        var el = form.elements[f.n], val = el.value.trim();
        if (f.type === 'password') val = el.value; // пароль не обрезаем
        var wrap = el.closest('.fld'), msg = '';
        if (f.req && !val) msg = f.reqMsg || 'Заполните поле «' + f.label + '».';
        else if (f.type === 'url' && val && !safeUrl(val)) msg = 'Адрес не распознан. Введите его как example.ru или https://example.ru.';
        wrap.classList.toggle('bad', !!msg); wrap.querySelector('.err').textContent = msg;
        if (msg) { ok = false; first = first || el; }
        out[f.n] = val;
      });
      if (!ok) { first.focus(); return; }
      d.close(); o.onSave(out);
    });
    d.showModal();
    var f1 = form.querySelector('input:not([type=hidden]), select, textarea'); if (f1) f1.focus();
  }

  /* ---------- Формы сущностей ---------- */
  function clientForm(c) {
    var isNew = !c, cur = c || { status: 'active', tags: [] };
    formDialog({
      title: isNew ? 'Новый клиент' : 'Клиент: ' + c.name,
      values: Object.assign({}, cur, { tags: (cur.tags || []).join(', ') }),
      fields: [
        { n: 'name', label: 'Имя', req: true, reqMsg: 'Укажите имя клиента.' }, { n: 'company', label: 'Компания' },
        { n: 'phone', label: 'Телефон', type: 'tel' }, { n: 'telegram', label: 'Telegram' },
        { n: 'email', label: 'Email', type: 'email' }, { n: 'status', label: 'Статус', type: 'select', opts: CLIENT_STATUS },
        { n: 'tags', label: 'Теги', wide: true, hint: 'Через запятую: например, магазин, реклама' },
        { n: 'notes', label: 'Заметки', type: 'textarea', wide: true }
      ],
      onSave: function (f) {
        var data = { name: f.name, company: f.company, phone: f.phone, telegram: f.telegram, email: f.email, status: f.status, notes: f.notes,
          tags: f.tags.split(',').map(function (t) { return t.trim(); }).filter(Boolean) };
        if (isNew) {
          var nc = Object.assign({ id: uid(), projects: [] }, data); state.db.clients.push(nc);
          commit('Сохранено').then(function () { go('#/c/' + nc.id); }).catch(render);
        } else mutate('Сохранено', function () { Object.assign(c, data); });
      },
      onDelete: isNew ? null : function () {
        confirmBox({ title: 'Удалить клиента «' + c.name + '»?', text: 'Вместе с клиентом удалятся его проекты (' + c.projects.length + '), ссылки и доступы. Действие нельзя отменить.', ok: 'Удалить клиента', danger: true })
          .then(function (yes) { if (!yes) return; state.db.clients = state.db.clients.filter(function (x) { return x !== c; }); commit('Удалено').then(function () { go('#/'); }).catch(render); });
      }
    });
  }

  function projectForm(c, p) {
    var isNew = !p, cur = p || { type: 'site', status: 'active', tech: {} };
    formDialog({
      title: isNew ? 'Новый проект' : 'Проект: ' + p.name,
      values: Object.assign({}, cur, cur.tech),
      fields: [
        { n: 'name', label: 'Название', req: true, reqMsg: 'Укажите название проекта.', wide: true },
        { n: 'url', label: 'Основной адрес', type: 'url', wide: true },
        { n: 'type', label: 'Тип', type: 'select', opts: PROJECT_TYPE }, { n: 'status', label: 'Статус', type: 'select', opts: PROJECT_STATUS },
        { section: 'Технический паспорт' },
        { n: 'hosting', label: 'Хостинг' }, { n: 'registrar', label: 'Регистратор домена' },
        { n: 'stack', label: 'CMS / стек', wide: true },
        { n: 'domainRenewal', label: 'Домен продлить до', type: 'date' }, { n: 'hostingRenewal', label: 'Хостинг продлить до', type: 'date' }
      ],
      onSave: function (f) {
        var tech = { hosting: f.hosting, registrar: f.registrar, stack: f.stack, domainRenewal: f.domainRenewal, hostingRenewal: f.hostingRenewal };
        if (isNew) {
          var np = { id: uid(), name: f.name, url: f.url, type: f.type, status: f.status, tech: tech, links: [], accesses: [], log: [] };
          c.projects.push(np); commit('Сохранено').then(function () { go('#/c/' + c.id + '/p/' + np.id); }).catch(render);
        } else mutate('Сохранено', function () { Object.assign(p, { name: f.name, url: f.url, type: f.type, status: f.status, tech: tech }); });
      },
      onDelete: isNew ? null : function () {
        confirmBox({ title: 'Удалить проект «' + p.name + '»?', text: 'Удалятся его ссылки (' + p.links.length + '), доступы (' + p.accesses.length + ') и журнал. Действие нельзя отменить.', ok: 'Удалить проект', danger: true })
          .then(function (yes) { if (!yes) return; c.projects = c.projects.filter(function (x) { return x !== p; }); commit('Удалено').then(function () { go('#/c/' + c.id); }).catch(render); });
      }
    });
  }

  function linkForm(p, l) {
    var isNew = !l;
    formDialog({
      title: isNew ? 'Новая ссылка' : 'Ссылка: ' + l.title,
      values: l || { category: 'design' },
      fields: [
        { n: 'title', label: 'Название', req: true, reqMsg: 'Укажите название ссылки, например «Макет в Figma».', wide: true },
        { n: 'url', label: 'Адрес', type: 'url', req: true, reqMsg: 'Укажите адрес ссылки.', wide: true },
        { n: 'category', label: 'Категория', type: 'select', opts: LINK_CAT, wide: true }
      ],
      onSave: function (f) {
        mutate('Сохранено', function () {
          if (isNew) p.links.push({ id: uid(), title: f.title, url: f.url, category: f.category });
          else Object.assign(l, { title: f.title, url: f.url, category: f.category });
        });
      },
      onDelete: isNew ? null : function () { removeWithUndo('Ссылка удалена', function () { p.links = p.links.filter(function (x) { return x !== l; }); }); }
    });
  }

  function accessForm(p, a) {
    var isNew = !a;
    formDialog({
      title: isNew ? 'Новый доступ' : 'Доступ: ' + a.service,
      values: a || {},
      fields: [
        { n: 'service', label: 'Сервис', req: true, reqMsg: 'Укажите сервис, например «Хостинг Beget».', wide: true },
        { n: 'url', label: 'Адрес входа', type: 'url', wide: true },
        { n: 'login', label: 'Логин' }, { n: 'password', label: 'Пароль', type: 'password' },
        { n: 'note2fa', label: 'Заметка про 2FA', wide: true, hint: 'Где приходит код. Сам секрет 2FA здесь не храните.' },
        { n: 'comment', label: 'Комментарий', type: 'textarea', wide: true }
      ],
      onSave: function (f) {
        mutate('Сохранено', function () {
          var data = { service: f.service, url: f.url, login: f.login, password: f.password, note2fa: f.note2fa, comment: f.comment };
          if (isNew) p.accesses.push(Object.assign({ id: uid() }, data)); else Object.assign(a, data);
        });
      },
      onDelete: isNew ? null : function () { removeWithUndo('Доступ удалён', function () { p.accesses = p.accesses.filter(function (x) { return x !== a; }); }); }
    });
  }

  /* ---------- Текущий контекст ---------- */
  function ctx() {
    var c = clientById(state.route.cid); if (!c) return {};
    return { c: c, p: projectOf(c, state.route.pid) || c.projects[0] };
  }

  /* ---------- Экспорт / импорт / смена пароля ---------- */
  function exportDb() {
    var blob = new Blob([Vault.exportText()], { type: 'application/json' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'kartoteka-' + todayStr() + '.json';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    toast('Экспортировано. Файл зашифрован мастер-паролем');
  }
  function importDb() {
    var inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
    inp.onchange = function () {
      var file = inp.files[0]; if (!file) return;
      var rd = new FileReader();
      rd.onload = function () {
        var text = String(rd.result);
        if (!Vault.isRecord(text)) { toast('Файл не похож на экспорт Картотеки. Выберите файл kartoteka-….json.', { error: true }); return; }
        passwordDialog('Импорт базы', 'Введите мастер-пароль, которым зашифрован файл. Текущая база будет заменена.', 'Импортировать', function (pw, fail, done) {
          Vault.decryptFile(text, pw).then(function (data) {
            data = normalize(data);
            done();
            confirmBox({ title: 'Заменить текущую базу?', text: 'В файле клиентов: ' + data.clients.length + '. Текущие данные (клиентов: ' + state.db.clients.length + ') будут заменены. Сначала можно сделать экспорт текущей базы.', ok: 'Заменить', danger: true }).then(function (yes) {
              if (!yes) return;
              state.db = data; commit('Импортировано').then(function () { go('#/'); render(); }).catch(render);
            });
          }).catch(function () { fail('Неверный мастер-пароль или файл повреждён. Проверьте пароль от файла.'); });
        });
      };
      rd.readAsText(file);
    };
    inp.click();
  }
  function passwordDialog(title, text, okLabel, onSubmit, confirmField) {
    var d = mkDialog('sheet confirm');
    d.setAttribute('aria-labelledby', 'pd-t');
    d.innerHTML = '<form novalidate><header><h2 id="pd-t">' + esc(title) + '</h2></header><div class="body"><p class="muted lead-s">' + esc(text) + '</p>' +
      '<div class="fld"><label for="pd-1">' + (confirmField ? 'Новый мастер-пароль' : 'Мастер-пароль') + '</label><input id="pd-1" type="password" autocomplete="off"></div>' +
      (confirmField ? '<div class="fld gap"><label for="pd-2">Повторите пароль</label><input id="pd-2" type="password" autocomplete="off"></div>' : '') +
      '<span class="err pd-err" id="pd-err" role="alert"></span></div>' +
      '<footer><button class="btn" type="button" data-x="cancel">Отмена</button><button class="btn primary" type="submit">' + esc(okLabel) + '</button></footer></form>';
    var err = d.querySelector('#pd-err');
    d.querySelector('[data-x=cancel]').onclick = function () { d.close(); };
    d.querySelector('form').onsubmit = function (e) {
      e.preventDefault();
      var pw = d.querySelector('#pd-1').value; err.textContent = '';
      if (!pw) { err.textContent = 'Введите мастер-пароль.'; return; }
      if (confirmField) {
        if (pw.length < 10) { err.textContent = 'Пароль короче 10 символов. Добавьте ещё несколько символов или слово.'; return; }
        if (pw !== d.querySelector('#pd-2').value) { err.textContent = 'Пароли не совпадают. Введите повторно.'; return; }
      }
      var btn = d.querySelector('button[type=submit]'); btn.disabled = true;
      onSubmit(pw, function (m) { err.textContent = m; btn.disabled = false; }, function () { d.close(); });
    };
    d.showModal(); d.querySelector('#pd-1').focus();
  }
  function changePassword() {
    passwordDialog('Сменить мастер-пароль', 'База будет перешифрована новым паролем. Старые файлы экспорта останутся зашифрованными старым паролем.', 'Сменить пароль', function (pw, fail, done) {
      Vault.changePassword(pw, state.db).then(function () { done(); toast('Мастер-пароль изменён'); }).catch(function (e) { fail('Не удалось сменить пароль: ' + (e && e.message)); });
    }, true);
  }

  /* ---------- Поиск ---------- */
  var EN = "qwertyuiop[]asdfghjkl;'zxcvbnm,.`", RU = 'йцукенгшщзхъфывапролджэячсмитьбюё';
  function swapLayout(s) {
    var out = '';
    for (var i = 0; i < s.length; i++) {
      var ch = s[i], lo = ch.toLowerCase(), a = EN.indexOf(lo), b = RU.indexOf(lo);
      out += a >= 0 ? RU[a] : (b >= 0 ? EN[b] : ch);
    }
    return out;
  }
  function searchItems() {
    var items = [];
    state.db.clients.forEach(function (c) {
      items.push({ kind: 'Клиент', label: c.name, path: [c.company, c.status !== 'active' ? CLIENT_STATUS[c.status] : ''].filter(Boolean).join(' · '),
        fields: [[c.name, 5], [c.company, 3], [c.tags.join(' '), 3], [c.telegram, 2], [c.email, 2], [c.phone, 2], [c.notes, 1]], hash: '#/c/' + c.id, weight: c.status === 'archive' ? -2 : 0 });
      c.projects.forEach(function (p) {
        var where = c.name + ' · ' + p.name, base = '#/c/' + c.id + '/p/' + p.id;
        items.push({ kind: 'Проект', label: p.name, path: c.name + (p.url ? ' · ' + hostOf(p.url) : ''), copy: safeUrl(p.url), copyWhat: 'адрес сайта',
          fields: [[p.name, 4], [hostOf(p.url), 4], [p.tech.hosting, 2], [p.tech.registrar, 2], [p.tech.stack, 2], [c.name, 1]], hash: base, weight: 0 });
        p.links.forEach(function (l) {
          items.push({ kind: 'Ссылка', label: l.title, path: where + ' · ' + hostOf(l.url), copy: safeUrl(l.url), copyWhat: 'ссылка', hl: l.id,
            fields: [[l.title, 4], [hostOf(l.url), 3], [l.url, 1], [LINK_CAT[l.category], 2], [c.name, 1], [p.name, 1]], hash: base, weight: 0 });
        });
        p.accesses.forEach(function (a) {
          items.push({ kind: 'Доступ', label: a.service, path: where + (a.login ? ' · ' + a.login : ''), secret: a.password, hl: a.id,
            fields: [[a.service, 4], [hostOf(a.url), 3], [a.login, 1], [c.name, 1], [p.name, 1]], hash: base, weight: 0 });
        });
      });
    });
    return items;
  }
  function score(item, tokens) {
    var total = item.weight || 0;
    for (var t = 0; t < tokens.length; t++) {
      var best = -1;
      for (var i = 0; i < item.fields.length; i++) {
        var s = normStr(item.fields[i][0]), pos = s.indexOf(tokens[t]);
        if (pos < 0) continue;
        var w = item.fields[i][1] * 10 - Math.min(pos, 20) + (pos === 0 || /[\s.\-_@/]/.test(s[pos - 1]) ? 15 : 0);
        if (w > best) best = w;
      }
      if (best < 0) return null;
      total += best;
    }
    return total;
  }
  function runSearch(q) {
    var items = searchItems(), tokens = normStr(q).split(/\s+/).filter(Boolean);
    function doit(tk) {
      return items.map(function (it) { var s = score(it, tk); return s == null ? null : { it: it, s: s }; })
        .filter(Boolean).sort(function (a, b) { return b.s - a.s; }).slice(0, 40).map(function (x) { return x.it; });
    }
    var res = doit(tokens), used = tokens;
    if (!res.length) { var alt = normStr(swapLayout(q)).split(/\s+/).filter(Boolean); res = doit(alt); used = alt; }
    return { res: res, tokens: used };
  }
  function highlight(text, tokens) {
    var out = esc(text);
    tokens.forEach(function (t) {
      if (!t) return;
      var re = new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
      out = out.replace(/(<[^>]+>)|([^<]+)/g, function (m, tag, txt) { return tag ? tag : txt.replace(re, '<mark>$1</mark>'); });
    });
    return out;
  }

  function openPalette() {
    if (document.querySelector('dialog.palette[open]')) return;
    var d = document.createElement('dialog'); d.className = 'palette'; d.setAttribute('aria-label', 'Поиск');
    d.innerHTML = '<div class="q">' + ic('search') + '<label class="sr" for="pq">Поиск</label><input id="pq" type="text" enterkeyhint="search" placeholder="Клиент, домен, сервис, тег" autocomplete="off" spellcheck="false" role="combobox" aria-expanded="true" aria-controls="pl" aria-autocomplete="list"><button class="iconbtn" type="button" id="pclose" aria-label="Закрыть поиск">✕</button></div>' +
      '<ul id="pl" role="listbox" aria-label="Результаты"></ul>' +
      '<div class="foot"><span><kbd>↑</kbd> <kbd>↓</kbd> выбрать</span><span><kbd>Enter</kbd> открыть</span><span><kbd>Ctrl</kbd>+<kbd>Enter</kbd> копировать пароль или адрес</span><span><kbd>Esc</kbd> закрыть</span></div>';
    document.body.appendChild(d);
    d.addEventListener('close', function () { d.remove(); });
    var inp = d.querySelector('#pq'), ul = d.querySelector('#pl'), sel = 0, list = [], tokens = [];
    function draw() {
      var q = inp.value.trim();
      if (!q) {
        var rec = (state.db.recent || []).map(clientById).filter(Boolean);
        var pool = rec.length ? rec : state.db.clients.slice().sort(function (a, b) { return a.name.localeCompare(b.name, 'ru'); }).slice(0, 8);
        list = pool.map(function (c) { return { kind: 'Клиент', label: c.name, path: c.company || '', hash: '#/c/' + c.id }; }); tokens = [];
      } else { var r = runSearch(q); list = r.res; tokens = r.tokens; }
      if (sel >= list.length) sel = Math.max(0, list.length - 1);
      ul.innerHTML = (!q && list.length ? '<li class="grp" role="presentation">' + (state.db.recent.length ? 'Недавние' : 'Клиенты') + '</li>' : '') +
        (list.length ? list.map(function (it, i) {
          return '<li role="option" id="po' + i + '" data-i="' + i + '" aria-selected="' + (i === sel) + '"><span class="kind">' + it.kind + '</span><span class="txt"><span class="what">' + highlight(it.label, tokens) + '</span><span class="path">' + highlight(it.path || '', tokens) + '</span></span></li>';
        }).join('') : '<li class="none" role="presentation">' + (q ? 'Ничего не найдено по запросу «' + esc(q) + '». Проверьте написание или введите часть домена.' : 'Клиентов пока нет. Добавьте первого.') + '</li>');
      inp.setAttribute('aria-activedescendant', list.length ? 'po' + sel : '');
      var s = ul.querySelector('[aria-selected=true]'); if (s) s.scrollIntoView({ block: 'nearest' });
    }
    function choose(i, withCopy) {
      var it = list[i]; if (!it) return;
      if (withCopy) {
        if (it.secret) { d.close(); copy(it.secret, 'Пароль', true); return; }
        if (it.copy) { d.close(); copy(it.copy, it.copyWhat, false); return; }
        toast('Для этого результата нечего копировать. Откройте карточку клиента.'); return;
      }
      d.close(); state.hl = it.hl || null; go(it.hash);
    }
    inp.addEventListener('input', function () { sel = 0; draw(); });
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(sel + 1, list.length - 1); draw(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(sel - 1, 0); draw(); }
      else if (e.key === 'Enter') { e.preventDefault(); choose(sel, e.ctrlKey || e.metaKey); }
    });
    ul.addEventListener('click', function (e) { var li = e.target.closest('li[data-i]'); if (li) choose(+li.dataset.i, false); });
    ul.addEventListener('mousemove', function (e) { var li = e.target.closest('li[data-i]'); if (li && +li.dataset.i !== sel) { sel = +li.dataset.i; ul.querySelectorAll('li[aria-selected]').forEach(function (n) { n.setAttribute('aria-selected', n === li); }); } });
    d.querySelector('#pclose').onclick = function () { d.close(); };
    d.addEventListener('click', function (e) { if (e.target === d) d.close(); });
    d.showModal(); draw(); inp.focus();
  }

  function helpDialog() {
    var d = mkDialog('sheet confirm');
    var mod = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl';
    d.setAttribute('aria-labelledby', 'hk-t');
    d.innerHTML = '<form method="dialog"><header><h2 id="hk-t">Горячие клавиши</h2></header><div class="body"><div class="keys">' +
      [[mod + ' K или /', 'Поиск'], ['N', 'Добавить клиента'], ['P', 'Добавить проект'], ['A', 'Добавить доступ'], ['L', 'Добавить ссылку'], ['Shift L', 'Заблокировать'], ['?', 'Эта подсказка'], ['Esc', 'Закрыть окно']]
        .map(function (k) { return '<span><kbd>' + k[0] + '</kbd></span><span>' + k[1] + '</span>'; }).join('') +
      '</div></div><footer><button class="btn primary" value="ok">Закрыть</button></footer></form>';
    d.showModal();
  }

  /* ---------- События ---------- */
  document.addEventListener('click', function (e) {
    var menu = document.getElementById('menu');
    if (menu && !menu.hidden && !e.target.closest('#menu') && !e.target.closest('#btn-menu')) setMenu(false);
    var t = e.target.closest('[data-act], #open-search, #btn-theme, #btn-menu, #btn-lock');
    if (!t || !state.db) return;
    if (t.id === 'open-search') return openPalette();
    if (t.id === 'btn-theme') return toggleTheme();
    if (t.id === 'btn-menu') return setMenu(menu.hidden);
    if (t.id === 'btn-lock') return lock();
    var act = t.dataset.act, x = ctx();
    if (menu && t.closest('#menu')) setMenu(false);
    switch (act) {
      case 'copy': copy(t.dataset.v, t.dataset.what, false, t); break;
      case 'copy-pw': var a = x.p && x.p.accesses.find(function (z) { return z.id === t.dataset.id; }); if (a) copy(a.password, 'Пароль', true, t); break;
      case 'toggle-pw':
        var id = t.dataset.id; state.shown[id] = !state.shown[id];
        if (state.shown[id]) setTimeout(function () { if (state.shown[id]) { state.shown[id] = false; render(); } }, 20000);
        render(); var nb = document.querySelector('[data-act=toggle-pw][data-id="' + id + '"]'); if (nb) nb.focus(); break;
      case 'filter': state.filter = t.dataset.v; renderSide(); break;
      case 'goto': go(t.dataset.to); break;
      case 'new-client': clientForm(null); break;
      case 'edit-client': clientForm(x.c); break;
      case 'new-project': if (x.c) projectForm(x.c, null); break;
      case 'edit-project': projectForm(x.c, x.p); break;
      case 'new-link': linkForm(x.p, null); break;
      case 'edit-link': linkForm(x.p, x.p.links.find(function (z) { return z.id === t.dataset.id; })); break;
      case 'new-access': accessForm(x.p, null); break;
      case 'edit-access': accessForm(x.p, x.p.accesses.find(function (z) { return z.id === t.dataset.id; })); break;
      case 'del-log': removeWithUndo('Запись удалена', function () { x.p.log = x.p.log.filter(function (z) { return z.id !== t.dataset.id; }); }); break;
      case 'export': exportDb(); break;
      case 'import': importDb(); break;
      case 'change-pw': changePassword(); break;
      case 'help': helpDialog(); break;
      case 'lock': lock(); break;
      case 'drop-demo':
        confirmBox({ title: 'Удалить демо-данные?', text: 'Будут удалены только демо-клиенты. Ваши клиенты останутся.', ok: 'Удалить демо', danger: true }).then(function (yes) {
          if (!yes) return;
          mutate('Удалено', function () { state.db.clients = state.db.clients.filter(function (c) { return !c.demo; }); });
          if (state.route.name === 'client' && !clientById(state.route.cid)) go('#/');
        }); break;
    }
  });
  document.addEventListener('submit', function (e) {
    var f = e.target.closest('[data-form=log]'); if (!f) return;
    e.preventDefault();
    var inp = f.querySelector('input'), text = inp.value.trim(), x = ctx();
    if (!text) { toast('Введите текст записи.', { error: true }); inp.focus(); return; }
    mutate('Сохранено', function () { x.p.log.push({ id: uid(), date: todayStr(), text: text }); }).then(function () { var n = document.getElementById('log-text'); if (n) n.focus(); });
  });
  function setMenu(show) {
    var m = document.getElementById('menu'), b = document.getElementById('btn-menu'); if (!m) return;
    m.hidden = !show; b.setAttribute('aria-expanded', String(show));
    if (show) m.querySelector('button').focus();
  }
  function toggleTheme() {
    var cur = document.documentElement.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    var next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('kt-theme', next); } catch (e) {}
  }
  document.addEventListener('keydown', function (e) {
    if (!state.db) return;
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); return; }
    if (e.key === 'Escape') { var m = document.getElementById('menu'); if (m && !m.hidden) { setMenu(false); document.getElementById('btn-menu').focus(); } return; }
    if (typing || e.ctrlKey || e.metaKey || e.altKey || document.querySelector('dialog[open]')) return;
    var k = e.key, x = ctx();
    if (k === '/') { e.preventDefault(); openPalette(); }
    else if (k === '?') helpDialog();
    else if (k === 'L') lock();
    else if (k.toLowerCase() === 'n' || k.toLowerCase() === 'т') { e.preventDefault(); clientForm(null); }
    else if ((k.toLowerCase() === 'p' || k.toLowerCase() === 'з') && x.c) { e.preventDefault(); projectForm(x.c, null); }
    else if ((k.toLowerCase() === 'a' || k.toLowerCase() === 'ф') && x.p) { e.preventDefault(); accessForm(x.p, null); }
    else if ((k.toLowerCase() === 'l' || k.toLowerCase() === 'д') && x.p) { e.preventDefault(); linkForm(x.p, null); }
  });
  window.addEventListener('pagehide', function () { clearClipboard(); });

  /* ---------- Старт ---------- */
  if (!window.crypto || !crypto.subtle || !window.indexedDB) {
    $root.innerHTML = '<main class="gate"><div class="warn narrow"><p>Браузер не поддерживает шифрование или хранилище, либо страница открыта не по HTTPS. Откройте приложение через https:// или http://localhost.</p></div></main>';
  } else {
    Vault.exists().then(function (yes) { gate(yes ? 'unlock' : 'setup'); }).catch(function (e) {
      $root.innerHTML = '<main class="gate"><div class="warn narrow"><p>Не удалось открыть хранилище браузера: ' + esc(e && e.message) + '. Выйдите из приватного режима и обновите страницу.</p></div></main>';
    });
  }
})();
