export type EstadoLocomotora = "en-servicio" | "detenida"
export type ServicioLocomotora = "local" | "ld"

export interface LocomotoraDB {
  id: number
  locomotora: string
  servicio: ServicioLocomotora
  ultima: string | null
  estado: EstadoLocomotora
  descripcion: string | null
  updated_at: string
}

export type SemColorLocomotora = "verde" | "amarillo" | "rojo" | "sin"

export interface Locomotora extends LocomotoraDB {
  dias: number | null
  sem: SemColorLocomotora
}

export type CamposEditablesLocomotora = Pick<LocomotoraDB, "ultima" | "servicio" | "estado" | "descripcion">

export const SERVICIOS: { value: ServicioLocomotora; label: string }[] = [
  { value: "local", label: "Local" },
  { value: "ld", label: "Larga Distancia" },
]

export const SERVICIO_LABEL: Record<ServicioLocomotora, string> = {
  local: "Local",
  ld: "LD",
}

export const ESTADOS_LOCO: { value: EstadoLocomotora; label: string }[] = [
  { value: "en-servicio", label: "En Servicio" },
  { value: "detenida", label: "Detenida" },
]

export const ESTADO_LOCO_LABEL: Record<EstadoLocomotora, string> = {
  "en-servicio": "En Servicio",
  detenida: "Detenida",
}