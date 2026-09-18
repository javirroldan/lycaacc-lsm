import { useState } from "react"
import { CalendarDays, ChevronDown, ChevronUp, History, Pencil, Plus, Save, Trash2, X } from "lucide-react"
import { ConfirmModal } from "./ConfirmModal"
import { TimeSelect } from "./TimeSelect"
import {
  OK_OPCIONES,
  OK_VALOR_CLASS,
  okABoolean,
  okLabel,
  okValor,
  type CamposEditablesLavado,
  type Lavado,
  type NuevoLavado,
  type ValorOk,
} from "../lib/typesLavado"

const INPUT_SM =
  "w-16 px-2 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none"

interface Props {
  formacion: number
  registros: Lavado[]
  editor: boolean
  onCambio: (id: number, campos: Partial<CamposEditablesLavado>) => void
  onEliminar: (id: number) => void
  onAgregar: (campos: NuevoLavado) => void
}

interface Borrador {
  ingreso: string
  egreso: string
  pasadas: string
  ok: ValorOk
}

const VACIO_NUEVO = { ingreso: "", egreso: "" }

function fmtHM(hora: string | null): string {
  return hora ? hora.slice(0, 5) : ""
}

function fmtDMY(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const dd = String(d.getUTCDate()).padStart(2, "0")
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0")
  return `${dd}/${mm}/${d.getUTCFullYear()}`
}

function FilaCargado({ iso }: { iso: string | null }) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <CalendarDays className="w-4 h-4 text-slate-400" />
      <span className="text-xs text-slate-500">Cargado: {fmtDMY(iso) || "—"}</span>
    </div>
  )
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
          {editando ? (
            <input
              type="number"
              min={0}
              value={borrador.pasadas}
              onChange={(e) => setBorrador({ ...borrador, pasadas: e.target.value })}
              placeholder="Cantidad"
              className={INPUT_SM}
            />
          ) : (
            <span className="text-sm font-semibold text-orange-700">{l.pasadas ?? "—"}</span>
          )}
        </div>
        <span className="w-px bg-slate-200" />
        <div className="flex-1 flex items-center justify-between gap-2">
          <span className="text-xs text-slate-500 shrink-0">Lavado</span>
          {editando ? (
            <select
              value={borrador.ok}
              onChange={(e) => setBorrador({ ...borrador, ok: e.target.value as ValorOk })}
              className={INPUT_SM}
            >
              {OK_OPCIONES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            <span className={`text-sm font-semibold ${OK_VALOR_CLASS[okValor(l.ok)]}`}>{okLabel(l.ok)}</span>
          )}
        </div>
      </div>
    </div>
  )
}

export function LavadoCard({ formacion, registros, editor, onCambio, onEliminar, onAgregar }: Props) {
  const [abierto, setAbierto] = useState(false)
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [borrador, setBorrador] = useState<Borrador>({ ingreso: "", egreso: "", pasadas: "", ok: "sin" })
  const [agregando, setAgregando] = useState(false)
  const [nuevo, setNuevo] = useState(VACIO_NUEVO)
  const [aEliminar, setAEliminar] = useState<Lavado | null>(null)

  const ultimo = registros[0]

  const entrarEdicion = (l: Lavado) => {
    setBorrador({
      ingreso: l.ingreso ?? "",
      egreso: l.egreso ?? "",
      pasadas: l.pasadas?.toString() ?? "",
      ok: okValor(l.ok),
    })
    setEditandoId(l.id)
  }

  const guardar = (l: Lavado) => {
    onCambio(l.id, {
      ingreso: borrador.ingreso || null,
      egreso: borrador.egreso || null,
      pasadas: borrador.pasadas === "" ? null : Number(borrador.pasadas),
      ok: okABoolean(borrador.ok),
    })
    setEditandoId(null)
  }

  const guardarNuevo = () => {
    onAgregar({ formacion, ingreso: nuevo.ingreso || null, egreso: nuevo.egreso || null })
    setNuevo(VACIO_NUEVO)
    setAgregando(false)
  }

  return (
    <article
      className="bg-slate-100/90 rounded-xl shadow-sm border border-slate-200 overflow-hidden cursor-pointer select-none transition-shadow hover:shadow-md"
      onClick={() => {
        if (editandoId === null && !agregando) setAbierto((a) => !a)
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
          <FilaCargado iso={ultimo.created_at} />
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
                <FilaCargado iso={l.created_at} />

                {editor && !editando && (
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
        <div className="px-4 py-2.5 border-t border-slate-200">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setAgregando(true)
            }}
            className="inline-flex items-center gap-1.5 w-full justify-center px-3 py-2 rounded-lg bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition cursor-pointer"
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
                setNuevo(VACIO_NUEVO)
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
        mensaje={`Se va a eliminar el registro de lavado de la Formación N° ${formacion} cargado el ${
          fmtDMY(aEliminar?.created_at ?? null) || "—"
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