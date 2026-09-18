import { useState } from "react"
import { LogOut } from "lucide-react"
import { InformeButton } from "./InformeButton"
import { LocomotoraCard } from "./LocomotoraCard"
import { LocomotoraInfoModal } from "./LocomotoraInfoModal"
import { LocomotoraStats } from "./LocomotoraStats"
import { SyncBadge } from "./SyncBadge"
import type { useLocomotoras } from "../hooks/useLocomotoras"
import { type EstadoLocomotora } from "../lib/typesLocomotoras"
import { insforgeConfigurado } from "../lib/insforge"

export type UseLocomotorasResult = ReturnType<typeof useLocomotoras>

interface Props {
  datos: UseLocomotorasResult
  esEditor: boolean
  rol: "admin" | "editor" | null
  ahora: string
  onSalir: () => void
}

export function LocomotoraPage({ datos, esEditor, rol, ahora, onSalir }: Props) {
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
          {esEditor && <InformeButton tipo="locomotoras" datos={locomotoras} tema="verde" tituloModal="Informe de locomotoras" />}
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

            <div className="grid grid-cols-1 gap-3">
              {locomotoras.map((l) => (
                <LocomotoraCard key={l.id} locomotora={l} editor={esEditor} onCambio={(id, c) => void aplicarCambio(id, c)} />
              ))}
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

      <LocomotoraInfoModal
        abierto={estadoModal !== null}
        estado={estadoModal ?? "en-servicio"}
        locomotoras={locomotoras}
        onCerrar={() => setEstadoModal(null)}
      />
    </div>
  )
}