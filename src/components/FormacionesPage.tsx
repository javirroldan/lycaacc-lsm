import { useState } from "react"
import { FileDown, LayoutGrid, LogOut, Table2 } from "lucide-react"
import { FormationCard } from "./FormationCard"
import { FormationTable } from "./FormationTable"
import { InfoModal } from "./InfoModal"
import { StatsCards } from "./StatsCards"
import { SyncBadge } from "./SyncBadge"
import type { useFormaciones } from "../hooks/useFormaciones"
import { compartirInforme, generarInforme } from "../lib/report"
import { ESTADO_LABEL } from "../lib/types"
import { supabaseConfigurado } from "../lib/supabase"

export type UseFormacionesResult = ReturnType<typeof useFormaciones>

interface Props {
  datos: UseFormacionesResult
  esEditor: boolean
  esVisitante: boolean
  usuario: { email?: string | undefined } | null
  rol: "admin" | "editor" | null
  ahora: string
  onSalir: () => void
}

export function FormacionesPage({ datos, esEditor, esVisitante, usuario, rol, ahora, onSalir }: Props) {
  const { formaciones, loading, error, online, pendientes, aplicarCambio, syncPending } = datos
  const [vista, setVista] = useState<"cards" | "tabla">("cards")
  const [situacion, setSituacion] = useState<"limpieza" | "reparacion" | "fuera-servicio" | null>(null)
  const [tipoInforme, setTipoInforme] = useState<string | null>(null)

  const conDatos = formaciones.filter((f) => f.dias !== null)
  const sinDatos = formaciones.filter((f) => f.dias === null)

  const informe = (tipo: string) => {
    const texto = generarInforme(formaciones)
    setTipoInforme(tipo)
    const nombre = `informe-demoras-${new Date().toISOString().slice(0, 10)}`
    void compartirInforme(texto, nombre).finally(() => setTipoInforme(null))
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
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white/20">
            {esEditor ? "✏️ MODO EDICIÓN" : esVisitante ? "👁️ EMPLEADO" : "👁️ SOLO LECTURA"}
          </span>
          {usuario?.email && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white/20">
              {usuario.email}
            </span>
          )}
        </div>

        <div className="mt-3 flex gap-2 flex-wrap items-center">
          {supabaseConfigurado && (
            <SyncBadge online={online} pendientes={pendientes} onSync={() => void syncPending()} />
          )}
        </div>

        <div className="mt-3 flex gap-2 flex-wrap">
          <button
            onClick={() => setVista((v) => (v === "cards" ? "tabla" : "cards"))}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/15 hover:bg-white/25 transition text-xs font-semibold cursor-pointer"
          >
            {vista === "cards" ? <Table2 className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
            Vista {vista === "cards" ? "tabla" : "tarjetas"}
          </button>
          {esEditor && (
            <button
              onClick={() => informe("txt")}
              disabled={tipoInforme !== null}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/15 hover:bg-white/25 transition text-xs font-semibold cursor-pointer disabled:opacity-60"
            >
              <FileDown className="w-4 h-4" /> {tipoInforme ? "Generando…" : "Informe TXT"}
            </button>
          )}
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

            {vista === "cards" ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  {conDatos.map((f) => (
                    <FormationCard key={f.id} formacion={f} editor={esEditor} onCambio={(id, c) => void aplicarCambio(id, c)} />
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
                        <FormationCard key={f.id} formacion={f} editor={esEditor} onCambio={(id, c) => void aplicarCambio(id, c)} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <FormationTable formaciones={formaciones} editor={esEditor} onCambio={(id, c) => void aplicarCambio(id, c)} />
            )}
          </>
        )}

        {!esEditor && !esVisitante && (
          <div className="rounded-xl bg-amber-100 border border-amber-200 text-amber-800 px-4 py-3 text-sm">
            No tenés permisos de edición ({rol === null ? "rol sin asignar" : "solo lectura"}). Hablá con el administrador.
          </div>
        )}
      </main>

      <footer className="mt-6 space-y-2">
        <div className="rounded-xl bg-white px-4 py-3 text-xs text-slate-600 space-y-1.5">
          <p className="font-semibold uppercase tracking-wide text-slate-500">Leyenda</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> Verde: 0-10 días</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Amarillo: 11-20 días</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Rojo: 21+ días</span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {Object.entries(ESTADO_LABEL).map(([k, v]) => (
              <span key={k} className="capitalize">{v}</span>
            ))}
          </div>
        </div>
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