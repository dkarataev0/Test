import { useEffect, useId, useRef, useState, type FormEvent } from "react"
import { AnimatePresence, motion } from "motion/react"
import { CheckCircle2, ChevronDown, Mail, MapPin, MessageCircle, Phone } from "lucide-react"
import { clsx } from "clsx"
import { SITE, rub } from "@/config"
import { Button, FadeIn, SectionHead } from "@/components/ui/primitives"
import { Logo, NAV } from "./Header"
import type { Estimate } from "./Prices"

/* ---------- Как работаем ---------- */
const STEPS = [
  { t: "Заявка", d: "Оставляете телефон — перезваниваем за 15 минут в рабочее время." },
  { t: "Замер", d: "Бесплатно. Привозим образцы тканей и цвета профиля." },
  { t: "Договор", d: "Фиксируем цену, срок и гарантию. Без скрытых доплат." },
  { t: "Монтаж", d: "Устанавливаем за день, настраиваем пульт и сценарии." },
]

export function Process() {
  return (
    <section className="bg-night py-20 text-white md:py-28">
      <div className="container-x">
        <FadeIn as="header" className="mb-12 max-w-2xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-emerald-300">Как работаем</p>
          <h2 className="text-3xl font-bold leading-[1.1] md:text-5xl">От звонка до прохлады — четыре шага</h2>
        </FadeIn>
        <ol className="grid gap-4 md:grid-cols-4">
          {STEPS.map((s, i) => (
            <FadeIn as="li" key={s.t} delay={i * 0.08} className="relative rounded-[28px] bg-white/[.06] p-7 ring-1 ring-white/10">
              <span className="font-display text-5xl font-extrabold text-emerald-300/90">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-6 text-xl font-bold">{s.t}</h3>
              <p className="mt-2 text-white/70">{s.d}</p>
            </FadeIn>
          ))}
        </ol>
      </div>
    </section>
  )
}

/* ---------- Вопросы ---------- */
const FAQ = [
  { q: "Выдержит ли экран сильный ветер?", a: "ZIP-экран гораздо устойчивее обычной шторы: ткань держится в направляющих по всей высоте. Но у любой ткани есть предел, поэтому допустимую нагрузку считаем на замере, а для надёжности ставим датчик ветра — он поднимет экран сам." },
  { q: "Будет ли видно улицу?", a: "Днём — да: изнутри улица видна, а снаружи вас почти не видно. Вечером при включённом свете эффект обратный. Для полного затемнения есть ткань blackout." },
  { q: "Можно ли поставить на готовый дом?", a: "Да. Короб крепится на фасад или в проём, без серьёзных работ. Скрытый монтаж в фасад лучше закладывать на этапе стройки или ремонта." },
  { q: "Сколько ждать?", a: "Обычно от двух до четырёх недель от замера до монтажа — в сезон чуть дольше. Точный срок пишем в договоре." },
  { q: "Что будет, если отключат свет?", a: "Экран останется в том положении, в котором был. Для беседок без электричества есть привод на солнечной батарее." },
  { q: "Как ухаживать за тканью?", a: "Раз в сезон промыть мягкой щёткой с тёплой мыльной водой и дать высохнуть в опущенном положении. Больше ничего не нужно." },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  return (
    <div className="border-b border-line">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((v) => !v)}
          className="flex min-h-16 w-full items-center justify-between gap-6 py-5 text-left text-lg font-semibold transition-colors hover:text-brand"
        >
          {q}
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3 }} className="grid size-9 shrink-0 place-items-center rounded-full bg-canvas" aria-hidden>
            <ChevronDown className="size-5" />
          </motion.span>
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div id={id} role="region" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden">
            <p className="max-w-[65ch] pb-6 text-ink-2">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function Faq() {
  return (
    <section id="faq" className="bg-white py-20 md:py-28">
      <div className="container-x grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHead kicker="Вопросы" title="Коротко о главном" sub={<>Не нашли ответ? <a href="#lead" className="font-semibold text-brand underline-offset-4 hover:underline">Спросите нас</a>.</>} />
        </div>
        <div>{FAQ.map((f) => <FaqItem key={f.q} {...f} />)}</div>
      </div>
    </section>
  )
}

/* ---------- Заявка ---------- */
function formatPhone(raw: string) {
  let d = raw.replace(/\D/g, "")
  if (!d) return ""
  if (d[0] === "8") d = "7" + d.slice(1)
  if (d[0] !== "7") d = "7" + d
  d = d.slice(0, 11)
  const [a, b, c, e] = [d.slice(1, 4), d.slice(4, 7), d.slice(7, 9), d.slice(9, 11)]
  return "+7" + (a ? ` (${a}` : "") + (a.length === 3 ? ")" : "") + (b ? ` ${b}` : "") + (c ? `-${c}` : "") + (e ? `-${e}` : "")
}

export function Lead({ estimate }: { estimate: Estimate | null }) {
  const [phone, setPhone] = useState("")
  const [name, setName] = useState("")
  const [note, setNote] = useState("")
  const [agree, setAgree] = useState(false)
  const [errors, setErrors] = useState<{ phone?: string; agree?: string }>({})
  const [state, setState] = useState<"idle" | "sending" | "done" | "fail">("idle")
  const phoneRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!estimate) return
    setNote(`Комплектация «${estimate.plan}», проём ${estimate.width} × ${estimate.height} м, ${estimate.count} шт. Ориентировочно ${rub(estimate.total)}.`)
    setTimeout(() => phoneRef.current?.focus({ preventScroll: true }), 600)
  }, [estimate])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const errs: typeof errors = {}
    if (phone.replace(/\D/g, "").length !== 11) errs.phone = "Укажите номер полностью: 11 цифр"
    if (!agree) errs.agree = "Отметьте согласие на обработку данных"
    setErrors(errs)
    if (errs.phone) return phoneRef.current?.focus()
    if (errs.agree) return

    setState("sending")
    const data = { name, phone, note }
    try {
      if (SITE.formEndpoint) {
        const res = await fetch(SITE.formEndpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(data) })
        if (!res.ok) throw new Error(String(res.status))
      } else {
        const text = `Заявка на замер — ${SITE.brand}\nИмя: ${name || "—"}\nТелефон: ${phone}\n${note}`
        window.open(`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`, "_blank", "noopener")
      }
      setState("done")
    } catch {
      setState("fail")
    }
  }

  const field = "min-h-13 w-full rounded-2xl border border-line bg-canvas px-4 py-3 text-base text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand-soft aria-[invalid=true]:border-danger"

  return (
    <section id="lead" className="py-20 md:py-28">
      <div className="container-x">
        <div className="grid overflow-hidden rounded-[36px] bg-brand text-white lg:grid-cols-2">
          <div className="relative p-8 md:p-14">
            <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-24 size-96 rounded-full bg-[radial-gradient(circle,rgb(253_224_171/.35),transparent_65%)]" />
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-emerald-100">Бесплатный замер</p>
            <h2 className="text-3xl font-bold leading-[1.1] md:text-5xl">Приедем, измерим, покажем ткани вживую</h2>
            <p className="mt-5 max-w-md text-lg text-emerald-50/90">Перезвоним в течение 15 минут в рабочее время и подберём удобный день.</p>
            <ul className="relative mt-10 grid gap-4 text-emerald-50">
              <li><a href={SITE.phoneHref} className="inline-flex min-h-11 items-center gap-3 font-display text-2xl font-bold text-white hover:underline"><Phone className="size-5" aria-hidden /> {SITE.phone}</a></li>
              <li><a href={`https://wa.me/${SITE.whatsapp}`} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center gap-3 font-semibold hover:underline"><MessageCircle className="size-5" aria-hidden /> Написать в WhatsApp</a></li>
              <li className="flex items-center gap-3"><MapPin className="size-5" aria-hidden /> {SITE.city} · {SITE.hours}</li>
            </ul>
          </div>

          <div className="bg-white p-6 text-ink md:p-12">
            <AnimatePresence mode="wait">
              {state === "done" ? (
                <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="flex h-full flex-col items-center justify-center py-12 text-center" role="status">
                  <CheckCircle2 className="size-16 text-brand" aria-hidden />
                  <h3 className="mt-5 text-2xl font-bold">Заявка отправлена</h3>
                  <p className="mt-2 max-w-sm text-ink-3">Спасибо! Перезвоним в течение 15 минут в рабочее время.</p>
                </motion.div>
              ) : (
                <motion.form key="form" onSubmit={submit} noValidate className="grid gap-5" exit={{ opacity: 0 }}>
                  <label className="grid gap-1.5 text-sm font-medium text-ink-2">
                    Как к вам обращаться
                    <input className={field} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                  </label>
                  <label className="grid gap-1.5 text-sm font-medium text-ink-2">
                    <span>Телефон <span className="text-danger" aria-hidden>*</span></span>
                    <input
                      ref={phoneRef}
                      className={field}
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="+7 (900) 000-00-00"
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                      onBlur={() => phone && setErrors((s) => ({ ...s, phone: phone.replace(/\D/g, "").length === 11 ? undefined : "Укажите номер полностью: 11 цифр" }))}
                      aria-invalid={!!errors.phone}
                      aria-describedby="phone-err"
                      aria-required="true"
                    />
                    <span id="phone-err" className={clsx("text-sm text-danger", !errors.phone && "sr-only")}>{errors.phone}</span>
                  </label>
                  <label className="grid gap-1.5 text-sm font-medium text-ink-2">
                    Что нужно закрыть
                    <textarea className={clsx(field, "min-h-28 resize-y")} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Например: терраса 6 × 2,5 м, нужен датчик ветра" />
                  </label>
                  <label className="flex cursor-pointer items-start gap-3 text-sm text-ink-2">
                    <input type="checkbox" className="mt-0.5 size-5 shrink-0 accent-[var(--color-brand)]" checked={agree} onChange={(e) => setAgree(e.target.checked)} aria-invalid={!!errors.agree} aria-describedby="agree-err" />
                    <span>Согласен с <a href="./privacy.html" className="font-semibold text-brand underline-offset-4 hover:underline">политикой обработки персональных данных</a></span>
                  </label>
                  <span id="agree-err" className={clsx("-mt-3 text-sm text-danger", !errors.agree && "sr-only")}>{errors.agree}</span>
                  <Button type="submit" size="lg" disabled={state === "sending"} aria-busy={state === "sending"}>
                    {state === "sending" ? "Отправляем…" : "Записаться на замер"}
                  </Button>
                  {state === "fail" && <p role="alert" className="text-center text-sm font-medium text-danger">Не получилось отправить. Позвоните нам: {SITE.phone}</p>}
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- Подвал ---------- */
export function Footer() {
  return (
    <footer className="bg-night pb-28 pt-16 text-white/70 md:pb-10">
      <div className="container-x grid gap-10 border-b border-white/10 pb-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo light />
          <p className="mt-4 max-w-sm">Продажа, монтаж и сервис наружных ZIP-экранов для домов, террас и бизнеса.</p>
        </div>
        <nav aria-label="Разделы" className="grid content-start">
          {NAV.map((n) => <a key={n.href} href={n.href} className="inline-flex min-h-11 items-center hover:text-white">{n.label}</a>)}
        </nav>
        <address className="grid content-start gap-3 not-italic">
          <a href={SITE.phoneHref} className="font-display text-xl font-bold text-white">{SITE.phone}</a>
          <a href={`mailto:${SITE.email}`} className="inline-flex items-center gap-2 hover:text-white"><Mail className="size-4" aria-hidden /> {SITE.email}</a>
          <span>{SITE.city}</span>
        </address>
      </div>
      <div className="container-x flex flex-wrap justify-between gap-4 pt-6 text-sm text-white/50">
        <span>© {new Date().getFullYear()} {SITE.brand}</span>
        <a href="./privacy.html" className="inline-flex min-h-11 items-center hover:text-white">Политика конфиденциальности</a>
      </div>
    </footer>
  )
}

/* ---------- Мобильная панель ---------- */
export function MobileBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-[1fr_1.5fr] gap-2 border-t border-line bg-canvas/90 px-3 pt-2.5 backdrop-blur-xl md:hidden" style={{ paddingBottom: "calc(10px + env(safe-area-inset-bottom))" }}>
      <a href={SITE.phoneHref} className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-line bg-white font-semibold">
        <Phone className="size-4" aria-hidden /> Позвонить
      </a>
      <a href="#lead" className="flex min-h-12 items-center justify-center rounded-full bg-brand font-semibold text-white">Бесплатный замер</a>
    </div>
  )
}
