import { toInputValue } from "../lib/dates"
import { ESTADOS, type Estado, type Formacion } from "../lib/types"

const SEM_BADGE: Record<string, string> = {
  verde: "bg-green-100 text-green-700 border-green-400",
  amarillo: "bg-amber-100 text-amber-700 border-amber-400",
  rojo: "bg-red-100 text-red-700 border-red-400 animate-pulse-rojo",
  sin: "bg-slate-100 text-slate-600 border-slate-300",
}

interface Props {
  formaciones: Formacion[]
  editor: boolean
  onCambio: (id: number, campos: { anteultima?: string | null; ultima?: string | null; estado?: Estado }) => void
}

export function FormationTable({ formaciones, editor, onCambio }: Props) {
  const ordenadas = [...formaciones].sort((a, b) => {
    if (a.dias !== null && b.dias !== null) return b.dias - a.dias
    if (a.dias !== null) return -1
    if (b.dias !== null) return 1
    return a.formacion - b.formacion
  })

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-brand text-white text-left">
            <th className="px-3 py-3 font-semibold text-xs uppercase tracking-wide">Formación</th>
            <th className="px-3 py-3 font-semibold text-xs uppercase tracking-wide">Anteúltima</th>
            <th className="px-3 py-3 font-semibold text-xs uppercase tracking-wide">Última</th>
            <th className="px-3 py-3 font-semibold text-xs uppercase tracking-wide">Días</th>
            <th className="px-3 py-3 font-semibold text-xs uppercase tracking-wide">Estado</th>
            <th className="px-3 py-3 font-semibold text-xs uppercase tracking-wide">Situación</th>
          </tr>
        </thead>
        <tbody>
          {ordenadas.map((f) => {
            const sem = SEM_BADGE[f.sem] + " inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border"
            return (
              <tr key={f.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                <td className="px-3 py-2.5 font-bold text-slate-700">N° {f.formacion}</td>
                <td className="px-3 py-2.5">
                  {editor ? (
                    <input
                      type="date"
                      value={toInputValue(f.anteultima)}
                      onChange={(e) => onCambio(f.id, { anteultima: e.target.value || null })}
                      className="px-2 py-1 rounded border border-slate-200 text-sm focus:border-brand outline-none"
                    />
                  ) : (
                    <span className="text-slate-600">{toInputValue(f.anteultima) ? toInputValue(f.anteultima) : "—"}</span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  {editor ? (
                    <input
                      type="date"
                      value={toInputValue(f.ultima)}
                      onChange={(e) => onCambio(f.id, { ultima: e.target.value || null })}
                      className="px-2 py-1 rounded border border-slate-200 text-sm focus:border-brand outline-none"
                    />
                  ) : (
                    <span className="text-slate-600">{toInputValue(f.ultima) || "—"}</span>
                  )}
                </td>
                <td className="px-3 py-2.5 font-semibold">
                  {f.dias !== null ? (
                    <span className={f.dias <= 10 ? "text-green-600" : f.dias <= 20 ? "text-amber-600" : "text-red-600"}>{f.dias === 0 ? "Hoy" : f.dias}</span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <span className={sem}>{f.sem === "sin" ? "Sin datos" : f.sem === "verde" ? "OK" : f.sem === "amarillo" ? "Precaución" : "Crítico"}</span>
                </td>
                <td className="px-3 py-2.5">
                  {editor ? (
                    <select
                      value={f.estado}
                      onChange={(e) => onCambio(f.id, { estado: e.target.value as Estado })}
                      className="px-2 py-1 rounded border border-slate-200 text-sm font-semibold bg-white focus:border-brand outline-none"
                    >
                      {ESTADOS.map((e) => (
                        <option key={e.value} value={e.value}>
                          {e.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-slate-600 capitalize">{f.estado.replace("-", " ")}</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}