import { useEffect, useRef, type ReactNode } from "react"

export interface FloatingNavItem {
  key: string
  label: string
  icon: ReactNode
  active?: boolean
  onClick?: () => void
  activeText?: string
  underline?: string
}

interface Props {
  items: FloatingNavItem[]
  activeText?: string    // clase texto activo, default "text-blue-600"
  underline?: string     // clase subraya, default "bg-blue-500"
  /** Clases extra para el nav (ej: "lg:hidden", mostrar en todos los tamaños) */
  className?: string
}

export function FloatingNav({
  items,
  activeText = "text-blue-600",
  underline = "bg-blue-500",
  className = "",
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  useEffect(() => {
    const activo = items.find((i) => i.active)
    if (!activo) return
    const scroller = scrollRef.current
    const btn = btnRefs.current[activo.key]
    if (!scroller || !btn) return
    // Si todo entra sin scroll (ej: 3 ítems), no hace falta desplazar
    if (scroller.scrollWidth <= scroller.clientWidth) {
      scroller.scrollTo({ left: 0, behavior: "smooth" })
      return
    }
    const target = btn.offsetLeft - scroller.clientWidth / 2 + btn.offsetWidth / 2
    scroller.scrollTo({ left: Math.max(0, target), behavior: "smooth" })
  }, [items])

  const pocosItems = items.length <= 4

  return (
    <nav
      className={`fixed bottom-3 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-4xl rounded-2xl border border-gray-200 bg-white backdrop-blur-lg shadow-lg pb-[env(safe-area-inset-bottom)] ${className}`}
    >
      <div
        ref={scrollRef}
        className={`no-scrollbar flex items-center gap-1 h-14 px-2 overflow-x-auto scroll-smooth ${pocosItems ? "justify-center" : "lg:justify-center"}`}
      >
        {items.map((item) => {
          const iconActive = item.activeText ?? activeText
          const iconUnderline = item.underline ?? underline
          const cs = item.active ? iconActive : "text-gray-400"
          return (
            <button
              key={item.key}
              ref={(el) => { btnRefs.current[item.key] = el }}
              onClick={item.onClick}
              aria-label={item.label}
              className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-2 rounded-xl transition-colors cursor-pointer ${pocosItems ? "flex-1 min-w-[80px]" : "w-[80px] shrink-0 lg:w-auto lg:flex-1"}`}
            >
              <span className={`transition ${item.active ? "" : "grayscale opacity-60"}`}>{item.icon}</span>
              <span className={`text-[10px] font-medium whitespace-nowrap ${cs}`}>{item.label}</span>
              {item.active && <span className={`h-0.5 w-6 rounded-full ${iconUnderline}`} />}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
