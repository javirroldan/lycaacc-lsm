import { createPortal } from "react-dom"
import { Ban, ClipboardList, Train, X } from "lucide-react"
import { fmtFechaLavado } from "../lib/dates"
import { OK_VALOR_CLASS, okLabel, okValor, ordenarPorRecienteLavado, type Lavado } from "../lib/typesLavado"
import type { LavadoDetalleModo } from "./LavadoStats"

interface Props {
  abierto: boolean
  modo: LavadoDetalleModo
  registros: Lavado[]
  formaciones: { formacion: number; registros: Lavado[] }[]
  sinLavados: number[]
  onCerrar: () => void
}

export function LavadoInfoModal({ abierto, modo, registros, formaciones, sinLavados, onCerrar }: Props) {
  if (!abierto) return null

  const titulo =
    modo === "registros" ? "Registros de lavado" : modo === "formaciones" ? "Formaciones con lavado" : "Formaciones sin lavado"
  const Icono = modo === "registros" ? ClipboardList : modo === "formaciones" ? Train : Ban
  const total = modo === "registros" ? registros.length : modo === "formaciones" ? formaciones.length : sinLavados.length
  const listaRegistros = ordenarPorRecienteLavado(registros)

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onCerrar}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 bg-orange-600 text-white">
          <h3 className="flex items-center gap-2 font-bold">
            <Icono className="w-5 h-5" />
            {titulo} ({total})
          </h3>
          <button onClick={onCerrar} className="hover:bg-white/20 rounded-lg p-1.5 transition cursor-pointer" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto">
          {total === 0 ? (
            <p className="text-center text-slate-400 py-10">No hay datos</p>
          ) : modo === "registros" ? (
            <ul className="space-y-2">
              {listaRegistros.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 text-orange-700 font-bold text-sm shrink-0">
                      {l.formacion}
                    </span>
                    <div className="text-sm min-w-0">
                      <p className="font-semibold text-slate-700 truncate">
                        Ingreso {l.ingreso?.slice(0, 5) || "—"} → Egreso {l.egreso?.slice(0, 5) || "—"}
                      </p>
                      <p className="text-slate-500 text-xs">Lavado: {fmtFechaLavado(l.fecha ?? l.created_at) || "—"}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold shrink-0 ${OK_VALOR_CLASS[okValor(l.ok)]}`}>{okLabel(l.ok)}</span>
                </li>
              ))}
            </ul>
          ) : modo === "formaciones" ? (
            <ul className="space-y-2">
              {formaciones.map((g) => (
                <li key={g.formacion} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 text-orange-700 font-bold text-sm">
                      {g.formacion}
                    </span>
                    <span className="text-sm text-slate-700">
                      {g.registros.length} {g.registros.length === 1 ? "registro" : "registros"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="space-y-2">
              {sinLavados.map((n) => (
                <li key={n} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-500 font-bold text-sm">
                      {n}
                    </span>
                    <span className="text-sm text-slate-700">Sin registros</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}