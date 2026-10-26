import { useEffect, useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import { CalendarCheck, ShieldCheck, Sparkles, Wrench } from "lucide-react"
import { RoomScene } from "@/components/art/RoomScene"
import { ButtonLink } from "@/components/ui/primitives"

const EASE = [0.16, 1, 0.3, 1] as const

const facts = [
  { icon: CalendarCheck, title: "Замер бесплатно", text: "С образцами тканей" },
  { icon: Wrench, title: "Монтаж за день", text: "Без грязи и пыли" },
  { icon: ShieldCheck, title: "Гарантия", text: "Прописана в договоре" },
]

export function Hero() {
  const reduce = useReducedMotion()
  const [drop, setDrop] = useState(reduce ? 0.85 : 0)

  // экран опускается после загрузки
  useEffect(() => {
    if (reduce) return
    const t = setTimeout(() => setDrop(0.85), 900)
    return () => clearTimeout(t)
  }, [reduce])

  const lowered = drop > 0.5

  return (
    <section id="top" className="relative overflow-hidden pb-16 pt-28 md:pb-24 md:pt-36">
      <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 size-[640px] rounded-full bg-[radial-gradient(circle,rgb(253_224_171/.55),transparent_65%)]" />
      <div aria-hidden className="pointer-events-none absolute -left-52 top-60 size-[520px] rounded-full bg-[radial-gradient(circle,rgb(187_222_196/.5),transparent_65%)]" />

      <div className="container-x relative grid items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <motion.p
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-white/70 px-4 py-2 text-sm font-semibold text-ink-2 backdrop-blur"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <Sparkles className="size-4 text-sun" aria-hidden /> Наружные ZIP-экраны под ключ
          </motion.p>
          <motion.h1
            className="text-[2.6rem] font-extrabold leading-[1.04] sm:text-6xl lg:text-7xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.08, ease: EASE }}
          >
            Жара остаётся <span className="relative whitespace-nowrap text-brand">снаружи<svg aria-hidden viewBox="0 0 220 14" className="absolute -bottom-2 left-0 w-full" preserveAspectRatio="none"><motion.path d="M2 10 C 60 2, 160 2, 218 8" fill="none" stroke="var(--color-sun)" strokeWidth="5" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: 0.7, ease: EASE }} /></svg></span>
          </motion.h1>
          <motion.p
            className="mt-7 max-w-xl text-lg leading-relaxed text-ink-2 md:text-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.16, ease: EASE }}
          >
            ZIP-экран опускается снаружи окна и задерживает солнце до того, как оно нагреет стекло. Ткань закреплена молнией по краям — не хлопает на ветру и не пускает комаров.
          </motion.p>
          <motion.div
            className="mt-9 flex flex-col gap-3 sm:flex-row"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.24, ease: EASE }}
          >
            <ButtonLink href="#prices" size="lg">Рассчитать стоимость</ButtonLink>
            <ButtonLink href="#compare" size="lg" variant="ghost">Посмотреть эффект</ButtonLink>
          </motion.div>
        </div>

        <motion.div
          className="relative"
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1, ease: EASE }}
        >
          <div className="overflow-hidden rounded-[32px] bg-white p-2 shadow-lift ring-1 ring-black/5">
            <RoomScene drop={drop} glare={!lowered} className="h-auto w-full rounded-[26px]" title="Гостиная с панорамным окном и ZIP-экраном снаружи" />
          </div>

          <motion.div
            className="absolute -bottom-5 left-4 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-lift ring-1 ring-black/5 sm:left-8"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2, ease: EASE }}
          >
            <span className={`size-2.5 rounded-full transition-colors duration-500 ${lowered ? "bg-brand" : "bg-sun"}`} aria-hidden />
            <span className="text-sm font-semibold">{lowered ? "Экран опущен — в комнате прохладно" : "Солнце нагревает комнату"}</span>
          </motion.div>

          <button
            type="button"
            onClick={() => setDrop((d) => (d > 0.5 ? 0 : 0.85))}
            className="absolute -top-4 right-4 min-h-11 rounded-full bg-ink px-4 text-sm font-semibold text-white shadow-lift transition-colors hover:bg-black sm:right-8"
            aria-pressed={lowered}
          >
            {lowered ? "Поднять экран" : "Опустить экран"}
          </button>
        </motion.div>
      </div>

      <div className="container-x relative mt-16 grid gap-3 sm:grid-cols-3 md:mt-20">
        {facts.map((f, i) => (
          <motion.div
            key={f.title}
            className="flex items-center gap-4 rounded-3xl border border-line bg-white/70 p-5 backdrop-blur"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 + i * 0.08, ease: EASE }}
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand" aria-hidden>
              <f.icon className="size-5" />
            </span>
            <span>
              <b className="block font-display text-lg">{f.title}</b>
              <span className="text-sm text-ink-3">{f.text}</span>
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
