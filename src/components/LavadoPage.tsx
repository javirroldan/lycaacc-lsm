import { useMemo, useState } from "react"
import { LogOut, Plus, X } from "lucide-react"
import { LavadoCard } from "./LavadoCard"
import { SyncBadge } from "./SyncBadge"
import { InformeButton } from "./InformeButton"
import { DropdownSelect } from "./DropdownSelect"
import type { useLavados } from "../hooks/useLavados"
import type { Lavado } from "../lib/typesLavado"
import { FORMACIONES_LAVADO } from "../lib/typesLavado"
import { insforgeConfigurado } from "../lib/insforge"

export type UseLavadosResult = ReturnType<typeof useLavados>

interface Props {
  datos: UseLavadosResult
  esEditor: boolean
  rol: "admin" | "editor" | null
  ahora: string
  onSalir: () => void
}

function ordenarReciente(lista: Lavado[]): Lavado[] {
  return [...lista].sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0))
}

export function LavadoPage({ datos, esEditor, rol, ahora, onSalir }: Props) {
  const { lavados, loading, error, online, pendientes, aplicarCambio, agregarLavado, eliminarLavado, syncPending } = datos
  const [agregando, setAgregando] = useState(false)
  const [form, setForm] = useState<{ formacion: number; ingreso: string; egreso: string }>({
    formacion: FORMACIONES_LAVADO[0],
    ingreso: "",
    egreso: "",
  })

  const porFormacion = useMemo(() => {
    const mapa = new Map<number, Lavado[]>()
    for (const l of lavados) {
      const arr = mapa.get(l.formacion)
      if (arr) arr.push(l)
      else mapa.set(l.formacion, [l])
    }
    return [...mapa.keys()]
      .sort((a, b) => a - b)
      .map((k) => ({ formacion: k, registros: ordenarReciente(mapa.get(k) as Lavado[]) }))
  }, [lavados])

  const formacionesDisponibles = useMemo(
    () => FORMACIONES_LAVADO.filter((n) => !porFormacion.some((g) => g.formacion === n)),
    [porFormacion],
  )

  const totalRegistros = lavados.length
  const totalFormaciones = porFormacion.length

  const abrirAlta = () => {
    setForm({ formacion: formacionesDisponibles[0], ingreso: "", egreso: "" })
    setAgregando(true)
  }

  const enviar = async () => {
    await agregarLavado({
      formacion: form.formacion,
      ingreso: form.ingreso || null,
      egreso: form.egreso || null,
    })
    setAgregando(false)
  }

  return (
    <div className="max-w-4xl mx-auto px-3 py-4 pb-10">
      <header className="bg-black/25 backdrop-blur rounded-2xl p-4 mb-4 text-white">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-white/20 overflow-hidden">
              <img src="/icons/icon-192.png" alt="Trenes" className="w-9 h-9 rounded-lg" />
            </span>
            <div>
              <h1 className="font-bold leading-tight text-[15px]">Planificación y control de servicios</h1>
              <p className="text-white/80 text-xs">Lavado automático de formaciones</p>
            </div>
          </div>
          <button
            onClick={onSalir}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/20 hover:bg-white/30 transition text-sm font-semibold cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Salir
          </button>
        </div>

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white/20">
            {esEditor ? "✏️ MODO EDICIÓN" : "👁️ EMPLEADO (SOLO LECTURA)"}
          </span>
        </div>

        <div className="mt-3 flex gap-2 flex-wrap items-center">
          {insforgeConfigurado && (
            <SyncBadge online={online} pendientes={pendientes} onSync={() => void syncPending()} />
          )}
        </div>

        <div className="mt-3 flex gap-2 flex-wrap">
          {esEditor && <InformeButton tipo="lavados" datos={lavados} tema="naranja" tituloModal="Informe de lavado" />}
        </div>
      </header>

      <main className="space-y-4">
        {esEditor && (
          <button
            onClick={abrirAlta}
            disabled={formacionesDisponibles.length === 0}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" /> Agregar lavado
          </button>
        )}

        {esEditor && formacionesDisponibles.length === 0 && (
          <p className="rounded-xl bg-slate-100/90 border border-slate-200 px-4 py-3 text-sm text-slate-600">
            Todas las formaciones ya tienen tarjeta. Usá el botón "Agregar" de cada tarjeta para cargar más lavados.
          </p>
        )}

        {esEditor && agregando && (
          <div className="rounded-xl bg-slate-100/90 border border-slate-200 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-slate-700">Nuevo lavado</p>
              <button onClick={() => setAgregando(false)} className="hover:bg-slate-200 rounded-lg p-1.5 transition cursor-pointer text-slate-500" aria-label="Cerrar">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="block">
                <span className="text-xs text-slate-500">Formación</span>
                <div className="mt-1">
                  <DropdownSelect
                    value={form.formacion}
                    options={formacionesDisponibles.map((n) => ({ value: n, label: `N° ${n}` }))}
                    onChange={(v) => setForm((f) => ({ ...f, formacion: v }))}
                    placeholder="Formación"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-xs text-slate-500">Hora ingreso</span>
                <input
                  type="time"
                  value={form.ingreso}
                  onChange={(e) => setForm((f) => ({ ...f, ingreso: e.target.value }))}
                  className="w-full mt-1 px-2 py-1.5 rounded-lg border border-slate-200 text-sm bg-white text-slate-700 focus:border-orange-500 outline-none"
                />
              </label>

              <label className="block">
                <span className="text-xs text-slate-500">Hora egreso</span>
                <input
                  type="time"
                  value={form.egreso}
                  onChange={(e) => setForm((f) => ({ ...f, egreso: e.target.value }))}
                  className="w-full mt-1 px-2 py-1.5 rounded-lg border border-slate-200 text-sm bg-white text-slate-700 focus:border-orange-500 outline-none"
                />
              </label>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setAgregando(false)}
                className="inline-flex items-center gap-1.5 flex-1 justify-center px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => void enviar()}
                className="inline-flex items-center gap-1.5 flex-1 justify-center px-3 py-2 rounded-lg bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Guardar
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-100 text-red-700 px-4 py-3 text-sm font-medium">
            Error al cargar datos: {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl bg-white/10 text-white text-center py-12">Cargando lavados…</div>
        ) : (
          <>
            <div className="flex items-center justify-between px-1">
              <h2 className="text-white font-bold text-sm uppercase tracking-wide">
                Lavados{" "}
                <span className="opacity-80 font-medium normal-case">
                  ({totalRegistros} registros · {totalFormaciones} {totalFormaciones === 1 ? "formación" : "formaciones"})
                </span>
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {porFormacion.map((g) => (
                <LavadoCard
                  key={g.formacion}
                  formacion={g.formacion}
                  registros={g.registros}
                  editor={esEditor}
                  onCambio={(id, c) => void aplicarCambio(id, c)}
                  onEliminar={esEditor ? (id) => void eliminarLavado(id) : () => {}}
                  onAgregar={(c) => void agregarLavado(c)}
                />
              ))}
              {porFormacion.length === 0 && (
                <div className="rounded-xl bg-white/10 text-white/80 text-center py-10 text-sm">
                  Todavía no hay lavados cargados.
                </div>
              )}
            </div>
          </>
        )}

        {!esEditor && (
          <div className="rounded-xl bg-amber-100 border border-amber-200 text-amber-800 px-4 py-3 text-sm">
            No tenés permisos de edición ({rol === null ? "rol sin asignar" : "solo lectura"}). Hablá con el administrador.
          </div>
        )}
      </main>

      <footer className="mt-6 space-y-2">
        <div className="rounded-xl bg-white px-4 py-3 text-xs text-slate-600 space-y-1.5">
          <p className="font-semibold uppercase tracking-wide text-slate-500">Leyenda</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" /> OK</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-400" /> Pendiente</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-400" /> Sin datos</span>
          </div>
        </div>
        <p className="text-center text-white/70 text-xs capitalize">Actualizado: {ahora}</p>
      </footer>
    </div>
  )
}