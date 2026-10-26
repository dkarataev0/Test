# Сайт ZIP-экранов (React + Vite + Tailwind)

Одностраничный сайт про наружные ZIP-экраны. Дизайн-система подобрана через **UI UX Pro Max**, два компонента взяты из **21st.dev Magic** и адаптированы.

## Запуск

```bash
npm install
npm run dev       # разработка, http://localhost:5173
npm run build     # готовый сайт в папке dist/
npm run preview   # посмотреть собранную версию
```

Папку `dist/` можно выложить на любой статический хостинг (Vercel, Netlify, GitHub Pages).

## Что поменять под компанию — `src/config.ts`

- `SITE.brand` — **название компании** (сейчас заглушка `ZIPHOME`);
- телефон, почта, город, часы работы, WhatsApp;
- `SITE.formEndpoint` — адрес обработчика заявок. Пока пусто, заявка открывается в WhatsApp с готовым текстом;
- `PLANS` — комплектации и **цены за м²** (сейчас ориентировочные значения, замените на свои).

Реквизиты в `public/privacy.html`, иконка — `public/favicon.svg`.

## Структура

| Раздел | Файл |
|--------|------|
| Шапка, мобильное меню | `src/components/sections/Header.tsx` |
| Главный экран с опускающимся экраном | `src/components/sections/Hero.tsx` |
| «До / после», преимущества, где ставят, подбор ткани | `src/components/sections/Showcase.tsx` |
| Цены и калькулятор | `src/components/sections/Prices.tsx` |
| Шаги, вопросы, заявка, подвал, мобильная панель | `src/components/sections/Closing.tsx` |
| Иллюстрация комнаты (переиспользуется) | `src/components/art/RoomScene.tsx` |
| Дизайн-токены (цвета, шрифты, тени) | `src/index.css` |

## Компоненты из 21st.dev Magic

- `src/components/ui/before-after-slider.tsx` — на основе **Image reveal slider** (motiondotdev): два слоя вместо одной картинки, ARIA-слайдер, клавиши ← → Home End, пересчёт при ресайзе.
- `src/components/ui/bento-features.tsx` — на основе **bento grid 01** (avanishverma4): та же сетка 6 колонок и анимации, мини-сцены переписаны под ZIP-экраны, светлая тема.

## Дизайн-система (UI UX Pro Max)

- Стиль: Bento Box Grid + Soft UI, светлая тема.
- Цвета: фон `#F4F4F0`, текст `#12201A`, основной `#15803D` (контраст 5:1 с белым), акцент «солнце» `#D97706`.
- Шрифты: Wix Madefor Display (заголовки) + Wix Madefor Text (текст) — оба с кириллицей.
- Учитывается `prefers-reduced-motion`, видимый фокус, цели нажатия от 44 px.
