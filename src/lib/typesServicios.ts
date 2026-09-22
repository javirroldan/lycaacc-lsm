import { toFechaKey } from "./dates"

export type SituacionFormacion = "activa" | "limpieza" | "reparacion" | "fuera-servicio"
export type SituacionLocomotora = "en-servicio" | "detenida"
export type TipoServicioLocomotora = "local" | "ld"

export interface ServicioFormacionDB {
  id: number
  formacion_id: number
  fecha: string
  situacion: SituacionFormacion
  created_at: string
}

export type ServicioFormacion = ServicioFormacionDB

export interface ServicioLocomotoraDB {
  id: number
  locomotora_id: number
  fecha: string
  situacion: SituacionLocomotora
  servicio: TipoServicioLocomotora
  created_at: string
}

export type ServicioLocomotora = ServicioLocomotoraDB

export type CamposEditablesServicioFormacion = { fecha: string; situacion: SituacionFormacion }
export type CamposEditablesServicioLocomotora = {
  fecha: string
  situacion: SituacionLocomotora
  servicio: TipoServicioLocomotora
}

export type NuevaServicioFormacion = { formacion_id: number; fecha: string; situacion: SituacionFormacion }
export type NuevaServicioLocomotora = {
  locomotora_id: number
  fecha: string
  situacion: SituacionLocomotora
  servicio: TipoServicioLocomotora
}

function claveOrden(v: { fecha: string; created_at: string }): string {
  return toFechaKey(v.fecha) ?? ""
}

export function ordenarServicios<T extends { id: number; fecha: string; created_at: string }>(lista: T[]): T[] {
  return [...lista].sort((a, b) => {
    const ka = claveOrden(a)
    const kb = claveOrden(b)
    if (ka < kb) return 1
    if (ka > kb) return -1
    if (a.created_at !== b.created_at) return a.created_at < b.created_at ? 1 : -1
    return b.id - a.id
  })
}

// Deriva ultima (registro más reciente) y anteultima (el segundo más reciente)
// desde el historial. El resto de los registros quedan en el historial.
export function derivarFechas(
  historial: { fecha: string }[],
): { ultima: string | null; anteultima: string | null } {
  const ordenado = [...historial].sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0))
  return {
    ultima: ordenado[0]?.fecha ?? null,
    anteultima: ordenado[1]?.fecha ?? null,
  }
}