import { Ban, ClipboardList, Train } from "lucide-react"

export type LavadoDetalleModo = "registros" | "formaciones" | "sin"

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
      className={`flex items-center gap-2 rounded-xl ${bg} p-3 min-w-0 flex-1 text-left ${onClick ? "cursor-pointer active:scale-[0.98] transition border-2 border-orange-600/30 shadow-md" : "cursor-default shadow-sm"}`}
    >
      <span className={color}>{icon}</span>
      <span>
        <span className={`block text-2xl font-bold leading-none ${color}`}>{valor}</span>
        <span className="block text-[11px] text-slate-600 uppercase tracking-wide mt-1">{label}</span>
      </span>
    </button>
  )
}

export function LavadoStats({
  registros,
  formaciones,
  sinLavados,
  onVer,
}: {
  registros: number
  formaciones: number
  sinLavados: number
  onVer: (modo: LavadoDetalleModo) => void
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <Card icon={<ClipboardList className="w-6 h-6" />} bg="bg-orange-50" color="text-orange-600" valor={registros} label="Registros" onClick={() => onVer("registros")} />
      <Card icon={<Train className="w-6 h-6" />} bg="bg-amber-50" color="text-amber-500" valor={formaciones} label="Formaciones" onClick={() => onVer("formaciones")} />
      <Card icon={<Ban className="w-6 h-6" />} bg="bg-slate-100" color="text-slate-500" valor={sinLavados} label="Sin lavados" onClick={() => onVer("sin")} />
    </div>
  )
}