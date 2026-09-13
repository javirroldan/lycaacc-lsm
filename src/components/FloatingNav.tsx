import type { LucideIcon } from "lucide-react"

export interface FloatingNavItem {
  key: string
  label: string
  icon: LucideIcon
  active?: boolean
  onClick?: () => void
}

interface Props {
  items: FloatingNavItem[]
  activeText?: string    // clase texto activo, default "text-blue-400"
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
  return (
    <nav
      className={`fixed bottom-3 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-4xl rounded-2xl border border-gray-200 bg-white backdrop-blur-lg shadow-lg pb-[env(safe-area-inset-bottom)] ${className}`}
    >
      <div className="flex items-center justify-around h-14 px-2">
        {items.map((item) => {
          const Icon = item.icon
          const cs = item.active ? activeText : "text-gray-400"
          return (
            <button
              key={item.key}
              onClick={item.onClick}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
            >
              <Icon className={`h-5 w-5 ${cs}`} />
              <span className={`text-[10px] font-medium ${cs}`}>{item.label}</span>
              {item.active && <span className={`h-0.5 w-6 rounded-full ${underline}`} />}
            </button>
          )
        })}
      </div>
    </nav>
  )
}