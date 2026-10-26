import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Menu, Phone, X } from "lucide-react"
import { clsx } from "clsx"
import { SITE } from "@/config"
import { ButtonLink } from "@/components/ui/primitives"

export const NAV = [
  { href: "#compare", label: "Эффект" },
  { href: "#features", label: "Преимущества" },
  { href: "#uses", label: "Где ставят" },
  { href: "#fabric", label: "Ткани" },
  { href: "#prices", label: "Цены" },
  { href: "#faq", label: "Вопросы" },
]

export function Logo({ light }: { light?: boolean }) {
  return (
    <a href="#top" className="flex min-h-11 items-center gap-2.5 whitespace-nowrap" aria-label={`${SITE.brand} — на главную`}>
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden>
        <rect width="32" height="32" rx="9" fill="var(--color-brand)" />
        <rect x="6" y="7" width="20" height="4" rx="1.5" fill="#fff" />
        <path d="M8 11v14M24 11v14" stroke="#fff" strokeWidth="2" />
        <rect x="10" y="11" width="12" height="10" fill="#fff" opacity=".45" />
      </svg>
      <span className={clsx("font-display text-lg font-extrabold tracking-tight", light ? "text-white" : "text-ink")}>{SITE.brand}</span>
    </a>
  )
}

export function Header() {
  const [solid, setSolid] = useState(false)
  const [open, setOpen] = useState(false)
  // Якорь, к которому прокрутить после закрытия мобильного меню:
  // плавная прокрутка во время анимации закрытия срывается.
  const pendingHash = useRef<string | null>(null)

  const goTo = (hash: string) => {
    pendingHash.current = hash
    setOpen(false)
  }
  const flushScroll = () => {
    const hash = pendingHash.current
    pendingHash.current = null
    if (!hash) return
    document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" })
    history.replaceState(null, "", hash)
  }

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 12)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  return (
    <header className={clsx("fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow] duration-300", solid || open ? "bg-canvas/85 shadow-[0_1px_0_var(--color-line)] backdrop-blur-xl" : "bg-transparent")}>
      <div className="container-x flex h-[72px] items-center gap-6">
        <Logo />
        <nav className="ml-auto hidden items-center gap-1 lg:flex" aria-label="Основное меню">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="inline-flex min-h-11 items-center rounded-full px-3.5 text-[15px] font-medium text-ink-2 transition-colors hover:bg-white hover:text-ink">
              {n.label}
            </a>
          ))}
        </nav>
        <a href={SITE.phoneHref} className="hidden min-h-11 items-center gap-2 whitespace-nowrap font-semibold xl:flex">
          <Phone className="size-4 text-brand" aria-hidden /> {SITE.phone}
        </a>
        <div className="hidden lg:block">
          <ButtonLink href="#lead">Бесплатный замер</ButtonLink>
        </div>
        <button
          className="ml-auto grid size-11 shrink-0 place-items-center rounded-full bg-white shadow-soft lg:hidden"
          aria-label={open ? "Закрыть меню" : "Открыть меню"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      <AnimatePresence onExitComplete={flushScroll}>
        {open && (
          <motion.nav
            id="mobile-menu"
            aria-label="Мобильное меню"
            className="container-x overflow-hidden lg:hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <ul className="grid gap-1 pb-6 pt-2">
              {NAV.map((n) => (
                <li key={n.href}>
                  <a href={n.href} onClick={(e) => { e.preventDefault(); goTo(n.href) }} className="block rounded-2xl px-4 py-3.5 text-lg font-semibold hover:bg-white">
                    {n.label}
                  </a>
                </li>
              ))}
              <li>
                <a href={SITE.phoneHref} className="flex items-center gap-2 rounded-2xl px-4 py-3.5 text-lg font-semibold text-brand">
                  <Phone className="size-5" aria-hidden /> {SITE.phone}
                </a>
              </li>
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
