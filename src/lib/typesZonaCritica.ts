export type EvaluacionTarea = "bueno" | "regular" | "malo" | null

export const EVALUACION_OPCIONES: { value: NonNullable<EvaluacionTarea>; label: string }[] = [
  { value: "bueno", label: "Bueno" },
  { value: "regular", label: "Regular" },
  { value: "malo", label: "Malo" },
]

export function evaluacionLabel(v: EvaluacionTarea): string {
  if (!v) return "—"
  return EVALUACION_OPCIONES.find((o) => o.value === v)?.label ?? "—"
}

export function evaluacionClass(v: EvaluacionTarea): string {
  if (v === "bueno") return "text-green-600"
  if (v === "regular") return "text-amber-600"
  if (v === "malo") return "text-red-600"
  return "text-slate-400"
}

export interface SectorZona {
  sector: number
  tramo: string
  rsu_vias_bolsas: string
  escombro_m3: string
  pastizales_m2: string
  cuadro_vias_rsu: string
  parrilla_vias_rsu: string
}

export const SECTORES_DEFAULT: SectorZona[] = [
  { sector: 1, tramo: "0 km a 0.650 km", rsu_vias_bolsas: "", escombro_m3: "", pastizales_m2: "", cuadro_vias_rsu: "", parrilla_vias_rsu: "" },
  { sector: 2, tramo: "0.650 km a 1.100 km", rsu_vias_bolsas: "", escombro_m3: "", pastizales_m2: "", cuadro_vias_rsu: "", parrilla_vias_rsu: "" },
  { sector: 3, tramo: "1.100 km a 1.600 km", rsu_vias_bolsas: "", escombro_m3: "", pastizales_m2: "", cuadro_vias_rsu: "", parrilla_vias_rsu: "" },
  { sector: 4, tramo: "1.600 km a 2.100 km", rsu_vias_bolsas: "", escombro_m3: "", pastizales_m2: "", cuadro_vias_rsu: "", parrilla_vias_rsu: "" },
]

export interface ZonaCriticaDB {
  id: number
  orden_servicio: string | null
  fecha: string | null
  proveedor: string | null
  oc: string | null
  sector_intervenciones: string | null
  supervisor_nombre: string | null
  supervisor_telefono: string | null
  supervisor_legajo: string | null
  horarios: string | null
  suspendida_mal_tiempo: boolean | null
  insumos: string | null
  sectores: SectorZona[] | null
  eval_presentismo: EvaluacionTarea
  eval_maquinas: EvaluacionTarea
  eval_uniformidad: EvaluacionTarea
  eval_compromiso: EvaluacionTarea
  eval_objetivos: EvaluacionTarea
  observaciones: string | null
  created_at: string
}

export type ZonaCritica = ZonaCriticaDB

export type CamposEditablesZonaCritica = Omit<ZonaCriticaDB, "id" | "created_at">

export type NuevaZonaCritica = CamposEditablesZonaCritica

export function zonaCriticaVacia(fechaHoy: string): NuevaZonaCritica {
  return {
    orden_servicio: "",
    fecha: fechaHoy,
    proveedor: "",
    oc: "",
    sector_intervenciones: "",
    supervisor_nombre: "",
    supervisor_telefono: "",
    supervisor_legajo: "",
    horarios: "",
    suspendida_mal_tiempo: null,
    insumos: "",
    sectores: SECTORES_DEFAULT.map((s) => ({ ...s })),
    eval_presentismo: null,
    eval_maquinas: null,
    eval_uniformidad: null,
    eval_compromiso: null,
    eval_objetivos: null,
    observaciones: "",
  }
}

import { toFechaKey } from "./dates"

export function claveOrdenZonaCritica(z: { fecha: string | null; created_at: string }): string {
  return toFechaKey(z.fecha) ?? toFechaKey(z.created_at) ?? ""
}

export function ordenarPorRecienteZonaCritica(lista: ZonaCritica[]): ZonaCritica[] {
  return [...lista].sort((a, b) => {
    const ka = claveOrdenZonaCritica(a)
    const kb = claveOrdenZonaCritica(b)
    if (ka < kb) return 1
    if (ka > kb) return -1
    if (a.created_at !== b.created_at) return a.created_at < b.created_at ? 1 : -1
    return b.id - a.id
  })
}

export const EVAL_ITEMS: { key: keyof Pick<ZonaCriticaDB, "eval_presentismo" | "eval_maquinas" | "eval_uniformidad" | "eval_compromiso" | "eval_objetivos">; label: string }[] = [
  { key: "eval_presentismo", label: "Presentismo e inicios de tareas" },
  { key: "eval_maquinas", label: "Máquinas, equipamiento e insumos" },
  { key: "eval_uniformidad", label: "Uniformidad y EPP" },
  { key: "eval_compromiso", label: "Compromiso y colaboración" },
  { key: "eval_objetivos", label: "Cumplimiento de objetivos generales" },
]
