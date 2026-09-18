import { createPortal } from "react-dom"
import { useState } from "react"
import { CalendarRange, X } from "lucide-react"
import { TEMAS, type TemaColor } from "../lib/temas"

interface Props {
  abierto: boolean
  titulo: string
  tema: TemaColor
  onCerrar: () => void
  onGenerar: (desde: string | undefined, hasta: string | undefined) => void
}

interface Datos {
  desde: string
  hasta: string
}

const VACIO: Datos = { desde: "", hasta: "" }

export function DateRangeModal({ abierto, titulo, tema, onCerrar, onGenerar }: Props) {
  const [datos, setDatos] = useState<Datos>(VACIO)
  const [error, setError] = useState<string | null>(null)

  if (!abierto) return null
  const t = TEMAS[tema]

  const cerrar = () => {
    setDatos(VACIO)
    setError(null)
    onCerrar()
  }

  const generar = () => {
    if (datos.desde && datos.hasta && datos.hasta < datos.desde) {
      setError("La fecha 'Hasta' no puede ser anterior a 'Desde'.")
      return
    }
    cerrar()
    onGenerar(datos.desde || undefined, datos.hasta || undefined)
  }

  return createPortal(
    <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4" onClick={cerrar}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between px-5 py-4 ${t.header}`}>
          <h3 className="flex items-center gap-2 font-bold">
            <CalendarRange className="w-5 h-5" />
            {titulo}
          </h3>
          <button onClick={cerrar} className="hover:bg-white/20 rounded-lg p-1.5 transition cursor-pointer" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <p className="text-xs text-slate-500">
            Elegí un rango de fechas. Si dejás ambas vacías se genera el informe completo.
          </p>

          <label className="block">
            <span className="text-xs text-slate-500 font-medium">Desde</span>
            <input
              type="date"
              value={datos.desde}
              onChange={(e) => setDatos((d) => ({ ...d, desde: e.target.value }))}
              className={`w-full mt-1 px-2 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white ${t.foco} outline-none`}
            />
          </label>

          <label className="block">
            <span className="text-xs text-slate-500 font-medium">Hasta</span>
            <input
              type="date"
              value={datos.hasta}
              onChange={(e) => setDatos((d) => ({ ...d, hasta: e.target.value }))}
              className={`w-full mt-1 px-2 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white ${t.foco} outline-none`}
            />
          </label>

          {error && (
            <p className="text-sm rounded-lg bg-amber-50 text-amber-700 border border-amber-200 px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={cerrar}
              className="inline-flex items-center justify-center flex-1 px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={generar}
              className={`inline-flex items-center justify-center flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${t.boton}`}
            >
              Generar informe
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}