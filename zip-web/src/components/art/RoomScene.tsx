import { useId } from "react"
import { motion } from "motion/react"

type Props = {
  /** 0 — экран поднят, 1 — опущен полностью */
  drop?: number
  /** открытость ткани, % */
  openness?: number
  /** цвет ткани */
  cloth?: string
  /** показывать жаркие солнечные блики в комнате */
  glare?: boolean
  className?: string
  title?: string
}

// Чем больше открытость, тем лучше виден сад сквозь ткань.
export const clothOpacity = (openness: number) => Math.max(0.5, 0.97 - openness * 0.045)

/**
 * Вид изнутри гостиной через панорамное окно.
 * ZIP-экран опускается снаружи стекла.
 */
export function RoomScene({ drop = 1, openness = 3, cloth = "#3a3d40", glare = false, className, title }: Props) {
  const id = useId().replace(/:/g, "")
  const winX = 120, winY = 70, winW = 560, winH = 330
  const clothH = winH * drop

  return (
    <svg viewBox="0 0 800 520" className={className} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <defs>
        <linearGradient id={`sky${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8ec5e8" />
          <stop offset="1" stopColor="#d6ecf7" />
        </linearGradient>
        <linearGradient id={`wall${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#efebe3" />
          <stop offset="1" stopColor="#e4ded3" />
        </linearGradient>
        <linearGradient id={`floor${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c9a985" />
          <stop offset="1" stopColor="#b08e6b" />
        </linearGradient>
        <linearGradient id={`beam${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffd27a" stopOpacity=".75" />
          <stop offset="1" stopColor="#ffb347" stopOpacity="0" />
        </linearGradient>
        <pattern id={`weave${id}`} width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill={cloth} />
          <rect width="2" height="2" fill="#fff" opacity=".12" />
        </pattern>
        <clipPath id={`win${id}`}>
          <rect x={winX} y={winY} width={winW} height={winH} />
        </clipPath>
      </defs>

      {/* стена и пол */}
      <rect width="800" height="520" fill={`url(#wall${id})`} />
      <rect y="430" width="800" height="90" fill={`url(#floor${id})`} />

      {/* вид из окна */}
      <g clipPath={`url(#win${id})`}>
        <rect x={winX} y={winY} width={winW} height={winH} fill={`url(#sky${id})`} />
        <circle cx="590" cy="130" r="38" fill="#ffd166" />
        <path d={`M${winX} 300 Q 250 250 380 285 T 680 270 V 400 H ${winX} Z`} fill="#8fbf7a" />
        <path d={`M${winX} 330 Q 300 300 460 330 T 680 320 V 400 H ${winX} Z`} fill="#6fa35d" />
        <circle cx="230" cy="250" r="42" fill="#4f8a45" />
        <rect x="226" y="270" width="8" height="50" fill="#6b4f3a" />
        <circle cx="520" cy="262" r="30" fill="#5c9650" />
        <rect x="517" y="280" width="6" height="40" fill="#6b4f3a" />
        <rect x={winX} y="360" width={winW} height="40" fill="#d8c7a9" />

        {/* ZIP-экран снаружи */}
        <motion.rect
          x={winX} y={winY} width={winW} fill={`url(#weave${id})`}
          initial={false}
          animate={{ height: clothH, opacity: clothOpacity(openness) }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        />
        <motion.rect
          x={winX - 4} width={winW + 8} height={10} rx={2} fill="#1d2420"
          initial={false}
          animate={{ y: winY + Math.max(clothH, 4) - 8 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        />
      </g>

      {/* рама и импосты */}
      <rect x={winX - 10} y={winY - 22} width={winW + 20} height="22" rx="3" fill="#2a302c" />
      <rect x={winX - 10} y={winY} width="10" height={winH} fill="#2a302c" />
      <rect x={winX + winW} y={winY} width="10" height={winH} fill="#2a302c" />
      <rect x={winX + winW / 2 - 3} y={winY} width="6" height={winH} fill="#2a302c" />
      <rect x={winX - 10} y={winY + winH} width={winW + 20} height="10" fill="#2a302c" />

      {/* солнечные лучи в комнату */}
      <motion.g initial={false} animate={{ opacity: glare ? 1 : 0 }} transition={{ duration: 0.5 }}>
        <path d="M200 400 L120 520 H520 L640 400 Z" fill={`url(#beam${id})`} />
        <rect width="800" height="520" fill="#ff9a3c" opacity=".08" />
      </motion.g>

      {/* мебель */}
      <g>
        <rect x="90" y="410" width="290" height="70" rx="18" fill="#7a8f84" />
        <rect x="90" y="380" width="290" height="44" rx="16" fill="#8ba195" />
        <rect x="110" y="392" width="60" height="34" rx="10" fill="#e9dcc6" />
        <rect x="80" y="400" width="26" height="80" rx="10" fill="#6b8076" />
        <rect x="364" y="400" width="26" height="80" rx="10" fill="#6b8076" />
        <rect x="470" y="440" width="150" height="10" rx="5" fill="#3b3330" />
        <rect x="485" y="450" width="8" height="34" fill="#3b3330" />
        <rect x="597" y="450" width="8" height="34" fill="#3b3330" />
        <rect x="520" y="424" width="40" height="16" rx="4" fill="#d9a441" />
        <path d="M700 480 v-60 q 0 -30 -25 -50 q 35 10 35 50 q 10 -50 40 -60 q -25 25 -25 60 v60 z" fill="#5c9650" />
        <rect x="690" y="470" width="44" height="20" rx="6" fill="#c8b59a" />
      </g>
    </svg>
  )
}
