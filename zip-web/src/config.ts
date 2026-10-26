// Всё, что нужно поменять под компанию, — в этом файле.
export const SITE = {
  brand: "ZIPHOME", // ← название компании
  tagline: "ZIP-экраны под ключ",
  city: "Ваш город",
  phone: "+7 (000) 000-00-00",
  phoneHref: "tel:+70000000000",
  email: "info@example.com",
  whatsapp: "70000000000", // без «+»
  telegram: "", // имя пользователя без @
  hours: "Пн–Сб, 9:00–20:00",
  // Адрес обработчика заявок (Formspree, Netlify Forms, свой сервер).
  // Пусто — заявка откроется в WhatsApp с готовым текстом.
  formEndpoint: "",
}

// Ориентировочные цены за м² — замените на свои.
export const PLANS = [
  {
    id: "base",
    name: "Базовый",
    pricePerM2: 14000,
    note: "Для одного-двух проёмов",
    features: ["ZIP-экран с тканью 3–5%", "Электропривод и пульт", "Монтаж и настройка"],
  },
  {
    id: "comfort",
    name: "Комфорт",
    pricePerM2: 17000,
    note: "Самый частый выбор",
    features: ["Всё из «Базового»", "Датчик ветра и солнца", "Цвет профиля по RAL", "Выбор из всей коллекции тканей"],
    featured: true,
  },
  {
    id: "smart",
    name: "Smart",
    pricePerM2: 21000,
    note: "Для умного дома и бизнеса",
    features: ["Всё из «Комфорта»", "Управление со смартфона и голосом", "Сценарии по времени и погоде", "Групповое управление"],
  },
] as const

export const rub = (n: number) => new Intl.NumberFormat("ru-RU").format(Math.round(n / 100) * 100) + " ₽"
