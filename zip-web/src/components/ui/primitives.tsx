import type { ComponentProps, ReactNode } from "react"
import { motion } from "motion/react"
import { clsx } from "clsx"

const EASE = [0.16, 1, 0.3, 1] as const

export function FadeIn({ children, delay = 0, className, as = "div" }: { children: ReactNode; delay?: number; className?: string; as?: "div" | "li" | "header" }) {
  const Comp = motion[as]
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </Comp>
  )
}

export function SectionHead({ kicker, title, sub, center }: { kicker: string; title: ReactNode; sub?: ReactNode; center?: boolean }) {
  return (
    <FadeIn as="header" className={clsx("mb-10 max-w-2xl md:mb-14", center && "mx-auto text-center")}>
      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-brand">{kicker}</p>
      <h2 className="text-3xl font-bold leading-[1.1] md:text-5xl">{title}</h2>
      {sub && <p className="mt-4 text-lg text-ink-3">{sub}</p>}
    </FadeIn>
  )
}

type BtnProps = { variant?: "brand" | "ghost" | "dark" | "light"; size?: "md" | "lg"; className?: string }

const btnBase = "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-[background-color,color,box-shadow,transform] duration-200 active:scale-[.98] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
const btnVariant = {
  brand: "bg-brand text-white hover:bg-brand-deep shadow-[0_8px_20px_-8px_rgb(21_128_61/.7)]",
  ghost: "border border-ink/15 bg-white/60 text-ink hover:bg-white backdrop-blur",
  dark: "bg-ink text-white hover:bg-black",
  light: "bg-white text-ink hover:bg-canvas",
}
const btnSize = { md: "min-h-11 px-5 text-[15px]", lg: "min-h-14 px-7 text-base" }

export const btnClass = ({ variant = "brand", size = "md", className }: BtnProps = {}) => clsx(btnBase, btnVariant[variant], btnSize[size], className)

export function ButtonLink({ variant, size, className, ...rest }: BtnProps & ComponentProps<"a">) {
  return <a className={btnClass({ variant, size, className })} {...rest} />
}

export function Button({ variant, size, className, ...rest }: BtnProps & ComponentProps<"button">) {
  return <button className={btnClass({ variant, size, className })} {...rest} />
}
