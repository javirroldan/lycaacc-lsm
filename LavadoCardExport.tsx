/**
 * LavadoCardExport.tsx
 *
 * Exporta el diseño de la tarjeta de lavado (sección Lavado) de "trenes-app"
 * como archivo standalone, para replicarlo tal cual en otro proyecto.
 *
 * Stack requerido:
 *   - React 18+
 *   - Tailwind CSS v4 (clases @tailwind base, incluida la configuración default)
 *   - lucide-react (iconos)
 *   - react-dom (createPortal para el modal de confirmación)
 *
 * Los datos se reciben por props; no hay backend acoplado.
 */

import { useState } from "react"
import { CalendarDays, ChevronDown, ChevronUp, History, Pencil, Plus, Save, Trash2, X, AlertTriangle } from "lucide-react"
import { createPortal } from "react-dom"

/* ============================================================
 * Tipos
 * ============================================================ */

export interface Lavado {
  id: number
  formacion: number
  ingreso: string | null
  egreso: string | null
  pasadas: number | null
  ok: boolean | null
  created_at: string
}

export type CamposEditablesLavado = Pick<Lavado, "formacion" | "ingreso" | "egreso" | "pasadas" | "ok">

interface Borrador {
  ingreso: string
  egreso: string
  pasadas: string
  ok: string
}

interface RegistroProps {
  l: Lavado
  editando: boolean
  borrador: Borrador
  setBorrador: (b: Borrador) => void
}

export interface LavadoCardProps {
  formacion: number
  registros: Lavado[]
  editor: boolean
  onCambio: (id: number, campos: Partial<CamposEditablesLavado>) => void
  onEliminar?: (id: number) => void
  onAgregar?: (formacion: number, datos: { ingreso: string | null; egreso: string | null }) => void
}

/* ============================================================
 * Constantes de estilos (copiadas del proyecto original)
 * ============================================================ */

const INPUT_CLASS =
  "flex-1 px-2 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none"

const INPUT_SM =
  "w-16 px-2 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none"

/* ============================================================
 * Helpers (inline; desacoplados de typesLavado.ts y dates.ts)
 * ============================================================ */

const OK_OPCIONES: { value: string; label: string }[] = [
  { value: "si", label: "Sí" },
  { value: "no", label: "No" },
  { value: "sin", label: "Sin datos" },
]

const OK_LABEL: Record<string, string> = {
  si: "OK",
  no: "Pendiente",
  sin: "Sin datos",
}

function okValor(ok: boolean | null): string {
  if (ok === true) return "si"
  if (ok === false) return "no"
  return "sin"
}

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

const VACIO_NUEVO = { ingreso: "", egreso: "" }

/* ============================================================
 * ConfirmModal (tema naranja) — versión inline del proyecto
 * ============================================================ */

interface ConfirmModalProps {
  abierto: boolean
  titulo: string
  mensaje: React.ReactNode
  etiquetaConfirmar?: string
  etiquetaCancelar?: string
  onConfirmar: () => void
  onCancelar: () => void
}

function ConfirmModal({
  abierto,
  titulo,
  mensaje,
  etiquetaConfirmar = "Sí, eliminar",
  etiquetaCancelar = "Cancelar",
  onConfirmar,
  onCancelar,
}: ConfirmModalProps) {
  if (!abierto) return null

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onCancelar}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 bg-orange-600 text-white">
          <h3 className="flex items-center gap-2 font-bold text-sm">
            <AlertTriangle className="w-5 h-5" />
            {titulo}
          </h3>
          <button
            onClick={onCancelar}
            className="hover:bg-white/20 rounded-lg p-1.5 transition cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 text-sm text-slate-600">{mensaje}</div>

        <div className="px-5 pb-5 grid grid-cols-2 gap-2">
          <button
            onClick={onCancelar}
            className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition cursor-pointer"
          >
            {etiquetaCancelar}
          </button>
          <button
            onClick={onConfirmar}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition cursor-pointer"
          >
            {etiquetaConfirmar}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

/* ============================================================
 * RegistroCuerpo — cuerpo de cada registro de lavado
 * ============================================================ */

function RegistroCuerpo({ l, editando, borrador, setBorrador }: RegistroProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-slate-500 w-28 shrink-0">Hora ingreso</span>
        {editando ? (
          <input
            type="time"
            value={borrador.ingreso}
            onChange={(e) => setBorrador({ ...borrador, ingreso: e.target.value })}
            className={INPUT_CLASS}
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
          <input
            type="time"
            value={borrador.egreso}
            onChange={(e) => setBorrador({ ...borrador, egreso: e.target.value })}
            className={INPUT_CLASS}
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
              onChange={(e) => setBorrador({ ...borrador, ok: e.target.value })}
              className={INPUT_SM}
            >
              {OK_OPCIONES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            <span
              className={`text-sm font-semibold ${
                okValor(l.ok) === "si"
                  ? "text-green-600"
                  : okValor(l.ok) === "no"
                    ? "text-amber-600"
                    : "text-slate-400"
              }`}
            >{OK_LABEL[okValor(l.ok)]}</span>
          )}
        </div>
      </div>
    </div>
  )
}

/* ============================================================
 * LavadoCard — tarjeta de lavado (acumula registros por formación)
 * ============================================================ */

export function LavadoCard({ formacion, registros, editor, onCambio, onEliminar, onAgregar }: LavadoCardProps) {
  const [expandido, setExpandido] = useState(false)
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
      ok: borrador.ok === "si" ? true : borrador.ok === "no" ? false : null,
    })
    setEditandoId(null)
  }

  const guardarNuevo = () => {
    if (!onAgregar) return
    onAgregar(formacion, { ingreso: nuevo.ingreso || null, egreso: nuevo.egreso || null })
    setNuevo(VACIO_NUEVO)
    setAgregando(false)
  }

  return (
    <article
      className="bg-slate-100/90 rounded-xl shadow-sm border border-slate-200 overflow-hidden cursor-pointer select-none transition-shadow hover:shadow-md"
      onClick={() => setExpandido((e) => !e)}
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
          {expandido ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
        </div>
      </div>

      {!expandido && ultimo && (
        <div className="p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold mb-2">Último lavado</p>
          <RegistroCuerpo l={ultimo} editando={false} borrador={borrador} setBorrador={setBorrador} />
          <div className="flex items-center gap-2 pt-2">
            <CalendarDays className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-500">Cargado: {fmtDMY(ultimo.created_at) || "—"}</span>
          </div>
        </div>
      )}

      {expandido && (
        <div className="max-h-[320px] overflow-y-auto">
          <p className="px-4 pt-3 text-[11px] uppercase tracking-wide text-slate-400 font-semibold">
            Historial de lavados
          </p>
          {registros.map((l, i) => {
            const editando = editandoId === l.id
            return (
              <div key={l.id} className={`p-4 ${i > 0 ? "border-t border-slate-200" : ""}`}>
                <RegistroCuerpo l={l} editando={editando} borrador={borrador} setBorrador={setBorrador} />

                <div className="flex items-center gap-2 pt-2">
                  <CalendarDays className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-500">Cargado: {fmtDMY(l.created_at) || "—"}</span>
                </div>

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
                    {onEliminar && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setAEliminar(l)
                        }}
                        className="inline-flex items-center gap-1.5 flex-1 justify-center px-3 py-1.5 rounded-lg bg-white border border-red-300 text-red-600 text-xs font-semibold hover:bg-red-50 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Eliminar
                      </button>
                    )}
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

      {editor && !agregando && (
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

      {editor && agregando && (
        <div className="px-4 py-2.5 border-t border-slate-200 space-y-3">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">
            Nuevo lavado · Formación N° {formacion}
          </p>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-slate-500 w-28 shrink-0">Hora ingreso</span>
            <input
              type="time"
              value={nuevo.ingreso}
              onChange={(e) => setNuevo((n) => ({ ...n, ingreso: e.target.value }))}
              className={INPUT_CLASS}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-slate-500 w-28 shrink-0">Hora egreso</span>
            <input
              type="time"
              value={nuevo.egreso}
              onChange={(e) => setNuevo((n) => ({ ...n, egreso: e.target.value }))}
              className={INPUT_CLASS}
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
        titulo="Eliminar lavado"
        mensaje={
          <>
            Se va a eliminar el registro de lavado de la <strong>Formación N° {formacion}</strong> cargado el{" "}
            <strong>{fmtDMY(aEliminar?.created_at ?? null) || "—"}</strong> (ingreso {fmtHM(aEliminar?.ingreso ?? null) || "—"}{" "}
            · egreso {fmtHM(aEliminar?.egreso ?? null) || "—"}). Esta acción no se puede deshacer.
          </>
        }
        onConfirmar={() => {
          if (aEliminar) onEliminar?.(aEliminar.id)
          setAEliminar(null)
        }}
        onCancelar={() => setAEliminar(null)}
      />
    </article>
  )
}

/* ============================================================
 * Ejemplo de uso (descomentá y adaptá a tu proyecto)
 * ============================================================ */
//
// <LavadoCard
//   formacion={5}
//   registros={[
//     {
//       id: 1,
//       formacion: 5,
//       ingreso: "08:00",
//       egreso: "08:30",
//       pasadas: 2,
//       ok: true,
//       created_at: "2026-09-17T14:00:00Z",
//     },
//     {
//       id: 2,
//       formacion: 5,
//       ingreso: "16:10",
//       egreso: "16:45",
//       pasadas: 2,
//       ok: true,
//       created_at: "2026-09-18T10:00:00Z",
//     },
//   ]}
//   editor
//   onCambio={(id, campos) => console.log("editar", id, campos)}
//   onEliminar={(id) => console.log("eliminar", id)}
//   onAgregar={(formacion, datos) => console.log("agregar", formacion, datos)}
// />
//
// Grid de la página (tal cual LavadoPage.tsx):
// <div className="grid grid-cols-1 gap-3">...</div>