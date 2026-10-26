// Основа — компонент «Image reveal slider» (motiondotdev) из 21st.dev Magic.
// Адаптация: два произвольных слоя вместо одной картинки, подписи, ARIA-слайдер,
// управление стрелками на самом элементе, пересчёт ширины при ресайзе.
import { useLayoutEffect, useRef, useState, type ReactNode, type KeyboardEvent } from "react"
import { animate, motion, useMotionValue, useMotionValueEvent, useTransform, type MotionValue } from "motion/react"

function clamp(min: number, max: number, value: number) {
  return Math.min(max, Math.max(min, value))
}

function useSliderColor(x: MotionValue<number>, half: number) {
  return useTransform(
    x,
    [-half + 20, -half + 60, half - 60, half - 20],
    ["rgba(255, 255, 255, 0)", "rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 1)", "rgba(255, 255, 255, 0)"],
  )
}

function HandleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m18 8 4 4-4 4" />
      <path d="m6 8-4 4 4 4" />
      <path d="M8 12h.01" />
      <path d="M12 12h.01" />
      <path d="M16 12h.01" />
    </svg>
  )
}

type Props = {
  /** слой слева от ручки */
  left: ReactNode
  /** слой справа от ручки */
  right: ReactNode
  leftLabel: string
  rightLabel: string
  /** подпись для скринридера */
  label: string
  /** стартовая позиция, -1…1 от центра */
  start?: number
  step?: number
  className?: string
}

export function BeforeAfterSlider({ left, right, leftLabel, rightLabel, label, start = 0, step = 50, className = "" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const [half, setHalf] = useState(300)
  const [pct, setPct] = useState(50)
  const halfRef = useRef(half)
  halfRef.current = half
  const toPct = (v: number) => Math.round(((v + halfRef.current) / (2 * halfRef.current)) * 100)
  const clipPath = useTransform(x, [-half, half], ["inset(0% 0% 0% 0%)", "inset(0% 0% 0% 100%)"])
  const backgroundColor = useSliderColor(x, half)

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const measure = () => {
      const h = el.clientWidth / 2
      setHalf(h)
      halfRef.current = h
      x.set(clamp(-h, h, start * h))
      setPct(toPct(x.get()))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [start, x])

  useMotionValueEvent(x, "change", (v) => setPct(toPct(v)))

  const onKeyDown = (event: KeyboardEvent) => {
    let target: number | null = null
    if (event.key === "ArrowLeft") target = x.get() - step
    else if (event.key === "ArrowRight") target = x.get() + step
    else if (event.key === "Home") target = -half
    else if (event.key === "End") target = half
    if (target === null) return
    event.preventDefault()
    const delta = target - x.get()
    animate(x, clamp(-half, half, target), { type: "spring", stiffness: 900, damping: 40, velocity: delta * 10 })
  }

  return (
    <div ref={containerRef} className={`relative select-none overflow-hidden rounded-[inherit] touch-pan-y ${className}`}>
      <div className="relative">
        {left}
        <motion.div style={{ clipPath }} className="absolute inset-0">
          {right}
        </motion.div>
      </div>

      <span className="pointer-events-none absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-sm font-semibold text-ink shadow-soft backdrop-blur">{leftLabel}</span>
      <span className="pointer-events-none absolute right-4 top-4 rounded-full bg-ink/85 px-3 py-1.5 text-sm font-semibold text-white shadow-soft backdrop-blur">{rightLabel}</span>

      <motion.div
        className="absolute inset-y-0 left-1/2 -ml-[2px] w-1 cursor-ew-resize"
        drag="x"
        dragElastic={0.05}
        dragMomentum={false}
        dragConstraints={{ left: -half, right: half }}
        style={{ x, backgroundColor }}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-valuetext={`${leftLabel}: ${pct}% кадра`}
        onKeyDown={onKeyDown}
      >
        <div className="absolute left-1/2 top-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-ink shadow-lift ring-1 ring-black/5">
          <HandleIcon />
        </div>
      </motion.div>
    </div>
  )
}

export default BeforeAfterSlider
