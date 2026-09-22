import { useState } from "react"
import { CalendarDays, Check, ChevronDown, ChevronUp, Pencil, Plus, Save, Trash2 } from "lucide-react"
import { ConfirmModal } from "./ConfirmModal"
import { DateSelect } from "./DateSelect"
import { SituacionSelect } from "./SituacionSelect"
import { fmtDMY, fmtFechaLavado } from "../lib/dates"
import {
  ESTADO_LOCO_LABEL,
  ESTADOS_LOCO,
  SERVICIO_LABEL,
  SERVICIOS,
  type EstadoLocomotora,
  type Locomotora,
  type ServicioLocomotora,
} from "../lib/typesLocomotoras"
import type {
  ServicioLocomotora as ServicioLocomotoraHistorial,
  SituacionLocomotora,
  TipoServicioLocomotora,
} from "../lib/typesServicios"

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

interface Props {
  locomotora: Locomotora
  editor: boolean
  onCambio: (id: number, campos: { ultima?: string | null; servicio?: ServicioLocomotora; estado?: EstadoLocomotora; descripcion?: string | null }) => void
  onAgregarServicio: (locomotoraId: number, fecha: string, situacion: SituacionLocomotora, servicio: TipoServicioLocomotora) => void
  onCambioServicio: (servicioId: number, locomotoraId: number, fecha: string, situacion: SituacionLocomotora, servicio: TipoServicioLocomotora) => void
  onEliminarServicio: (servicioId: number, locomotoraId: number) => void
}

export function LocomotoraCard({ locomotora: l, editor, onCambio, onAgregarServicio, onCambioServicio, onEliminarServicio }: Props) {
  const sem = SEM_STYLE[l.sem]
  const [abierto, setAbierto] = useState(false)
  const [modoEdicion, setModoEdicion] = useState(false)
  const [editandoServicioId, setEditandoServicioId] = useState<number | null>(null)
  const [borradorServicio, setBorradorServicio] = useState<{ fecha: string; situacion: EstadoLocomotora; servicio: TipoServicioLocomotora }>({
    fecha: "",
    situacion: "en-servicio",
    servicio: "local",
  })
  const [descBorrador, setDescBorrador] = useState(l.descripcion ?? "")
  const [agregando, setAgregando] = useState(false)
  const [nuevaFecha, setNuevaFecha] = useState("")
  const [nuevaSituacion, setNuevaSituacion] = useState<EstadoLocomotora>(l.estado)
  const [nuevoServicio, setNuevoServicio] = useState<TipoServicioLocomotora>(l.servicio)
  const [aEliminarServicio, setAEliminarServicio] = useState<ServicioLocomotoraHistorial | null>(null)

  const entrarEdicion = () => {
    setDescBorrador(l.descripcion ?? "")
    setEditandoServicioId(null)
    setModoEdicion(true)
  }

  const guardarCambios = () => {
    onCambio(l.id, {
      descripcion: descBorrador.trim() || null,
    })
  }

  const entrarEdicionServicio = (s: ServicioLocomotoraHistorial) => {
    setBorradorServicio({ fecha: s.fecha, situacion: s.situacion as EstadoLocomotora, servicio: s.servicio })
    setEditandoServicioId(s.id)
  }

  const guardarServicio = () => {
    if (borradorServicio.fecha) {
      onCambioServicio(
        editandoServicioId!,
        l.id,
        borradorServicio.fecha,
        borradorServicio.situacion as SituacionLocomotora,
        borradorServicio.servicio,
      )
    }
    setEditandoServicioId(null)
  }

  const guardarNuevo = () => {
    if (nuevaFecha) onAgregarServicio(l.id, nuevaFecha, nuevaSituacion as SituacionLocomotora, nuevoServicio)
    setNuevaFecha("")
    setNuevaSituacion(l.estado)
    setNuevoServicio(l.servicio)
    setAgregando(false)
  }

  return (
    <article
      className={`bg-slate-100/90 rounded-xl shadow-sm border border-slate-200 overflow-hidden ${editor ? "select-none" : ""} cursor-pointer transition-shadow hover:shadow-md`}
      onClick={() => {
        if (!modoEdicion && editandoServicioId === null && !agregando) setAbierto((a) => !a)
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-green-50 via-green-100 to-emerald-100 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-11 h-9 rounded-lg bg-green-600 text-white font-bold text-sm">
            {l.locomotora}
          </span>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">Locomotora</p>
            <p className="font-semibold text-slate-700 leading-none">N° {l.locomotora}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${sem.badge}`}>
            <span className={`w-2 h-2 rounded-full ${sem.dot}`} />
            {sem.texto}
          </span>
          {abierto ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-slate-500 w-24 shrink-0">Último lavado</span>
          <span className={`flex-1 text-sm font-medium ${l.ultima ? "text-slate-700" : "text-slate-400"}`}>
            {fmtDMY(l.ultima) || "—"}
          </span>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <CalendarDays className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-600">
            Sin lavar: <strong className={l.dias === null ? "" : l.dias <= 15 ? "text-green-600" : l.dias <= 20 ? "text-amber-600" : "text-red-600"}>{l.dias === null ? "—" : l.dias === 0 ? "Hoy" : `${l.dias} días`}</strong>
          </span>
        </div>

        <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-100">
          <span className="text-xs text-slate-500">Detalle / Descripción</span>
          <span className={`text-sm ${l.descripcion ? "text-slate-700" : "text-slate-400 italic"}`}>
            {l.descripcion || "Sin detalle"}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100">
          <span className="text-xs text-slate-500">Servicio</span>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold border border-slate-300 bg-white text-slate-700">
            {SERVICIO_LABEL[l.servicio]}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100">
          <span className="text-xs text-slate-500">Situación</span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${ESTADO_STYLE[l.estado]}`}>
            {ESTADO_LOCO_LABEL[l.estado]}
          </span>
        </div>
      </div>

      {abierto && (
        <div className="border-t border-slate-200">
          <div className="max-h-[320px] overflow-y-auto">
            <p className="px-4 pt-3 text-[11px] uppercase tracking-wide text-slate-400 font-semibold">
              Historial de lavados
            </p>
            {l.historial.length === 0 && (
              <p className="px-4 py-3 text-sm text-slate-400 italic">Sin registros en el historial.</p>
            )}
            {l.historial.map((s, i) => {
              const editandoServicio = editandoServicioId === s.id
              return (
                <div key={s.id} className={`p-4 ${i > 0 ? "border-t border-slate-200" : ""}`}>
                  {editandoServicio ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-slate-500 w-24 shrink-0">Fecha del lavado</span>
                        <DateSelect
                          value={borradorServicio.fecha || null}
                          onChange={(v) => setBorradorServicio((b) => ({ ...b, fecha: v ?? "" }))}
                          tema="verde"
                          className="flex-1"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs text-slate-500">Situación al ingresar</span>
                        <SituacionSelect
                          value={borradorServicio.situacion}
                          options={ESTADOS_LOCO}
                          onChange={(v) => setBorradorServicio((b) => ({ ...b, situacion: v }))}
                          tema="verde"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs text-slate-500">Servicio (Local / LD)</span>
                        <SituacionSelect
                          value={borradorServicio.servicio}
                          options={SERVICIOS}
                          onChange={(v) => setBorradorServicio((b) => ({ ...b, servicio: v }))}
                          tema="verde"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditandoServicioId(null)
                          }}
                          className="inline-flex items-center justify-center flex-1 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            guardarServicio()
                          }}
                          className="inline-flex items-center justify-center flex-1 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" /> Guardar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-600" />
                        <span className="text-sm font-medium text-slate-700">
                          Lavado {fmtFechaLavado(s.fecha) || "—"}
                        </span>
                      </div>
                      {modoEdicion && editor ? (
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              entrarEdicionServicio(s)
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" /> Editar
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setAEliminarServicio(s)
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-red-300 text-red-600 text-xs font-semibold hover:bg-red-50 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Eliminar
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-slate-300 bg-white text-slate-600">
                            {SERVICIO_LABEL[s.servicio]}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${ESTADO_STYLE[s.situacion as EstadoLocomotora]}`}>
                            {ESTADO_LOCO_LABEL[s.situacion as EstadoLocomotora]}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {modoEdicion && (
            <div className="px-4 py-3 border-t border-slate-200 space-y-2">
              <span className="text-xs text-slate-500">Detalle / Descripción</span>
              <textarea
                value={descBorrador}
                onChange={(e) => setDescBorrador(e.target.value)}
                rows={2}
                placeholder="Agregá un detalle, observación o descripción…"
                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:border-green-600 focus:ring-2 focus:ring-green-300 outline-none resize-none"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  guardarCambios()
                }}
                className="inline-flex items-center gap-1.5 justify-center px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" /> Guardar cambios
              </button>
            </div>
          )}

          {editor && !agregando && (
            <div className="px-4 py-2.5 border-t border-slate-200 flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (modoEdicion) {
                    setEditandoServicioId(null)
                    setModoEdicion(false)
                  } else {
                    entrarEdicion()
                  }
                }}
                className="inline-flex items-center gap-1.5 flex-1 justify-center px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition cursor-pointer"
              >
                {modoEdicion ? <Check className="w-4 h-4" /> : <Pencil className="w-4 h-4" />} {modoEdicion ? "Listo" : "Editar card"}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setNuevaFecha("")
                  setNuevaSituacion(l.estado)
                  setNuevoServicio(l.servicio)
                  setAgregando(true)
                }}
                className="inline-flex items-center gap-1.5 flex-1 justify-center px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Agregar lavado
              </button>
            </div>
          )}

          {editor && agregando && (
            <div className="px-4 py-2.5 border-t border-slate-200 space-y-3">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Nuevo lavado · Locomotora N° {l.locomotora}
              </p>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-slate-500 w-24 shrink-0">Fecha del lavado</span>
                <DateSelect
                  value={nuevaFecha || null}
                  onChange={(v) => setNuevaFecha(v ?? "")}
                  tema="verde"
                  className="flex-1"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-slate-500">Situación al ingresar</span>
                <SituacionSelect
                  value={nuevaSituacion}
                  options={ESTADOS_LOCO}
                  onChange={setNuevaSituacion}
                  tema="verde"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-slate-500">Servicio (Local / LD)</span>
                <SituacionSelect
                  value={nuevoServicio}
                  options={SERVICIOS}
                  onChange={setNuevoServicio}
                  tema="verde"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setNuevaFecha("")
                    setAgregando(false)
                  }}
                  className="inline-flex items-center justify-center flex-1 px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    guardarNuevo()
                  }}
                  disabled={!nuevaFecha}
                  className="inline-flex items-center justify-center flex-1 px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" /> Guardar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        abierto={aEliminarServicio !== null}
        tema="verde"
        titulo="Eliminar lavado"
        etiquetaConfirmar="Sí, eliminar"
        mensaje={`Se va a eliminar el registro del historial de lavados de la Locomotora N° ${l.locomotora} del ${
          fmtFechaLavado(aEliminarServicio?.fecha ?? null) || "—"
        }. Si era la fecha más reciente, la locomotora recalculará su último lavado, sus días sin lavar y su situación.`}
        onConfirmar={() => {
          if (aEliminarServicio) onEliminarServicio(aEliminarServicio.id, l.id)
          setAEliminarServicio(null)
        }}
        onCancelar={() => setAEliminarServicio(null)}
      />
    </article>
  )
}