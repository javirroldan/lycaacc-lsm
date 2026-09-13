import { useState } from "react"
import { LogOut } from "lucide-react"
import { LocomotoraCard } from "./LocomotoraCard"
import { LocomotoraInfoModal } from "./LocomotoraInfoModal"
import { LocomotoraStats } from "./LocomotoraStats"
import { SyncBadge } from "./SyncBadge"
import type { useLocomotoras } from "../hooks/useLocomotoras"
import type { EstadoLocomotora } from "../lib/typesLocomotoras"
import { ESTADO_LOCO_LABEL, SERVICIO_LABEL } from "../lib/typesLocomotoras"
import { supabaseConfigurado } from "../lib/supabase"

export type UseLocomotorasResult = ReturnType<typeof useLocomotoras>

interface Props {
  datos: UseLocomotorasResult
  esEditor: boolean
  esVisitante: boolean
  usuario: { email?: string | undefined } | null
  rol: "admin" | "editor" | null
  ahora: string
  onSalir: () => void
}

export function LocomotoraPage({ datos, esEditor, esVisitante, usuario, rol, ahora, onSalir }: Props) {
  const { locomotoras, loading, error, online, pendientes, aplicarCambio, syncPending } = datos
  const [estadoModal, setEstadoModal] = useState<EstadoLocomotora | null>(null)

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
              <p className="text-white/80 text-xs">Lavado de locomotoras</p>
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
      </header>

      <main className="space-y-4">
        {error && (
          <div className="rounded-xl bg-red-100 text-red-700 px-4 py-3 text-sm font-medium">
            Error al cargar datos: {error}
          </div>
        )}

        {!loading && locomotoras.length > 0 && (
          <LocomotoraStats locomotoras={locomotoras} onVerEstado={(e) => setEstadoModal(e as EstadoLocomotora)} />
        )}

        {loading ? (
          <div className="rounded-xl bg-white/10 text-white text-center py-12">Cargando locomotoras…</div>
        ) : (
          <>
            <div className="flex items-center justify-between px-1">
              <h2 className="text-white font-bold text-sm uppercase tracking-wide">
                Locomotoras <span className="opacity-80 font-medium normal-case">({locomotoras.length})</span>
              </h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                {locomotoras.map((l) => (
                  <LocomotoraCard key={l.id} locomotora={l} editor={esEditor} onCambio={(id, c) => void aplicarCambio(id, c)} />
                ))}
              </div>
            </div>
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
            {Object.entries(ESTADO_LOCO_LABEL).map(([k, v]) => (
              <span key={k} className="capitalize">{v}</span>
            ))}
            {Object.entries(SERVICIO_LABEL).map(([k, v]) => (
              <span key={k} className="capitalize">{v}</span>
            ))}
          </div>
        </div>
        <p className="text-center text-white/70 text-xs capitalize">Actualizado: {ahora}</p>
      </footer>

      <LocomotoraInfoModal
        abierto={estadoModal !== null}
        estado={estadoModal ?? "en-servicio"}
        locomotoras={locomotoras}
        onCerrar={() => setEstadoModal(null)}
      />
    </div>
  )
}