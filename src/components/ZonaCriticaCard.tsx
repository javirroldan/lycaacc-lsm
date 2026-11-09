import { useState } from "react"
import { ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react"
import { ConfirmModal } from "./ConfirmModal"
import { fmtFechaLavado } from "../lib/dates"
import { EVAL_ITEMS, evaluacionClass, evaluacionLabel, SECTORES_DEFAULT, type ZonaCritica } from "../lib/typesZonaCritica"

interface Props { registro: ZonaCritica; editor: boolean; onEditar: (r: ZonaCritica) => void; onEliminar: (id: number) => void }

function Fila({ label, value }: { label: string; value: string | null | undefined }) {
  return <div className="flex justify-between gap-3 text-sm"><span className="text-slate-500 shrink-0">{label}</span><span className={`text-right font-medium ${value ? "text-slate-700" : "text-slate-400"}`}>{value || "—"}</span></div>
}

export function ZonaCriticaCard({ registro: r, editor, onEditar, onEliminar }: Props) {
  const [abierto, setAbierto] = useState(false)
  const [confirmar, setConfirmar] = useState(false)
  const sectores = Array.isArray(r.sectores) && r.sectores.length ? r.sectores : SECTORES_DEFAULT

  return (
    <article className="bg-slate-100/90 rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-rose-50 via-rose-100 to-pink-100 border-b border-slate-200 cursor-pointer select-none" onClick={() => setAbierto((a) => !a)}>
        <div className="min-w-0">
          <p className="text-xs text-slate-400 uppercase tracking-wide">Zona crítica</p>
          <p className="font-semibold text-slate-700 truncate">{r.orden_servicio?.trim() ? `Orden N° ${r.orden_servicio.trim()} · ` : ""}{fmtFechaLavado(r.fecha ?? r.created_at) || "Sin fecha"} · {r.proveedor || "Sin proveedor"}</p>
          <p className="text-xs text-slate-500 truncate">{r.sector_intervenciones || "Sin sector de intervenciones"}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {r.suspendida_mal_tiempo === true && <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-bold border border-amber-200">Suspendida</span>}
          {abierto ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
        </div>
      </div>

      {abierto && (
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Fila label="Orden de servicio" value={r.orden_servicio} />
            <Fila label="OC" value={r.oc} />
            <Fila label="Horarios" value={r.horarios} />
            <Fila label="Supervisor" value={r.supervisor_nombre} />
            <Fila label="Teléfono" value={r.supervisor_telefono} />
            <Fila label="Legajo" value={r.supervisor_legajo} />
            <Fila label="Suspendida (mal tiempo)" value={r.suspendida_mal_tiempo === null ? null : r.suspendida_mal_tiempo ? "Sí" : "No"} />
          </div>

          <div className="border-t border-slate-200 pt-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Datos por sector</p>
            <div className="space-y-2">
              {sectores.map((s, i) => (
                <div key={i} className="rounded-lg border border-slate-200 bg-white p-2">
                  <p className="text-xs font-bold text-rose-700">Sector {s.sector} <span className="font-normal text-slate-500">({s.tramo})</span></p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1 mt-1 text-xs">
                    <span><span className="text-slate-500">RSU vías:</span> <b className="text-slate-700">{s.rsu_vias_bolsas || "—"}</b></span>
                    <span><span className="text-slate-500">Escombro m³:</span> <b className="text-slate-700">{s.escombro_m3 || "—"}</b></span>
                    <span><span className="text-slate-500">Pastizales m²:</span> <b className="text-slate-700">{s.pastizales_m2 || "—"}</b></span>
                    <span><span className="text-slate-500">Cuadro vías:</span> <b className="text-slate-700">{s.cuadro_vias_rsu || "—"}</b></span>
                    <span><span className="text-slate-500">Parrilla vías:</span> <b className="text-slate-700">{s.parrilla_vias_rsu || "—"}</b></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-200 pt-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Evaluación diaria</p>
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

          {editor && (
            <div className="flex gap-2 pt-1 border-t border-slate-200">
              <button onClick={() => onEditar(r)} className="inline-flex items-center gap-1.5 flex-1 justify-center px-3 py-2 rounded-lg bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition cursor-pointer"><Pencil className="w-4 h-4" /> Editar</button>
              <button onClick={() => setConfirmar(true)} className="inline-flex items-center gap-1.5 flex-1 justify-center px-3 py-2 rounded-lg bg-white border border-red-300 text-red-600 text-sm font-semibold hover:bg-red-50 transition cursor-pointer"><Trash2 className="w-4 h-4" /> Eliminar</button>
            </div>
          )}
        </div>
      )}

      <ConfirmModal abierto={confirmar} tema="rose" titulo="Eliminar registro de zona crítica" etiquetaConfirmar="Sí, eliminar" mensaje={`Se va a eliminar el registro del ${fmtFechaLavado(r.fecha ?? r.created_at) || "—"} (${r.proveedor || "sin proveedor"}). Esta acción no se puede deshacer.`} onConfirmar={() => { onEliminar(r.id); setConfirmar(false) }} onCancelar={() => setConfirmar(false)} />
    </article>
  )
}
