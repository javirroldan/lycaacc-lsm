import type { Basural } from "../lib/typesBasurales"
import type { BasuralesDetalleModo } from "./BasuralesStats"
import { fmtFechaLavado } from "../lib/dates"

interface Props {
  abierto: boolean
  modo: BasuralesDetalleModo
  registros: Basural[]
  onCerrar: () => void
}

export function BasuralesInfoModal({ abierto, modo, registros, onCerrar }: Props) {
  if (!abierto) return null
  const titulo =
    modo === "registros" ? "Registros de basurales" : modo === "suspendidas" ? "Tareas suspendidas" : "Tareas activas"
  const lista =
    modo === "registros"
      ? registros
      : modo === "suspendidas"
        ? registros.filter((r) => r.suspendida_mal_tiempo === true)
        : registros.filter((r) => r.suspendida_mal_tiempo !== true)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onCerrar}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-4 py-3 border-b bg-teal-50 flex items-center justify-between">
          <h3 className="font-bold text-teal-800">{titulo}</h3>
          <button onClick={onCerrar} className="text-slate-500 hover:text-slate-700 text-sm font-semibold cursor-pointer">Cerrar</button>
        </div>
        <div className="p-3 overflow-y-auto max-h-[65vh] space-y-2">
          {lista.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">Sin registros.</p>
          ) : (
            lista.map((r) => (
              <div key={r.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                <p className="font-semibold text-slate-700">{r.orden_servicio?.trim() ? `Orden N° ${r.orden_servicio.trim()} · ` : ""}{fmtFechaLavado(r.fecha ?? r.created_at) || "Sin fecha"} · {r.proveedor || "Sin proveedor"}</p>
                <p className="text-slate-500 text-xs mt-0.5">{r.domicilio || "Sin domicilio"} {r.oc ? `· OC ${r.oc}` : ""}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
