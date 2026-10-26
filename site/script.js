// Настройки, которые нужно поменять под вашу компанию
const CONFIG = {
  pricePerM2: 15000,        // базовая ставка, ₽ за м²
  maxWidth: 4.5,            // м
  maxHeight: 4.8,           // м
  maxArea: 16.8,            // м²
  whatsapp: "70000000000",  // номер для WhatsApp без «+»
  // Адрес обработчика заявок (например, Formspree, Netlify Forms или свой бэкенд).
  // Пока пусто — заявка открывается в WhatsApp с готовым текстом.
  formEndpoint: "",
};

const rub = (n) => new Intl.NumberFormat("ru-RU").format(Math.round(n)) + " ₽";
const fmt = (n) => String(n).replace(".", ",");
const num = (s) => parseFloat(String(s).replace(",", "."));

// Мобильное меню
const burger = document.getElementById("burger");
const nav = document.getElementById("nav");
burger.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  burger.setAttribute("aria-expanded", String(open));
});
nav.addEventListener("click", (e) => {
  if (e.target.tagName === "A") {
    nav.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
  }
});

// Элементы конструкции
const PARTS = [
  ["Короб", "Алюминиевый короб защищает свёрнутое полотно и привод от пыли и осадков. Доступен накладной, встроенный и полностью скрытый в фасаде вариант."],
  ["Вал", "Стальной оцинкованный вал рассчитан на ширину и вес полотна, чтобы ткань наматывалась ровно, без складок и провисания."],
  ["Электропривод", "Трубчатый мотор спрятан внутри вала. Встроенный радиоприёмник позволяет подключить пульт, датчики и умный дом без лишних проводов."],
  ["Полотно", "Технический текстиль из стекловолокна или полиэстера в ПВХ-оболочке: не растягивается, не выгорает и легко моется."],
  ["Направляющие", "Профиль 33 × 43 мм с вкладышем, внутри которого скользит молния полотна. Именно он удерживает ткань на ветру."],
  ["Нижняя планка", "Утяжелённый профиль натягивает полотно и плотно прилегает к полу или подоконнику, закрывая нижнюю щель."],
];
const tabs = document.querySelectorAll(".parts__tabs button");
tabs.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabs.forEach((b) => b.setAttribute("aria-selected", "false"));
    btn.setAttribute("aria-selected", "true");
    const [title, text] = PARTS[btn.dataset.part];
    document.getElementById("partTitle").textContent = title;
    document.getElementById("partText").textContent = text;
  });
});

// Выбор ткани — меняет цвет экрана в превью и на главной иллюстрации
const root = document.documentElement;
let fabric = { name: "Антрацит", open: 3 };
function updateFabric() {
  const color = document.querySelector('input[name="color"]:checked');
  const open = document.querySelector('input[name="open"]:checked');
  fabric = { name: color.dataset.name, open: Number(open.value) };
  root.style.setProperty("--screen-color", color.value);
  // 0% → почти непрозрачно, 10% → заметно просвечивает
  root.style.setProperty("--screen-holes", String(0.02 + fabric.open * 0.035));
  document.getElementById("fabricSummary").textContent = `${fabric.name}, открытость ${fabric.open}%`;
}
document.querySelectorAll('input[name="color"], input[name="open"]').forEach((el) => el.addEventListener("change", updateFabric));
updateFabric();

// Калькулятор
const itemsEl = document.getElementById("calcItems");
let items = [{ w: "3", h: "2.5", q: "1" }];

function renderItems() {
  itemsEl.innerHTML = "";
  items.forEach((it, i) => {
    const row = document.createElement("div");
    row.className = "calc__row";
    row.innerHTML = `
      <span class="calc__num">${String(i + 1).padStart(2, "0")}</span>
      <label>Ширина, м<input inputmode="decimal" data-k="w" value="${it.w}"></label>
      <label>Высота, м<input inputmode="decimal" data-k="h" value="${it.h}"></label>
      <label>Кол-во<input inputmode="numeric" data-k="q" value="${it.q}"></label>
      <span class="calc__sum"></span>
      <button class="calc__del" type="button" aria-label="Удалить изделие ${i + 1}" ${items.length === 1 ? "disabled" : ""}>×</button>
      <p class="calc__warn" hidden></p>`;
    row.querySelectorAll("input").forEach((input) => {
      input.addEventListener("input", () => { items[i][input.dataset.k] = input.value; calculate(); });
    });
    row.querySelector(".calc__del").addEventListener("click", () => { items.splice(i, 1); renderItems(); });
    itemsEl.appendChild(row);
  });
  calculate();
}

function calculate() {
  let total = 0, area = 0;
  itemsEl.querySelectorAll(".calc__row").forEach((row, i) => {
    const w = num(items[i].w), h = num(items[i].h), q = Math.max(0, Math.floor(num(items[i].q)) || 0);
    const warn = row.querySelector(".calc__warn");
    const sumEl = row.querySelector(".calc__sum");
    let msg = "";
    if (!(w > 0) || !(h > 0)) msg = "Укажите ширину и высоту";
    else if (w > CONFIG.maxWidth) msg = `Ширина больше ${fmt(CONFIG.maxWidth)} м — разделим проём на несколько изделий`;
    else if (h > CONFIG.maxHeight) msg = `Высота больше ${fmt(CONFIG.maxHeight)} м — нужна индивидуальная проработка`;
    else if (w * h > CONFIG.maxArea) msg = `Площадь больше ${fmt(CONFIG.maxArea)} м² — разделим на несколько изделий`;
    warn.hidden = !msg;
    warn.textContent = msg;
    if (w > 0 && h > 0) {
      const a = w * h * q;
      area += a;
      total += a * CONFIG.pricePerM2;
      sumEl.textContent = rub(a * CONFIG.pricePerM2);
    } else {
      sumEl.textContent = "—";
    }
  });
  document.getElementById("calcTotal").textContent = rub(total);
  document.getElementById("calcArea").textContent = `${area.toFixed(2).replace(".", ",")} м² · ${rub(CONFIG.pricePerM2)}/м²`;
}

document.getElementById("addItem").addEventListener("click", () => {
  items.push({ w: "", h: "", q: "1" });
  renderItems();
  itemsEl.querySelector(".calc__row:last-child input").focus();
});
document.getElementById("calcNote").textContent =
  `Расчёт по базовой ставке ${rub(CONFIG.pricePerM2)} за м². Стоимость ткани, автоматики и монтажа уточняется после замера.`;
renderItems();

function calcSummary() {
  const lines = items
    .filter((it) => num(it.w) > 0 && num(it.h) > 0)
    .map((it, i) => `${i + 1}) ${it.w} × ${it.h} м, ${it.q} шт`);
  return lines.length
    ? `Расчёт: ${lines.join("; ")}. Итого ≈ ${document.getElementById("calcTotal").textContent}. Ткань: ${fabric.name}, ${fabric.open}%.`
    : "";
}
document.getElementById("calcToForm").addEventListener("click", () => {
  document.getElementById("formComment").value = calcSummary();
});
document.getElementById("fabricToCalc").addEventListener("click", () => {
  const c = document.getElementById("formComment");
  if (!c.value) c.value = `Интересует ткань: ${fabric.name}, открытость ${fabric.open}%.`;
});

// Заявка
const form = document.getElementById("form");
const statusEl = document.getElementById("formStatus");
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  const digits = (data.phone || "").replace(/\D/g, "");
  form.elements.name.classList.toggle("invalid", !data.name.trim());
  form.elements.phone.classList.toggle("invalid", digits.length < 10 || digits.length > 15);
  statusEl.className = "form__status err";
  if (!data.name.trim()) return (statusEl.textContent = "Укажите имя");
  if (digits.length < 10 || digits.length > 15) return (statusEl.textContent = "Проверьте номер телефона");
  if (!data.agree) return (statusEl.textContent = "Нужно согласие на обработку данных");

  const text = `Заявка с сайта\nИмя: ${data.name}\nТелефон: ${data.phone}\nСвязь: ${data.via}\n${data.comment || ""}`;
  if (CONFIG.formEndpoint) {
    try {
      const res = await fetch(CONFIG.formEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(res.status);
    } catch {
      return (statusEl.textContent = "Не удалось отправить. Позвоните нам или напишите в WhatsApp.");
    }
  } else {
    window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  }
  statusEl.className = "form__status ok";
  statusEl.textContent = "Спасибо! Мы свяжемся с вами в ближайшее время.";
  form.reset();
});

document.getElementById("year").textContent = new Date().getFullYear();
