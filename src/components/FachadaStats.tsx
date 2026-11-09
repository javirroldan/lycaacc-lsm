import { ClipboardList, AlertTriangle, TrainFront } from "lucide-react"

export type FachadaDetalleModo = "registros" | "estaciones" | "suspendidas"

function Card({ icon, bg, color, valor, label, onClick }: { icon: React.ReactNode; bg: string; color: string; valor: number | string; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 rounded-xl ${bg} p-3 min-w-0 flex-1 text-left ${onClick ? "cursor-pointer active:scale-[0.98] transition border-2 border-violet-600/30 shadow-md" : "cursor-default shadow-sm"}`}>
      <span className={color}>{icon}</span>
      <span>
        <span className={`block text-2xl font-bold leading-none ${color}`}>{valor}</span>
        <span className="block text-[11px] text-slate-600 uppercase tracking-wide mt-1">{label}</span>
      </span>
    </button>
  )
}

export function FachadaStats({ registros, estaciones, suspendidas, onVer }: { registros: number; estaciones: number; suspendidas: number; onVer: (modo: FachadaDetalleModo) => void }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <Card icon={<ClipboardList className="w-6 h-6" />} bg="bg-violet-50" color="text-violet-600" valor={registros} label="Registros" onClick={() => onVer("registros")} />
      <Card icon={<TrainFront className="w-6 h-6" />} bg="bg-amber-50" color="text-amber-500" valor={`${estaciones}/22`} label="Estaciones" onClick={() => onVer("estaciones")} />
      <Card icon={<AlertTriangle className="w-6 h-6" />} bg="bg-red-50" color="text-red-500" valor={suspendidas} label="Suspendidas" onClick={() => onVer("suspendidas")} />
    </div>
  )
}
