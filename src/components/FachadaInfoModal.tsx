import type { FachadaEntorno } from "../lib/typesFachadaEntorno"
import { agruparPorEstacion } from "../lib/typesFachadaEntorno"
import type { FachadaDetalleModo } from "./FachadaStats"
import { fmtFechaLavado } from "../lib/dates"
import { createPortal } from "react-dom"

interface Props { abierto: boolean; modo: FachadaDetalleModo; registros: FachadaEntorno[]; onCerrar: () => void }

export function FachadaInfoModal({ abierto, modo, registros, onCerrar }: Props) {
  if (!abierto) return null
  const grupos = agruparPorEstacion(registros)
  const titulo = modo === "registros" ? "Registros de fachada entorno" : modo === "estaciones" ? "Estaciones con cargas" : "Tareas suspendidas por mal tiempo"
  const lista = modo === "registros" ? registros : modo === "suspendidas" ? registros.filter((r) => r.suspendida_mal_tiempo === true) : registros
  return createPortal(
    <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4" onClick={onCerrar}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-4 py-3 border-b bg-violet-50 flex items-center justify-between">
          <h3 className="font-bold text-violet-800">{titulo}</h3>
          <button onClick={onCerrar} className="text-slate-500 hover:text-slate-700 text-sm font-semibold cursor-pointer">Cerrar</button>
        </div>
        <div className="p-3 overflow-y-auto max-h-[65vh] space-y-2">
          {modo === "estaciones" ? (
            grupos.map((g) => (
              <div key={g.estacion} className="rounded-lg border border-slate-200 p-3 text-sm flex items-center justify-between gap-3">
                <span className="font-semibold text-slate-700">{g.estacion}</span>
                <span className={`text-xs font-bold ${g.registros.length ? "text-violet-700" : "text-slate-400"}`}>{g.registros.length ? `${g.registros.length} cargas` : "Sin registros"}</span>
              </div>
            ))
          ) : lista.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">Sin registros.</p>
          ) : (
            lista.map((r) => (
              <div key={r.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                <p className="font-semibold text-slate-700">{r.estacion || "Sin estación"} · {fmtFechaLavado(r.fecha ?? r.created_at) || "Sin fecha"}</p>
                <p className="text-slate-500 text-xs mt-0.5">{r.proveedor || "Sin proveedor"} {r.oc ? `· OC ${r.oc}` : ""}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
