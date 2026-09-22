import { useState } from "react"
import { LogOut } from "lucide-react"
import { FormationCard } from "./FormationCard"
import { InformeButton } from "./InformeButton"
import { InfoModal } from "./InfoModal"
import { StatsCards } from "./StatsCards"
import { SyncBadge } from "./SyncBadge"
import type { useFormaciones } from "../hooks/useFormaciones"
import { insforgeConfigurado } from "../lib/insforge"

export type UseFormacionesResult = ReturnType<typeof useFormaciones>

interface Props {
  datos: UseFormacionesResult
  esEditor: boolean
  rol: "admin" | "editor" | null
  ahora: string
  onSalir: () => void
}

export function FormacionesPage({ datos, esEditor, rol, ahora, onSalir }: Props) {
  const { formaciones, loading, error, online, pendientes, aplicarCambio, agregarServicio, aplicarCambioServicio, eliminarServicio, syncPending } = datos
  const [situacion, setSituacion] = useState<"limpieza" | "reparacion" | "fuera-servicio" | null>(null)

  const conDatos = formaciones.filter((f) => f.dias !== null)
  const sinDatos = formaciones.filter((f) => f.dias === null)

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
              <p className="text-white/80 text-xs">Lavado de formaciones</p>
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Verde: 0-15 días
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Amarillo: 16-20 días
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Rojo: 21+ días
          </span>
        </div>

        <div className="mt-3 flex gap-2 flex-wrap items-center">
          {insforgeConfigurado && (
            <SyncBadge online={online} pendientes={pendientes} onSync={() => void syncPending()} />
          )}
        </div>

        <div className="mt-3 flex gap-2 flex-wrap">
          {esEditor && <InformeButton tipo="formaciones" datos={formaciones} tema="azul" tituloModal="Informe de formaciones" />}
        </div>
      </header>

      <main className="space-y-4">
        {error && (
          <div className="rounded-xl bg-red-100 text-red-700 px-4 py-3 text-sm font-medium">
            Error al cargar datos: {error}
          </div>
        )}

        {!loading && formaciones.length > 0 && (
          <StatsCards formaciones={formaciones} onVerSituacion={(e) => setSituacion(e as "limpieza" | "reparacion" | "fuera-servicio")} />
        )}

        {loading ? (
          <div className="rounded-xl bg-white/10 text-white text-center py-12">Cargando formaciones…</div>
        ) : (
          <>
            <div className="flex items-center justify-between px-1">
              <h2 className="text-white font-bold text-sm uppercase tracking-wide">
                Formaciones <span className="opacity-80 font-medium normal-case">({formaciones.length})</span>
              </h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                {conDatos.map((f) => (
                  <FormationCard
                    key={f.id}
                    formacion={f}
                    editor={esEditor}
                    onCambio={(id, c) => void aplicarCambio(id, c)}
                    onAgregarServicio={(formacionId, fecha, situacion) => void agregarServicio(formacionId, fecha, situacion)}
                    onCambioServicio={(servicioId, formacionId, fecha, situacion) => void aplicarCambioServicio(servicioId, formacionId, fecha, situacion)}
                    onEliminarServicio={(servicioId, formacionId) => void eliminarServicio(servicioId, formacionId)}
                  />
                ))}
              </div>
              {sinDatos.length > 0 && (
                <>
                  <h3 className="px-1 pt-1 text-white/80 font-bold text-xs uppercase tracking-wide flex items-center gap-2">
                    Fuera de servicio ({sinDatos.length})
                    <span className="inline-block w-2 h-2 rounded-full bg-slate-400" />
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {sinDatos.map((f) => (
                      <FormationCard
                        key={f.id}
                        formacion={f}
                        editor={esEditor}
                        onCambio={(id, c) => void aplicarCambio(id, c)}
                        onAgregarServicio={(formacionId, fecha, situacion) => void agregarServicio(formacionId, fecha, situacion)}
                        onCambioServicio={(servicioId, formacionId, fecha, situacion) => void aplicarCambioServicio(servicioId, formacionId, fecha, situacion)}
                        onEliminarServicio={(servicioId, formacionId) => void eliminarServicio(servicioId, formacionId)}
                      />
                    ))}
                  </div>
                </>
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

      <footer className="mt-6">
        <p className="text-center text-white/70 text-xs capitalize">Actualizado: {ahora}</p>
      </footer>

      <InfoModal
        abierto={situacion !== null}
        estado={situacion ?? "limpieza"}
        formaciones={formaciones}
        onCerrar={() => setSituacion(null)}
      />
    </div>
  )
}