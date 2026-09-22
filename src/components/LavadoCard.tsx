import { useState } from "react"
import { Check, ChevronDown, ChevronUp, History, Pencil, Plus, Save, Trash2, X } from "lucide-react"
import { ConfirmModal } from "./ConfirmModal"
import { TimeSelect } from "./TimeSelect"
import { DateSelect } from "./DateSelect"
import { fechaHoy, fmtFechaLavado, toFechaKey } from "../lib/dates"
import {
  OK_VALOR_CLASS,
  okABoolean,
  okLabel,
  okValor,
  type CamposEditablesLavado,
  type Lavado,
  type NuevoLavado,
  type ValorOk,
} from "../lib/typesLavado"

interface Props {
  formacion: number
  registros: Lavado[]
  editor: boolean
  onCambio: (id: number, campos: Partial<CamposEditablesLavado>) => void
  onEliminar: (id: number) => void
  onAgregar: (campos: NuevoLavado) => void
}

interface Borrador {
  fecha: string
  ingreso: string
  egreso: string
  pasadas: string
  ok: ValorOk
}

function nuevoVacio() {
  return { fecha: fechaHoy(), ingreso: "", egreso: "" }
}

function fechaDeLavado(l: Lavado): string {
  return toFechaKey(l.fecha) ?? toFechaKey(l.created_at) ?? ""
}

function fmtHM(hora: string | null): string {
  return hora ? hora.slice(0, 5) : ""
}

function RegistroCuerpo({ l, editando, borrador, setBorrador }: {
  l: Lavado
  editando: boolean
  borrador: Borrador
  setBorrador: (b: Borrador) => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-slate-500 w-28 shrink-0">Fecha del lavado</span>
        {editando ? (
          <DateSelect
            value={borrador.fecha || null}
            onChange={(v) => setBorrador({ ...borrador, fecha: v ?? "" })}
            className="flex-1"
          />
        ) : (
          <span className={`flex-1 text-sm font-medium ${l.fecha ? "text-slate-700" : "text-slate-400"}`}>
            {fmtFechaLavado(l.fecha ?? l.created_at) || "—"}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-slate-500 w-28 shrink-0">Hora ingreso</span>
        {editando ? (
          <TimeSelect
            value={borrador.ingreso || null}
            onChange={(v) => setBorrador({ ...borrador, ingreso: v ?? "" })}
            className="flex-1"
          />
        ) : (
          <span className={`flex-1 text-sm font-medium ${l.ingreso ? "text-slate-700" : "text-slate-400"}`}>
            {fmtHM(l.ingreso) || "—"}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-slate-500 w-28 shrink-0">Hora egreso</span>
        {editando ? (
          <TimeSelect
            value={borrador.egreso || null}
            onChange={(v) => setBorrador({ ...borrador, egreso: v ?? "" })}
            className="flex-1"
          />
        ) : (
          <span className={`flex-1 text-sm font-medium ${l.egreso ? "text-slate-700" : "text-slate-400"}`}>
            {fmtHM(l.egreso) || "—"}
          </span>
        )}
      </div>

      <div className="flex gap-3 pt-1 border-t border-slate-100">
        <div className="flex-1 flex items-center justify-between gap-2">
          <span className="text-xs text-slate-500 shrink-0">Pasadas rodillos</span>
          <span className="text-sm font-semibold text-orange-700">{l.pasadas ?? "—"}</span>
        </div>
        <span className="w-px bg-slate-200" />
        <div className="flex-1 flex items-center justify-between gap-2">
          <span className="text-xs text-slate-500 shrink-0">Lavado</span>
          <span className={`text-sm font-semibold ${OK_VALOR_CLASS[okValor(l.ok)]}`}>{okLabel(l.ok)}</span>
        </div>
      </div>
    </div>
  )
}

export function LavadoCard({ formacion, registros, editor, onCambio, onEliminar, onAgregar }: Props) {
  const [abierto, setAbierto] = useState(false)
  const [modoEdicion, setModoEdicion] = useState(false)
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [borrador, setBorrador] = useState<Borrador>({ fecha: "", ingreso: "", egreso: "", pasadas: "", ok: "sin" })
  const [agregando, setAgregando] = useState(false)
  const [nuevo, setNuevo] = useState(nuevoVacio)
  const [aEliminar, setAEliminar] = useState<Lavado | null>(null)

  const ultimo = registros[0]

  const entrarEdicion = (l: Lavado) => {
    setBorrador({
      fecha: fechaDeLavado(l),
      ingreso: l.ingreso ?? "",
      egreso: l.egreso ?? "",
      pasadas: l.pasadas?.toString() ?? "",
      ok: okValor(l.ok),
    })
    setEditandoId(l.id)
  }

  const guardar = (l: Lavado) => {
    onCambio(l.id, {
      fecha: borrador.fecha || null,
      ingreso: borrador.ingreso || null,
      egreso: borrador.egreso || null,
      pasadas: borrador.pasadas === "" ? null : Number(borrador.pasadas),
      ok: okABoolean(borrador.ok),
    })
    setEditandoId(null)
  }

  const guardarNuevo = () => {
    onAgregar({ formacion, fecha: nuevo.fecha || null, ingreso: nuevo.ingreso || null, egreso: nuevo.egreso || null })
    setNuevo(nuevoVacio())
    setAgregando(false)
  }

  return (
    <article
      className="bg-slate-100/90 rounded-xl shadow-sm border border-slate-200 overflow-hidden cursor-pointer select-none transition-shadow hover:shadow-md"
      onClick={() => {
        if (editandoId === null && !agregando && !modoEdicion) setAbierto((a) => !a)
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-orange-50 via-orange-100 to-amber-100 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-orange-600 text-white font-bold text-sm">
            {formacion}
          </span>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">Formación</p>
            <p className="font-semibold text-slate-700 leading-none">N° {formacion}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-600/10 text-orange-700 text-xs font-bold border border-orange-200">
            <History className="w-3.5 h-3.5" />
            {registros.length} {registros.length === 1 ? "lavado" : "lavados"}
          </span>
          {abierto ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
        </div>
      </div>

      {!abierto && ultimo && (
        <div className="p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold mb-2">Último lavado</p>
          <RegistroCuerpo l={ultimo} editando={false} borrador={borrador} setBorrador={setBorrador} />
        </div>
      )}

      {abierto && (
        <div className="max-h-[320px] overflow-y-auto">
          <p className="px-4 pt-3 text-[11px] uppercase tracking-wide text-slate-400 font-semibold">
            Historial de lavados
          </p>
          {registros.map((l, i) => {
            const editando = editandoId === l.id
            return (
              <div key={l.id} className={`p-4 ${i > 0 ? "border-t border-slate-200" : ""}`}>
                <RegistroCuerpo l={l} editando={editando} borrador={borrador} setBorrador={setBorrador} />

                {editor && modoEdicion && !editando && (
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        entrarEdicion(l)
                      }}
                      className="inline-flex items-center gap-1.5 flex-1 justify-center px-3 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-semibold hover:bg-orange-700 transition cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Editar
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setAEliminar(l)
                      }}
                      className="inline-flex items-center gap-1.5 flex-1 justify-center px-3 py-1.5 rounded-lg bg-white border border-red-300 text-red-600 text-xs font-semibold hover:bg-red-50 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Eliminar
                    </button>
                  </div>
                )}

                {editor && editando && (
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditandoId(null)
                      }}
                      className="inline-flex items-center gap-1.5 flex-1 justify-center px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" /> Cancelar
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        guardar(l)
                      }}
                      className="inline-flex items-center gap-1.5 flex-1 justify-center px-3 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-semibold hover:bg-orange-700 transition cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" /> Guardar
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {abierto && editor && !agregando && (
        <div className="px-4 py-2.5 border-t border-slate-200 flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (modoEdicion) {
                setEditandoId(null)
                setModoEdicion(false)
              } else {
                setModoEdicion(true)
              }
            }}
            className="inline-flex items-center gap-1.5 flex-1 justify-center px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition cursor-pointer"
          >
            {modoEdicion ? <Check className="w-4 h-4" /> : <Pencil className="w-4 h-4" />} {modoEdicion ? "Listo" : "Editar card"}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setNuevo(nuevoVacio())
              setAgregando(true)
            }}
            className="inline-flex items-center gap-1.5 flex-1 justify-center px-3 py-2 rounded-lg bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Agregar
          </button>
        </div>
      )}

      {abierto && editor && agregando && (
        <div className="px-4 py-2.5 border-t border-slate-200 space-y-3">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">
            Nuevo lavado · Formación N° {formacion}
          </p>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-slate-500 w-28 shrink-0">Fecha del lavado</span>
            <DateSelect
              value={nuevo.fecha || null}
              onChange={(v) => setNuevo((n) => ({ ...n, fecha: v ?? "" }))}
              className="flex-1"
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-slate-500 w-28 shrink-0">Hora ingreso</span>
            <TimeSelect
              value={nuevo.ingreso || null}
              onChange={(v) => setNuevo((n) => ({ ...n, ingreso: v ?? "" }))}
              className="flex-1"
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-slate-500 w-28 shrink-0">Hora egreso</span>
            <TimeSelect
              value={nuevo.egreso || null}
              onChange={(v) => setNuevo((n) => ({ ...n, egreso: v ?? "" }))}
              className="flex-1"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setNuevo(nuevoVacio())
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
              className="inline-flex items-center justify-center flex-1 px-3 py-2 rounded-lg bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Guardar
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        abierto={aEliminar !== null}
        tema="naranja"
        titulo="Eliminar lavado"
        etiquetaConfirmar="Sí, eliminar"
        mensaje={`Se va a eliminar el registro de lavado de la Formación N° ${formacion} del ${
          fmtFechaLavado(aEliminar && toFechaKey(aEliminar.fecha ?? aEliminar.created_at)) || "—"
        } (ingreso ${fmtHM(aEliminar?.ingreso ?? null) || "—"} · egreso ${
          fmtHM(aEliminar?.egreso ?? null) || "—"
        }). Esta acción no se puede deshacer.`}
        onConfirmar={() => {
          if (aEliminar) onEliminar(aEliminar.id)
          setAEliminar(null)
        }}
        onCancelar={() => setAEliminar(null)}
      />
    </article>
  )
}