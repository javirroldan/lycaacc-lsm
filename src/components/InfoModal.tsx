import { X, Factory, Wrench, XCircle } from "lucide-react"
import { fmtDMY } from "../lib/dates"
import type { Formacion } from "../lib/types"

interface Props {
  abierto: boolean
  estado: "limpieza" | "reparacion" | "fuera-servicio"
  formaciones: Formacion[]
  onCerrar: () => void
}

export function InfoModal({ abierto, estado, formaciones, onCerrar }: Props) {
  if (!abierto) return null
  const lista = formaciones
    .filter((f) => f.estado === estado)
    .sort((a, b) => (b.dias ?? 0) - (a.dias ?? 0))
  const titulo =
    estado === "limpieza"
      ? "Formaciones en Limpieza"
      : estado === "reparacion"
        ? "Formaciones en Reparación"
        : "Formaciones en Fuera de servicio"
  const Icono = estado === "limpieza" ? Factory : estado === "reparacion" ? Wrench : XCircle

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
            <p className="text-center text-slate-400 py-10">No hay formaciones en este estado</p>
          ) : (
            <ul className="space-y-2">
              {lista.map((f) => (
                <li key={f.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-brand-soft text-brand-strong font-bold text-sm">
                      {f.formacion}
                    </span>
                    <div className="text-sm">
                      <p className="text-slate-500 text-xs">Última: {fmtDMY(f.ultima) || "—"}</p>
                      <p className="text-slate-500 text-xs">Anteúltima: {fmtDMY(f.anteultima) || "—"}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${f.dias !== null && f.dias > 20 ? "text-red-600" : f.dias !== null && f.dias > 10 ? "text-amber-600" : "text-green-600"}`}>
                    {f.dias === null ? "—" : f.dias === 0 ? "Hoy" : `${f.dias} días`}
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