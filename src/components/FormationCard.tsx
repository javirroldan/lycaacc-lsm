import { useState } from "react"
import { CalendarDays, Check, ChevronDown, ChevronUp, Pencil, Plus, Save, Trash2 } from "lucide-react"
import { ConfirmModal } from "./ConfirmModal"
import { DateSelect } from "./DateSelect"
import { SituacionSelect } from "./SituacionSelect"
import { fmtDMY, fmtFechaLavado } from "../lib/dates"
import { ESTADOS, ESTADO_LABEL, type Estado, type Formacion } from "../lib/types"
import type { ServicioFormacion, SituacionFormacion } from "../lib/typesServicios"

const SEM_STYLE: Record<string, { badge: string; dot: string; texto: string }> = {
  verde: { badge: "bg-green-100 text-green-700 border-green-400", dot: "bg-green-500", texto: "OK" },
  amarillo: { badge: "bg-amber-100 text-amber-700 border-amber-400", dot: "bg-amber-400", texto: "Precaución" },
  rojo: { badge: "bg-red-100 text-red-700 border-red-400 animate-pulse-rojo", dot: "bg-red-500", texto: "Crítico" },
  sin: { badge: "bg-slate-100 text-slate-600 border-slate-300", dot: "bg-slate-400", texto: "Sin datos" },
}

const ESTADO_STYLE: Record<Estado, string> = {
  limpieza: "bg-cyan-100 text-cyan-700 border-cyan-300",
  reparacion: "bg-rose-100 text-rose-700 border-rose-300",
  "fuera-servicio": "bg-slate-200 text-slate-600 border-slate-400",
  activa: "bg-green-100 text-green-700 border-green-300",
}

interface Props {
  formacion: Formacion
  editor: boolean
  onCambio: (id: number, campos: { anteultima?: string | null; ultima?: string | null; estado?: Estado; descripcion?: string | null }) => void
  onAgregarServicio: (formacionId: number, fecha: string, situacion: SituacionFormacion) => void
  onCambioServicio: (servicioId: number, formacionId: number, fecha: string, situacion: SituacionFormacion) => void
  onEliminarServicio: (servicioId: number, formacionId: number) => void
}

export function FormationCard({ formacion: f, editor, onCambio, onAgregarServicio, onCambioServicio, onEliminarServicio }: Props) {
  const sem = SEM_STYLE[f.sem]
  const [abierto, setAbierto] = useState(false)
  const [modoEdicion, setModoEdicion] = useState(false)
  const [editandoServicioId, setEditandoServicioId] = useState<number | null>(null)
  const [borradorServicio, setBorradorServicio] = useState<{ fecha: string; situacion: Estado }>({ fecha: "", situacion: "activa" })
  const [descBorrador, setDescBorrador] = useState(f.descripcion ?? "")
  const [agregando, setAgregando] = useState(false)
  const [nuevaFecha, setNuevaFecha] = useState("")
  const [nuevaSituacion, setNuevaSituacion] = useState<Estado>(f.estado)
  const [aEliminarServicio, setAEliminarServicio] = useState<ServicioFormacion | null>(null)

  const entrarEdicion = () => {
    setDescBorrador(f.descripcion ?? "")
    setEditandoServicioId(null)
    setModoEdicion(true)
  }

  const guardarDescripcion = () => {
    onCambio(f.id, { descripcion: descBorrador.trim() || null })
  }

  const entrarEdicionServicio = (s: ServicioFormacion) => {
    setBorradorServicio({ fecha: s.fecha, situacion: s.situacion as Estado })
    setEditandoServicioId(s.id)
  }

  const guardarServicio = () => {
    if (borradorServicio.fecha) {
      onCambioServicio(editandoServicioId!, f.id, borradorServicio.fecha, borradorServicio.situacion as SituacionFormacion)
    }
    setEditandoServicioId(null)
  }

  const guardarNuevo = () => {
    if (nuevaFecha) onAgregarServicio(f.id, nuevaFecha, nuevaSituacion as SituacionFormacion)
    setNuevaFecha("")
    setNuevaSituacion(f.estado)
    setAgregando(false)
  }

  return (
    <article
      className={`bg-slate-100/90 rounded-xl shadow-sm border border-slate-200 overflow-hidden ${editor ? "select-none" : ""} cursor-pointer transition-shadow hover:shadow-md`}
      onClick={() => {
        if (!modoEdicion && editandoServicioId === null && !agregando) setAbierto((a) => !a)
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-50 via-blue-100 to-sky-100 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-brand text-white font-bold text-sm">
            {f.formacion}
          </span>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">Formación</p>
            <p className="font-semibold text-slate-700 leading-none">N° {f.formacion}</p>
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
          <span className="text-xs text-slate-500 w-24 shrink-0">Anteúltima</span>
          <span className={`flex-1 text-sm font-medium ${f.anteultima ? "text-slate-700" : "text-slate-400"}`}>
            {fmtDMY(f.anteultima) || "—"}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-slate-500 w-24 shrink-0">Última</span>
          <span className={`flex-1 text-sm font-medium ${f.ultima ? "text-slate-700" : "text-slate-400"}`}>
            {fmtDMY(f.ultima) || "—"}
          </span>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <CalendarDays className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-600">
            Demora: <strong className={f.dias === null ? "" : f.dias <= 15 ? "text-green-600" : f.dias <= 20 ? "text-amber-600" : "text-red-600"}>{f.dias === null ? "—" : f.dias === 0 ? "Hoy" : `${f.dias} días`}</strong>
          </span>
        </div>

        <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-100">
          <span className="text-xs text-slate-500">Detalle / Descripción</span>
          <span className={`text-sm ${f.descripcion ? "text-slate-700" : "text-slate-400 italic"}`}>
            {f.descripcion || "Sin detalle"}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100">
          <span className="text-xs text-slate-500">Situación</span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${ESTADO_STYLE[f.estado]}`}>
            {ESTADO_LABEL[f.estado]}
          </span>
        </div>
      </div>

      {abierto && (
        <div className="border-t border-slate-200">
          <div className="max-h-[320px] overflow-y-auto">
            <p className="px-4 pt-3 text-[11px] uppercase tracking-wide text-slate-400 font-semibold">
              Historial de lavados
            </p>
            {f.historial.length === 0 && (
              <p className="px-4 py-3 text-sm text-slate-400 italic">Sin registros en el historial.</p>
            )}
            {f.historial.map((s, i) => {
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
                          tema="azul"
                          className="flex-1"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs text-slate-500">Situación al ingresar</span>
                        <SituacionSelect
                          value={borradorServicio.situacion}
                          options={ESTADOS}
                          onChange={(v) => setBorradorServicio((b) => ({ ...b, situacion: v }))}
                          tema="azul"
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
                          className="inline-flex items-center justify-center flex-1 px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand-strong transition cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" /> Guardar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
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
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand-strong transition cursor-pointer"
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
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${ESTADO_STYLE[s.situacion as Estado]}`}>
                          {ESTADO_LABEL[s.situacion as Estado]}
                        </span>
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
                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:border-brand focus:ring-2 focus:ring-brand-mid outline-none resize-none"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  guardarDescripcion()
                }}
                className="inline-flex items-center gap-1.5 justify-center px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand-strong transition cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" /> Guardar descripción
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
                className={`inline-flex items-center gap-1.5 flex-1 justify-center px-3 py-2 rounded-lg border text-sm font-semibold transition cursor-pointer ${
                  modoEdicion
                    ? "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                    : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {modoEdicion ? <Check className="w-4 h-4" /> : <Pencil className="w-4 h-4" />} {modoEdicion ? "Listo" : "Editar card"}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setNuevaFecha("")
                  setNuevaSituacion(f.estado)
                  setAgregando(true)
                }}
                className="inline-flex items-center gap-1.5 flex-1 justify-center px-3 py-2 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-strong transition cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Agregar lavado
              </button>
            </div>
          )}

          {editor && agregando && (
            <div className="px-4 py-2.5 border-t border-slate-200 space-y-3">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Nuevo lavado · Formación N° {f.formacion}
              </p>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-slate-500 w-24 shrink-0">Fecha del lavado</span>
                <DateSelect
                  value={nuevaFecha || null}
                  onChange={(v) => setNuevaFecha(v ?? "")}
                  tema="azul"
                  className="flex-1"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-slate-500">Situación al ingresar</span>
                <SituacionSelect
                  value={nuevaSituacion}
                  options={ESTADOS}
                  onChange={setNuevaSituacion}
                  tema="azul"
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
                  className="inline-flex items-center justify-center flex-1 px-3 py-2 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-strong transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
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
        tema="azul"
        titulo="Eliminar lavado"
        etiquetaConfirmar="Sí, eliminar"
        mensaje={`Se va a eliminar el registro del historial de lavados de la Formación N° ${f.formacion} del ${
          fmtFechaLavado(aEliminarServicio?.fecha ?? null) || "—"
        }. Si era la fecha más reciente, la formación recalculará su última fecha, sus días de demora y su situación.`}
        onConfirmar={() => {
          if (aEliminarServicio) onEliminarServicio(aEliminarServicio.id, f.id)
          setAEliminarServicio(null)
        }}
        onCancelar={() => setAEliminarServicio(null)}
      />
    </article>
  )
}