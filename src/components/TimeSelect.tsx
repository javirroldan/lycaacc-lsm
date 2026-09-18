import { useLayoutEffect, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Clock } from "lucide-react"

interface Props {
  value: string | null
  onChange: (v: string | null) => void
  className?: string
}

const HORAS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"))
const MINUTOS = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"))

const PANEL_H = 288

export function TimeSelect({ value, onChange, className = "" }: Props) {
  const [abierto, setAbierto] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null)

  const hh = value ? value.slice(0, 2) : null
  const mm = value ? value.slice(3, 5) : null

  useLayoutEffect(() => {
    if (!abierto || !btnRef.current) return
    const r = btnRef.current.getBoundingClientRect()
    const espacioAbajo = window.innerHeight - r.bottom - 8
    const abreArriba = espacioAbajo < PANEL_H
    setPos({
      top: abreArriba ? Math.max(8, r.top - PANEL_H - 4) : r.bottom + 4,
      left: r.left,
      width: Math.max(164, r.width),
    })
    for (const el of document.querySelectorAll<HTMLElement>("[data-time-seleccionada]")) {
      el.scrollIntoView({ block: "nearest" })
    }
  }, [abierto])

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

  const seleccionarHora = (h: string) => onChange(`${h}:${mm ?? "00"}`)
  const seleccionarMinuto = (m: string) => {
    onChange(`${hh ?? "00"}:${m}`)
    setAbierto(false)
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setAbierto((o) => !o)}
        className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg border border-slate-200 text-sm bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none cursor-pointer ${className}`}
      >
        <span className={hh && mm ? "text-slate-700" : "text-slate-400"}>{hh && mm ? `${hh}:${mm}` : "—"}</span>
        <Clock className="w-4 h-4 text-slate-400 shrink-0" />
      </button>

      {abierto &&
        createPortal(
          <div
            ref={panelRef}
            className="fixed z-[70] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden"
            style={{ top: pos?.top ?? 0, left: pos?.left ?? 0, width: pos?.width ?? 0 }}
          >
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100 bg-slate-50">
              <span className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">Seleccionar hora</span>
              <button
                type="button"
                onClick={() => {
                  onChange(null)
                  setAbierto(false)
                }}
                className="text-xs text-red-600 hover:underline cursor-pointer"
              >
                Limpiar
              </button>
            </div>

            <div className="flex justify-center p-2">
              <div className="flex flex-col overflow-y-auto" style={{ maxHeight: PANEL_H - 60 }}>
                {HORAS.map((h) => {
                  const activa = h === hh
                  return (
                    <button
                      key={h}
                      type="button"
                      data-time-seleccionada={activa ? "" : undefined}
                      onClick={() => seleccionarHora(h)}
                      className={`w-16 h-8 px-2 text-sm rounded-lg transition cursor-pointer ${
                        activa ? "bg-orange-600 text-white font-semibold" : "text-slate-700 hover:bg-orange-50"
                      }`}
                    >
                      {h}
                    </button>
                  )
                })}
              </div>

              <span className="self-center mx-1 text-lg font-bold text-slate-400">:</span>

              <div className="flex flex-col overflow-y-auto" style={{ maxHeight: PANEL_H - 60 }}>
                {MINUTOS.map((m) => {
                  const activo = m === mm
                  return (
                    <button
                      key={m}
                      type="button"
                      data-time-seleccionada={activo ? "" : undefined}
                      onClick={() => seleccionarMinuto(m)}
                      className={`w-16 h-8 px-2 text-sm rounded-lg transition cursor-pointer ${
                        activo ? "bg-orange-600 text-white font-semibold" : "text-slate-700 hover:bg-orange-50"
                      }`}
                    >
                      {m}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}