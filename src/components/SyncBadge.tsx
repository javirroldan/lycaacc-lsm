import { CloudOff, CloudUpload, RefreshCw } from "lucide-react"

interface Props {
  online: boolean
  pendientes: number
  sincronizando?: boolean
  onSync: () => void
}

export function SyncBadge({ online, pendientes, sincronizando, onSync }: Props) {
  if (!online) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-amber-950 text-xs font-bold mb-2 w-fit">
        <CloudOff className="w-3.5 h-3.5" /> Sin conexión
        {pendientes > 0 && <span className="ml-1">· {pendientes} pendiente{pendientes > 1 ? "s" : ""}</span>}
      </span>
    )
  }
  if (pendientes > 0) {
    return (
      <button
        onClick={onSync}
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-amber-950 text-xs font-bold mb-2 w-fit cursor-pointer hover:bg-amber-300 transition"
      >
        {sincronizando ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CloudUpload className="w-3.5 h-3.5" />}
        {sincronizando ? "Sincronizando…" : `Sincronizar ${pendientes}`}
      </button>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500 text-white text-xs font-bold mb-2 w-fit">
      <CloudUpload className="w-3.5 h-3.5" /> Sincronizado
    </span>
  )
}