import { CheckCircle2, AlertTriangle, BadgeAlert, Factory, Wrench, XCircle } from "lucide-react"
import type { Formacion } from "../lib/types"

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

export function StatsCards({ formaciones, onVerSituacion }: { formaciones: Formacion[]; onVerSituacion: (estado: string) => void }) {
  const verde = formaciones.filter((f) => f.sem === "verde").length
  const amarillo = formaciones.filter((f) => f.sem === "amarillo").length
  const rojo = formaciones.filter((f) => f.sem === "rojo").length
  const limpieza = formaciones.filter((f) => f.estado === "limpieza").length
  const reparacion = formaciones.filter((f) => f.estado === "reparacion").length
  const fuera = formaciones.filter((f) => f.estado === "fuera-servicio").length

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <Card icon={<CheckCircle2 className="w-6 h-6" />} bg="bg-green-50" color="text-green-600" valor={verde} label="Al día" />
        <Card icon={<AlertTriangle className="w-6 h-6" />} bg="bg-amber-50" color="text-amber-500" valor={amarillo} label="Precaución" />
        <Card icon={<BadgeAlert className="w-6 h-6" />} bg="bg-red-50" color="text-red-500" valor={rojo} label="Crítico" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Card icon={<Factory className="w-6 h-6" />} bg="bg-cyan-50" color="text-cyan-600" valor={limpieza} label="Limpieza" onClick={() => onVerSituacion("limpieza")} />
        <Card icon={<Wrench className="w-6 h-6" />} bg="bg-red-50" color="text-rose-600" valor={reparacion} label="Reparación" onClick={() => onVerSituacion("reparacion")} />
        <Card icon={<XCircle className="w-6 h-6" />} bg="bg-slate-100" color="text-slate-500" valor={fuera} label="Fuera de servicio" onClick={() => onVerSituacion("fuera-servicio")} />
      </div>
    </div>
  )
}