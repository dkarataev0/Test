"use strict";

/* ---------- Иконки (Lucide, MIT) ---------- */
const ICONS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  radar: '<path d="M19.07 4.93A10 10 0 1 0 22 12"/><path d="M16.24 7.76A6 6 0 1 0 18 12"/><circle cx="12" cy="12" r="2"/><path d="M12 12l7-7"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>',
  settings: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  x: '<path d="M18 6L6 18M6 6l12 12"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 6L2 7"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  chat: '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.9-.9L3 21l1.9-5.1A8.4 8.4 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5z"/>',
  send: '<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  alert: '<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6M10 14L21 3"/>',
  monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
  smartphone: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  beauty: '<path d="M6 3l6 9 6-9"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="18" r="3"/><path d="M8.1 15.9L12 12l3.9 3.9"/>',
  food: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>',
  auto: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  services: '<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/>',
};
function icon(name, size = 16) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;
}
function hydrateIcons(root = document) {
  root.querySelectorAll("[data-icon]").forEach(el => { el.outerHTML = icon(el.dataset.icon); });
}

/* ---------- Утилиты ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const digits = p => { let d = String(p || "").replace(/\D/g, ""); if (d.length === 11 && d[0] === "8") d = "7" + d.slice(1); return d; };
const plural = (n, one, few, many) => {
  const m10 = n % 10, m100 = n % 100;
  return m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? few : many;
};
async function api(path, opts = {}) {
  const r = await fetch(path, { headers: { "Content-Type": "application/json" }, ...opts });
  if (r.status === 401 && !path.startsWith("/api/login")) { location.href = "/login"; throw new Error("Нужно войти"); }
  if (!r.ok) {
    let msg = `Ошибка ${r.status}`;
    try { msg = (await r.json()).detail || msg; } catch {}
    throw new Error(msg);
  }
  return r.json();
}
let toastTimer;
function toast(text) {
  const t = $("#toast");
  t.innerHTML = icon("check") + esc(text);
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}
async function copy(text, label = "Скопировано") {
  try { await navigator.clipboard.writeText(text); }
  catch {
    const ta = Object.assign(document.createElement("textarea"), { value: text });
    document.body.append(ta); ta.select(); document.execCommand("copy"); ta.remove();
  }
  toast(label);
}

/* ---------- Настройки пользователя ---------- */
const SETTINGS_KEY = "leadfinder.me";
function loadSettings() { try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; } catch { return {}; } }
function saveSettings(s) { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch {} }
function fillPlaceholders(text) {
  const me = loadSettings();
  return text
    .replaceAll("[Ваше имя]", me.name || "[Ваше имя]")
    .replaceAll("[Ваш телефон]", me.phone || "[Ваш телефон]")
    .replaceAll("[Портфолио]", me.portfolio || "[Портфолио]");
}
const highlight = text => esc(text).replace(/\[(Ваше имя|Ваш телефон|Портфолио)\]/g, '<span class="placeholder">[$1]</span>');

/* ---------- Состояние ---------- */
const state = { meta: null, items: [], filters: { kind: "leads", niche: "", status: "", q: "" }, current: null, tab: "overview", variant: 0, device: "desktop" };

const KIND_FILTERS = [["leads", "Клиенты"], ["no_site", "Нет сайта"], ["social_only", "Соцсети"], ["bad_site", "Слабый сайт"], ["", "Все"]];

function kindBadge(c) {
  const label = c.kind === "bad_site" && c.score != null ? (c.score === 0 ? "Сайт не открылся" : `Сайт ${c.score}/100`) : state.meta.kinds[c.kind];
  return `<span class="badge ${c.kind}">${esc(label)}</span>`;
}

/* ---------- Загрузка ---------- */
async function loadMeta() {
  state.meta = await api("/api/meta");
  const m = state.meta;
  $("#city-label").textContent = m.city;
  $("#scan-city").textContent = m.city;
  $("#demo-banner").hidden = !m.demo;
  const leads = m.counts.no_site + m.counts.social_only + m.counts.bad_site;
  const stats = [
    ["leads", "Потенциальных клиентов", leads, "#3B82F6"],
    ["no_site", "Без сайта", m.counts.no_site, "#F43F5E"],
    ["social_only", "Только соцсети", m.counts.social_only, "#F59E0B"],
    ["bad_site", "Слабый сайт", m.counts.bad_site, "#FB923C"],
    ["deal", "Клиентов в работе", `${m.in_work} / ${m.deals}`, "#10B981"],
  ];
  $("#stats").innerHTML = stats.map(([k, label, v, color]) => `
    <button class="stat ${state.filters.kind === k ? "active" : ""}" data-kind="${k}" style="--accent:${color}" ${k === "deal" ? 'title="Написал или ответил / стали клиентами"' : ""}>
      <span class="stat-label"><i></i>${esc(label)}</span>
      <span class="stat-value">${esc(v)}</span>
    </button>`).join("");

  if ($("#niche-filter").options.length === 1) {
    for (const [k, v] of Object.entries(m.niches)) $("#niche-filter").add(new Option(v, k));
    for (const [k, v] of Object.entries(m.statuses)) $("#status-filter").add(new Option(v, k));
    $("#scan-niches").innerHTML = Object.entries(m.niches).map(([k, v]) =>
      `<label><input type="checkbox" name="niche" value="${k}" checked>${icon(k)}${esc(v)}</label>`).join("");
  }
}

async function loadList() {
  const f = state.filters;
  const qs = new URLSearchParams({ kind: f.kind, niche: f.niche, status: f.status, q: f.q });
  state.items = await api("/api/companies?" + qs);
  renderGrid();
}

function renderKindSeg() {
  $("#kind-filter").innerHTML = KIND_FILTERS.map(([k, v]) =>
    `<button role="tab" data-kind="${k}" class="${state.filters.kind === k ? "active" : ""}" aria-selected="${state.filters.kind === k}">${v}</button>`).join("");
  document.querySelectorAll(".stat").forEach(s => s.classList.toggle("active", s.dataset.kind === state.filters.kind));
}

function renderGrid() {
  const { items, meta } = state;
  const grid = $("#grid");
  const empty = $("#empty");
  if (!meta.total) {
    grid.innerHTML = ""; $("#result-line").textContent = "";
    empty.hidden = false;
    $("#empty-title").textContent = "Пока никого не нашли";
    $("#empty-text").textContent = `Запустите поиск: соберу малый бизнес (${meta.city}) из OpenStreetMap, проверю их сайты и покажу тех, кому нужен новый сайт.`;
    $("#empty-actions").hidden = false;
    return;
  }
  if (!items.length) {
    grid.innerHTML = ""; $("#result-line").textContent = "";
    empty.hidden = false;
    $("#empty-title").textContent = "Ничего не подходит под фильтры";
    $("#empty-text").textContent = "Попробуйте другую нишу или сбросьте поиск.";
    $("#empty-actions").hidden = true;
    return;
  }
  empty.hidden = true;
  $("#result-line").textContent = `Показано ${items.length} ${plural(items.length, "компания", "компании", "компаний")} · сначала самые перспективные`;
  grid.innerHTML = items.map((c, i) => {
    const has = { phone: !!c.phone, chat: !!(c.socials.whatsapp || c.socials.telegram || digits(c.phone).startsWith("79")), mail: !!c.email, globe: !!c.website, link: Object.keys(c.socials).length > 0 };
    return `
    <button class="company" data-id="${esc(c.id)}" style="animation-delay:${Math.min(i, 20) * 25}ms">
      <div class="c-top">
        <span class="cat"><span class="cat-ic">${icon(c.niche, 14)}</span>${esc(c.category)}</span>
        ${kindBadge(c)}
      </div>
      <h3>${esc(c.name)}</h3>
      <span class="addr">${icon("pin", 14)}${esc(c.address || "Адрес не указан")}</span>
      <div class="c-bottom">
        <span class="contacts-ic">${Object.entries(has).map(([k, on]) => `<span class="${on ? "on" : ""}" title="${{ phone: "Телефон", chat: "Мессенджер", mail: "Email", globe: "Сайт", link: "Соцсети" }[k]}">${icon(k, 14)}</span>`).join("")}</span>
        <span class="status-dot st-${c.status}"><i></i>${esc(meta.statuses[c.status])}</span>
      </div>
    </button>`;
  }).join("");
}

/* ---------- Карточка компании ---------- */
async function openCompany(id) {
  state.current = await api(`/api/companies/${encodeURIComponent(id)}`);
  state.tab = "overview";
  state.variant = 0;
  const c = state.current;
  $("#d-meta").innerHTML = `<span class="cat"><span class="cat-ic">${icon(c.niche, 14)}</span>${esc(c.category)}</span>${kindBadge({ ...c, score: c.audit?.score })}${c.demo ? '<span class="badge unchecked">демо</span>' : ""}`;
  $("#d-name").textContent = c.name;
  $("#d-address").textContent = [state.meta.city, c.address].filter(Boolean).join(", ");
  renderTab();
  $("#overlay").hidden = false;
  const d = $("#drawer");
  d.setAttribute("aria-hidden", "false");
  requestAnimationFrame(() => d.classList.add("open"));
  $("#d-close").focus();
}
function closeDrawer() {
  const d = $("#drawer");
  d.classList.remove("open");
  d.setAttribute("aria-hidden", "true");
  $("#overlay").hidden = true;
  state.current = null;
}

function renderTab() {
  document.querySelectorAll(".tabs button").forEach(b => {
    b.classList.toggle("active", b.dataset.tab === state.tab);
    b.setAttribute("aria-selected", b.dataset.tab === state.tab);
  });
  const body = $("#d-body");
  body.scrollTop = 0;
  body.innerHTML = { overview: renderOverview, messages: renderMessages, mockup: renderMockup }[state.tab]();
}

function contactRow(ic, label, value, href, copyVal) {
  return `<a class="c-item" ${href ? `href="${esc(href)}" target="_blank" rel="noopener"` : ""}>
    <span class="ic">${icon(ic)}</span>
    <span><small>${esc(label)}</small><span class="val">${esc(value)}</span></span>
    ${copyVal ? `<button class="btn btn-ghost btn-sm icon-only copy" data-copy="${esc(copyVal)}" aria-label="Скопировать">${icon("copy", 14)}</button>` : ""}
  </a>`;
}

function renderOverview() {
  const c = state.current, m = state.meta;
  const d = digits(c.phone);
  const rows = [];
  if (c.phone) rows.push(contactRow("phone", "Телефон", c.phone, `tel:+${d}`, c.phone));
  if (c.email) rows.push(contactRow("mail", "Email", c.email, `mailto:${c.email}`, c.email));
  if (c.website) rows.push(contactRow("globe", "Сайт", c.website, c.website, c.website));
  const socialNames = { vk: "ВКонтакте", instagram: "Instagram", telegram: "Telegram", whatsapp: "WhatsApp", facebook: "Facebook", ok: "Одноклассники", link: "Страница" };
  for (const [k, v] of Object.entries(c.socials)) rows.push(contactRow(k === "telegram" || k === "whatsapp" ? "chat" : "link", socialNames[k] || k, v.replace(/^https?:\/\//, ""), v, v));
  if (c.opening_hours) rows.push(contactRow("clock", "Режим работы", humanHours(c.opening_hours)));

  const search2gis = `https://2gis.ru/search/${encodeURIComponent(c.name + " " + m.city)}`;
  const yandex = c.lat ? `https://yandex.ru/maps/?pt=${c.lon},${c.lat}&z=17&l=map` : `https://yandex.ru/maps/?text=${encodeURIComponent(c.name + " " + m.city)}`;
  const quick = [
    d && `<a class="btn btn-primary btn-sm" href="tel:+${d}">${icon("phone", 14)}Позвонить</a>`,
    d && `<a class="btn btn-success btn-sm" target="_blank" rel="noopener" href="https://wa.me/${d}">${icon("chat", 14)}WhatsApp</a>`,
    `<a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="${yandex}">${icon("pin", 14)}Яндекс Карты</a>`,
    `<a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="${search2gis}">${icon("search", 14)}Найти в 2ГИС</a>`,
  ].filter(Boolean).join("");

  let auditHtml;
  const a = c.audit;
  if (c.kind === "no_site") {
    auditHtml = `<div class="score"><div class="ring" style="--v:0"><b>—</b></div><div><strong>Сайта нет</strong><p>Компания есть на карте, но клиенты не могут найти её в поиске Яндекса и Google.</p></div></div>
      <div class="pitch">Лучший повод: предложите сайт-визитку с прайсом и онлайн-записью и покажите готовый макет.</div>`;
  } else if (c.kind === "social_only") {
    auditHtml = `<div class="score"><div class="ring" style="--v:15;--c:var(--warning)"><b>—</b></div><div><strong>Только соцсети</strong><p>Вместо сайта — страница в соцсетях. В поиске её почти не видно.</p></div></div>
      <div class="pitch">Повод: «соцсети + сайт» — сайт приводит клиентов из поиска, а соцсети удерживают.</div>`;
  } else if (a) {
    const color = a.score >= 60 ? "var(--success)" : a.score >= 35 ? "var(--orange)" : "var(--danger)";
    const verdict = !a.reachable ? "Сайт не открылся" : a.score >= 60 ? "Сайт в порядке" : a.score >= 35 ? "Требует обновления" : "Сайт сильно устарел";
    auditHtml = `<div class="score"><div class="ring" style="--v:${a.score};--c:${color}"><b>${a.score}</b></div>
        <div><strong>${verdict}</strong><p>${a.load_time ? `Загрузка ${a.load_time} с · ` : ""}${a.issues.length} ${plural(a.issues.length, "проблема", "проблемы", "проблем")}</p></div></div>
      ${a.issues.length ? `<ul class="issues">${a.issues.map(i => `<li>${icon("alert", 15)}<span>${esc(i)}</span></li>`).join("")}</ul>` : ""}`;
  } else {
    auditHtml = `<p class="c-none">Сайт не проверялся. Включите «Проверять качество сайтов» при поиске.</p>`;
  }

  const map = c.lat ? `<iframe class="map-frame" loading="lazy" title="Карта" src="https://www.openstreetmap.org/export/embed.html?bbox=${c.lon - 0.004},${c.lat - 0.0025},${c.lon + 0.004},${c.lat + 0.0025}&layer=mapnik&marker=${c.lat},${c.lon}"></iframe>` : "";

  return `
    <div class="panel">
      <h4>Статус работы</h4>
      <div class="status-pills">${Object.entries(m.statuses).map(([k, v]) => `<button class="st-${k} ${c.status === k ? "active" : ""}" data-status="${k}"><i></i>${v}</button>`).join("")}</div>
    </div>
    <div class="row2">
      <div class="panel">
        <h4>Контакты</h4>
        ${rows.length ? `<div class="c-items">${rows.join("")}</div>` : '<p class="c-none">Контактов в OpenStreetMap нет — поищите компанию в 2ГИС или Яндекс Картах.</p>'}
        <div class="quick">${quick}</div>
      </div>
      <div class="panel">
        <h4>Анализ сайта</h4>
        ${auditHtml}
      </div>
    </div>
    ${map ? `<div class="panel"><h4>На карте</h4>${map}</div>` : ""}
    <div class="panel">
      <h4>Заметка</h4>
      <textarea id="note" placeholder="Например: звонил 12.11, перезвонить после обеда, ЛПР — Ирина">${esc(c.note)}</textarea>
    </div>`;
}

function renderMessages() {
  const c = state.current;
  const me = loadSettings();
  const d = digits(c.phone);
  const tg = c.socials.telegram;
  const head = !me.name ? `<p class="hint">${icon("info", 14)}<span>Укажите своё имя и телефон — они подставятся в тексты. <a data-action="settings">Заполнить</a></span></p>` : "";
  return head + c.messages.map((msg, i) => {
    const text = fillPlaceholders(msg.text);
    const actions = [`<button class="btn btn-ghost btn-sm" data-copy-msg="${i}">${icon("copy", 14)}Копировать</button>`];
    if (msg.channel === "whatsapp" || msg.channel === "followup") {
      if (d) actions.push(`<a class="btn btn-success btn-sm" data-sent target="_blank" rel="noopener" href="https://wa.me/${d}?text=${encodeURIComponent(text)}">${icon("send", 14)}WhatsApp</a>`);
      if (tg) actions.push(`<a class="btn btn-ghost btn-sm" data-sent data-copy-msg="${i}" target="_blank" rel="noopener" href="${esc(tg)}">${icon("send", 14)}Telegram</a>`);
    }
    if (msg.channel === "email" && c.email) {
      actions.push(`<a class="btn btn-primary btn-sm" data-sent href="mailto:${esc(c.email)}?subject=${encodeURIComponent(msg.subject)}&body=${encodeURIComponent(text)}">${icon("mail", 14)}Отправить</a>`);
    }
    if (msg.channel === "call" && d) actions.push(`<a class="btn btn-primary btn-sm" data-sent href="tel:+${d}">${icon("phone", 14)}Позвонить</a>`);
    const ic = { whatsapp: "chat", email: "mail", call: "phone", followup: "clock" }[msg.channel];
    return `<div class="msg">
      <div class="msg-head"><b>${icon(ic)}${esc(msg.title)}</b><div class="msg-actions">${actions.join("")}</div></div>
      ${msg.subject ? `<div class="msg-subject">Тема: <b>${esc(msg.subject)}</b></div>` : ""}
      <div class="msg-text">${highlight(text)}</div>
    </div>`;
  }).join("") + `<p class="hint">${icon("info", 14)}Совет: приложите к сообщению скриншот макета со вкладки «Макет сайта» — это сильно повышает отклик.</p>`;
}

function renderMockup() {
  const c = state.current;
  const src = `/mockup/${encodeURIComponent(c.id)}?variant=${state.variant}`;
  return `
    <div class="mock-bar">
      <div class="seg" role="tablist" aria-label="Стиль макета">${state.meta.themes.map((t, i) => `<button data-variant="${i}" class="${state.variant === i ? "active" : ""}">${esc(t)}</button>`).join("")}</div>
      <div class="seg" role="tablist" aria-label="Устройство">
        <button data-device="desktop" class="${state.device === "desktop" ? "active" : ""}" aria-label="Компьютер">${icon("monitor", 15)}</button>
        <button data-device="mobile" class="${state.device === "mobile" ? "active" : ""}" aria-label="Телефон">${icon("smartphone", 15)}</button>
      </div>
    </div>
    <div class="mock-stage">
      <div class="browser ${state.device === "mobile" ? "mobile" : ""}">
        <div class="browser-bar"><i></i><i></i><i></i><span>${esc(slug(c.name))}.ru</span></div>
        <iframe src="${src}" title="Макет сайта ${esc(c.name)}"></iframe>
      </div>
    </div>
    <div class="quick">
      <a class="btn btn-primary btn-sm" href="${src}" target="_blank" rel="noopener">${icon("external", 14)}Открыть в новой вкладке</a>
      <button class="btn btn-ghost btn-sm" data-copy="${esc(location.origin + src)}">${icon("link", 14)}Ссылка для клиента</button>
      <a class="btn btn-ghost btn-sm" href="${src}&download=1">${icon("download", 14)}Скачать HTML</a>
    </div>
    <p class="hint">${icon("info", 14)}Откройте макет в новой вкладке и сделайте скриншот — его удобно отправить клиенту вместе с сообщением.</p>`;
}

function humanHours(v) {
  if (v.trim() === "24/7") return "Круглосуточно";
  const days = { Mo: "Пн", Tu: "Вт", We: "Ср", Th: "Чт", Fr: "Пт", Sa: "Сб", Su: "Вс", PH: "праздники", off: "выходной", closed: "выходной" };
  return v.replace(/\b(Mo|Tu|We|Th|Fr|Sa|Su|PH|off|closed)\b/g, m => days[m]).replace(/-/g, "–").replace(/;\s*/g, " · ");
}

function slug(name) {
  const map = { а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch", ы: "y", э: "e", ю: "yu", я: "ya" };
  const m = name.match(/«([^»]+)»/);
  const base = (m ? m[1] : name).toLowerCase();
  return [...base].map(ch => map[ch] ?? ch).join("").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "site";
}

async function setStatus(status) {
  const c = state.current;
  if (!c || c.status === status) return;
  await api(`/api/companies/${encodeURIComponent(c.id)}`, { method: "PATCH", body: JSON.stringify({ status }) });
  c.status = status;
  if (state.tab === "overview") renderTab();
  toast(`Статус: ${state.meta.statuses[status]}`);
  await Promise.all([loadMeta(), loadList()]);
}

/* ---------- Поиск (шагами: найти компании → проверить сайты пачками) ---------- */
let scanning = false;
function setProgress(pct, text, error = false) {
  const bar = $("#scan-bar"), wrap = bar.parentElement;
  $("#scan-progress").hidden = false;
  wrap.classList.toggle("indeterminate", pct === null);
  bar.style.width = pct === null ? "" : `${pct}%`;
  $("#scan-msg").textContent = text;
  $("#scan-msg").style.color = error ? "#FDA4AF" : "";
}
async function startScan(e) {
  e.preventDefault();
  if (scanning) return;
  const niches = [...document.querySelectorAll("#scan-niches input:checked")].map(i => i.value);
  if (!niches.length) { toast("Выберите хотя бы одну нишу"); return; }
  scanning = true;
  $("#scan-start").disabled = true;
  try {
    setProgress(null, `Ищу компании (${state.meta.city}) в OpenStreetMap… это может занять до 2 минут`);
    const found = await searchCompanies(niches);
    await Promise.all([loadMeta(), loadList()]);
    if ($("#scan-audit").checked) await auditSites(found.to_audit);
    setProgress(100, `Готово: найдено ${found.found} ${plural(found.found, "компания", "компании", "компаний")}`);
    await Promise.all([loadMeta(), loadList()]);
    toast("Поиск завершён");
  } catch (err) {
    setProgress(0, err.message, true);
  } finally {
    scanning = false;
    $("#scan-start").disabled = false;
  }
}
// Сначала браузер сам спрашивает OpenStreetMap (все зеркала параллельно, берём первый ответ),
// если не вышло — просим сервер.
async function searchCompanies(niches) {
  const body = JSON.stringify({ niches });
  const { query, servers } = await api("/api/scan/query", { method: "POST", body });
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 120000);
  const ask = async url => {
    const r = await fetch(url, { method: "POST", body: new URLSearchParams({ data: query }), signal: ctrl.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();
    if (!data.elements || (!data.elements.length && /error/i.test(data.remark || ""))) throw new Error(data.remark || "пустой ответ");
    return data.elements;
  };
  let elements = null;
  try { elements = await Promise.any(servers.map(ask)); }
  catch { elements = null; }
  finally { clearTimeout(timer); ctrl.abort(); }
  if (elements) {
    setProgress(null, `Получено объектов: ${elements.length}. Сохраняю…`);
    const slim = elements.map(e => ({ type: e.type, id: e.id, lat: e.lat, lon: e.lon, center: e.center, tags: e.tags }));
    return api("/api/scan/import", { method: "POST", body: JSON.stringify({ elements: slim }) });
  }
  setProgress(null, "Прямой запрос не удался, пробую через сервер…");
  return api("/api/scan/search", { method: "POST", body });
}

async function auditSites(total) {
  total = Math.max(total, 1);
  let remaining = total;
  setProgress(0, "Проверяю сайты…");
  while (remaining > 0) {
    const r = await api("/api/scan/audit", { method: "POST" });
    remaining = r.remaining;
    const done = Math.max(total - remaining, 0);
    setProgress(Math.round(done / total * 100), `Проверено сайтов: ${done} из ${total}${r.last ? ` · ${r.last}` : ""}`);
    if (!r.checked) break;
    await Promise.all([loadMeta(), loadList()]);
  }
}

function showResumeHint(n) {
  toast(`Не проверено сайтов: ${n}. Нажмите «Найти клиентов», чтобы продолжить`);
}
async function resumeAudit() {
  if (scanning) return;
  scanning = true;
  try { await auditSites(state.meta.pending_audit); toast("Сайты проверены"); }
  catch (err) { setProgress(0, err.message, true); }
  finally { scanning = false; await Promise.all([loadMeta(), loadList()]); }
}

/* ---------- События ---------- */
function bind() {
  $("#btn-settings").innerHTML = icon("settings", 18);
  $("#d-close").innerHTML = icon("x", 18);

  let qTimer;
  $("#q").addEventListener("input", e => { clearTimeout(qTimer); qTimer = setTimeout(() => { state.filters.q = e.target.value.trim(); loadList(); }, 200); });
  $("#niche-filter").addEventListener("change", e => { state.filters.niche = e.target.value; loadList(); });
  $("#status-filter").addEventListener("change", e => { state.filters.status = e.target.value; loadList(); });

  document.addEventListener("click", e => {
    const t = e.target.closest("[data-kind], .company, [data-action], [data-copy], [data-copy-msg], [data-status], [data-variant], [data-device], .tabs button");
    if (!t) return;
    if (t.matches(".stat, #kind-filter button")) {
      const deal = t.dataset.kind === "deal";
      state.filters.kind = deal ? "" : t.dataset.kind;
      state.filters.status = deal ? "deal" : "";
      $("#status-filter").value = state.filters.status;
      renderKindSeg(); loadList(); return;
    }
    if (t.matches(".company")) { openCompany(t.dataset.id); return; }
    if (t.dataset.action === "scan") { $("#scan-dialog").showModal(); return; }
    if (t.dataset.action === "settings") { openSettings(); return; }
    if (t.dataset.action === "demo") {
      api("/api/demo", { method: "POST" }).then(() => Promise.all([loadMeta(), loadList()])).then(() => toast("Демо-данные загружены"));
      return;
    }
    if (t.dataset.copy !== undefined) { e.preventDefault(); e.stopPropagation(); copy(t.dataset.copy); return; }
    if (t.dataset.copyMsg !== undefined) {
      const msg = state.current.messages[+t.dataset.copyMsg];
      copy(fillPlaceholders(msg.subject ? `${msg.subject}\n\n${msg.text}` : msg.text), "Текст скопирован");
      if (t.hasAttribute("data-sent")) setStatus("contacted");
      return;
    }
    if (t.dataset.status) { setStatus(t.dataset.status); return; }
    if (t.dataset.variant) { state.variant = +t.dataset.variant; renderTab(); return; }
    if (t.dataset.device) { state.device = t.dataset.device; renderTab(); return; }
    if (t.matches(".tabs button")) { state.tab = t.dataset.tab; renderTab(); }
  });
  // отметка «Написал» при отправке через мессенджер/почту
  document.addEventListener("click", e => {
    const a = e.target.closest("a[data-sent]:not([data-copy-msg])");
    if (a) setStatus("contacted");
  }, true);

  let noteTimer;
  document.addEventListener("input", e => {
    if (e.target.id !== "note") return;
    clearTimeout(noteTimer);
    const c = state.current, note = e.target.value;
    noteTimer = setTimeout(async () => {
      await api(`/api/companies/${encodeURIComponent(c.id)}`, { method: "PATCH", body: JSON.stringify({ note }) });
      c.note = note; toast("Заметка сохранена");
    }, 700);
  });

  $("#d-close").addEventListener("click", closeDrawer);
  $("#overlay").addEventListener("click", closeDrawer);
  document.addEventListener("keydown", e => { if (e.key === "Escape" && state.current) closeDrawer(); });

  $("#btn-scan").addEventListener("click", () => {
    $("#scan-dialog").showModal();
    $("#scan-resume").hidden = !state.meta.pending_audit;
    $("#scan-resume").textContent = `Допроверить сайты (${state.meta.pending_audit})`;
  });
  $("#scan-resume").addEventListener("click", resumeAudit);
  $("#btn-logout").addEventListener("click", async () => { await api("/api/logout", { method: "POST" }); location.href = "/login"; });
  $("#scan-cancel").addEventListener("click", () => $("#scan-dialog").close());
  $("#scan-form").addEventListener("submit", startScan);

  $("#btn-settings").addEventListener("click", openSettings);
  $("#settings-cancel").addEventListener("click", () => $("#settings-dialog").close());
  $("#settings-form").addEventListener("submit", () => {
    const f = new FormData($("#settings-form"));
    saveSettings({ name: f.get("name").trim(), phone: f.get("phone").trim(), portfolio: f.get("portfolio").trim() });
    toast("Данные сохранены");
    if (state.current && state.tab === "messages") renderTab();
  });
}
function openSettings() {
  const me = loadSettings(), f = $("#settings-form");
  $("#btn-logout").hidden = !state.meta?.auth;
  f.name.value = me.name || ""; f.phone.value = me.phone || ""; f.portfolio.value = me.portfolio || "";
  $("#settings-dialog").showModal();
}

/* ---------- Старт ---------- */
(async function init() {
  hydrateIcons();
  bind();
  $("#grid").innerHTML = Array.from({ length: 6 }, () => '<div class="skeleton"></div>').join("");
  try {
    await loadMeta();
    renderKindSeg();
    await loadList();
    if (state.meta.pending_audit) showResumeHint(state.meta.pending_audit);
  } catch (err) {
    $("#grid").innerHTML = "";
    $("#empty").hidden = false;
    $("#empty-title").textContent = "Не удалось загрузить данные";
    $("#empty-text").textContent = err.message;
  }
})();
