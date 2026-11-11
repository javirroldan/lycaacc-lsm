import { useMemo, useState } from "react"
import { LogOut, Plus, Search, X } from "lucide-react"
import { FachadaCard } from "./FachadaCard"
import { FachadaStats, type FachadaDetalleModo } from "./FachadaStats"
import { FachadaInfoModal } from "./FachadaInfoModal"
import { SyncBadge } from "./SyncBadge"
import { InformeButton } from "./InformeButton"
import { DateSelect } from "./DateSelect"
import type { useFachadaEntorno } from "../hooks/useFachadaEntorno"
import {
  EVAL_ITEMS,
  EVALUACION_OPCIONES,
  ITEMS_FACHADA,
  fachadaEntornoVacia,
  agruparPorEstacion,
  normalizarItems,
  type FachadaEntorno,
  type ItemFachadaKey,
  type NuevaFachadaEntorno,
} from "../lib/typesFachadaEntorno"
import { fechaHoy } from "../lib/dates"
import { insforgeConfigurado } from "../lib/insforge"

export type UseFachadaEntornoResult = ReturnType<typeof useFachadaEntorno>

interface Props {
  datos: UseFachadaEntornoResult
  esEditor: boolean
  esGerencia: boolean
  rol: "admin" | "editor" | "gerencia" | "editor_formaciones" | "editor_locomotoras" | null
  ahora: string
  onSalir: () => void
}

const inputCls = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400"
const selectCls = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400"

function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs text-slate-500">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} />
    </label>
  )
}

export function FachadaPage({ datos, esEditor, esGerencia, rol, ahora, onSalir }: Props) {
  const { registros, loading, error, online, pendientes, aplicarCambio, agregar, eliminar, syncPending } = datos
  const [detalle, setDetalle] = useState<FachadaDetalleModo | null>(null)
  const [form, setForm] = useState<NuevaFachadaEntorno | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const [busqueda, setBusqueda] = useState("")

  const grupos = useMemo(() => agruparPorEstacion(registros), [registros])
  const suspendidas = useMemo(() => registros.filter((r) => r.suspendida_mal_tiempo === true).length, [registros])
  const estacionesConDatos = useMemo(() => grupos.filter((g) => g.registros.length > 0).length, [grupos])
  const gruposFiltrados = useMemo(() => {
    const q = busqueda.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
    if (!q) return grupos
    return grupos.filter((g) => g.estacion.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(q))
  }, [grupos, busqueda])

  const abrirNuevo = (estacion: string) => {
    setEditId(null)
    setForm(fachadaEntornoVacia(fechaHoy(), estacion))
  }
  const abrirEditar = (r: FachadaEntorno) => {
    const { id: _id, created_at: _c, ...rest } = r
    setEditId(r.id)
    setForm({ ...rest, items: normalizarItems(r.items), estacion: r.estacion ?? "" } as NuevaFachadaEntorno)
  }
  const cerrarForm = () => { setForm(null); setEditId(null) }
  const guardar = async () => {
    if (!form) return
    const payload = { ...form, items: normalizarItems(form.items) }
    if (editId !== null) await aplicarCambio(editId, payload)
    else await agregar(payload)
    cerrarForm()
  }

  const set = <K extends keyof NuevaFachadaEntorno>(k: K, v: NuevaFachadaEntorno[K]) => setForm((f) => (f ? { ...f, [k]: v } : f))
  const setItem = (key: ItemFachadaKey, value: string) =>
    setForm((f) => {
      if (!f) return f
      const items = normalizarItems(f.items)
      items[key] = value === "sin" ? null : (value as "bueno" | "regular" | "malo")
      return { ...f, items }
    })

  return (
    <div className="max-w-4xl mx-auto px-3 py-4 pb-10">
      <header className="bg-black/25 backdrop-blur rounded-2xl p-4 mb-4 text-white">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-white/20 overflow-hidden">
              <img src="/icons/icon-192.png" alt="Fachada entorno" className="w-9 h-9 rounded-lg" />
            </span>
            <div>
              <h1 className="font-bold leading-tight text-[15px]">Planificación y control de servicios</h1>
              <p className="text-white/80 text-xs">Fachada entorno — carga de datos por estación</p>
            </div>
          </div>
          <button onClick={onSalir} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/20 hover:bg-white/30 transition text-sm font-semibold cursor-pointer">
            <LogOut className="w-4 h-4" /> Salir
          </button>
        </div>
        <div className="flex items-center gap-2 mt-3 flex-wrap min-h-[26px]"></div>
        <div className="mt-3 flex gap-2 flex-wrap items-center">
          {insforgeConfigurado && <SyncBadge online={online} pendientes={pendientes} onSync={() => void syncPending()} />}
        </div>
        <div className="mt-3 flex gap-2 flex-wrap items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {esEditor && <InformeButton tipo="fachada_entorno" datos={registros} tema="violeta" tituloModal="Informe de fachada entorno" />}
          </div>
          <div className="flex gap-2 flex-wrap">
            {esGerencia && <InformeButton tipo="fachada_entorno" datos={registros} tema="violeta" tituloModal="Informe de fachada entorno" etiqueta="GGO informe" />}
          </div>
        </div>
      </header>

      <main className="space-y-4">
        {!loading && (
          <FachadaStats registros={registros.length} estaciones={estacionesConDatos} suspendidas={suspendidas} onVer={setDetalle} />
        )}

        {!loading && (
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                inputMode="search"
                placeholder="Buscar estación… (ej: Retiro, Pilar)"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white/95 pl-9 pr-9 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 shadow-sm"
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={() => setBusqueda("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-slate-100 rounded-lg p-1 transition cursor-pointer text-slate-500"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {busqueda && (
              <p className="mt-1 px-1 text-xs text-white/70">
                {gruposFiltrados.length} de {grupos.length} estaciones
              </p>
            )}
          </div>
        )}

        {esEditor && form && (
          <div className="rounded-xl bg-slate-100/90 border border-slate-200 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-slate-700">{editId ? "Editar carga" : "Nueva carga"} — {form.estacion}</p>
              <button onClick={cerrarForm} className="hover:bg-slate-200 rounded-lg p-1.5 transition cursor-pointer text-slate-500"><X className="w-4 h-4" /></button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs text-slate-500">Fecha</span>
                <div className="mt-1"><DateSelect tema="violeta" value={form.fecha} onChange={(v) => set("fecha", v)} className="w-full" /></div>
              </label>
              <Input label="Proveedor" value={form.proveedor ?? ""} onChange={(v) => set("proveedor", v)} />
              <Input label="OC" value={form.oc ?? ""} onChange={(v) => set("oc", v)} />
              <Input label="Sector de intervenciones" value={form.sector_intervenciones ?? ""} onChange={(v) => set("sector_intervenciones", v)} />
            </div>

            <div className="border-t border-slate-200 pt-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Supervisor a cargo</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input label="Nombre y apellido" value={form.supervisor_nombre ?? ""} onChange={(v) => set("supervisor_nombre", v)} />
                <Input label="Teléfono" value={form.supervisor_telefono ?? ""} onChange={(v) => set("supervisor_telefono", v)} />
                <Input label="Legajo" value={form.supervisor_legajo ?? ""} onChange={(v) => set("supervisor_legajo", v)} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Horarios" value={form.horarios ?? ""} onChange={(v) => set("horarios", v)} />
              <label className="block">
                <span className="text-xs text-slate-500">Tarea suspendida por mal tiempo</span>
                <select
                  value={form.suspendida_mal_tiempo === null ? "sin" : form.suspendida_mal_tiempo ? "si" : "no"}
                  onChange={(e) => set("suspendida_mal_tiempo", e.target.value === "sin" ? null : e.target.value === "si")}
                  className={selectCls}
                >
                  <option value="sin">Sin dato</option>
                  <option value="si">Sí</option>
                  <option value="no">No</option>
                </select>
              </label>
            </div>

            <label className="block">
              <span className="text-xs text-slate-500">Insumos requeridos (tipo y cantidad)</span>
              <textarea value={form.insumos ?? ""} onChange={(e) => set("insumos", e.target.value)} rows={2} className={inputCls} />
            </label>

            <div className="border-t border-slate-200 pt-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Evaluación de fachada / entorno — {form.estacion}</p>
              <div className="space-y-2">
                {ITEMS_FACHADA.map((it) => {
                  const items = normalizarItems(form.items)
                  return (
                    <label key={it.key} className="flex items-center justify-between gap-3">
                      <span className="text-xs text-slate-600 flex-1">{it.label}</span>
                      <select
                        value={items[it.key] ?? "sin"}
                        onChange={(e) => setItem(it.key, e.target.value)}
                        className="w-40 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400"
                      >
                        <option value="sin">—</option>
                        {EVALUACION_OPCIONES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </label>
                  )
                })}
              </div>
            </div>

            <div className="border-t border-slate-200 pt-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Evaluación diaria de tareas</p>
              <div className="space-y-2">
                {EVAL_ITEMS.map((it) => (
                  <label key={it.key} className="flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-600 flex-1">{it.label}</span>
                    <select
                      value={form[it.key] ?? "sin"}
                      onChange={(e) => set(it.key, e.target.value === "sin" ? null : (e.target.value as any))}
                      className="w-40 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400"
                    >
                      <option value="sin">—</option>
                      {EVALUACION_OPCIONES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </label>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="text-xs text-slate-500">Observaciones o interrupción del servicio</span>
              <textarea value={form.observaciones ?? ""} onChange={(e) => set("observaciones", e.target.value)} rows={3} className={inputCls} />
            </label>

            <div className="flex gap-2">
              <button onClick={cerrarForm} className="inline-flex items-center gap-1.5 flex-1 justify-center px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition cursor-pointer">Cancelar</button>
              <button onClick={() => void guardar()} className="inline-flex items-center gap-1.5 flex-1 justify-center px-3 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition cursor-pointer"><Plus className="w-4 h-4" /> Guardar</button>
            </div>
          </div>
        )}

        {error && <div className="rounded-xl bg-red-100 text-red-700 px-4 py-3 text-sm font-medium">Error al cargar datos: {error}</div>}

        {loading ? (
          <div className="rounded-xl bg-white/10 text-white text-center py-12">Cargando fachada entorno…</div>
        ) : (
          <>
            <h2 className="text-white font-bold text-sm uppercase tracking-wide px-1">Estaciones <span className="opacity-80 font-medium normal-case">({gruposFiltrados.length} · {registros.length} cargas)</span></h2>
            <div className="grid grid-cols-1 gap-3">
              {gruposFiltrados.map((g) => (
                <FachadaCard key={g.estacion} estacion={g.estacion} registros={g.registros} editor={esEditor} onEditar={abrirEditar} onEliminar={(id) => void eliminar(id)} onAgregar={(est) => abrirNuevo(est)} />
              ))}
              {gruposFiltrados.length === 0 && (
                <div className="rounded-xl bg-white/10 text-white/80 text-center py-10 text-sm">
                  No se encontraron estaciones para “{busqueda}”.
                </div>
              )}
            </div>
          </>
        )}

        {!esEditor && (
          <div className="rounded-xl bg-amber-100 border border-amber-200 text-amber-800 px-4 py-3 text-sm">
            No tenés permisos de edición ({rol === null ? "rol sin asignar" : "solo lectura"}).
          </div>
        )}
      </main>

      <footer className="mt-6"><p className="text-center text-white/70 text-xs capitalize">Actualizado: {ahora}</p></footer>
      <FachadaInfoModal abierto={detalle !== null} modo={detalle ?? "registros"} registros={registros} onCerrar={() => setDetalle(null)} />
    </div>
  )
}
