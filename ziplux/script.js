// ЗИП ЛЮКС — поведение сайта
// Цены и контакты меняются здесь, в одном месте.
const CONFIG = {
  pricePerM2: 15000,                 // базовая ставка за м², ₽
  fabricK: { 0: 1.15, 3: 1, 5: 1, 10: 1 }, // коэффициент ткани по открытости
  control: { remote: 0, smart: 9000, solar: 14000 },  // доплата за изделие, ₽
  windSensor: 7500,                  // за комплект, ₽
  mount: { surface: 0, inset: 0.05, hidden: 0.12 },   // надбавка к базе, доля
  installPerItem: 6000,              // монтаж за изделие, ₽
  maxW: 4.5, maxH: 4.8, maxArea: 16.8,
  whatsapp: "70000000000",
  // Обработчик заявок: Formspree, Netlify Forms, свой бэкенд. Пусто — откроется WhatsApp.
  formEndpoint: "",
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const rub = (n) => new Intl.NumberFormat("ru-RU").format(Math.round(n / 100) * 100) + " ₽";
const dec = (s) => parseFloat(String(s).replace(",", "."));
const comma = (n) => String(n).replace(".", ",");
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
root.classList.add("js");

/* ---------- header ---------- */
const hdr = $("#hdr");
const onScroll = () => hdr.classList.toggle("is-solid", scrollY > 20);
addEventListener("scroll", onScroll, { passive: true });
onScroll();

const burger = $("#burger"), menu = $("#menu");
const setMenu = (open) => {
  menu.classList.toggle("is-open", open);
  burger.setAttribute("aria-expanded", String(open));
  hdr.classList.toggle("is-solid", open || scrollY > 20);
};
burger.addEventListener("click", () => setMenu(!menu.classList.contains("is-open")));
menu.addEventListener("click", (e) => e.target.closest("a") && setMenu(false));
addEventListener("keydown", (e) => e.key === "Escape" && menu.classList.contains("is-open") && (setMenu(false), burger.focus()));

/* ---------- reveal on scroll ---------- */
if ("IntersectionObserver" in window && !reduced) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -8% 0px" });
  $$(".reveal").forEach((el) => {
    const sibs = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
    el.style.setProperty("--d", `${Math.min(sibs.indexOf(el), 5) * 70}ms`);
    io.observe(el);
  });
} else {
  $$(".reveal").forEach((el) => el.classList.add("is-in"));
}

/* ---------- hero scene ---------- */
const pos = $("#screenPos"), pct = $("#scenePct"), msg = $("#sceneMsg");
function setDrop(v) {
  root.style.setProperty("--drop", v / 100);
  pos.style.setProperty("--fill", v + "%");
  pct.textContent = v + "%";
  pos.setAttribute("aria-valuetext", `Экран опущен на ${v}%`);
  const [text, color] = v >= 85 ? ["Солнце и ветер снаружи", "#4cc38a"]
    : v >= 40 ? ["Солнце остаётся снаружи", "#4cc38a"]
    : v > 0 ? ["Солнце уже греет комнату", "#f0a443"]
    : ["Экран поднят — жарко", "#ef6a4a"];
  msg.textContent = text;
  msg.style.setProperty("--chip", color);
}
pos.addEventListener("input", () => setDrop(+pos.value));
setDrop(+pos.value);
// небольшая демонстрация при загрузке
if (!reduced) {
  pos.value = 0; setDrop(0);
  setTimeout(() => { pos.value = 85; setDrop(85); }, 700);
}

/* ---------- solutions ---------- */
const SOL = {
  house: {
    title: "Панорамные окна частного дома",
    lead: "Экран снаружи не пускает солнце к стеклу — в гостиной прохладно, мебель и полы не выгорают.",
    list: ["Меньше нагрузка на кондиционер", "Приватность без плотных штор", "Короб можно спрятать в фасад"],
    fabric: "3% — Антрацит", control: "Smart + датчик солнца",
    art: { bg: "linear-gradient(160deg,#f1c58f,#e2a66d)", l: "12%", r: "12%", t: "14%", floor: "#8d6a4b" },
    cfg: { w: "3,0", h: "2,6", open: "3", ctrl: "smart" },
  },
  terrace: {
    title: "Открытая терраса",
    lead: "Терраса превращается в дополнительную комнату — защищённую от солнца, ветра и комаров.",
    list: ["Можно сидеть в жару и ветер", "Без насекомых летними вечерами", "Обзор на сад сохраняется"],
    fabric: "5% — Лён", control: "Пульт + датчик ветра",
    art: { bg: "linear-gradient(160deg,#b9d3c0,#86a98f)", l: "5%", r: "5%", t: "18%", floor: "#9a7a58" },
    cfg: { w: "4,0", h: "2,5", open: "5", ctrl: "remote" },
  },
  pergola: {
    title: "Пергола и беседка",
    lead: "ZIP-экраны по периметру перголы закрывают боковые проёмы. Для беседки без проводки — привод на солнечной панели.",
    list: ["Работает без прокладки кабеля", "Каждую сторону можно опустить отдельно", "Профиль в цвет конструкции"],
    fabric: "10% — Графит", control: "Solar + пульт",
    art: { bg: "linear-gradient(160deg,#c9d7e6,#93acc5)", l: "18%", r: "18%", t: "20%", floor: "#7e6a55" },
    cfg: { w: "3,5", h: "2,4", open: "10", ctrl: "solar" },
  },
  horeca: {
    title: "Летние веранды кафе и ресторанов",
    lead: "Веранда работает в любую погоду и приносит выручку весь сезон, а не только в солнечные дни.",
    list: ["Больше посадочных дней в сезоне", "Логотип можно нанести на полотно", "Групповое управление всеми экранами"],
    fabric: "3% — Бронза", control: "Smart, групповые сценарии",
    art: { bg: "linear-gradient(160deg,#e9b79c,#c98a6c)", l: "8%", r: "8%", t: "16%", floor: "#6f4f3a" },
    cfg: { w: "4,5", h: "2,8", open: "3", ctrl: "smart" },
  },
};
let currentSol = "house";
const solTabs = $$(".sol__tabs [role=tab]");
function showSol(key, focus) {
  currentSol = key;
  const s = SOL[key];
  solTabs.forEach((t) => {
    const on = t.dataset.sol === key;
    t.setAttribute("aria-selected", String(on));
    t.tabIndex = on ? 0 : -1;
    if (on) { $("#p-sol").setAttribute("aria-labelledby", t.id); if (focus) t.focus(); }
  });
  $("#solTitle").textContent = s.title;
  $("#solLead").textContent = s.lead;
  $("#solList").innerHTML = s.list.map((x) => `<li>${x}</li>`).join("");
  $("#solFabric").textContent = s.fabric;
  $("#solControl").textContent = s.control;
  const art = $("#solArt");
  art.style.setProperty("--art-bg", s.art.bg);
  art.style.setProperty("--art-l", s.art.l);
  art.style.setProperty("--art-r", s.art.r);
  art.style.setProperty("--art-t", s.art.t);
  art.style.setProperty("--art-floor", s.art.floor);
  art.classList.remove("fade"); void art.offsetWidth; art.classList.add("fade");
}
solTabs.forEach((t, i) => {
  t.addEventListener("click", () => showSol(t.dataset.sol));
  t.addEventListener("keydown", (e) => {
    const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!d) return;
    e.preventDefault();
    showSol(solTabs[(i + d + solTabs.length) % solTabs.length].dataset.sol, true);
  });
});
showSol("house");
$("#solToConfig").addEventListener("click", () => {
  const c = SOL[currentSol].cfg;
  $("#cW").value = c.w; $("#cH").value = c.h;
  $(`input[name=open][value="${c.open}"]`).checked = true;
  $(`input[name=ctrl][value="${c.ctrl}"]`).checked = true;
  $("#cWind").checked = currentSol !== "house";
  calc();
  $("#config").scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
});

/* ---------- technology ---------- */
const PARTS = [
  ["Короб", "Алюминиевый короб 110 или 125 мм защищает свёрнутое полотно от пыли, дождя и ультрафиолета. Бывает накладным, встроенным и скрытым."],
  ["Вал", "Стальной вал подобран под ширину и вес полотна, поэтому ткань наматывается ровно, без складок и провисания."],
  ["Электропривод", "Тихий трубчатый мотор спрятан внутри вала. Встроенный радиоприёмник работает с пультом, датчиками и умным домом."],
  ["Полотно", "Технический текстиль, который не растягивается, не выгорает и легко моется. Открытость от 0 до 10%."],
  ["Направляющие и молния", "По краям ткани — молния, которая скользит во вкладыше направляющей 33 × 43 мм. Именно она держит полотно на ветру и закрывает щели."],
  ["Нижняя планка", "Утяжелённый профиль натягивает ткань и плотно прилегает к полу, закрывая нижнюю щель."],
];
const partsList = $("#partsList");
partsList.innerHTML = PARTS.map(([t, d], i) =>
  `<li><button type="button" aria-expanded="false" aria-controls="pd${i}" data-part="${i}">${t}</button><p id="pd${i}">${d}</p></li>`).join("");
function showPart(i) {
  $$("li", partsList).forEach((li, j) => {
    li.classList.toggle("is-on", j === i);
    $("button", li).setAttribute("aria-expanded", String(j === i));
  });
  $$(".hs").forEach((h) => h.classList.toggle("is-on", +h.dataset.part === i));
}
partsList.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) showPart(+b.dataset.part); });
$$(".hs").forEach((h) => h.addEventListener("click", () => { showPart(+h.dataset.part); }));
showPart(4);

/* ---------- configurator ---------- */
const cW = $("#cW"), cH = $("#cH"), cQ = $("#cQ");
const val = (name) => $(`input[name=${name}]:checked`);
let summary = "";

function calc() {
  const w = dec(cW.value), h = dec(cH.value), q = Math.max(1, Math.floor(dec(cQ.value)) || 1);
  const open = val("open"), color = val("color"), ctrl = val("ctrl").value, mount = val("mount").value;
  const wind = $("#cWind").checked;

  root.style.setProperty("--cloth", color.value);
  root.style.setProperty("--holes", String(0.03 + open.value * 0.03));

  let err = "";
  if (!(w > 0) || !(h > 0)) err = "Укажите ширину и высоту проёма.";
  else if (w > CONFIG.maxW) err = `Ширина больше ${comma(CONFIG.maxW)} м — разделим проём на ${Math.ceil(w / CONFIG.maxW)} изделия.`;
  else if (h > CONFIG.maxH) err = `Высота больше ${comma(CONFIG.maxH)} м — нужна индивидуальная проработка.`;
  else if (w * h > CONFIG.maxArea) err = `Площадь больше ${comma(CONFIG.maxArea)} м² — разделим на несколько изделий.`;
  $("#sizeErr").textContent = err;
  cW.setAttribute("aria-invalid", String(!(w > 0) || w > CONFIG.maxW));
  cH.setAttribute("aria-invalid", String(!(h > 0) || h > CONFIG.maxH));

  if (!(w > 0) || !(h > 0)) {
    $("#cfgLines").innerHTML = "";
    $("#cfgTotal").textContent = "—";
    summary = "";
    return;
  }
  $(".cfg__win").style.setProperty("--ratio", String(Math.min(Math.max(w / h, .6), 2.2)));

  const area = w * h * q;
  const base = area * CONFIG.pricePerM2 * CONFIG.fabricK[open.value] * (1 + CONFIG.mount[mount]);
  const ctrlCost = CONFIG.control[ctrl] * q;
  const windCost = wind ? CONFIG.windSensor : 0;
  const install = CONFIG.installPerItem * q;
  const total = base + ctrlCost + windCost + install;

  const ctrlName = { remote: "пульт", smart: "Smart", solar: "Solar" }[ctrl];
  const mountName = { surface: "накладной", inset: "встроенный", hidden: "скрытый" }[mount];
  const lines = [
    [`Экран ${comma(w)} × ${comma(h)} м${q > 1 ? ` × ${q}` : ""} · ${comma(area.toFixed(1))} м²`, base],
    [`Ткань ${open.value}%, ${color.dataset.name.toLowerCase()} · монтаж ${mountName}`, null],
    [`Управление: ${ctrlName}`, ctrlCost],
    ...(wind ? [["Датчик ветра и солнца", windCost]] : []),
    ["Монтаж и настройка", install],
  ];
  $("#cfgLines").innerHTML = lines.map(([t, v]) =>
    `<li><span>${t}</span><b>${v === null ? "" : v === 0 ? "включено" : rub(v)}</b></li>`).join("");
  $("#cfgTotal").textContent = rub(total);
  summary = `Конфигурация: ${comma(w)}×${comma(h)} м, ${q} шт, ткань ${open.value}% ${color.dataset.name}, ${ctrlName}${wind ? " + датчик ветра" : ""}, монтаж ${mountName}. Ориентировочно ${rub(total)}.`;
}
$("#cfg").addEventListener("input", calc);
$("#cfg").addEventListener("change", calc);
calc();

$("#cfgSend").addEventListener("click", () => {
  if (summary) $("#lfNote").value = summary;
  $("#lead").scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
  setTimeout(() => $("#lfPhone").focus({ preventScroll: true }), reduced ? 0 : 600);
});

/* ---------- lead form ---------- */
const form = $("#leadForm"), phone = $("#lfPhone"), status = $("#lfStatus"), btn = $("#lfBtn");

// мягкая маска +7 (XXX) XXX-XX-XX
phone.addEventListener("input", () => {
  let d = phone.value.replace(/\D/g, "");
  if (!d) { phone.value = ""; return; }
  if (d[0] === "8") d = "7" + d.slice(1);
  if (d[0] !== "7") d = "7" + d;
  d = d.slice(0, 11);
  const p = [d.slice(1, 4), d.slice(4, 7), d.slice(7, 9), d.slice(9, 11)];
  phone.value = "+7" + (p[0] ? ` (${p[0]}` : "") + (p[0].length === 3 ? ")" : "") + (p[1] ? ` ${p[1]}` : "") + (p[2] ? `-${p[2]}` : "") + (p[3] ? `-${p[3]}` : "");
});

function setErr(input, errEl, text) {
  errEl.textContent = text;
  if (input) input.setAttribute("aria-invalid", String(!!text));
  return !text;
}
phone.addEventListener("blur", () => {
  if (phone.value) setErr(phone, $("#lfPhoneErr"), phone.value.replace(/\D/g, "").length === 11 ? "" : "Номер должен содержать 11 цифр");
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const digits = phone.value.replace(/\D/g, "");
  const okPhone = setErr(phone, $("#lfPhoneErr"), digits.length === 11 ? "" : "Укажите номер телефона полностью");
  const okAgree = setErr(null, $("#lfAgreeErr"), $("#lfAgree").checked ? "" : "Отметьте согласие на обработку данных");
  if (!okPhone) return phone.focus();
  if (!okAgree) return $("#lfAgree").focus();

  const data = Object.fromEntries(new FormData(form));
  const text = `Заявка на замер — ЗИП ЛЮКС\nИмя: ${data.name || "—"}\nТелефон: ${data.phone}\nСвязь: ${data.via}\n${data.note || ""}`;
  status.className = "lf__status";
  btn.setAttribute("aria-busy", "true");
  btn.textContent = "Отправляем…";
  try {
    if (CONFIG.formEndpoint) {
      const res = await fetch(CONFIG.formEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(String(res.status));
    } else {
      window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
    }
    status.classList.add("ok");
    status.textContent = "Спасибо! Перезвоним в течение 15 минут в рабочее время.";
    form.reset();
  } catch {
    status.classList.add("err");
    status.textContent = "Не получилось отправить. Позвоните нам: +7 (000) 000-00-00.";
  } finally {
    btn.removeAttribute("aria-busy");
    btn.textContent = "Записаться на замер";
  }
});

$("#yr").textContent = new Date().getFullYear();
