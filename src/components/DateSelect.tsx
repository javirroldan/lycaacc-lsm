import { useLayoutEffect, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"
import { fechaHoy, fmtFechaLavado } from "../lib/dates"

interface Props {
  value: string | null
  onChange: (v: string | null) => void
  className?: string
  tema?: "azul" | "verde" | "naranja"
}

const PANEL_H = 320

type Tema = NonNullable<Props["tema"]>

const TEMAS: Record<Tema, { focusBtn: string; activo: string; hover: string; nav: string; hoy: string }> = {
  azul: {
    focusBtn: "focus:border-brand focus:ring-2 focus:ring-brand-mid",
    activo: "bg-blue-600 text-white font-semibold",
    hover: "hover:bg-blue-50",
    nav: "hover:bg-blue-50",
    hoy: "text-blue-600 border-blue-200 hover:bg-blue-50",
  },
  verde: {
    focusBtn: "focus:border-green-600 focus:ring-2 focus:ring-green-300",
    activo: "bg-green-600 text-white font-semibold",
    hover: "hover:bg-green-50",
    nav: "hover:bg-green-50",
    hoy: "text-green-600 border-green-200 hover:bg-green-50",
  },
  naranja: {
    focusBtn: "focus:border-orange-500 focus:ring-2 focus:ring-orange-200",
    activo: "bg-orange-600 text-white font-semibold",
    hover: "hover:bg-orange-50",
    nav: "hover:bg-orange-50",
    hoy: "text-orange-600 border-orange-200 hover:bg-orange-50",
  },
}

const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]

function partes(fecha: string): { a: number; m: number; d: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha)
  if (!m) return null
  return { a: Number(m[1]), m: Number(m[2]), d: Number(m[3]) }
}

function fechaKey(a: number, m: number, d: number): string {
  const mm = String(m).padStart(2, "0")
  const dd = String(d).padStart(2, "0")
  return `${a}-${mm}-${dd}`
}

export function DateSelect({ value, onChange, className = "", tema = "naranja" }: Props) {
  const t = TEMAS[tema]
  const [abierto, setAbierto] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null)

  const hoy = fechaHoy()

  const hoyP = partes(hoy) as { a: number; m: number; d: number }

  const [vista, setVista] = useState<{ a: number; m: number }>({ a: hoyP.a, m: hoyP.m })

  useLayoutEffect(() => {
    if (!abierto || !btnRef.current) return
    const s = partes(value ?? "")
    const hp = partes(hoy) as { a: number; m: number; d: number }
    setVista({ a: s?.a ?? hp.a, m: s?.m ?? hp.m })
    const r = btnRef.current.getBoundingClientRect()
    const espacioAbajo = window.innerHeight - r.bottom - 8
    const abreArriba = espacioAbajo < PANEL_H
    setPos({
      top: abreArriba ? Math.max(8, r.top - PANEL_H - 4) : r.bottom + 4,
      left: r.left,
      width: Math.max(240, r.width),
    })
  }, [abierto, value, hoy])

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

  const celdas = useMemo(() => {
    const { a, m } = vista
    const primero = new Date(a, m - 1, 1).getDay()
    const dias = new Date(a, m, 0).getDate()
    const lista: { key: string; dia: number | null; futuro: boolean }[] = []
    for (let i = 0; i < primero; i++) lista.push({ key: `b-${i}`, dia: null, futuro: false })
    for (let d = 1; d <= dias; d++) {
      const key = fechaKey(a, m, d)
      const futuro = key > hoy
      lista.push({ key, dia: d, futuro })
    }
    return lista
  }, [vista, hoy])

  const mesActual = vista.a === hoyP.a && vista.m === hoyP.m
  const mesActualFuturo = vista.a > hoyP.a || (vista.a === hoyP.a && vista.m > hoyP.m)

  const irMes = (delta: number) => {
    setVista((v) => {
      let m = v.m + delta
      let a = v.a
      if (m < 1) {
        m = 12
        a -= 1
      } else if (m > 12) {
        m = 1
        a += 1
      }
      return { a, m }
    })
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setAbierto((o) => !o)}
        className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg border border-slate-200 text-sm bg-white outline-none cursor-pointer ${t.focusBtn} ${className}`}
      >
        <span className={value ? "text-slate-700" : "text-slate-400"}>{value ? fmtFechaLavado(value) : "—"}</span>
        <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
      </button>

      {abierto &&
        createPortal(
          <div
            ref={panelRef}
            className="fixed z-[70] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden"
            style={{ top: pos?.top ?? 0, left: pos?.left ?? 0, width: pos?.width ?? 0 }}
          >
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100 bg-slate-50">
              <span className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">Seleccionar fecha</span>
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

            <div className="p-2">
              <div className="flex items-center justify-between px-1 mb-1">
                <button
                  type="button"
                  onClick={() => irMes(-1)}
                  className={`p-1 rounded-lg text-slate-500 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${t.nav}`}
                  aria-label="Mes anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-semibold text-slate-700">
                  {MESES[vista.m - 1]} {vista.a}
                </span>
                <button
                  type="button"
                  onClick={() => irMes(1)}
                  disabled={mesActualFuturo}
                  className={`p-1 rounded-lg text-slate-500 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${t.nav}`}
                  aria-label="Mes siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-0.5 mb-1">
                {DIAS_SEMANA.map((d) => (
                  <span key={d} className="text-center text-[10px] font-semibold uppercase text-slate-400 py-0.5">
                    {d}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-0.5">
                {celdas.map((c) => {
                  if (c.dia === null) return <span key={c.key} />
                  const activo = c.key === value
                  return (
                    <button
                      key={c.key}
                      type="button"
                      disabled={c.futuro}
                      onClick={() => {
                        onChange(c.key)
                        setAbierto(false)
                      }}
                      className={`h-8 text-sm rounded-lg transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 ${
                        activo
                          ? t.activo
                          : c.futuro
                            ? "text-slate-300"
                            : `text-slate-700 ${t.hover}`
                      }`}
                    >
                      {c.dia}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="px-2 pb-2">
              <button
                type="button"
                disabled={mesActual}
                onClick={() => {
                  setVista({ a: hoyP.a, m: hoyP.m })
                  onChange(hoy)
                  setAbierto(false)
                }}
                className={`w-full text-xs font-semibold border rounded-lg py-1.5 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${t.hoy}`}
              >
                Hoy
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}