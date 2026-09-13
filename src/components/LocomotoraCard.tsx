import { useState } from "react"
import { CalendarDays, Pencil, Save, X } from "lucide-react"
import { fmtDMY, toInputValue } from "../lib/dates"
import {
  ESTADO_LOCO_LABEL,
  ESTADOS_LOCO,
  SERVICIO_LABEL,
  SERVICIOS,
  type EstadoLocomotora,
  type Locomotora,
  type ServicioLocomotora,
} from "../lib/typesLocomotoras"

const SEM_STYLE: Record<string, { badge: string; dot: string; texto: string }> = {
  verde: { badge: "bg-green-100 text-green-700 border-green-400", dot: "bg-green-500", texto: "OK" },
  amarillo: { badge: "bg-amber-100 text-amber-700 border-amber-400", dot: "bg-amber-400", texto: "Precaución" },
  rojo: { badge: "bg-red-100 text-red-700 border-red-400 animate-pulse-rojo", dot: "bg-red-500", texto: "Crítico" },
  sin: { badge: "bg-slate-100 text-slate-600 border-slate-300", dot: "bg-slate-400", texto: "Sin datos" },
}

const ESTADO_STYLE: Record<EstadoLocomotora, string> = {
  "en-servicio": "bg-green-100 text-green-700 border-green-300",
  detenida: "bg-slate-200 text-slate-600 border-slate-400",
}

const INPUT_CLASS =
  "flex-1 px-2 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:border-brand focus:ring-2 focus:ring-brand-mid outline-none"

interface Props {
  locomotora: Locomotora
  editor: boolean
  onCambio: (id: number, campos: { ultima?: string | null; servicio?: ServicioLocomotora; estado?: EstadoLocomotora; descripcion?: string | null }) => void
}

export function LocomotoraCard({ locomotora: l, editor, onCambio }: Props) {
  const sem = SEM_STYLE[l.sem]
  const [editando, setEditando] = useState(false)
  const [borrador, setBorrador] = useState({
    ultima: l.ultima,
    servicio: l.servicio,
    estado: l.estado,
    descripcion: l.descripcion ?? "",
  })

  const entrarEdicion = () => {
    setBorrador({
      ultima: l.ultima,
      servicio: l.servicio,
      estado: l.estado,
      descripcion: l.descripcion ?? "",
    })
    setEditando(true)
  }

  const guardar = () => {
    onCambio(l.id, {
      ultima: borrador.ultima || null,
      servicio: borrador.servicio,
      estado: borrador.estado,
      descripcion: borrador.descripcion.trim() || null,
    })
    setEditando(false)
  }

  return (
    <article className="bg-slate-100/90 rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-200/40 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-11 h-9 rounded-lg bg-brand text-white font-bold text-sm">
            {l.locomotora}
          </span>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">Locomotora</p>
            <p className="font-semibold text-slate-700 leading-none">N° {l.locomotora}</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${sem.badge}`}>
          <span className={`w-2 h-2 rounded-full ${sem.dot}`} />
          {sem.texto}
        </span>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-slate-500 w-24 shrink-0">Último lavado</span>
          {editando ? (
            <input
              type="date"
              value={toInputValue(borrador.ultima)}
              onChange={(e) => setBorrador((b) => ({ ...b, ultima: e.target.value || null }))}
              className={INPUT_CLASS}
            />
          ) : (
            <span className={`flex-1 text-sm font-medium ${l.ultima ? "text-slate-700" : "text-slate-400"}`}>
              {fmtDMY(l.ultima) || "—"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <CalendarDays className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-600">
            Sin lavar: <strong className={l.dias === null ? "" : l.dias <= 10 ? "text-green-600" : l.dias <= 20 ? "text-amber-600" : "text-red-600"}>{l.dias === null ? "—" : l.dias === 0 ? "Hoy" : `${l.dias} días`}</strong>
          </span>
        </div>

        <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-100">
          <span className="text-xs text-slate-500">Detalle / Descripción</span>
          {editando ? (
            <textarea
              value={borrador.descripcion}
              onChange={(e) => setBorrador((b) => ({ ...b, descripcion: e.target.value }))}
              rows={2}
              placeholder="Agregá un detalle, observación o descripción…"
              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:border-brand focus:ring-2 focus:ring-brand-mid outline-none resize-none"
            />
          ) : (
            <span className={`text-sm ${l.descripcion ? "text-slate-700" : "text-slate-400 italic"}`}>
              {l.descripcion || "Sin detalle"}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100">
          <span className="text-xs text-slate-500">Servicio</span>
          {editando ? (
            <select
              value={borrador.servicio}
              onChange={(e) => setBorrador((b) => ({ ...b, servicio: e.target.value as ServicioLocomotora }))}
              className="flex-1 px-2 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold bg-white focus:border-brand outline-none"
            >
              {SERVICIOS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold border border-slate-300 bg-white text-slate-700">
              {SERVICIO_LABEL[l.servicio]}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100">
          <span className="text-xs text-slate-500">Situación</span>
          {editando ? (
            <select
              value={borrador.estado}
              onChange={(e) => setBorrador((b) => ({ ...b, estado: e.target.value as EstadoLocomotora }))}
              className="flex-1 px-2 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold bg-white focus:border-brand outline-none"
            >
              {ESTADOS_LOCO.map((e) => (
                <option key={e.value} value={e.value}>
                  {e.label}
                </option>
              ))}
            </select>
          ) : (
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${ESTADO_STYLE[l.estado]}`}>
              {ESTADO_LOCO_LABEL[l.estado]}
            </span>
          )}
        </div>
      </div>

      {editor && !editando && (
        <div className="px-4 py-2.5 border-t border-slate-200">
          <button
            onClick={entrarEdicion}
            className="inline-flex items-center gap-1.5 w-full justify-center px-3 py-2 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-strong transition cursor-pointer"
          >
            <Pencil className="w-4 h-4" /> Editar
          </button>
        </div>
      )}

      {editor && editando && (
        <div className="px-4 py-2.5 border-t border-slate-200 flex gap-2">
          <button
            onClick={() => setEditando(false)}
            className="inline-flex items-center gap-1.5 flex-1 justify-center px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition cursor-pointer"
          >
            <X className="w-4 h-4" /> Cancelar
          </button>
          <button
            onClick={guardar}
            className="inline-flex items-center gap-1.5 flex-1 justify-center px-3 py-2 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-strong transition cursor-pointer"
          >
            <Save className="w-4 h-4" /> Guardar
          </button>
        </div>
      )}
    </article>
  )
}