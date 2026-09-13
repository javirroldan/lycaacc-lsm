export type Estado = "activa" | "limpieza" | "reparacion" | "fuera-servicio"

export interface FormacionDB {
  id: number
  formacion: number
  anteultima: string | null
  ultima: string | null
  estado: Estado
  descripcion: string | null
  updated_at: string
}

export type SemColor = "verde" | "amarillo" | "rojo" | "sin"

export interface Formacion extends FormacionDB {
  dias: number | null
  sem: SemColor
}

export type CamposEditables = Pick<FormacionDB, "anteultima" | "ultima" | "estado" | "descripcion">

export const ESTADOS: { value: Estado; label: string }[] = [
  { value: "limpieza", label: "Limpieza" },
  { value: "reparacion", label: "Reparación" },
  { value: "fuera-servicio", label: "Fuera de servicio" },
  { value: "activa", label: "Activa" },
]

export const ESTADO_LABEL: Record<Estado, string> = {
  limpieza: "Limpieza",
  reparacion: "Reparación",
  "fuera-servicio": "Fuera de servicio",
  activa: "Activa",
}