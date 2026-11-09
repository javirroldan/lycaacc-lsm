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

export interface BasuralDB {
  id: number
  orden_servicio: string | null
  fecha: string | null
  proveedor: string | null
  oc: string | null
  domicilio: string | null
  supervisor_nombre: string | null
  supervisor_telefono: string | null
  supervisor_legajo: string | null
  horarios: string | null
  suspendida_mal_tiempo: boolean | null
  insumos: string | null
  rsu_bolsas: string | null
  escombro_m3: string | null
  pastizales_m2: string | null
  eval_presentismo: EvaluacionTarea
  eval_maquinas: EvaluacionTarea
  eval_uniformidad: EvaluacionTarea
  eval_compromiso: EvaluacionTarea
  eval_objetivos: EvaluacionTarea
  observaciones: string | null
  created_at: string
}

export type Basural = BasuralDB

export type CamposEditablesBasural = Omit<BasuralDB, "id" | "created_at">

export type NuevoBasural = CamposEditablesBasural

export function basuralVacio(fechaHoy: string): NuevoBasural {
  return {
    orden_servicio: "",
    fecha: fechaHoy,
    proveedor: "",
    oc: "",
    domicilio: "",
    supervisor_nombre: "",
    supervisor_telefono: "",
    supervisor_legajo: "",
    horarios: "",
    suspendida_mal_tiempo: null,
    insumos: "",
    rsu_bolsas: "",
    escombro_m3: "",
    pastizales_m2: "",
    eval_presentismo: null,
    eval_maquinas: null,
    eval_uniformidad: null,
    eval_compromiso: null,
    eval_objetivos: null,
    observaciones: "",
  }
}

import { toFechaKey } from "./dates"

export function claveOrdenBasural(b: { fecha: string | null; created_at: string }): string {
  return toFechaKey(b.fecha) ?? toFechaKey(b.created_at) ?? ""
}

export function ordenarPorRecienteBasural(lista: Basural[]): Basural[] {
  return [...lista].sort((a, b) => {
    const ka = claveOrdenBasural(a)
    const kb = claveOrdenBasural(b)
    if (ka < kb) return 1
    if (ka > kb) return -1
    if (a.created_at !== b.created_at) return a.created_at < b.created_at ? 1 : -1
    return b.id - a.id
  })
}

export const EVAL_ITEMS: { key: keyof Pick<BasuralDB, "eval_presentismo" | "eval_maquinas" | "eval_uniformidad" | "eval_compromiso" | "eval_objetivos">; label: string }[] = [
  { key: "eval_presentismo", label: "Presentismo e inicios de tareas" },
  { key: "eval_maquinas", label: "Máquinas, equipamiento e insumos" },
  { key: "eval_uniformidad", label: "Uniformidad y EPP" },
  { key: "eval_compromiso", label: "Compromiso y colaboración" },
  { key: "eval_objetivos", label: "Cumplimiento de objetivos generales" },
]
