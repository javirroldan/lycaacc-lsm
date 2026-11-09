import { ClipboardList, AlertTriangle, CheckCircle2 } from "lucide-react"

export type BasuralesDetalleModo = "registros" | "suspendidas" | "activas"

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
      className={`flex items-center gap-2 rounded-xl ${bg} p-3 min-w-0 flex-1 text-left ${onClick ? "cursor-pointer active:scale-[0.98] transition border-2 border-teal-600/30 shadow-md" : "cursor-default shadow-sm"}`}
    >
      <span className={color}>{icon}</span>
      <span>
        <span className={`block text-2xl font-bold leading-none ${color}`}>{valor}</span>
        <span className="block text-[11px] text-slate-600 uppercase tracking-wide mt-1">{label}</span>
      </span>
    </button>
  )
}

export function BasuralesStats({
  registros,
  suspendidas,
  activas,
  onVer,
}: {
  registros: number
  suspendidas: number
  activas: number
  onVer: (modo: BasuralesDetalleModo) => void
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <Card icon={<ClipboardList className="w-6 h-6" />} bg="bg-teal-50" color="text-teal-600" valor={registros} label="Registros" onClick={() => onVer("registros")} />
      <Card icon={<AlertTriangle className="w-6 h-6" />} bg="bg-amber-50" color="text-amber-500" valor={suspendidas} label="Suspendidas" onClick={() => onVer("suspendidas")} />
      <Card icon={<CheckCircle2 className="w-6 h-6" />} bg="bg-emerald-50" color="text-emerald-600" valor={activas} label="Activas" onClick={() => onVer("activas")} />
    </div>
  )
}
