import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Building2, Coffee, Home, Trees } from "lucide-react"
import { clsx } from "clsx"
import { RoomScene } from "@/components/art/RoomScene"
import { BeforeAfterSlider } from "@/components/ui/before-after-slider"
import { BentoFeatures } from "@/components/ui/bento-features"
import { ButtonLink, FadeIn, SectionHead } from "@/components/ui/primitives"

/* ---------- До / после (Magic: Image reveal slider) ---------- */
export function Compare() {
  return (
    <section id="compare" className="py-20 md:py-28">
      <div className="container-x">
        <SectionHead
          kicker="Эффект"
          title="Потяните ручку и сравните"
          sub="Одна и та же комната в солнечный полдень: слева с ZIP-экраном, справа без него."
        />
        <FadeIn>
          <div className="overflow-hidden rounded-[32px] bg-white p-2 shadow-lift ring-1 ring-black/5">
            <BeforeAfterSlider
              className="rounded-[26px]"
              label="Сравнение комнаты с экраном и без"
              leftLabel="С ZIP-экраном"
              rightLabel="Без экрана"
              start={0.1}
              left={<RoomScene drop={1} openness={5} className="block h-auto w-full" />}
              right={<RoomScene drop={0} glare className="block h-auto w-full" />}
            />
          </div>
          <p className="mt-4 text-center text-sm text-ink-3">Перетащите ручку или используйте стрелки ← → на клавиатуре</p>
        </FadeIn>
      </div>
    </section>
  )
}

/* ---------- Преимущества (Magic: bento grid 01) ---------- */
export function Features() {
  return (
    <section id="features" className="bg-white py-20 md:py-28">
      <div className="container-x">
        <SectionHead kicker="Преимущества" title="Шесть причин выбрать ZIP, а не обычную штору" />
        <BentoFeatures />
      </div>
    </section>
  )
}

/* ---------- Где ставят ---------- */
const USES = [
  { id: "home", icon: Home, title: "Окна и двери дома", text: "Панорамное остекление, спальни на солнечной стороне, мансардные этажи. Прохлада и приватность без плотных штор внутри.", tip: "Чаще берут ткань 3–5% и датчик солнца.", tone: "from-amber-200 to-orange-200" },
  { id: "terrace", icon: Trees, title: "Террасы и беседки", text: "Открытая терраса становится закрытой комнатой: можно сидеть в жару, ветер и комариный вечер.", tip: "Чаще берут ткань 5–10% и датчик ветра.", tone: "from-emerald-200 to-lime-200" },
  { id: "cafe", icon: Coffee, title: "Летние веранды кафе", text: "Веранда работает весь сезон, а не только в тихие солнечные дни. Логотип можно нанести прямо на ткань.", tip: "Чаще берут групповое управление и брендирование.", tone: "from-rose-200 to-orange-200" },
  { id: "office", icon: Building2, title: "Офисы и фасады", text: "Ровный свет без бликов на мониторах и единый вид фасада снаружи.", tip: "Чаще берут ткань 3% и сценарии по расписанию.", tone: "from-sky-200 to-indigo-200" },
]

export function Uses() {
  const [active, setActive] = useState(USES[0].id)
  const cur = USES.find((u) => u.id === active)!

  return (
    <section id="uses" className="py-20 md:py-28">
      <div className="container-x">
        <SectionHead kicker="Где ставят" title="Одна технология — четыре сценария" />
        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <div className="grid gap-3" role="tablist" aria-label="Где применяют ZIP-экраны" aria-orientation="vertical">
            {USES.map((u, i) => {
              const on = u.id === active
              return (
                <button
                  key={u.id}
                  id={`use-${u.id}`}
                  role="tab"
                  aria-selected={on}
                  aria-controls="use-panel"
                  tabIndex={on ? 0 : -1}
                  onClick={() => setActive(u.id)}
                  onKeyDown={(e) => {
                    const d = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0
                    if (!d) return
                    e.preventDefault()
                    const next = USES[(i + d + USES.length) % USES.length]
                    setActive(next.id)
                    document.getElementById(`use-${next.id}`)?.focus()
                  }}
                  className={clsx(
                    "flex min-h-16 items-center gap-4 rounded-3xl border px-5 py-4 text-left transition-[background-color,border-color,box-shadow] duration-300",
                    on ? "border-ink bg-ink text-white shadow-lift" : "border-line bg-white hover:border-ink/25",
                  )}
                >
                  <span className={clsx("grid size-11 shrink-0 place-items-center rounded-2xl", on ? "bg-white/10" : "bg-brand-soft text-brand")} aria-hidden>
                    <u.icon className="size-5" />
                  </span>
                  <span className="font-display text-lg font-bold">{u.title}</span>
                </button>
              )
            })}
          </div>

          <div id="use-panel" role="tabpanel" aria-labelledby={`use-${cur.id}`} className="relative min-h-[380px] overflow-hidden rounded-[32px] border border-line bg-white p-8 md:p-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={cur.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="flex h-full flex-col"
              >
                <div className={clsx("mb-8 grid h-40 place-items-center rounded-3xl bg-gradient-to-br", cur.tone)} aria-hidden>
                  <cur.icon className="size-16 text-ink/70" strokeWidth={1.4} />
                </div>
                <h3 className="text-2xl font-bold md:text-3xl">{cur.title}</h3>
                <p className="mt-3 text-lg text-ink-2">{cur.text}</p>
                <p className="mt-5 inline-flex self-start rounded-full bg-sun-soft px-4 py-2 text-sm font-semibold text-[#8a4b00]">{cur.tip}</p>
                <ButtonLink href="#prices" variant="dark" className="mt-8 self-start">Рассчитать для своего объекта</ButtonLink>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- Подбор ткани ---------- */
const OPENNESS = [
  { v: 0, name: "Blackout", text: "Полное затемнение. Для спален и домашнего кинотеатра." },
  { v: 3, name: "Тень", text: "Максимум тени и приватности, улица видна мягко." },
  { v: 5, name: "Баланс", text: "Золотая середина между прохладой и обзором." },
  { v: 10, name: "Обзор", text: "Лучший вид наружу и проветривание. Для террас." },
]
const COLORS = [
  { hex: "#2e3134", name: "Антрацит" },
  { hex: "#5a5d60", name: "Графит" },
  { hex: "#6e5a47", name: "Бронза" },
  { hex: "#9a9f8e", name: "Олива" },
  { hex: "#c2b49c", name: "Песок" },
  { hex: "#e2ddd3", name: "Молоко" },
]

export function Fabric() {
  const [open, setOpen] = useState(3)
  const [color, setColor] = useState(COLORS[0])
  const o = OPENNESS.find((x) => x.v === open)!

  return (
    <section id="fabric" className="bg-white py-20 md:py-28">
      <div className="container-x grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
        <FadeIn className="order-2 lg:order-1">
          <div className="overflow-hidden rounded-[32px] bg-canvas p-2 ring-1 ring-black/5">
            <RoomScene drop={1} openness={open} cloth={color.hex} className="h-auto w-full rounded-[26px]" title={`Вид из окна через ткань ${color.name}, открытость ${open}%`} />
          </div>
        </FadeIn>
        <div className="order-1 lg:order-2">
          <SectionHead kicker="Ткани" title="Выберите, сколько улицы видеть" sub="Открытость ткани — доля просвета в плетении. Посмотрите, как меняется вид из окна." />

          <fieldset>
            <legend className="mb-3 font-semibold">Открытость</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {OPENNESS.map((x) => (
                <label key={x.v} className="cursor-pointer">
                  <input type="radio" name="openness" className="peer sr-only" checked={open === x.v} onChange={() => setOpen(x.v)} />
                  <span className="flex min-h-16 flex-col items-center justify-center rounded-2xl border-2 border-line bg-canvas px-2 py-3 text-center transition-colors peer-checked:border-brand peer-checked:bg-brand-soft peer-focus-visible:outline-3 peer-focus-visible:outline-brand peer-focus-visible:outline-offset-2 hover:border-ink/25">
                    <b className="font-display text-xl">{x.v}%</b>
                    <span className="text-xs text-ink-3">{x.name}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <p className="mt-3 min-h-12 text-ink-2" aria-live="polite">{o.text}</p>

          <fieldset className="mt-6">
            <legend className="mb-3 font-semibold">Цвет: <span className="font-normal text-ink-3">{color.name}</span></legend>
            <div className="flex flex-wrap gap-3">
              {COLORS.map((c) => (
                <label key={c.hex} className="cursor-pointer" title={c.name}>
                  <input type="radio" name="color" className="peer sr-only" checked={color.hex === c.hex} onChange={() => setColor(c)} aria-label={c.name} />
                  <span
                    className="block size-11 rounded-full ring-1 ring-black/10 ring-offset-2 transition-shadow peer-checked:ring-[3px] peer-checked:ring-brand peer-focus-visible:outline-3 peer-focus-visible:outline-brand peer-focus-visible:outline-offset-4"
                    style={{ background: c.hex }}
                  />
                </label>
              ))}
            </div>
          </fieldset>
          <p className="mt-6 text-sm text-ink-3">Цвета на экране ориентировочные — замерщик привезёт живые образцы.</p>
        </div>
      </div>
    </section>
  )
}
