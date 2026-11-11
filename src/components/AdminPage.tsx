import { useEffect, useMemo, useState } from "react"
import { Archive, ChevronDown, ChevronUp, LogOut, Pencil, Plus, RefreshCw, Save, Settings } from "lucide-react"
import { ConfirmModal } from "./ConfirmModal"
import { insforge } from "../lib/insforge"
import { guardarSemaforosConfig, type SemaforosConfig } from "../lib/semaforoConfig"
import type { Formacion } from "../lib/types"
import type { Locomotora } from "../lib/typesLocomotoras"
import type { Lavado } from "../lib/typesLavado"

interface Props {
  rol: "admin" | "editor" | "gerencia" | "editor_formaciones" | "editor_locomotoras" | null
  ahora: string
  onSalir: () => void
  semaforos: SemaforosConfig
  onSemaforosChange: (cfg: SemaforosConfig) => void
  formaciones: Formacion[]
  locomotoras: Locomotora[]
  lavados: Lavado[]
  onRefetch: () => void
}

function CampoUmbral({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Number.parseInt(e.target.value || "0", 10))}
        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
      />
    </label>
  )
}

function RangoPreview({ verde, amarillo }: { verde: number; amarillo: number }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 text-green-700 px-2.5 py-1">
        <span className="w-2 h-2 rounded-full bg-green-500" /> Verde: 0–{verde}
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-700 px-2.5 py-1">
        <span className="w-2 h-2 rounded-full bg-amber-400" /> Amarillo: {verde + 1}–{amarillo}
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 text-red-700 px-2.5 py-1">
        <span className="w-2 h-2 rounded-full bg-red-500" /> Rojo: {amarillo + 1}+
      </span>
    </div>
  )
}

type Mensaje = { tipo: "ok" | "error"; texto: string } | null

export function AdminPage({ rol, ahora, onSalir, semaforos, onSemaforosChange, formaciones, locomotoras, lavados, onRefetch }: Props) {
  const esAdmin = rol === "admin"
  const [draft, setDraft] = useState<SemaforosConfig>(semaforos)
  const [guardandoSem, setGuardandoSem] = useState(false)
  const [msgSem, setMsgSem] = useState<Mensaje>(null)

  // Formaciones
  const [nuevaFormacion, setNuevaFormacion] = useState("")
  const [editFormId, setEditFormId] = useState<number | null>(null)
  const [nuevoNumero, setNuevoNumero] = useState("")
  const [msgForm, setMsgForm] = useState<Mensaje>(null)
  const [busyForm, setBusyForm] = useState(false)
  const [confirmArchivarForm, setConfirmArchivarForm] = useState<Formacion | null>(null)
  const [confirmArchivarForm2, setConfirmArchivarForm2] = useState(false)

  // Locomotoras
  const [nuevaLoco, setNuevaLoco] = useState("")
  const [nuevoServicioLoco, setNuevoServicioLoco] = useState<"local" | "ld">("local")
  const [editLocoId, setEditLocoId] = useState<number | null>(null)
  const [nuevoNombreLoco, setNuevoNombreLoco] = useState("")
  const [msgLoco, setMsgLoco] = useState<Mensaje>(null)
  const [busyLoco, setBusyLoco] = useState(false)
  const [confirmArchivarLoco, setConfirmArchivarLoco] = useState<Locomotora | null>(null)
  const [confirmArchivarLoco2, setConfirmArchivarLoco2] = useState(false)

  const [mostrarFormaciones, setMostrarFormaciones] = useState(false)
  const [mostrarLocomotoras, setMostrarLocomotoras] = useState(false)

  useEffect(() => { setDraft(semaforos) }, [semaforos])

  const lavadosPorFormacion = useMemo(() => {
    const m = new Map<number, number>()
    for (const l of lavados) m.set(l.formacion, (m.get(l.formacion) ?? 0) + 1)
    return m
  }, [lavados])

  const tieneHistorialFormacion = (f: Formacion) => (f.historial?.length ?? 0) > 0 || (lavadosPorFormacion.get(f.formacion) ?? 0) > 0
  const tieneHistorialLocomotora = (l: Locomotora) => (l.historial?.length ?? 0) > 0

  const guardarSemaforos = async () => {
    setMsgSem(null)
    const f = draft.formaciones
    const l = draft.locomotoras
    if (f.verde < 0 || l.verde < 0 || f.amarillo <= f.verde || l.amarillo <= l.verde) {
      setMsgSem({ tipo: "error", texto: "Revisá los rangos: verde ≥ 0 y amarillo mayor que verde en cada sección." })
      return
    }
    setGuardandoSem(true)
    const res = await guardarSemaforosConfig(draft)
    setGuardandoSem(false)
    if (!res.ok) { setMsgSem({ tipo: "error", texto: res.error ?? "No se pudieron guardar los cambios." }); return }
    onSemaforosChange(res.config ?? draft)
    setMsgSem({ tipo: "ok", texto: "Semáforos actualizados." })
  }

  const crearFormacion = async () => {
    const n = Number.parseInt(nuevaFormacion, 10)
    if (!Number.isFinite(n) || n < 1) { setMsgForm({ tipo: "error", texto: "Ingresá un número de formación válido (>= 1)." }); return }
    setBusyForm(true); setMsgForm(null)
    const { error } = await insforge.database.rpc("admin_crear_formacion", { p_formacion: n, p_estado: "fuera-servicio", p_descripcion: null })
    setBusyForm(false)
    if (error) { setMsgForm({ tipo: "error", texto: error.message }); return }
    setNuevaFormacion("")
    setMsgForm({ tipo: "ok", texto: `Formación N° ${n} creada.` })
    onRefetch()
  }

  const guardarRenumerarFormacion = async (f: Formacion) => {
    const n = Number.parseInt(nuevoNumero, 10)
    if (!Number.isFinite(n) || n < 1) { setMsgForm({ tipo: "error", texto: "Ingresá un número válido (>= 1)." }); return }
    setBusyForm(true); setMsgForm(null)
    const { error } = await insforge.database.rpc("admin_renumerar_formacion", { p_id: f.id, p_nuevo_numero: n })
    setBusyForm(false)
    if (error) { setMsgForm({ tipo: "error", texto: error.message }); return }
    setEditFormId(null); setNuevoNumero("")
    setMsgForm({ tipo: "ok", texto: `Formación renumerada a N° ${n}. Se actualizaron sus lavados para conservar el historial.` })
    onRefetch()
  }

  const pedirArchivarFormacion = (f: Formacion) => {
    setConfirmArchivarForm(f)
    setConfirmArchivarForm2(false)
  }

  const archivarFormacion = async () => {
    if (!confirmArchivarForm) return
    const f = confirmArchivarForm
    setBusyForm(true); setMsgForm(null)
    const { error } = await insforge.database.rpc("admin_archivar_formacion", { p_id: f.id, p_archivar: true })
    setBusyForm(false)
    if (error) { setMsgForm({ tipo: "error", texto: error.message }); return }
    setConfirmArchivarForm(null); setConfirmArchivarForm2(false)
    setMsgForm({ tipo: "ok", texto: `Formación N° ${f.formacion} archivada. Su información e historial se conservaron.` })
    onRefetch()
  }

  const crearLocomotora = async () => {
    const nombre = nuevaLoco.trim()
    if (!nombre) { setMsgLoco({ tipo: "error", texto: "Ingresá un identificador para la locomotora." }); return }
    setBusyLoco(true); setMsgLoco(null)
    const { error } = await insforge.database.rpc("admin_crear_locomotora", { p_locomotora: nombre, p_servicio: nuevoServicioLoco, p_estado: "en-servicio", p_descripcion: null })
    setBusyLoco(false)
    if (error) { setMsgLoco({ tipo: "error", texto: error.message }); return }
    setNuevaLoco("")
    setMsgLoco({ tipo: "ok", texto: `Locomotora ${nombre} creada.` })
    onRefetch()
  }

  const guardarRenombrarLoco = async (l: Locomotora) => {
    const nombre = nuevoNombreLoco.trim()
    if (!nombre) { setMsgLoco({ tipo: "error", texto: "Ingresá un identificador válido." }); return }
    setBusyLoco(true); setMsgLoco(null)
    const { error } = await insforge.database.rpc("admin_renombrar_locomotora", { p_id: l.id, p_nuevo_nombre: nombre })
    setBusyLoco(false)
    if (error) { setMsgLoco({ tipo: "error", texto: error.message }); return }
    setEditLocoId(null); setNuevoNombreLoco("")
    setMsgLoco({ tipo: "ok", texto: `Locomotora renombrada a ${nombre}.` })
    onRefetch()
  }

  const pedirArchivarLoco = (l: Locomotora) => {
    setConfirmArchivarLoco(l)
    setConfirmArchivarLoco2(false)
  }

  const archivarLoco = async () => {
    if (!confirmArchivarLoco) return
    const l = confirmArchivarLoco
    setBusyLoco(true); setMsgLoco(null)
    const { error } = await insforge.database.rpc("admin_archivar_locomotora", { p_id: l.id, p_archivar: true })
    setBusyLoco(false)
    if (error) { setMsgLoco({ tipo: "error", texto: error.message }); return }
    setConfirmArchivarLoco(null); setConfirmArchivarLoco2(false)
    setMsgLoco({ tipo: "ok", texto: `Locomotora ${l.locomotora} archivada. Su información e historial se conservaron.` })
    onRefetch()
  }

  const formOrdenadas = [...formaciones].sort((a, b) => a.formacion - b.formacion)
  const locoOrdenadas = [...locomotoras].sort((a, b) => a.locomotora.localeCompare(b.locomotora, "es", { numeric: true }))

  return (
    <div className="max-w-4xl mx-auto px-3 py-4 pb-10">
      <header className="bg-black/25 backdrop-blur rounded-2xl p-4 mb-4 text-white">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-white/20 overflow-hidden"><Settings className="w-6 h-6" /></span>
            <div>
              <h1 className="font-bold leading-tight text-[15px]">Administración</h1>
              <p className="text-white/80 text-xs">Configuración y gestión (solo admin)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onRefetch} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/20 hover:bg-white/30 transition text-sm font-semibold cursor-pointer" title="Actualizar">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={onSalir} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/20 hover:bg-white/30 transition text-sm font-semibold cursor-pointer">
              <LogOut className="w-4 h-4" /> Salir
            </button>
          </div>
        </div>
      </header>

      <main className="space-y-4">
        {/* Semáforos */}
        <section className="bg-slate-100/90 rounded-xl shadow-sm border border-slate-200 p-4">
          <h2 className="text-slate-800 font-bold text-base">Rangos de semáforo</h2>
          <p className="text-slate-500 text-sm mt-1">Umbrales independientes para Formaciones y Locomotoras. Verde hasta X días, amarillo hasta Y días, rojo a partir de Y+1.</p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="font-bold text-slate-700">Formaciones</h3>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <CampoUmbral label="Verde hasta (días)" value={draft.formaciones.verde} onChange={(v) => setDraft((d) => ({ ...d, formaciones: { ...d.formaciones, verde: v } }))} />
                <CampoUmbral label="Amarillo hasta (días)" value={draft.formaciones.amarillo} onChange={(v) => setDraft((d) => ({ ...d, formaciones: { ...d.formaciones, amarillo: v } }))} />
              </div>
              <RangoPreview verde={draft.formaciones.verde} amarillo={draft.formaciones.amarillo} />
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="font-bold text-slate-700">Locomotoras</h3>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <CampoUmbral label="Verde hasta (días)" value={draft.locomotoras.verde} onChange={(v) => setDraft((d) => ({ ...d, locomotoras: { ...d.locomotoras, verde: v } }))} />
                <CampoUmbral label="Amarillo hasta (días)" value={draft.locomotoras.amarillo} onChange={(v) => setDraft((d) => ({ ...d, locomotoras: { ...d.locomotoras, amarillo: v } }))} />
              </div>
              <RangoPreview verde={draft.locomotoras.verde} amarillo={draft.locomotoras.amarillo} />
            </div>
          </div>
          {msgSem && <div className={`mt-4 rounded-lg px-3 py-2 text-sm font-medium ${msgSem.tipo === "ok" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{msgSem.texto}</div>}
          <div className="mt-4 flex justify-end">
            <button onClick={() => void guardarSemaforos()} disabled={guardandoSem || !esAdmin} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-white font-semibold hover:bg-slate-900 disabled:opacity-50 cursor-pointer transition">
              <Save className="w-4 h-4" />{guardandoSem ? "Guardando…" : "Guardar semáforos"}
            </button>
          </div>
        </section>

        {/* Formaciones */}
        <section className="bg-slate-100/90 rounded-xl shadow-sm border border-slate-200 p-4">
          <button
            type="button"
            onClick={() => setMostrarFormaciones((v) => !v)}
            className="w-full flex items-center justify-between gap-2 text-left cursor-pointer"
          >
            <div>
              <h2 className="text-slate-800 font-bold text-base">Formaciones activas <span className="text-slate-500 font-semibold">({formOrdenadas.length})</span></h2>
              <p className="text-slate-500 text-sm mt-1">Agregar, renumerar o archivar formaciones. Al renumerar se actualizan sus lavados. Al archivar se conserva el historial.</p>
            </div>
            {mostrarFormaciones ? <ChevronUp className="w-5 h-5 text-slate-500 shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-500 shrink-0" />}
          </button>

          <div className="mt-3 flex flex-wrap gap-2 items-end">
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Nueva formación (número)</span>
              <input type="number" min={1} value={nuevaFormacion} onChange={(e) => setNuevaFormacion(e.target.value)} className="mt-1 w-40 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" placeholder="Ej: 24" />
            </label>
            <button onClick={() => void crearFormacion()} disabled={busyForm || !esAdmin} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
              <Plus className="w-4 h-4" /> Agregar
            </button>
          </div>
          {msgForm && <div className={`mt-3 rounded-lg px-3 py-2 text-sm font-medium ${msgForm.tipo === "ok" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{msgForm.texto}</div>}

          {mostrarFormaciones && (
            <div className="mt-4 space-y-2">
              {formOrdenadas.map((f) => {
                const hist = tieneHistorialFormacion(f)
                const cantLav = lavadosPorFormacion.get(f.formacion) ?? 0
                return (
                  <div key={f.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                    <div>
                      <p className="font-semibold text-slate-800">Formación N° {f.formacion}</p>
                      <p className="text-xs text-slate-500">{(f.historial?.length ?? 0)} servicio(s) · {cantLav} lavado(s){hist ? " · tiene historial" : ""}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                      {editFormId === f.id ? (
                        <>
                          <input type="number" min={1} value={nuevoNumero} onChange={(e) => setNuevoNumero(e.target.value)} className="w-28 rounded-lg border border-slate-300 px-2 py-1.5 text-sm" placeholder="Nuevo N°" />
                          <button onClick={() => void guardarRenumerarFormacion(f)} disabled={busyForm} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-semibold cursor-pointer">Guardar</button>
                          <button onClick={() => { setEditFormId(null); setNuevoNumero("") }} className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 text-sm font-semibold cursor-pointer">Cancelar</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditFormId(f.id); setNuevoNumero(String(f.formacion)) }} disabled={busyForm} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold cursor-pointer">
                            <Pencil className="w-4 h-4" /> Renumerar
                          </button>
                          <button onClick={() => pedirArchivarFormacion(f)} disabled={busyForm} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 text-sm font-semibold cursor-pointer">
                            <Archive className="w-4 h-4" /> Archivar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
              {formOrdenadas.length === 0 && <p className="text-sm text-slate-500">No hay formaciones activas.</p>}
            </div>
          )}

          <button
            type="button"
            onClick={() => setMostrarFormaciones((v) => !v)}
            className="mt-3 w-full flex justify-center py-1 cursor-pointer"
            aria-label={mostrarFormaciones ? "Contraer lista de formaciones" : "Desplegar lista de formaciones"}
            title={mostrarFormaciones ? "Contraer" : "Desplegar"}
          >
            <span className="h-1.5 w-12 rounded-full bg-slate-300" />
          </button>
        </section>

        {/* Locomotoras */}
        <section className="bg-slate-100/90 rounded-xl shadow-sm border border-slate-200 p-4">
          <button
            type="button"
            onClick={() => setMostrarLocomotoras((v) => !v)}
            className="w-full flex items-center justify-between gap-2 text-left cursor-pointer"
          >
            <div>
              <h2 className="text-slate-800 font-bold text-base">Locomotoras activas <span className="text-slate-500 font-semibold">({locoOrdenadas.length})</span></h2>
              <p className="text-slate-500 text-sm mt-1">Agregar, renombrar o archivar locomotoras. Al archivar se conserva el historial.</p>
            </div>
            {mostrarLocomotoras ? <ChevronUp className="w-5 h-5 text-slate-500 shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-500 shrink-0" />}
          </button>

          <div className="mt-3 flex flex-wrap gap-2 items-end">
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Nueva locomotora</span>
              <input value={nuevaLoco} onChange={(e) => setNuevaLoco(e.target.value)} className="mt-1 w-40 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" placeholder="Ej: 123" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Servicio</span>
              <select value={nuevoServicioLoco} onChange={(e) => setNuevoServicioLoco(e.target.value as "local" | "ld")} className="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
                <option value="local">Local</option>
                <option value="ld">LD</option>
              </select>
            </label>
            <button onClick={() => void crearLocomotora()} disabled={busyLoco || !esAdmin} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 cursor-pointer">
              <Plus className="w-4 h-4" /> Agregar
            </button>
          </div>
          {msgLoco && <div className={`mt-3 rounded-lg px-3 py-2 text-sm font-medium ${msgLoco.tipo === "ok" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{msgLoco.texto}</div>}

          {mostrarLocomotoras && (
            <div className="mt-4 space-y-2">
              {locoOrdenadas.map((l) => {
                const hist = tieneHistorialLocomotora(l)
                return (
                  <div key={l.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                    <div>
                      <p className="font-semibold text-slate-800">Locomotora {l.locomotora}</p>
                      <p className="text-xs text-slate-500">{(l.historial?.length ?? 0)} servicio(s){hist ? " · tiene historial" : ""}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                      {editLocoId === l.id ? (
                        <>
                          <input value={nuevoNombreLoco} onChange={(e) => setNuevoNombreLoco(e.target.value)} className="w-32 rounded-lg border border-slate-300 px-2 py-1.5 text-sm" placeholder="Nuevo nombre" />
                          <button onClick={() => void guardarRenombrarLoco(l)} disabled={busyLoco} className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm font-semibold cursor-pointer">Guardar</button>
                          <button onClick={() => { setEditLocoId(null); setNuevoNombreLoco("") }} className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 text-sm font-semibold cursor-pointer">Cancelar</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditLocoId(l.id); setNuevoNombreLoco(l.locomotora) }} disabled={busyLoco} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold cursor-pointer">
                            <Pencil className="w-4 h-4" /> Renombrar
                          </button>
                          <button onClick={() => pedirArchivarLoco(l)} disabled={busyLoco} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 text-sm font-semibold cursor-pointer">
                            <Archive className="w-4 h-4" /> Archivar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
              {locoOrdenadas.length === 0 && <p className="text-sm text-slate-500">No hay locomotoras activas.</p>}
            </div>
          )}

          <button
            type="button"
            onClick={() => setMostrarLocomotoras((v) => !v)}
            className="mt-3 w-full flex justify-center py-1 cursor-pointer"
            aria-label={mostrarLocomotoras ? "Contraer lista de locomotoras" : "Desplegar lista de locomotoras"}
            title={mostrarLocomotoras ? "Contraer" : "Desplegar"}
          >
            <span className="h-1.5 w-12 rounded-full bg-slate-300" />
          </button>
        </section>
      </main>

      <footer className="mt-6">
        <p className="text-center text-white/70 text-xs capitalize">Actualizado: {ahora}</p>
      </footer>

      <ConfirmModal
        abierto={!!confirmArchivarForm && !confirmArchivarForm2}
        titulo="Archivar formación"
        mensaje={confirmArchivarForm ? (
          tieneHistorialFormacion(confirmArchivarForm)
            ? `La formación N° ${confirmArchivarForm.formacion} tiene historial de servicios/lavados. Si continuás, se va a archivar: dejará de verse en Formaciones y Lavado, pero se conservará toda su información e historial.`
            : `Vas a archivar la formación N° ${confirmArchivarForm.formacion}. Dejará de verse en Formaciones y Lavado y su información se conservará.`
        ) : ""}
        etiquetaConfirmar="Continuar"
        tema="azul"
        onConfirmar={() => setConfirmArchivarForm2(true)}
        onCancelar={() => setConfirmArchivarForm(null)}
      />
      <ConfirmModal
        abierto={!!confirmArchivarForm && confirmArchivarForm2}
        titulo="Confirmar archivado"
        mensaje={confirmArchivarForm ? `Confirmá el archivado definitivo de la formación N° ${confirmArchivarForm.formacion}. Esta acción la oculta de las secciones operativas conservando sus datos.` : ""}
        etiquetaConfirmar="Archivar"
        tema="azul"
        onConfirmar={() => void archivarFormacion()}
        onCancelar={() => { setConfirmArchivarForm(null); setConfirmArchivarForm2(false) }}
      />

      <ConfirmModal
        abierto={!!confirmArchivarLoco && !confirmArchivarLoco2}
        titulo="Archivar locomotora"
        mensaje={confirmArchivarLoco ? (
          tieneHistorialLocomotora(confirmArchivarLoco)
            ? `La locomotora ${confirmArchivarLoco.locomotora} tiene historial de servicios/lavados. Si continuás, se va a archivar: dejará de verse en Locomotoras, pero se conservará toda su información e historial.`
            : `Vas a archivar la locomotora ${confirmArchivarLoco.locomotora}. Dejará de verse en Locomotoras y su información se conservará.`
        ) : ""}
        etiquetaConfirmar="Continuar"
        tema="verde"
        onConfirmar={() => setConfirmArchivarLoco2(true)}
        onCancelar={() => setConfirmArchivarLoco(null)}
      />
      <ConfirmModal
        abierto={!!confirmArchivarLoco && confirmArchivarLoco2}
        titulo="Confirmar archivado"
        mensaje={confirmArchivarLoco ? `Confirmá el archivado definitivo de la locomotora ${confirmArchivarLoco.locomotora}. Esta acción la oculta de la sección operativa conservando sus datos.` : ""}
        etiquetaConfirmar="Archivar"
        tema="verde"
        onConfirmar={() => void archivarLoco()}
        onCancelar={() => { setConfirmArchivarLoco(null); setConfirmArchivarLoco2(false) }}
      />
    </div>
  )
}
