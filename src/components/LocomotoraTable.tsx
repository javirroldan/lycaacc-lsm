import { toInputValue } from "../lib/dates"
import {
  ESTADOS_LOCO,
  SERVICIO_LABEL,
  SERVICIOS,
  type EstadoLocomotora,
  type Locomotora,
  type ServicioLocomotora,
} from "../lib/typesLocomotoras"

const SEM_BADGE: Record<string, string> = {
  verde: "bg-green-100 text-green-700 border-green-400",
  amarillo: "bg-amber-100 text-amber-700 border-amber-400",
  rojo: "bg-red-100 text-red-700 border-red-400 animate-pulse-rojo",
  sin: "bg-slate-100 text-slate-600 border-slate-300",
}

interface Props {
  locomotoras: Locomotora[]
  editor: boolean
  onCambio: (id: number, campos: { ultima?: string | null; servicio?: ServicioLocomotora; estado?: EstadoLocomotora }) => void
}

export function LocomotoraTable({ locomotoras, editor, onCambio }: Props) {
  const ordenadas = [...locomotoras].sort((a, b) => {
    if (a.dias !== null && b.dias !== null) return b.dias - a.dias
    if (a.dias !== null) return -1
    if (b.dias !== null) return 1
    return a.locomotora.localeCompare(b.locomotora)
  })

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-brand text-white text-left">
            <th className="px-3 py-3 font-semibold text-xs uppercase tracking-wide">Locomotora</th>
            <th className="px-3 py-3 font-semibold text-xs uppercase tracking-wide">Servicio</th>
            <th className="px-3 py-3 font-semibold text-xs uppercase tracking-wide">Último lavado</th>
            <th className="px-3 py-3 font-semibold text-xs uppercase tracking-wide">Días</th>
            <th className="px-3 py-3 font-semibold text-xs uppercase tracking-wide">Estado</th>
            <th className="px-3 py-3 font-semibold text-xs uppercase tracking-wide">Situación</th>
          </tr>
        </thead>
        <tbody>
          {ordenadas.map((l) => {
            const sem = SEM_BADGE[l.sem] + " inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border"
            return (
              <tr key={l.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                <td className="px-3 py-2.5 font-bold text-slate-700">N° {l.locomotora}</td>
                <td className="px-3 py-2.5">
                  {editor ? (
                    <select
                      value={l.servicio}
                      onChange={(e) => onCambio(l.id, { servicio: e.target.value as ServicioLocomotora })}
                      className="px-2 py-1 rounded border border-slate-200 text-sm font-semibold bg-white focus:border-brand outline-none"
                    >
                      {SERVICIOS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-slate-600">{SERVICIO_LABEL[l.servicio]}</span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  {editor ? (
                    <input
                      type="date"
                      value={toInputValue(l.ultima)}
                      onChange={(e) => onCambio(l.id, { ultima: e.target.value || null })}
                      className="px-2 py-1 rounded border border-slate-200 text-sm focus:border-brand outline-none"
                    />
                  ) : (
                    <span className="text-slate-600">{toInputValue(l.ultima) || "—"}</span>
                  )}
                </td>
                <td className="px-3 py-2.5 font-semibold">
                  {l.dias !== null ? (
                    <span className={l.dias <= 15 ? "text-green-600" : l.dias <= 20 ? "text-amber-600" : "text-red-600"}>{l.dias === 0 ? "Hoy" : l.dias}</span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  {editor ? (
                    <select
                      value={l.estado}
                      onChange={(e) => onCambio(l.id, { estado: e.target.value as EstadoLocomotora })}
                      className="px-2 py-1 rounded border border-slate-200 text-sm font-semibold bg-white focus:border-brand outline-none"
                    >
                      {ESTADOS_LOCO.map((e) => (
                        <option key={e.value} value={e.value}>
                          {e.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-slate-600 capitalize">{l.estado.replace("-", " ")}</span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <span className={sem}>{l.sem === "sin" ? "Sin datos" : l.sem === "verde" ? "OK" : l.sem === "amarillo" ? "Precaución" : "Crítico"}</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}