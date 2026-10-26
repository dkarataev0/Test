// Основа — компонент «bento grid 01» (avanishverma4) из 21st.dev Magic.
// Сохранены сетка 6 колонок с разными размерами плиток, анимации появления,
// hover-отклик и «живые» мини-сцены; содержимое переписано под ZIP-экраны.
import { useEffect, useState, type ReactNode } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { Bug, Eye, Maximize2, Smartphone, Thermometer, Wind } from "lucide-react"

const EASE = [0.16, 1, 0.3, 1] as const

function useTicker(ms: number, size: number) {
  const reduce = useReducedMotion()
  const [i, setI] = useState(0)
  useEffect(() => {
    if (reduce) return
    const t = setInterval(() => setI((p) => (p + 1) % size), ms)
    return () => clearInterval(t)
  }, [ms, size, reduce])
  return i
}

/** Температура в комнате падает, когда экран опускается */
function CoolDown() {
  const step = useTicker(2600, 2)
  const down = step === 1
  return (
    <div className="flex h-full items-center justify-center gap-8">
      <div className="relative h-36 w-28 overflow-hidden rounded-xl border-4 border-ink/80 bg-sky-200">
        <div className="absolute right-3 top-3 size-8 rounded-full bg-amber-300" />
        <motion.div
          className="absolute inset-x-0 top-0 bg-ink/80"
          style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,.07) 0 1px, transparent 1px 5px)" }}
          animate={{ height: down ? "100%" : "0%" }}
          transition={{ duration: 1, ease: EASE }}
        />
      </div>
      <div className="text-center">
        <AnimatePresence mode="wait">
          <motion.span
            key={down ? "cool" : "hot"}
            className={`block font-display text-3xl font-bold md:text-4xl ${down ? "text-brand" : "text-sun"}`}
            initial={{ y: 16, opacity: 0, filter: "blur(4px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            exit={{ y: -16, opacity: 0, filter: "blur(4px)" }}
            transition={{ duration: 0.45, ease: EASE }}
          >
            {down ? "Прохладно" : "Жарко"}
          </motion.span>
        </AnimatePresence>
        <span className="text-sm text-ink-3">{down ? "экран опущен" : "экран поднят"}</span>
      </div>
    </div>
  )
}

/** Обычная штора парусит, ZIP-полотно стоит ровно */
function WindTest() {
  const reduce = useReducedMotion()
  const sway = reduce ? {} : { animate: { skewX: [0, 9, -6, 7, 0], x: [0, 6, -4, 5, 0] }, transition: { duration: 2.2, repeat: Infinity, ease: "easeInOut" as const } }
  return (
    <div className="flex h-full items-end justify-center gap-6 pb-1">
      {[
        { label: "Обычная", zip: false },
        { label: "ZIP", zip: true },
      ].map(({ label, zip }) => (
        <div key={label} className="flex flex-col items-center gap-2">
          <div className="relative h-16 w-16">
            <div className="absolute inset-x-0 top-0 h-2.5 rounded-sm bg-ink/80" />
            {zip && <div className="absolute inset-y-0 left-0 w-1 bg-ink/80" />}
            {zip && <div className="absolute inset-y-0 right-0 w-1 bg-ink/80" />}
            <motion.div
              className={`absolute top-2.5 h-[54px] origin-top rounded-b-sm ${zip ? "inset-x-1 bg-brand/80" : "inset-x-0 bg-ink/30"}`}
              {...(zip ? {} : sway)}
            />
          </div>
          <span className={`text-xs font-semibold ${zip ? "text-brand" : "text-ink-3"}`}>{label}</span>
        </div>
      ))}
    </div>
  )
}

/** Комар отскакивает от закрытого контура */
function BugShield() {
  const reduce = useReducedMotion()
  return (
    <div className="relative flex h-full items-center justify-center">
      <div className="relative h-20 w-14 rounded-md border-x-4 border-t-8 border-ink/80 bg-ink/15" style={{ backgroundImage: "repeating-linear-gradient(90deg, rgba(18,32,26,.12) 0 1px, transparent 1px 4px)" }} />
      <motion.div
        className="absolute left-[calc(50%+56px)] top-1/2 -translate-y-1/2 text-ink-2"
        animate={reduce ? undefined : { x: [30, 0, 22, 4, 30], y: [-10, 0, 12, -4, -10], rotate: [0, -20, 10, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <Bug className="size-6" aria-hidden />
      </motion.div>
    </div>
  )
}

/** Снаружи не видно, изнутри видно */
function Privacy() {
  const side = useTicker(2200, 2)
  return (
    <div className="flex h-full items-center justify-center gap-4">
      <div className="relative h-20 w-28 overflow-hidden rounded-lg bg-gradient-to-b from-sky-200 to-emerald-200">
        <motion.div className="absolute inset-0 bg-ink" animate={{ opacity: side === 0 ? 0.35 : 0.92 }} transition={{ duration: 0.6, ease: EASE }} />
        <Eye className="absolute left-1/2 top-1/2 size-7 -translate-x-1/2 -translate-y-1/2 text-white" aria-hidden />
      </div>
      <AnimatePresence mode="wait">
        <motion.p key={side} className="w-24 text-sm font-semibold text-ink-2" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.3 }}>
          {side === 0 ? "Изнутри: видно сад" : "Снаружи: вас не видно"}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}

/** Сценарии в приложении включаются по очереди */
function SmartScenes() {
  const active = useTicker(1400, 4)
  const scenes = ["Жара после 12:00", "Сильный ветер", "Вечер на террасе"]
  return (
    <div className="flex h-full items-center justify-center">
      <div className="w-full max-w-[260px] space-y-2">
        {scenes.map((s, i) => {
          const on = i < active
          return (
            <div key={s} className="flex items-center justify-between rounded-xl bg-canvas px-3 py-2 text-sm">
              <span className="font-medium text-ink-2">{s}</span>
              <span className={`relative h-5 w-9 rounded-full transition-colors duration-300 ${on ? "bg-brand" : "bg-line"}`}>
                <motion.span className="absolute top-0.5 size-4 rounded-full bg-white shadow" animate={{ left: on ? 18 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Проёмы разной формы */
function AnySize() {
  const layout = useTicker(2400, 3)
  const shapes = [
    { w: 140, h: 70 },
    { w: 76, h: 96 },
    { w: 170, h: 90 },
  ]
  return (
    <div className="flex h-full items-center justify-center">
      <motion.div
        className="rounded-md border-x-4 border-t-8 border-ink/80 bg-brand/25"
        style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(18,32,26,.1) 0 1px, transparent 1px 5px)" }}
        animate={{ width: shapes[layout].w, height: shapes[layout].h }}
        transition={{ duration: 0.6, ease: EASE }}
      />
    </div>
  )
}

type Tile = { span: string; title: string; text: string; icon: ReactNode; visual: ReactNode; tone?: "brand" | "sun" }

const TILES: Tile[] = [
  { span: "md:col-span-2 md:row-span-2", title: "Прохлада без кондиционера", text: "Экран останавливает солнце снаружи, до того как оно нагреет стекло.", icon: <Thermometer className="size-5" />, visual: <CoolDown />, tone: "sun" },
  { span: "md:col-span-2", title: "Не боится ветра", text: "Края ткани держит молния в направляющих — полотно не хлопает.", icon: <Wind className="size-5" />, visual: <WindTest /> },
  { span: "md:col-span-2 md:row-span-2", title: "Умные сценарии", text: "Экраны опускаются в жару и поднимаются при сильном ветре сами. Управление с пульта, телефона или голосом.", icon: <Smartphone className="size-5" />, visual: <SmartScenes />, tone: "brand" },
  { span: "md:col-span-2", title: "Без комаров", text: "Нет боковых щелей — работает как большая москитная сетка.", icon: <Bug className="size-5" />, visual: <BugShield /> },
  { span: "md:col-span-3", title: "Приватность днём", text: "Вы видите улицу, а прохожие и соседи вас — нет.", icon: <Eye className="size-5" />, visual: <Privacy /> },
  { span: "md:col-span-3", title: "Под любой проём", text: "Окно, дверь, терраса или пергола — экран делается по точным размерам.", icon: <Maximize2 className="size-5" />, visual: <AnySize /> },
]

export function BentoFeatures() {
  return (
    <div className="grid grid-cols-1 gap-4 md:auto-rows-[250px] md:grid-cols-6">
      {TILES.map((t, i) => (
        <motion.article
          key={t.title}
          className={`group flex min-h-[260px] flex-col overflow-hidden rounded-bento border border-line bg-card p-6 shadow-soft transition-[border-color,box-shadow] duration-300 hover:border-ink/15 hover:shadow-lift md:min-h-0 md:p-7 ${t.span}`}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ delay: i * 0.08, duration: 0.6, ease: EASE }}
          whileHover={{ scale: 1.015 }}
        >
          <div className="min-h-0 flex-1">{t.visual}</div>
          <div className="mt-4">
            <h3 className="flex items-center gap-2 text-lg font-bold text-ink">
              <span className={`grid size-8 place-items-center rounded-lg ${t.tone === "sun" ? "bg-sun-soft text-sun" : "bg-brand-soft text-brand"}`} aria-hidden>{t.icon}</span>
              {t.title}
            </h3>
            <p className="mt-1.5 text-[15px] leading-relaxed text-ink-3">{t.text}</p>
          </div>
        </motion.article>
      ))}
    </div>
  )
}

export default BentoFeatures
