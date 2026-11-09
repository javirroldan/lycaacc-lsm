import { useState } from "react"
import { ChevronDown, ChevronUp, History, Pencil, Plus, Trash2 } from "lucide-react"
import { ConfirmModal } from "./ConfirmModal"
import { fmtFechaLavado } from "../lib/dates"
import { EVAL_ITEMS, ITEMS_FACHADA, evaluacionClass, evaluacionLabel, normalizarItems, type FachadaEntorno } from "../lib/typesFachadaEntorno"

interface Props {
  estacion: string
  registros: FachadaEntorno[]
  editor: boolean
  onEditar: (r: FachadaEntorno) => void
  onEliminar: (id: number) => void
  onAgregar: (estacion: string) => void
}

function Fila({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className={`text-right font-medium ${value ? "text-slate-700" : "text-slate-400"}`}>{value || "—"}</span>
    </div>
  )
}

function DetalleRegistro({ r }: { r: FachadaEntorno }) {
  const items = normalizarItems(r.items)
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Fila label="OC" value={r.oc} />
        <Fila label="Sector de intervenciones" value={r.sector_intervenciones} />
        <Fila label="Horarios" value={r.horarios} />
        <Fila label="Suspendida (mal tiempo)" value={r.suspendida_mal_tiempo === null ? null : r.suspendida_mal_tiempo ? "Sí" : "No"} />
        <Fila label="Supervisor" value={r.supervisor_nombre} />
        <Fila label="Teléfono" value={r.supervisor_telefono} />
        <Fila label="Legajo" value={r.supervisor_legajo} />
      </div>

      <div className="border-t border-slate-200 pt-2">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Evaluación de fachada / entorno</p>
        <div className="space-y-1">
          {ITEMS_FACHADA.map((it) => (
            <div key={it.key} className="flex justify-between gap-2 text-xs">
              <span className="text-slate-600">{it.label}</span>
              <span className={`font-semibold ${evaluacionClass(items[it.key])}`}>{evaluacionLabel(items[it.key])}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-200 pt-2">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Evaluación diaria de tareas</p>
        <div className="space-y-1">
          {EVAL_ITEMS.map((it) => (
            <div key={it.key} className="flex justify-between gap-2 text-xs">
              <span className="text-slate-600">{it.label}</span>
              <span className={`font-semibold ${evaluacionClass(r[it.key])}`}>{evaluacionLabel(r[it.key])}</span>
            </div>
          ))}
        </div>
      </div>

      {(r.insumos || r.observaciones) && (
        <div className="border-t border-slate-200 pt-2 space-y-1 text-sm">
          {r.insumos && <p><span className="text-slate-500 text-xs">Insumos: </span><span className="text-slate-700">{r.insumos}</span></p>}
          {r.observaciones && <p><span className="text-slate-500 text-xs">Observaciones: </span><span className="text-slate-700">{r.observaciones}</span></p>}
        </div>
      )}
    </div>
  )
}

export function FachadaCard({ estacion, registros, editor, onEditar, onEliminar, onAgregar }: Props) {
  const [abierto, setAbierto] = useState(false)
  const [expandidoId, setExpandidoId] = useState<number | null>(null)
  const [aEliminar, setAEliminar] = useState<FachadaEntorno | null>(null)

  const ultimo = registros[0]
  const suspendidaUltima = ultimo?.suspendida_mal_tiempo === true

  return (
    <article className="bg-slate-100/90 rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-violet-50 via-violet-100 to-purple-100 border-b border-slate-200 cursor-pointer select-none"
        onClick={() => setAbierto((a) => !a)}
      >
        <div className="min-w-0">
          <p className="text-xs text-slate-400 uppercase tracking-wide">Fachada entorno</p>
          <p className="font-semibold text-slate-700 truncate">{estacion}</p>
          <p className="text-xs text-slate-500 truncate">
            {ultimo ? `${fmtFechaLavado(ultimo.fecha ?? ultimo.created_at) || "Sin fecha"} · ${ultimo.proveedor || "Sin proveedor"}` : "Sin registros todavía"}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-600/10 text-violet-700 text-xs font-bold border border-violet-200">
            <History className="w-3.5 h-3.5" />
            {registros.length} {registros.length === 1 ? "carga" : "cargas"}
          </span>
          {suspendidaUltima && <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-bold border border-amber-200">Suspendida</span>}
          {abierto ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
        </div>
      </div>

      {abierto && (
        <div className="max-h-[560px] overflow-y-auto">
          <p className="px-4 pt-3 text-[11px] uppercase tracking-wide text-slate-400 font-semibold">Historial de cargas</p>
          {registros.length === 0 && <p className="px-4 py-3 text-sm text-slate-400 italic">Sin registros en el historial.</p>}
          {registros.map((r, i) => {
            const expandido = expandidoId === r.id
            return (
              <div key={r.id} className={`p-4 ${i > 0 ? "border-t border-slate-200" : ""}`}>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setExpandidoId((cur) => (cur === r.id ? null : r.id)) }}
                  className="w-full flex items-center justify-between gap-3 text-left cursor-pointer"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-slate-700 truncate">{fmtFechaLavado(r.fecha ?? r.created_at) || "Sin fecha"} · {r.proveedor || "Sin proveedor"}</span>
                    <span className="block text-xs text-slate-500 truncate">{r.oc ? `OC ${r.oc} · ` : ""}{r.sector_intervenciones || "Sin sector"}</span>
                  </span>
                  <span className="flex items-center gap-2 shrink-0">
                    {r.suspendida_mal_tiempo === true && <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-bold border border-amber-200">Suspendida</span>}
                    {expandido ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </span>
                </button>

                {expandido && (
                  <div className="mt-3">
                    <DetalleRegistro r={r} />
                    {editor && (
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); onEditar(r) }}
                          className="inline-flex items-center gap-1.5 flex-1 justify-center px-3 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" /> Editar
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setAEliminar(r) }}
                          className="inline-flex items-center gap-1.5 flex-1 justify-center px-3 py-2 rounded-lg bg-white border border-red-300 text-red-600 text-sm font-semibold hover:bg-red-50 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" /> Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {abierto && editor && (
        <div className="px-4 py-2.5 border-t border-slate-200">
          <button
            onClick={(e) => { e.stopPropagation(); onAgregar(estacion) }}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Agregar carga en {estacion}
          </button>
        </div>
      )}

      <ConfirmModal
        abierto={aEliminar !== null}
        tema="violeta"
        titulo="Eliminar carga de fachada entorno"
        etiquetaConfirmar="Sí, eliminar"
        mensaje={`Se va a eliminar la carga de ${estacion} del ${fmtFechaLavado(aEliminar?.fecha ?? aEliminar?.created_at) || "—"} (${aEliminar?.proveedor || "sin proveedor"}). Esta acción no se puede deshacer.`}
        onConfirmar={() => { if (aEliminar) onEliminar(aEliminar.id); setAEliminar(null) }}
        onCancelar={() => setAEliminar(null)}
      />
    </article>
  )
}
