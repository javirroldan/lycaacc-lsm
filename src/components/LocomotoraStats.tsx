import { BadgeAlert, CheckCircle2, AlertTriangle, Power, PowerOff } from "lucide-react"
import type { Locomotora } from "../lib/typesLocomotoras"

function Card({
  icon,
  bg,
  color,
  valor,
  label,
  onClick,
}: {
  icon: React.ReactNode
  bg: string
  color: string
  valor: number
  label: string
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl ${bg} p-3 min-w-0 flex-1 text-left ${onClick ? "cursor-pointer active:scale-[0.98] transition border-2 border-brand/30 shadow-md" : "cursor-default shadow-sm"}`}
    >
      <span className={color}>{icon}</span>
      <span>
        <span className={`block text-2xl font-bold leading-none ${color}`}>{valor}</span>
        <span className="block text-[11px] text-slate-600 uppercase tracking-wide mt-1">{label}</span>
      </span>
    </button>
  )
}

export function LocomotoraStats({ locomotoras, onVerEstado }: { locomotoras: Locomotora[]; onVerEstado: (estado: string) => void }) {
  const verde = locomotoras.filter((l) => l.sem === "verde").length
  const amarillo = locomotoras.filter((l) => l.sem === "amarillo").length
  const rojo = locomotoras.filter((l) => l.sem === "rojo").length
  const enServicio = locomotoras.filter((l) => l.estado === "en-servicio").length
  const detenida = locomotoras.filter((l) => l.estado === "detenida").length

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <Card icon={<CheckCircle2 className="w-6 h-6" />} bg="bg-green-50" color="text-green-600" valor={verde} label="Al día" />
        <Card icon={<AlertTriangle className="w-6 h-6" />} bg="bg-amber-50" color="text-amber-500" valor={amarillo} label="Precaución" />
        <Card icon={<BadgeAlert className="w-6 h-6" />} bg="bg-red-50" color="text-red-500" valor={rojo} label="Crítico" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Card icon={<Power className="w-6 h-6" />} bg="bg-emerald-50" color="text-emerald-600" valor={enServicio} label="En servicio" onClick={() => onVerEstado("en-servicio")} />
        <Card icon={<PowerOff className="w-6 h-6" />} bg="bg-slate-100" color="text-slate-500" valor={detenida} label="Detenidas" onClick={() => onVerEstado("detenida")} />
      </div>
    </div>
  )
}