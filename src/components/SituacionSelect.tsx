import { useLayoutEffect, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { ChevronDown } from "lucide-react"

interface Option<T extends string> {
  value: T
  label: string
}

interface Props<T extends string> {
  value: T
  options: Option<T>[]
  onChange: (v: T) => void
  className?: string
  tema?: "azul" | "verde"
}

type Tema = NonNullable<Props<string>["tema"]>

const FOCUS: Record<Tema, string> = {
  azul: "focus:border-brand focus:ring-2 focus:ring-brand-mid",
  verde: "focus:border-green-600 focus:ring-2 focus:ring-green-300",
}

const ACTIVO: Record<Tema, string> = {
  azul: "bg-orange-50 text-orange-700 font-semibold",
  verde: "bg-green-50 text-green-700 font-semibold",
}

const PANEL_H = 220

export function SituacionSelect<T extends string>({
  value,
  options,
  onChange,
  className = "",
  tema = "azul",
}: Props<T>) {
  const [abierto, setAbierto] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null)

  useLayoutEffect(() => {
    if (!abierto || !btnRef.current) return
    const r = btnRef.current.getBoundingClientRect()
    const panelH = Math.min(options.length * 36 + 8, PANEL_H)
    const espacioAbajo = window.innerHeight - r.bottom - 8
    const abreArriba = espacioAbajo < panelH
    setPos({
      top: abreArriba ? Math.max(8, r.top - panelH - 4) : r.bottom + 4,
      left: r.left,
      width: Math.max(r.width, 200),
    })
  }, [abierto, options.length])

  useEffect(() => {
    if (!abierto) return
    const onDown = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node
      if (btnRef.current?.contains(t)) return
      if (panelRef.current?.contains(t)) return
      setAbierto(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false)
    }
    const onScroll = (e: Event) => {
      const t = e.target as Node
      if (t && panelRef.current?.contains(t)) return
      setAbierto(false)
    }
    window.addEventListener("mousedown", onDown)
    window.addEventListener("touchstart", onDown)
    document.addEventListener("keydown", onKey)
    window.addEventListener("scroll", onScroll, true)
    return () => {
      window.removeEventListener("mousedown", onDown)
      window.removeEventListener("touchstart", onDown)
      document.removeEventListener("keydown", onKey)
      window.removeEventListener("scroll", onScroll, true)
    }
  }, [abierto])

  const seleccionado = options.find((o) => o.value === value)

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setAbierto((o) => !o)}
        className={`flex items-center justify-between w-full px-2 py-1.5 rounded-lg border border-slate-200 text-sm bg-white text-slate-700 outline-none cursor-pointer ${FOCUS[tema]} ${className}`}
      >
        <span className={seleccionado ? "text-slate-700 font-semibold" : "text-slate-400"}>{seleccionado?.label ?? "—"}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${abierto ? "rotate-180" : ""}`} />
      </button>

      {abierto &&
        createPortal(
          <div
            ref={panelRef}
            className="fixed z-[70] bg-white rounded-xl shadow-2xl border border-slate-200"
            style={{ top: pos?.top ?? 0, left: pos?.left ?? 0, width: pos?.width ?? 0 }}
          >
            <div className="overflow-y-auto py-1" style={{ maxHeight: PANEL_H }}>
              {options.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    onChange(o.value)
                    setAbierto(false)
                  }}
                  className={`block w-full text-left px-3 py-2 text-sm transition cursor-pointer ${
                    o.value === value ? ACTIVO[tema] : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}