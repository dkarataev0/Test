/* MasterMaler — site logic: calculator, lead submit, animations. */
(function () {
  'use strict';

  /* ================= Config ================= */

  // Цены за единицу (₽ за м² или пог. м). null — «по запросу».
  // Укажите число, и калькулятор начнёт показывать ориентировочную стоимость.
  const PRICES = {
    'paint-walls': null,
    'paint-ceiling': null,
    'paint-slopes': null,
    'primer': null,
    'putty-start': null,
    'putty-finish': null,
    'cracks': null,
    'strip': null,
    'decor': null,
    'facade': null,
    'wallpaper': null,
  };

  const GROUPS = [
    { id: 'paint', label: 'Покраска' },
    { id: 'putty', label: 'Шпаклёвка и подготовка' },
    { id: 'decor', label: 'Декор и фасад' },
  ];

  const LAYERS = { id: 'layers', label: 'Слоёв', choices: ['1', '2', '3'], value: '2' };

  const SERVICES = [
    { id: 'paint-walls', group: 'paint', name: 'Покраска стен', desc: 'Водоэмульсионные, моющиеся, интерьерные краски', unit: 'м²', options: [LAYERS] },
    { id: 'paint-ceiling', group: 'paint', name: 'Покраска потолка', desc: 'Без разводов и видимых стыков', unit: 'м²', options: [LAYERS] },
    { id: 'paint-slopes', group: 'paint', name: 'Покраска откосов', desc: 'Оконные и дверные откосы, наличники', unit: 'пог. м' },
    { id: 'primer', group: 'putty', name: 'Грунтовка', desc: 'Укрепляет основание, улучшает сцепление', unit: 'м²' },
    { id: 'putty-start', group: 'putty', name: 'Стартовая шпаклёвка', desc: 'Выравнивание стен и потолков', unit: 'м²' },
    { id: 'putty-finish', group: 'putty', name: 'Финишная шпаклёвка', desc: 'Идеально гладкая поверхность под покраску', unit: 'м²', options: [{ id: 'layers', label: 'Слоёв', choices: ['1', '2'], value: '2' }] },
    { id: 'cracks', group: 'putty', name: 'Заделка трещин и рустов', desc: 'Армирование серпянкой, расшивка', unit: 'пог. м' },
    { id: 'strip', group: 'putty', name: 'Снятие старого покрытия', desc: 'Краска, обои, побелка', unit: 'м²' },
    { id: 'decor', group: 'decor', name: 'Декоративная штукатурка', desc: 'Фактурные и эффектные покрытия', unit: 'м²', options: [{ id: 'texture', label: 'Фактура', choices: ['Бетон', 'Шёлк', 'Травертин', 'Другое'], value: 'Бетон' }] },
    { id: 'facade', group: 'decor', name: 'Покраска фасада', desc: 'Фасадные атмосферостойкие краски', unit: 'м²' },
    { id: 'wallpaper', group: 'decor', name: 'Обои под покраску', desc: 'Стеклохолст, флизелин', unit: 'м²' },
  ];

  // Иллюстрации «до/после». Чтобы поставить реальные фото, добавьте в сцену
  // поля before/after с путями к картинкам: { label, before: 'img/1-before.webp', after: 'img/1-after.webp' }.
  const BA_SCENES = [
    { label: 'Гостиная', color: '#8AB0AB', accent: '#5E8580' },
    { label: 'Спальня', color: '#D9BC8C', accent: '#B0915F' },
    { label: 'Кухня', color: '#D98A6E', accent: '#B4654A' },
  ];

  const PALETTES = [
    { name: 'Шалфей', colors: ['#8AB0AB', '#A7C4BF', '#6F9792'] },
    { name: 'Охра', colors: ['#E9C46A', '#F1D58E', '#D4A94A'] },
    { name: 'Терракота', colors: ['#E76F51', '#EE8E75', '#C9563A'] },
    { name: 'Лаванда', colors: ['#9C89B8', '#B7A8CE', '#7F6C9C'] },
  ];

  const MARQUEE = [
    ['Шалфей', '#8AB0AB'], ['Охра', '#E9C46A'], ['Терракота', '#E76F51'], ['Лён', '#E8DCCB'],
    ['Графит', '#3D3D3D'], ['Мята', '#A8DADC'], ['Пудра', '#E8C4C0'], ['Слоновая кость', '#F3EBDD'],
    ['Индиго', '#3F4C8A'], ['Оливка', '#8A8F5C'], ['Лаванда', '#9C89B8'], ['Песок', '#D9BC8C'],
  ];

  const LEAD_ENDPOINT = '/api/lead';
  const TELEGRAM_URL = 'https://t.me/MasterMaler';
  const DRAFT_KEY = 'mm-draft-v1';

  /* ================= Helpers ================= */

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const icon = (id) => `<svg class="i" aria-hidden="true"><use href="#i-${id}"/></svg>`;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (n) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(n);
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* storage unavailable */ } },
  };
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hasGsap = () => typeof window.gsap !== 'undefined';

  let toastTimer;
  function toast(msg) {
    const el = $('[data-toast]');
    el.textContent = msg;
    el.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-on'), 2600);
  }

  /* ================= Theme ================= */

  function initTheme() {
    const btn = $('[data-theme-toggle]');
    const use = btn.querySelector('use');
    const isDark = () => {
      const t = document.documentElement.dataset.theme;
      return t ? t === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    };
    const sync = () => {
      const dark = isDark();
      use.setAttribute('href', dark ? '#i-sun' : '#i-moon');
      btn.setAttribute('aria-label', dark ? 'Включить светлую тему' : 'Включить тёмную тему');
    };
    btn.addEventListener('click', () => {
      const next = isDark() ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem('mm-theme', next); } catch (e) { /* ignore */ }
      sync();
    });
    sync();
  }

  /* ================= Header, menu, mobile bar ================= */

  function initChrome() {
    const header = $('.header');
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const menu = $('#mobile-menu');
    const openBtn = $('[data-menu-open]');
    const closeBtn = $('[data-menu-close]');
    const setOpen = (open) => {
      menu.classList.toggle('is-open', open);
      openBtn.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) closeBtn.focus(); else openBtn.focus();
    };
    openBtn.addEventListener('click', () => setOpen(true));
    closeBtn.addEventListener('click', () => setOpen(false));
    $$('a', menu).forEach((a) => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('is-open')) setOpen(false); });

    // Hide the mobile action bar while the calculator or a form is on screen.
    const mbar = $('[data-mbar]');
    const hideFor = new Set();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => (en.isIntersecting ? hideFor.add(en.target) : hideFor.delete(en.target)));
      mbar.classList.toggle('is-hidden', hideFor.size > 0);
    }, { threshold: 0.15 });
    [$('#calculator'), $('#callback-form'), $('.footer')].forEach((el) => io.observe(el));

    $('[data-year]').textContent = new Date().getFullYear();
  }

  /* ================= Phone mask ================= */

  function phoneDigits(v) {
    let d = String(v).replace(/\D/g, '');
    if (d.length && (d[0] === '7' || d[0] === '8')) d = d.slice(1);
    return d.slice(0, 10);
  }
  function formatPhone(d) {
    if (!d) return '';
    let out = '+7 (' + d.slice(0, 3);
    if (d.length >= 3) out += ') ' + d.slice(3, 6);
    if (d.length >= 6) out += '-' + d.slice(6, 8);
    if (d.length >= 8) out += '-' + d.slice(8, 10);
    return out;
  }
  // Digits typed after the "+7 (" prefix. A leading 8/7 is treated as the country code
  // when it is the first digit typed or part of a pasted 11-digit number.
  function maskedDigits(value, prevCount) {
    const v = String(value).trim();
    if (!v.startsWith('+7')) return phoneDigits(v);
    let d = v.slice(2).replace(/\D/g, '');
    if ((d.length > 10 || (prevCount === 0 && d.length === 1)) && (d[0] === '8' || d[0] === '7')) d = d.slice(1);
    return d.slice(0, 10);
  }
  function initPhoneMask() {
    $$('[data-phone]').forEach((input) => {
      let prev = phoneDigits(input.value).length;
      input.addEventListener('input', () => {
        const d = maskedDigits(input.value, prev);
        prev = d.length;
        input.value = d ? formatPhone(d) : '+7 (';
      });
      input.addEventListener('focus', () => { if (!input.value) input.value = '+7 ('; });
      input.addEventListener('blur', () => { if (phoneDigits(input.value).length === 0) input.value = ''; });
    });
  }

  /* ================= Validation ================= */

  function setError(input, errEl, msg) {
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    errEl.innerHTML = msg ? icon('alert') + esc(msg) : '';
  }
  function validateContact(form, prefix) {
    const name = form.elements.name;
    const phone = form.elements.phone;
    const consent = form.elements.consent;
    const errs = [];
    const nameOk = name.value.trim().length >= 2;
    setError(name, $('#' + prefix + 'name-err'), nameOk ? '' : 'Введите имя, хотя бы 2 буквы');
    if (!nameOk) errs.push(name);
    const phoneOk = phoneDigits(phone.value).length === 10;
    setError(phone, $('#' + prefix + 'phone-err'), phoneOk ? '' : 'Введите номер полностью: +7 и 10 цифр');
    if (!phoneOk) errs.push(phone);
    const consentEl = $('#' + prefix + 'consent-err');
    consentEl.innerHTML = consent.checked ? '' : icon('alert') + 'Нужно согласие на обработку данных';
    consent.setAttribute('aria-invalid', consent.checked ? 'false' : 'true');
    if (!consent.checked) errs.push(consent);
    if (errs.length) errs[0].focus();
    return errs.length === 0;
  }

  /* ================= Lead submit ================= */

  function leadToText(d) {
    const lines = [];
    lines.push(d.type === 'callback' ? 'Заявка: обратный звонок' : 'Заявка из калькулятора');
    lines.push(`Имя: ${d.name}`);
    lines.push(`Телефон: ${d.phone}`);
    if (d.contact) lines.push(`Связь: ${d.contact}, ${d.time}`);
    if (d.object) lines.push(`Объект: ${d.object} (${d.condition}), ${d.city}`);
    if (d.services && d.services.length) {
      lines.push('Работы:');
      d.services.forEach((s) => {
        const opts = s.options && Object.keys(s.options).length ? ' — ' + Object.entries(s.options).map(([k, v]) => `${k}: ${v}`).join(', ') : '';
        lines.push(`• ${s.name}: ${s.qty ? fmt(s.qty) + ' ' + s.unit : 'объём уточнить'}${opts}`);
      });
      if (d.totalArea) lines.push(`Итого площадь: ${fmt(d.totalArea)} м²`);
    }
    if (d.materials) lines.push(`Материалы: ${d.materials}`);
    if (d.timing) lines.push(`Сроки: ${d.timing}`);
    if (d.comment) lines.push(`Комментарий: ${d.comment}`);
    return lines.join('\n');
  }

  // Sends the lead to the serverless function, which forwards it to Telegram.
  async function submitLead(data) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    try {
      const res = await fetch(LEAD_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json = await res.json().catch(() => ({}));
      if (json.ok === false) throw new Error(json.error || 'Lead rejected');
      return true;
    } finally {
      clearTimeout(timer);
    }
  }

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
      ta.remove();
      return ok;
    }
  }

  function setBusy(btn, busy, label) {
    const span = btn.querySelector('span');
    if (!btn.dataset.label) btn.dataset.label = span.textContent;
    btn.disabled = busy;
    btn.setAttribute('aria-busy', String(busy));
    const svg = btn.querySelector('svg, .spinner');
    if (busy) {
      svg.outerHTML = '<span class="spinner" aria-hidden="true"></span>';
      span.textContent = label || 'Отправляем…';
    } else {
      const sp = btn.querySelector('.spinner');
      if (sp) sp.outerHTML = icon(btn.dataset.icon || 'send');
      span.textContent = btn.dataset.label;
    }
  }

  /* ================= Calculator ================= */

  const state = {
    step: 0,
    maxStep: 0,
    tab: 'paint',
    selected: {}, // id -> { qty, options }
  };

  function serviceById(id) { return SERVICES.find((s) => s.id === id); }

  function renderServices() {
    const tabs = $('[data-tabs]');
    const panels = $('[data-tabpanels]');
    tabs.innerHTML = GROUPS.map((g) => `<button class="tab" role="tab" type="button" id="tab-${g.id}" aria-controls="panel-${g.id}" aria-selected="${g.id === state.tab}" tabindex="${g.id === state.tab ? 0 : -1}" data-tab="${g.id}">${esc(g.label)}<span class="count" data-count="${g.id}"></span></button>`).join('');
    panels.innerHTML = GROUPS.map((g) => `
      <div class="svc-list" role="tabpanel" id="panel-${g.id}" aria-labelledby="tab-${g.id}" ${g.id === state.tab ? '' : 'hidden'}>
        ${SERVICES.filter((s) => s.group === g.id).map(serviceTpl).join('')}
      </div>`).join('');

    tabs.addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) selectTab(b.dataset.tab, true); });
    tabs.addEventListener('keydown', (e) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
      e.preventDefault();
      const i = GROUPS.findIndex((g) => g.id === state.tab);
      let n = i;
      if (e.key === 'ArrowRight') n = (i + 1) % GROUPS.length;
      if (e.key === 'ArrowLeft') n = (i - 1 + GROUPS.length) % GROUPS.length;
      if (e.key === 'Home') n = 0;
      if (e.key === 'End') n = GROUPS.length - 1;
      selectTab(GROUPS[n].id, true);
    });

    panels.addEventListener('change', onServiceChange);
    panels.addEventListener('input', onServiceInput);
    panels.addEventListener('click', onStepperClick);
  }

  function serviceTpl(s) {
    const opts = (s.options || []).map((o) => `
      <div class="opt" role="radiogroup" aria-label="${esc(o.label)}">
        <span>${esc(o.label)}</span>
        <div class="seg">${o.choices.map((c) => `<label><input type="radio" name="opt-${s.id}-${o.id}" value="${esc(c)}" data-opt="${o.id}" data-svc="${s.id}" ${c === o.value ? 'checked' : ''}><span>${esc(c)}</span></label>`).join('')}</div>
      </div>`).join('');
    return `
      <div class="svc" data-svc-card="${s.id}">
        <label class="svc__head">
          <input type="checkbox" value="${s.id}" data-svc-toggle aria-controls="svc-body-${s.id}">
          <span><span class="svc__name">${esc(s.name)}</span><span class="svc__desc">${esc(s.desc)}</span></span>
          <span class="svc__unit">${esc(s.unit)}</span>
        </label>
        <div class="svc__body" id="svc-body-${s.id}" inert><div>
          <div class="svc__fields">
            <div class="qty">
              <label for="qty-${s.id}">Объём, ${esc(s.unit)}</label>
              <div class="qty__ctrl">
                <button type="button" data-step-qty="-1" data-svc="${s.id}" aria-label="Уменьшить">−</button>
                <input id="qty-${s.id}" type="number" inputmode="decimal" min="0" max="100000" step="1" placeholder="0" data-qty="${s.id}">
                <button type="button" data-step-qty="1" data-svc="${s.id}" aria-label="Увеличить">+</button>
              </div>
            </div>
            ${opts}
          </div>
        </div></div>
      </div>`;
  }

  function selectTab(id, focus) {
    state.tab = id;
    $$('[data-tab]').forEach((b) => {
      const on = b.dataset.tab === id;
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
      if (on && focus) b.focus();
    });
    $$('[data-tabpanels] [role="tabpanel"]').forEach((p) => { p.hidden = p.id !== 'panel-' + id; });
  }

  function setService(id, on) {
    const card = $(`[data-svc-card="${id}"]`);
    const cb = $('[data-svc-toggle]', card);
    const qty = $('[data-qty]', card);
    cb.checked = on;
    card.classList.toggle('is-on', on);
    $('.svc__body', card).inert = !on;
    if (on) {
      if (!state.selected[id]) {
        const s = serviceById(id);
        const options = {};
        (s.options || []).forEach((o) => { options[o.id] = $(`input[data-svc="${id}"][data-opt="${o.id}"]:checked`, card).value; });
        state.selected[id] = { qty: parseFloat(qty.value) || 0, options };
      }
    } else {
      delete state.selected[id];
    }
  }

  function onServiceChange(e) {
    const t = e.target;
    if (t.matches('[data-svc-toggle]')) {
      setService(t.value, t.checked);
      if (t.checked) setTimeout(() => $(`[data-qty="${t.value}"]`).focus({ preventScroll: true }), 50);
      $('[data-services-error]').textContent = '';
    } else if (t.matches('[data-opt]') && state.selected[t.dataset.svc]) {
      state.selected[t.dataset.svc].options[t.dataset.opt] = t.value;
    }
    update();
  }

  function onServiceInput(e) {
    const t = e.target;
    if (!t.matches('[data-qty]')) return;
    const v = Math.max(0, Math.min(100000, parseFloat(t.value.replace(',', '.')) || 0));
    if (state.selected[t.dataset.qty]) state.selected[t.dataset.qty].qty = v;
    update();
  }

  function onStepperClick(e) {
    const b = e.target.closest('[data-step-qty]');
    if (!b) return;
    const id = b.dataset.svc;
    const input = $(`[data-qty="${id}"]`);
    const step = serviceById(id).unit === 'м²' ? 5 : 1;
    const v = Math.max(0, (parseFloat(input.value) || 0) + step * Number(b.dataset.stepQty));
    input.value = v || '';
    if (state.selected[id]) state.selected[id].qty = v;
    update();
  }

  function selectedList() {
    return SERVICES.filter((s) => state.selected[s.id]).map((s) => {
      const sel = state.selected[s.id];
      const options = {};
      (s.options || []).forEach((o) => { options[o.label] = sel.options[o.id]; });
      return { id: s.id, name: s.name, unit: s.unit, qty: sel.qty, options };
    });
  }

  let areaTween = null;
  let shownArea = 0;
  function update() {
    const list = selectedList();
    const ul = $('[data-summary-list]');
    ul.innerHTML = list.map((s) => `<li><span>${esc(s.name)}</span><span>${s.qty ? fmt(s.qty) + ' ' + esc(s.unit) : 'уточнить'}</span></li>`).join('');
    $('[data-summary-empty]').hidden = list.length > 0;

    const area = list.filter((s) => s.unit === 'м²').reduce((a, s) => a + (s.qty || 0), 0);
    const areaEl = $('[data-summary-area]');
    if (hasGsap() && !reduceMotion.matches) {
      if (areaTween) areaTween.kill();
      const o = { v: shownArea };
      areaTween = gsap.to(o, { v: area, duration: 0.5, ease: 'power2.out', onUpdate: () => { shownArea = o.v; areaEl.textContent = fmt(Math.round(o.v * 10) / 10); } });
    } else {
      shownArea = area;
      areaEl.textContent = fmt(area);
    }

    // Price: only when every selected service has a price and a volume.
    const priced = list.filter((s) => typeof PRICES[s.id] === 'number' && s.qty > 0);
    const sum = priced.reduce((a, s) => a + PRICES[s.id] * s.qty, 0);
    const priceEl = $('[data-summary-price]');
    if (list.length && priced.length === list.length) {
      priceEl.innerHTML = `<strong>≈ ${fmt(Math.round(sum))} ₽</strong>Ориентировочно. Точную смету мастер составит после осмотра.`;
    } else if (priced.length) {
      priceEl.innerHTML = `<strong>от ${fmt(Math.round(sum))} ₽</strong>Остальные работы оценит мастер после осмотра.`;
    } else {
      priceEl.innerHTML = '<strong>Цена по запросу</strong>Мастер рассчитает стоимость после осмотра и пришлёт её в Telegram.';
    }

    const f = $('#calc-form');
    const meta = [];
    const obj = f.elements.object.value;
    meta.push(`${obj}, ${f.elements.city.value.trim() || 'Краснодар'}`);
    if (state.maxStep >= 2) meta.push(`Материалы: ${f.elements.materials.value.toLowerCase()}`);
    $('[data-summary-meta]').innerHTML = meta.map((m) => `<span>${esc(m)}</span>`).join('');

    GROUPS.forEach((g) => {
      const n = list.filter((s) => serviceById(s.id).group === g.id).length;
      const el = $(`[data-count="${g.id}"]`);
      if (el) el.textContent = n ? String(n) : '';
    });

    saveDraft();
  }

  /* Steps */
  function goTo(step, focus = true) {
    const steps = $$('.step[data-step]').filter((s) => s.dataset.step !== 'done');
    const prev = $('.step.is-active');
    const next = steps[step];
    if (!next) return;
    state.step = step;
    state.maxStep = Math.max(state.maxStep, step);
    if (prev !== next) {
      prev.classList.remove('is-active');
      next.classList.add('is-active');
      if (hasGsap() && !reduceMotion.matches) {
        gsap.fromTo(next, { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.35, ease: 'power2.out', clearProps: 'transform,opacity' });
      }
    }
    $$('.steps li').forEach((li, i) => {
      li.classList.toggle('is-current', i === step);
      li.classList.toggle('is-done', i < step);
      const b = li.querySelector('button');
      b.disabled = i > state.maxStep;
      if (i === step) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    $('[data-step-announce]').textContent = `Шаг ${step + 1} из 4`;
    if (focus) {
      const title = next.querySelector('.step__title');
      title.focus({ preventScroll: true });
      const top = $('.calc__main').getBoundingClientRect().top;
      if (top < 0 || top > window.innerHeight * 0.5) {
        $('.calc__main').scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
      }
    }
    update();
  }

  function validateStep(step) {
    if (step === 1 && Object.keys(state.selected).length === 0) {
      $('[data-services-error]').innerHTML = icon('alert') + 'Отметьте хотя бы одну работу';
      return false;
    }
    return true;
  }

  function initCalculator() {
    renderServices();
    const form = $('#calc-form');

    form.addEventListener('click', (e) => {
      if (e.target.closest('[data-next]')) {
        if (validateStep(state.step)) goTo(state.step + 1);
      } else if (e.target.closest('[data-prev]')) {
        goTo(state.step - 1);
      }
    });
    $('.steps').addEventListener('click', (e) => {
      const b = e.target.closest('[data-goto]');
      if (b && !b.disabled) goTo(Number(b.dataset.goto));
    });
    form.addEventListener('change', (e) => { if (!e.target.closest('[data-tabpanels]')) update(); });
    form.addEventListener('input', (e) => { if (e.target.matches('#comment, #city, #name, #phone')) saveDraft(); });
    form.addEventListener('keydown', (e) => {
      // Enter in a text field moves to the next step instead of submitting early.
      if (e.key === 'Enter' && e.target.matches('input:not([type="checkbox"]):not([type="radio"])') && state.step < 3) {
        e.preventDefault();
        if (validateStep(state.step)) goTo(state.step + 1);
      }
    });

    // "Добавить в расчёт" buttons in the services section.
    $$('[data-pick]').forEach((b) => b.addEventListener('click', () => {
      const id = b.dataset.pick;
      setService(id, true);
      selectTab(serviceById(id).group, false);
      if (state.step < 1) goTo(1, false);
      else update();
      $('#calculator').scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      toast(`«${serviceById(id).name}» добавлено в расчёт`);
    }));

    initRoomHelper();
    restoreDraft();

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (state.step !== 3) { if (validateStep(state.step)) goTo(state.step + 1); return; }
      if (!validateContact(form, '')) return;
      if (form.elements.website.value) return; // honeypot

      const list = selectedList();
      const data = {
        type: 'calc',
        name: form.elements.name.value.trim(),
        phone: formatPhone(phoneDigits(form.elements.phone.value)),
        contact: form.elements.contact.value,
        time: form.elements.time.value,
        object: form.elements.object.value,
        condition: form.elements.condition.value,
        city: form.elements.city.value.trim() || 'Краснодар',
        materials: form.elements.materials.value,
        timing: form.elements.timing.value,
        comment: form.elements.comment.value.trim(),
        services: list.map(({ name, unit, qty, options }) => ({ name, unit, qty, options })),
        totalArea: list.filter((s) => s.unit === 'м²').reduce((a, s) => a + (s.qty || 0), 0),
        website: form.elements.website.value,
        page: location.href,
      };
      const btn = form.querySelector('[type="submit"]');
      btn.dataset.icon = 'send';
      setBusy(btn, true);
      try {
        await submitLead(data);
        showResult(true, data);
        store.del(DRAFT_KEY);
      } catch (err) {
        showResult(false, data);
      } finally {
        setBusy(btn, false);
      }
    });
  }

  function showResult(ok, data) {
    const done = $('.step[data-step="done"]');
    $('.step.is-active').classList.remove('is-active');
    done.classList.add('is-active');
    $('.steps').hidden = true;
    if (ok) {
      done.innerHTML = `
        <div class="result">
          <div class="result__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path class="check-path" d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>
          <h3 tabindex="-1">Заявка отправлена</h3>
          <p>Спасибо, ${esc(data.name)}! Мастер свяжется с вами: ${esc(data.contact)}, ${esc(data.time.toLowerCase())}. Фото объекта можно прислать в Telegram, так оценка будет точнее.</p>
          <div class="hero__cta">
            <a class="btn" href="${TELEGRAM_URL}" target="_blank" rel="noopener">${icon('send')}Отправить фото</a>
            <button class="btn btn--ghost" type="button" data-restart>Новый расчёт</button>
          </div>
        </div>`;
      celebrate();
    } else {
      done.innerHTML = `
        <div class="result result--error">
          <div class="result__icon">${icon('alert')}</div>
          <h3 tabindex="-1">Не получилось отправить</h3>
          <p>Похоже, проблема со связью. Скопируйте заявку и отправьте её в Telegram или просто позвоните, расчёт сохранён.</p>
          <div class="hero__cta">
            <button class="btn" type="button" data-copy-tg>${icon('copy')}Скопировать и открыть Telegram</button>
            <a class="btn btn--ghost" href="tel:+79181157676">${icon('phone')}Позвонить</a>
            <button class="btn btn--ghost" type="button" data-retry>Попробовать снова</button>
          </div>
        </div>`;
      $('[data-copy-tg]', done).addEventListener('click', async () => {
        const ok2 = await copyText(leadToText(data));
        toast(ok2 ? 'Заявка скопирована, вставьте её в чат' : 'Не удалось скопировать');
        window.open(TELEGRAM_URL, '_blank', 'noopener');
      });
      $('[data-retry]', done).addEventListener('click', () => {
        done.classList.remove('is-active');
        $('.steps').hidden = false;
        goTo(3);
      });
    }
    const r = $('[data-restart]', done);
    if (r) r.addEventListener('click', resetCalculator);
    done.querySelector('h3').focus({ preventScroll: true });
    $('.calc__main').scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
  }

  function resetCalculator() {
    const form = $('#calc-form');
    form.reset();
    Object.keys(state.selected).forEach((id) => setService(id, false));
    $$('[data-qty]').forEach((i) => { i.value = ''; });
    $$('[aria-invalid]', form).forEach((i) => i.setAttribute('aria-invalid', 'false'));
    $$('.field__error', form).forEach((e) => { e.innerHTML = ''; });
    state.maxStep = 0;
    const done = $('.step[data-step="done"]');
    done.classList.remove('is-active');
    done.innerHTML = '';
    $('.steps').hidden = false;
    $$('.step[data-step]')[0].classList.add('is-active');
    goTo(0);
  }

  function initRoomHelper() {
    const ids = ['r-l', 'r-w', 'r-h', 'r-o'];
    const val = (id) => Math.max(0, parseFloat(String($('#' + id).value).replace(',', '.')) || 0);
    let walls = 0;
    let ceiling = 0;
    const calc = () => {
      const l = val('r-l'); const w = val('r-w'); const h = val('r-h'); const o = val('r-o');
      walls = Math.max(0, Math.round((2 * (l + w) * h - o) * 10) / 10);
      ceiling = Math.round(l * w * 10) / 10;
      $('[data-room-walls]').textContent = fmt(walls);
      $('[data-room-ceiling]').textContent = fmt(ceiling);
    };
    ids.forEach((id) => $('#' + id).addEventListener('input', calc));
    calc();
    $('[data-room-apply]').addEventListener('click', () => {
      const ceilingIds = ['paint-ceiling'];
      const ids2 = Object.keys(state.selected).filter((id) => serviceById(id).unit === 'м²');
      if (!ids2.length) { toast('Сначала отметьте работы выше'); return; }
      if (!walls && !ceiling) { toast('Укажите длину и ширину комнаты'); return; }
      ids2.forEach((id) => {
        const v = ceilingIds.includes(id) ? ceiling : walls;
        state.selected[id].qty = v;
        $(`[data-qty="${id}"]`).value = v || '';
      });
      update();
      toast('Площадь подставлена');
    });
  }

  /* Draft (per-viewer convenience only) */
  function saveDraft() {
    const f = $('#calc-form');
    if (!f) return;
    const radios = {};
    ['object', 'condition', 'materials', 'timing', 'contact'].forEach((n) => { radios[n] = f.elements[n].value; });
    store.set(DRAFT_KEY, {
      selected: state.selected,
      radios,
      city: f.elements.city.value,
      comment: f.elements.comment.value,
      name: f.elements.name.value,
      phone: f.elements.phone.value,
    });
  }
  function restoreDraft() {
    const d = store.get(DRAFT_KEY);
    const f = $('#calc-form');
    if (!d || typeof d !== 'object') { update(); return; }
    try {
      Object.entries(d.radios || {}).forEach(([n, v]) => {
        const r = $$(`input[name="${n}"]`, f).find((i) => i.value === v);
        if (r) r.checked = true;
      });
      ['city', 'comment', 'name', 'phone'].forEach((k) => { if (typeof d[k] === 'string') f.elements[k].value = d[k]; });
      Object.entries(d.selected || {}).forEach(([id, sel]) => {
        if (!serviceById(id)) return;
        Object.entries(sel.options || {}).forEach(([oid, v]) => {
          const r = $$(`input[data-svc="${id}"][data-opt="${oid}"]`).find((i) => i.value === v);
          if (r) r.checked = true;
        });
        setService(id, true);
        const q = Number(sel.qty) || 0;
        state.selected[id].qty = q;
        $(`[data-qty="${id}"]`).value = q || '';
      });
    } catch (e) { store.del(DRAFT_KEY); }
    update();
  }

  /* ================= Callback form ================= */

  function initCallback() {
    const form = $('#callback-form');
    const status = $('[data-cb-status]');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validateContact(form, 'cb-')) return;
      if (form.elements.website.value) return;
      const data = {
        type: 'callback',
        name: form.elements.name.value.trim(),
        phone: formatPhone(phoneDigits(form.elements.phone.value)),
        website: form.elements.website.value,
        page: location.href,
      };
      const btn = form.querySelector('[type="submit"]');
      btn.dataset.icon = 'phone';
      setBusy(btn, true);
      status.textContent = '';
      try {
        await submitLead(data);
        form.reset();
        status.innerHTML = `<strong style="color:var(--success)">Готово! Скоро перезвоню.</strong>`;
        celebrate();
      } catch (err) {
        status.innerHTML = `Не получилось отправить. Позвоните: <a href="tel:+79181157676">+7 918 115-76-76</a> или напишите в <a href="${TELEGRAM_URL}" target="_blank" rel="noopener">Telegram</a>.`;
      } finally {
        setBusy(btn, false);
      }
    });
  }

  /* ================= Before / after ================= */

  function sceneSvg(sc, after, uid) {
    const id = `${uid}-${after ? 'a' : 'b'}`;
    const wall = after ? sc.color : '#CFC6BC';
    const defs = `
      <defs>
        <filter id="n-${id}"><feTurbulence type="fractalNoise" baseFrequency="${after ? '.6' : '1.1'}" numOctaves="3" seed="7"/><feColorMatrix values="0 0 0 0 .3 0 0 0 0 .26 0 0 0 0 .22 0 0 0 ${after ? '.06' : '.4'} 0"/></filter>
        <linearGradient id="l-${id}" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="${after ? '.35' : '.15'}"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${after ? '.12' : '.2'}"/></linearGradient>
        <linearGradient id="f-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${after ? '#B08A63' : '#8F7E6C'}"/><stop offset="1" stop-color="${after ? '#8C6A48' : '#6E6052'}"/></linearGradient>
      </defs>`;
    const base = `
      <rect width="1600" height="900" fill="${wall}"/>
      <rect width="1600" height="740" fill="url(#l-${id})"/>
      <rect width="1600" height="740" filter="url(#n-${id})"/>
      <rect x="140" y="140" width="330" height="420" rx="6" fill="${after ? '#EAF2F6' : '#C9D2D6'}" stroke="${after ? '#FFFFFF' : '#B5AEA5'}" stroke-width="22"/>
      <path d="M305 140v420M140 350h330" stroke="${after ? '#FFFFFF' : '#B5AEA5'}" stroke-width="14"/>
      <polygon points="140,560 470,560 560,740 50,740" fill="#fff" opacity="${after ? '.18' : '.06'}"/>
      <rect y="740" width="1600" height="160" fill="url(#f-${id})"/>
      <rect y="722" width="1600" height="22" fill="${after ? '#FAFAF7' : '#B8AEA2'}"/>`;
    const beforeMess = after ? '' : `
      <path d="M760 90 q40 80 -10 160 t30 170 q-20 60 10 120" stroke="#9A8D80" stroke-width="4" fill="none"/>
      <path d="M1300 200 q-60 50 -40 140 t-50 120" stroke="#9A8D80" stroke-width="3" fill="none"/>
      <ellipse cx="1050" cy="520" rx="170" ry="90" fill="#B5A898" opacity=".55"/>
      <ellipse cx="620" cy="300" rx="110" ry="60" fill="#BFB3A5" opacity=".5"/>
      <path d="M1180 420 l90 -20 l40 60 l-30 70 l-90 10 l-30 -60z" fill="#E4DDD3" opacity=".9"/>
      <path d="M880 560 l60 -10 l20 40 l-50 30z" fill="#E4DDD3" opacity=".9"/>
      <rect x="1420" y="600" width="44" height="64" rx="6" fill="#E9E2D8" stroke="#A39889" stroke-width="3"/>`;
    const afterDecor = after ? `
      <rect x="820" y="230" width="380" height="250" rx="6" fill="${sc.accent}" opacity=".9"/>
      <rect x="845" y="255" width="330" height="200" rx="4" fill="#F5EFE6"/>
      <circle cx="960" cy="330" r="40" fill="${sc.color}"/>
      <path d="M860 440 l90 -80 l70 60 l50 -40 l90 60z" fill="${sc.accent}" opacity=".7"/>
      <path d="M1360 740 q-10 -120 30 -160 q30 40 20 160z" fill="#5E7A5A"/>
      <path d="M1400 740 q20 -150 70 -190 q10 70 -30 190z" fill="#6E8C68"/>
      <rect x="1350" y="680" width="110" height="60" rx="10" fill="#E2D6C5"/>
      <rect x="1420" y="600" width="44" height="64" rx="6" fill="#FFFFFF" stroke="${sc.accent}" stroke-opacity=".4" stroke-width="2"/>` : '';
    return `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${esc(sc.label)}: ${after ? 'после покраски' : 'до ремонта'}">${defs}${base}${beforeMess}${afterDecor}</svg>`;
  }

  function initBeforeAfter() {
    const root = $('[data-ba]');
    const tabs = $('[data-ba-tabs]');
    const before = $('[data-ba-before]');
    const after = $('[data-ba-after]');
    const range = $('[data-ba-range]');
    let current = 0;
    const render = (i) => {
      current = i;
      const sc = BA_SCENES[i];
      if (sc.before && sc.after) {
        before.innerHTML = `<img src="${esc(sc.before)}" alt="${esc(sc.label)}: до" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:cover">`;
        after.innerHTML = `<img src="${esc(sc.after)}" alt="${esc(sc.label)}: после" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:cover">`;
      } else {
        before.innerHTML = sceneSvg(sc, false, 'ba' + i);
        after.innerHTML = sceneSvg(sc, true, 'ba' + i);
      }
      $$('.tab', tabs).forEach((b, j) => b.setAttribute('aria-pressed', String(j === i)));
      $$('.tab', tabs).forEach((b, j) => b.setAttribute('aria-selected', String(j === i)));
    };
    tabs.innerHTML = BA_SCENES.map((s, i) => `<button class="tab" type="button" data-ba-i="${i}">${esc(s.label)}</button>`).join('');
    tabs.addEventListener('click', (e) => { const b = e.target.closest('[data-ba-i]'); if (b) render(Number(b.dataset.baI)); });
    const setPos = (v) => {
      root.style.setProperty('--pos', v + '%');
      range.setAttribute('aria-valuetext', `После: ${100 - Math.round(v)}%`);
    };
    range.addEventListener('input', () => setPos(range.value));
    render(current);
    setPos(50);

    // Gentle hint: sweep the handle once when the slider scrolls into view.
    if (hasGsap() && !reduceMotion.matches) {
      const o = { v: 50 };
      gsap.timeline({ scrollTrigger: { trigger: root, start: 'top 70%', once: true } })
        .to(o, { v: 25, duration: 0.7, ease: 'power2.inOut', onUpdate: () => { range.value = o.v; setPos(o.v); } })
        .to(o, { v: 70, duration: 0.9, ease: 'power2.inOut', onUpdate: () => { range.value = o.v; setPos(o.v); } })
        .to(o, { v: 50, duration: 0.6, ease: 'power2.out', onUpdate: () => { range.value = o.v; setPos(o.v); } });
    }
  }

  /* ================= Marquee ================= */

  function initMarquee() {
    const track = $('[data-marquee]');
    const items = MARQUEE.map(([n, c]) => `<span class="marquee__item"><span class="marquee__dot" style="background:${c}"></span>${esc(n)}</span>`).join('');
    track.innerHTML = items + items;
  }

  /* ================= Animations ================= */

  function celebrate() {
    if (!hasGsap() || reduceMotion.matches) return;
    const colors = MARQUEE.map((m) => m[1]);
    for (let i = 0; i < 28; i++) {
      const d = document.createElement('span');
      const size = 6 + Math.random() * 10;
      d.style.cssText = `position:fixed;left:50%;top:45%;width:${size}px;height:${size}px;border-radius:50%;background:${colors[i % colors.length]};z-index:90;pointer-events:none`;
      document.body.appendChild(d);
      gsap.to(d, {
        x: (Math.random() - 0.5) * window.innerWidth * 0.8,
        y: (Math.random() - 0.7) * window.innerHeight * 0.7,
        scale: 0.4 + Math.random(),
        opacity: 0,
        duration: 1.1 + Math.random() * 0.6,
        ease: 'power3.out',
        onComplete: () => d.remove(),
      });
    }
  }

  function addBrushes() {
    $$('[data-brush]').forEach((h) => {
      if (h.querySelector('.brush')) return;
      h.insertAdjacentHTML('beforeend', '<svg class="brush" viewBox="0 0 300 18" preserveAspectRatio="none" aria-hidden="true"><path d="M4 12 C 60 4, 120 16, 180 9 S 270 6, 296 10"/></svg>');
    });
  }

  function initAnimations() {
    if (!hasGsap()) return;
    const { gsap } = window;
    if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);
    if (window.SplitText) gsap.registerPlugin(window.SplitText);

    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      // Scroll progress as a stripe of paint.
      gsap.to('.progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

      // Hero title — per-character entrance.
      const title = $('[data-split]');
      let split = null;
      if (window.SplitText && title) {
        split = new window.SplitText(title, { type: 'words,chars', wordsClass: 'w' });
        gsap.from(split.chars, { opacity: 0, y: 24, rotateX: -50, duration: 0.6, stagger: 0.018, ease: 'expo.out', delay: 0.1 });
      }
      gsap.from('.hero__badge', { opacity: 0, y: 12, duration: 0.5, ease: 'power2.out' });
      gsap.from('.hero [data-reveal]', { opacity: 0, y: 16, duration: 0.6, stagger: 0.1, ease: 'power2.out', delay: 0.45 });
      gsap.from('.wall', { opacity: 0, y: 30, scale: 0.97, duration: 0.9, ease: 'expo.out', delay: 0.2 });

      // Blobs follow the pointer a little.
      const blobs = $$('.blob');
      const drift = gsap.to(blobs, { x: 'random(-60, 60)', y: 'random(-40, 40)', duration: 6, ease: 'sine.inOut', repeat: -1, yoyo: true, repeatRefresh: true, stagger: 0.5 });
      const hero = $('.hero');
      let onMove = null;
      if (window.matchMedia('(pointer: fine)').matches) {
        const qx = blobs.map((b) => gsap.quickTo(b, 'xPercent', { duration: 1.2, ease: 'power3.out' }));
        const qy = blobs.map((b) => gsap.quickTo(b, 'yPercent', { duration: 1.2, ease: 'power3.out' }));
        onMove = (e) => {
          const r = hero.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          qx.forEach((q, i) => q(px * (i + 1) * 12));
          qy.forEach((q, i) => q(py * (i + 1) * 12));
        };
        hero.addEventListener('pointermove', onMove);
      }

      const wallTl = initWall();

      // Palette marquee.
      const marquee = gsap.to('[data-marquee]', { xPercent: -50, duration: 40, ease: 'none', repeat: -1 });
      window.ScrollTrigger.create({ trigger: '.marquee', start: 'top bottom', end: 'bottom top', onToggle: (s) => (s.isActive ? marquee.play() : marquee.pause()) });

      // Section headings: brush stroke draws in.
      $$('.brush path').forEach((p) => {
        const len = p.getTotalLength();
        gsap.fromTo(p, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut', scrollTrigger: { trigger: p.closest('[data-brush]'), start: 'top 85%' } });
      });
      $$('.section-head').forEach((h) => {
        gsap.from(h.children, { opacity: 0, y: 16, duration: 0.5, stagger: 0.08, ease: 'power2.out', scrollTrigger: { trigger: h, start: 'top 85%' } });
      });

      // Grid stagger (design-system preset: back.out(1.4)).
      $$('[data-stagger]').forEach((g) => {
        gsap.from(g.children, { opacity: 0, y: 16, scale: 0.96, duration: 0.45, stagger: { each: 0.07, grid: 'auto', from: 'start' }, ease: 'back.out(1.4)', scrollTrigger: { trigger: g, start: 'top 82%' } });
      });

      gsap.from('.calc__main, .summary', { opacity: 0, y: 24, duration: 0.6, stagger: 0.12, ease: 'power2.out', scrollTrigger: { trigger: '.calc', start: 'top 80%' } });
      gsap.from('.ba', { opacity: 0, y: 24, scale: 0.98, duration: 0.7, ease: 'expo.out', scrollTrigger: { trigger: '.ba', start: 'top 85%' } });
      gsap.from('.callback', { opacity: 0, y: 24, duration: 0.6, ease: 'power2.out', scrollTrigger: { trigger: '.callback', start: 'top 85%' } });

      // Process timeline line + steps.
      const line = $('.process .process__line span');
      const steps = $$('.process li:not(.process__line)');
      const pm = gsap.matchMedia();
      pm.add({ wide: '(min-width: 901px)', narrow: '(max-width: 900px)' }, (ctx) => {
        const prop = ctx.conditions.wide ? 'scaleX' : 'scaleY';
        gsap.fromTo(line, { [prop]: 0 }, { [prop]: 1, ease: 'none', scrollTrigger: { trigger: '.process', start: 'top 75%', end: 'bottom 60%', scrub: 0.5 } });
      });
      steps.forEach((li) => {
        gsap.from(li.querySelector('.process__num'), { scale: 0.4, opacity: 0, duration: 0.5, ease: 'back.out(2)', scrollTrigger: { trigger: li, start: 'top 80%' } });
        gsap.from(li.querySelectorAll('h3, p'), { opacity: 0, y: 12, duration: 0.45, stagger: 0.06, ease: 'power2.out', scrollTrigger: { trigger: li, start: 'top 80%' } });
      });

      return () => {
        if (split) split.revert();
        if (onMove) hero.removeEventListener('pointermove', onMove);
        drift.kill();
        if (wallTl) wallTl.kill();
        pm.revert();
      };
    });
  }

  // Hero: a roller paints the wall stripe by stripe, cycling through palettes.
  function initWall() {
    const wall = $('[data-wall]');
    if (!wall) return null;
    const paints = $$('.wall__paint', wall);
    const roller = $('.wall__roller', wall);
    const swatch = $('[data-swatch]');
    const swatchName = $('[data-swatch-name]');
    let h = wall.offsetHeight;
    const ro = new ResizeObserver(() => { h = wall.offsetHeight; });
    ro.observe(wall);

    // Start from bare plaster; each new coat goes over the previous colour.
    gsap.set(paints, { scaleY: 0 });
    const last = paints.map(() => 'transparent');
    const tl = gsap.timeline({ repeat: -1, delay: 0.8 });
    PALETTES.forEach((pal) => {
      tl.call(() => { swatch.style.background = pal.colors[0]; swatchName.textContent = pal.name; });
      paints.forEach((p, i) => {
        const prog = { v: 0 };
        tl.call(() => { p.parentElement.style.background = last[i]; last[i] = pal.colors[i]; })
          .set(p, { background: pal.colors[i], scaleY: 0 })
          .set(roller, { xPercent: i * 100, opacity: 1 })
          .to(prog, {
            v: 1,
            duration: 1.1,
            ease: 'power1.inOut',
            onUpdate: () => {
              gsap.set(p, { scaleY: prog.v });
              gsap.set(roller, { y: prog.v * h - roller.offsetHeight * 0.18 });
            },
          });
      });
      tl.to(roller, { opacity: 0, duration: 0.25 }).to({}, { duration: 1.6 });
    });

    // Only animate while visible.
    window.ScrollTrigger.create({ trigger: wall, start: 'top bottom', end: 'bottom top', onToggle: (s) => (s.isActive ? tl.play() : tl.pause()) });
    document.addEventListener('visibilitychange', () => { if (document.hidden) tl.pause(); else if (window.ScrollTrigger.isInViewport(wall)) tl.play(); });
    return tl;
  }

  /* ================= Boot ================= */

  function boot() {
    addBrushes();
    initTheme();
    initChrome();
    initPhoneMask();
    initMarquee();
    initCalculator();
    initCallback();
    initAnimations();
    initBeforeAfter();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
