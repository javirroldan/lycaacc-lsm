import { useMemo, useState } from "react"
import { LogOut, Plus, X } from "lucide-react"
import { ZonaCriticaCard } from "./ZonaCriticaCard"
import { ZonaCriticaStats, type ZonaCriticaDetalleModo } from "./ZonaCriticaStats"
import { ZonaCriticaInfoModal } from "./ZonaCriticaInfoModal"
import { SyncBadge } from "./SyncBadge"
import { InformeButton } from "./InformeButton"
import { DateSelect } from "./DateSelect"
import type { useZonaCritica } from "../hooks/useZonaCritica"
import { EVAL_ITEMS, EVALUACION_OPCIONES, SECTORES_DEFAULT, zonaCriticaVacia, type NuevaZonaCritica, type SectorZona, type ZonaCritica } from "../lib/typesZonaCritica"
import { fechaHoy } from "../lib/dates"
import { insforgeConfigurado } from "../lib/insforge"

export type UseZonaCriticaResult = ReturnType<typeof useZonaCritica>
interface Props { datos: UseZonaCriticaResult; esEditor: boolean; esGerencia: boolean; rol: "admin" | "editor" | "gerencia" | "editor_formaciones" | "editor_locomotoras" | null; ahora: string; onSalir: () => void }

const inputCls = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-400"
function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return <label className="block"><span className="text-xs text-slate-500">{label}</span><input value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} /></label>
}

export function ZonaCriticaPage({ datos, esEditor, esGerencia, rol, ahora, onSalir }: Props) {
  const { registros, loading, error, online, pendientes, aplicarCambio, agregar, eliminar, syncPending } = datos
  const [detalle, setDetalle] = useState<ZonaCriticaDetalleModo | null>(null)
  const [form, setForm] = useState<NuevaZonaCritica | null>(null)
  const [editId, setEditId] = useState<number | null>(null)
  const suspendidas = useMemo(() => registros.filter((r) => r.suspendida_mal_tiempo === true).length, [registros])

  const abrirNuevo = () => { setEditId(null); setForm(zonaCriticaVacia(fechaHoy())) }
  const abrirEditar = (r: ZonaCritica) => { const { id, created_at, ...rest } = r; setEditId(id); setForm({ ...rest, sectores: Array.isArray(r.sectores) && r.sectores.length ? r.sectores.map(s => ({...s})) : SECTORES_DEFAULT.map(s => ({...s})) } as NuevaZonaCritica) }
  const cerrarForm = () => { setForm(null); setEditId(null) }
  const guardar = async () => { if (!form) return; if (editId !== null) await aplicarCambio(editId, form); else await agregar(form); cerrarForm() }
  const set = <K extends keyof NuevaZonaCritica>(k: K, v: NuevaZonaCritica[K]) => setForm((f) => (f ? { ...f, [k]: v } : f))
  const setSector = (idx: number, key: keyof SectorZona, value: string) => setForm((f) => {
    if (!f) return f
    const sectores = (f.sectores ?? SECTORES_DEFAULT).map((s, i) => i === idx ? { ...s, [key]: value } : s)
    return { ...f, sectores }
  })

  return (
    <div className="max-w-4xl mx-auto px-3 py-4 pb-10">
      <header className="bg-black/25 backdrop-blur rounded-2xl p-4 mb-4 text-white">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-white/20 overflow-hidden"><img src="/icons/icon-192.png" alt="Zona crítica" className="w-9 h-9 rounded-lg" /></span>
            <div><h1 className="font-bold leading-tight text-[15px]">Planificación y control de servicios</h1><p className="text-white/80 text-xs">Zona crítica — carga de datos</p></div>
          </div>
          <button onClick={onSalir} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/20 hover:bg-white/30 transition text-sm font-semibold cursor-pointer"><LogOut className="w-4 h-4" /> Salir</button>
        </div>
        <div className="flex items-center gap-2 mt-3 flex-wrap min-h-[26px]"></div>
        <div className="mt-3 flex gap-2 flex-wrap items-center">{insforgeConfigurado && <SyncBadge online={online} pendientes={pendientes} onSync={() => void syncPending()} />}</div>
        <div className="mt-3 flex gap-2 flex-wrap items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {esEditor && <InformeButton tipo="zona_critica" datos={registros} tema="rose" tituloModal="Informe de zona crítica" />}
          </div>
          <div className="flex gap-2 flex-wrap">
            {esGerencia && <InformeButton tipo="zona_critica" datos={registros} tema="rose" tituloModal="Informe de zona crítica" etiqueta="GGO informe" />}
          </div>
        </div>
      </header>

      <main className="space-y-4">
        {!loading && <ZonaCriticaStats registros={registros.length} suspendidas={suspendidas} activas={registros.length - suspendidas} onVer={setDetalle} />}
        {esEditor && !form && <button onClick={abrirNuevo} className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition text-xs font-bold cursor-pointer"><Plus className="w-4 h-4" /> Nueva carga de zona crítica</button>}

        {esEditor && form && (
          <div className="rounded-xl bg-slate-100/90 border border-slate-200 p-3 space-y-3">
            <div className="flex items-center justify-between"><p className="text-sm font-bold text-slate-700">{editId ? "Editar registro" : "Nueva carga de zona crítica"}</p><button onClick={cerrarForm} className="hover:bg-slate-200 rounded-lg p-1.5 transition cursor-pointer text-slate-500"><X className="w-4 h-4" /></button></div>
            <Input label="Orden de servicio" value={form.orden_servicio ?? ""} onChange={(v) => set("orden_servicio", v)} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block"><span className="text-xs text-slate-500">Fecha</span><div className="mt-1"><DateSelect tema="rose" value={form.fecha} onChange={(v) => set("fecha", v)} className="w-full" /></div></label>
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
              <label className="block"><span className="text-xs text-slate-500">Tarea suspendida por mal tiempo</span>
                <select value={form.suspendida_mal_tiempo === null ? "sin" : form.suspendida_mal_tiempo ? "si" : "no"} onChange={(e) => set("suspendida_mal_tiempo", e.target.value === "sin" ? null : e.target.value === "si")} className={inputCls}>
                  <option value="sin">Sin dato</option><option value="si">Sí</option><option value="no">No</option>
                </select>
              </label>
            </div>
            <label className="block"><span className="text-xs text-slate-500">Insumos requeridos (tipo y cantidad)</span><textarea value={form.insumos ?? ""} onChange={(e) => set("insumos", e.target.value)} rows={2} className={inputCls} /></label>

            <div className="border-t border-slate-200 pt-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Datos de tareas por sector</p>
              <div className="space-y-2">
                {(form.sectores ?? SECTORES_DEFAULT).map((s, idx) => (
                  <div key={idx} className="rounded-lg border border-slate-200 bg-white p-2">
                    <p className="text-xs font-bold text-rose-700 mb-1">Sector {s.sector} <span className="font-normal text-slate-500">({s.tramo})</span></p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <label className="block"><span className="text-[11px] text-slate-500">RSU vías (bolsas)</span><input value={s.rsu_vias_bolsas} onChange={(e) => setSector(idx, "rsu_vias_bolsas", e.target.value)} className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1 text-sm" /></label>
                      <label className="block"><span className="text-[11px] text-slate-500">Escombro m³</span><input value={s.escombro_m3} onChange={(e) => setSector(idx, "escombro_m3", e.target.value)} className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1 text-sm" /></label>
                      <label className="block"><span className="text-[11px] text-slate-500">Pastizales m²</span><input value={s.pastizales_m2} onChange={(e) => setSector(idx, "pastizales_m2", e.target.value)} className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1 text-sm" /></label>
                      <label className="block"><span className="text-[11px] text-slate-500">Cuadro vías (RSU)</span><input value={s.cuadro_vias_rsu} onChange={(e) => setSector(idx, "cuadro_vias_rsu", e.target.value)} className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1 text-sm" /></label>
                      <label className="block"><span className="text-[11px] text-slate-500">Parrilla vías (RSU)</span><input value={s.parrilla_vias_rsu} onChange={(e) => setSector(idx, "parrilla_vias_rsu", e.target.value)} className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1 text-sm" /></label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-200 pt-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Evaluación diaria de tareas</p>
              <div className="space-y-2">
                {EVAL_ITEMS.map((it) => (
                  <label key={it.key} className="flex items-center justify-between gap-3"><span className="text-xs text-slate-600 flex-1">{it.label}</span>
                    <select value={form[it.key] ?? "sin"} onChange={(e) => set(it.key, e.target.value === "sin" ? null : (e.target.value as any))} className="w-40 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-400">
                      <option value="sin">—</option>{EVALUACION_OPCIONES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </label>
                ))}
              </div>
            </div>

            <label className="block"><span className="text-xs text-slate-500">Observaciones o interrupción del servicio</span><textarea value={form.observaciones ?? ""} onChange={(e) => set("observaciones", e.target.value)} rows={3} className={inputCls} /></label>
            <div className="flex gap-2">
              <button onClick={cerrarForm} className="inline-flex items-center gap-1.5 flex-1 justify-center px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition cursor-pointer">Cancelar</button>
              <button onClick={() => void guardar()} className="inline-flex items-center gap-1.5 flex-1 justify-center px-3 py-2 rounded-lg bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition cursor-pointer"><Plus className="w-4 h-4" /> Guardar</button>
            </div>
          </div>
        )}

        {error && <div className="rounded-xl bg-red-100 text-red-700 px-4 py-3 text-sm font-medium">Error al cargar datos: {error}</div>}
        {loading ? <div className="rounded-xl bg-white/10 text-white text-center py-12">Cargando zona crítica…</div> : (
          <>
            <h2 className="text-white font-bold text-sm uppercase tracking-wide px-1">Historial <span className="opacity-80 font-medium normal-case">({registros.length})</span></h2>
            <div className="grid grid-cols-1 gap-3">
              {registros.map((r) => <ZonaCriticaCard key={r.id} registro={r} editor={esEditor} onEditar={abrirEditar} onEliminar={(id) => void eliminar(id)} />)}
              {registros.length === 0 && <div className="rounded-xl bg-white/10 text-white/80 text-center py-10 text-sm">Todavía no hay registros cargados.</div>}
            </div>
          </>
        )}
        {!esEditor && <div className="rounded-xl bg-amber-100 border border-amber-200 text-amber-800 px-4 py-3 text-sm">No tenés permisos de edición ({rol === null ? "rol sin asignar" : "solo lectura"}).</div>}
      </main>

      <footer className="mt-6"><p className="text-center text-white/70 text-xs capitalize">Actualizado: {ahora}</p></footer>
      <ZonaCriticaInfoModal abierto={detalle !== null} modo={detalle ?? "registros"} registros={registros} onCerrar={() => setDetalle(null)} />
    </div>
  )
}
