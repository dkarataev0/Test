import { useMemo, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Check, Minus, Plus } from "lucide-react"
import { clsx } from "clsx"
import { PLANS, rub } from "@/config"
import { Button, FadeIn, SectionHead } from "@/components/ui/primitives"

const parse = (s: string) => parseFloat(s.replace(",", "."))

export type Estimate = { plan: string; width: string; height: string; count: number; total: number }

export function Prices({ onEstimate }: { onEstimate: (e: Estimate) => void }) {
  const [width, setWidth] = useState("3")
  const [height, setHeight] = useState("2,5")
  const [count, setCount] = useState(1)
  const [planId, setPlanId] = useState<string>("comfort")

  const w = parse(width), h = parse(height)
  const valid = w > 0 && h > 0 && w <= 8 && h <= 6
  const area = valid ? w * h * count : 0
  const error = !(w > 0) || !(h > 0) ? "Введите ширину и высоту в метрах" : w > 8 || h > 6 ? "Для такого проёма сделаем несколько экранов — посчитаем на замере" : ""

  const totals = useMemo(() => Object.fromEntries(PLANS.map((p) => [p.id, area * p.pricePerM2])), [area])

  const send = () => {
    const plan = PLANS.find((p) => p.id === planId)!
    onEstimate({ plan: plan.name, width, height, count, total: totals[planId] })
    document.getElementById("lead")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section id="prices" className="py-20 md:py-28">
      <div className="container-x">
        <SectionHead kicker="Цены" title="Прозрачная цена ещё до замера" sub="Укажите размер проёма — посчитаем все три комплектации сразу. На замере цену зафиксируем в договоре." />

        <FadeIn className="mb-6 grid gap-4 rounded-[28px] border border-line bg-white p-5 shadow-soft sm:grid-cols-2 md:p-6 lg:flex lg:items-end">
          <label className="grid flex-1 gap-1.5 text-sm font-medium text-ink-2">
            Ширина, м
            <input inputMode="decimal" value={width} onChange={(e) => setWidth(e.target.value)} aria-invalid={!(w > 0) || w > 8} aria-describedby="calc-err" className="min-h-12 rounded-2xl border border-line bg-canvas px-4 text-lg font-semibold text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand-soft aria-[invalid=true]:border-danger" />
          </label>
          <label className="grid flex-1 gap-1.5 text-sm font-medium text-ink-2">
            Высота, м
            <input inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value)} aria-invalid={!(h > 0) || h > 6} aria-describedby="calc-err" className="min-h-12 rounded-2xl border border-line bg-canvas px-4 text-lg font-semibold text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand-soft aria-[invalid=true]:border-danger" />
          </label>
          <div className="grid gap-1.5 text-sm font-medium text-ink-2">
            <span id="count-label">Количество</span>
            <div className="flex min-h-12 items-center gap-1 rounded-2xl border border-line bg-canvas p-1" role="group" aria-labelledby="count-label">
              <button type="button" className="grid size-10 place-items-center rounded-xl hover:bg-white disabled:opacity-40" onClick={() => setCount((c) => Math.max(1, c - 1))} disabled={count <= 1} aria-label="Меньше">
                <Minus className="size-4" />
              </button>
              <output className="w-10 text-center text-lg font-semibold text-ink" aria-live="polite">{count}</output>
              <button type="button" className="grid size-10 place-items-center rounded-xl hover:bg-white" onClick={() => setCount((c) => Math.min(20, c + 1))} aria-label="Больше">
                <Plus className="size-4" />
              </button>
            </div>
          </div>
          <div className="text-sm text-ink-3 lg:min-w-28 lg:pb-3 lg:text-right">
            Площадь<br />
            <b className="font-display text-xl text-ink">{area ? area.toFixed(1).replace(".", ",") : "—"} м²</b>
          </div>
        </FadeIn>
        <p id="calc-err" role="alert" className={clsx("mb-6 text-sm font-medium text-danger", !error && "sr-only")}>{error}</p>

        <div className="grid gap-4 lg:grid-cols-3" role="radiogroup" aria-label="Комплектация">
          {PLANS.map((p, i) => {
            const on = p.id === planId
            const featured = "featured" in p && p.featured
            return (
              <FadeIn key={p.id} delay={i * 0.08}>
                <div
                  role="radio"
                  aria-checked={on}
                  tabIndex={on ? 0 : -1}
                  onClick={() => setPlanId(p.id)}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter") { e.preventDefault(); setPlanId(p.id) }
                    const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0
                    if (d) { e.preventDefault(); const n = PLANS[(i + d + PLANS.length) % PLANS.length]; setPlanId(n.id); (e.currentTarget.parentElement?.parentElement?.children[(i + d + PLANS.length) % PLANS.length]?.querySelector("[role=radio]") as HTMLElement | null)?.focus() }
                  }}
                  className={clsx(
                    "relative flex h-full cursor-pointer flex-col rounded-[28px] border-2 p-7 transition-[border-color,box-shadow,background-color] duration-300",
                    on ? "border-brand bg-white shadow-lift" : "border-transparent bg-white shadow-soft hover:border-line",
                  )}
                >
                  {featured && <span className="absolute -top-3 left-7 rounded-full bg-sun px-3 py-1 text-xs font-bold text-white">Популярный</span>}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-bold">{p.name}</h3>
                      <p className="text-sm text-ink-3">{p.note}</p>
                    </div>
                    <span className={clsx("mt-1 grid size-6 shrink-0 place-items-center rounded-full border-2", on ? "border-brand bg-brand text-white" : "border-line")} aria-hidden>
                      {on && <Check className="size-3.5" strokeWidth={3} />}
                    </span>
                  </div>
                  <div className="mt-6">
                    <span className="text-sm text-ink-3">от {rub(p.pricePerM2)} за м²</span>
                    <div className="h-12 overflow-hidden">
                      <AnimatePresence mode="popLayout" initial={false}>
                        <motion.p
                          key={totals[p.id]}
                          className="font-display text-4xl font-extrabold"
                          initial={{ y: 24, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -24, opacity: 0 }}
                          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        >
                          {totals[p.id] ? rub(totals[p.id]) : "—"}
                        </motion.p>
                      </AnimatePresence>
                    </div>
                  </div>
                  <ul className="mt-6 grid gap-2.5 border-t border-line pt-6">
                    {p.features.map((f) => (
                      <li key={f} className="flex gap-3 text-[15px] text-ink-2">
                        <Check className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={3} aria-hidden /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeIn>
            )
          })}
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          <Button size="lg" onClick={send} disabled={!valid}>Зафиксировать цену на замере</Button>
          <p className="text-sm text-ink-3">Цена ориентировочная: монтаж и настройка включены, точная сумма — после замера.</p>
        </div>
      </div>
    </section>
  )
}
