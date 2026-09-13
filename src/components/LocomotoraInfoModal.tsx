import { Power, PowerOff, X } from "lucide-react"
import { fmtDMY } from "../lib/dates"
import type { EstadoLocomotora, Locomotora } from "../lib/typesLocomotoras"

interface Props {
  abierto: boolean
  estado: EstadoLocomotora
  locomotoras: Locomotora[]
  onCerrar: () => void
}

export function LocomotoraInfoModal({ abierto, estado, locomotoras, onCerrar }: Props) {
  if (!abierto) return null
  const lista = locomotoras
    .filter((l) => l.estado === estado)
    .sort((a, b) => (b.dias ?? 0) - (a.dias ?? 0))
  const titulo = estado === "en-servicio" ? "Locomotoras en Servicio" : "Locomotoras Detenidas"
  const Icono = estado === "en-servicio" ? Power : PowerOff

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onCerrar}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 bg-brand text-white">
          <h3 className="flex items-center gap-2 font-bold">
            <Icono className="w-5 h-5" />
            {titulo}
          </h3>
          <button onClick={onCerrar} className="hover:bg-white/20 rounded-lg p-1.5 transition cursor-pointer" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto">
          {lista.length === 0 ? (
            <p className="text-center text-slate-400 py-10">No hay locomotoras en este estado</p>
          ) : (
            <ul className="space-y-2">
              {lista.map((l) => (
                <li key={l.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center w-10 h-8 rounded-lg bg-brand-soft text-brand-strong font-bold text-sm">
                      {l.locomotora}
                    </span>
                    <div className="text-sm">
                      <p className="text-slate-500 text-xs">Último lavado: {fmtDMY(l.ultima) || "—"}</p>
                      <p className="text-slate-400 text-xs">{l.servicio === "ld" ? "Larga Distancia" : "Local"}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${l.dias !== null && l.dias > 20 ? "text-red-600" : l.dias !== null && l.dias > 10 ? "text-amber-600" : "text-green-600"}`}>
                    {l.dias === null ? "—" : l.dias === 0 ? "Hoy" : `${l.dias} días`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}