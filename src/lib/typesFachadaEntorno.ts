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

export const ESTACIONES_FACHADA: string[] = [
  "Retiro",
  "Palermo",
  "Villa Crespo",
  "La Paternal",
  "Villa del Parque",
  "Devoto",
  "Sáenz Peña",
  "Santos Lugares",
  "Caseros",
  "El Palomar",
  "Hurlingham",
  "William Morris",
  "Bella Vista",
  "Muñiz",
  "San Miguel",
  "José C. Paz",
  "Sol y Verde",
  "Presidente Derqui",
  "Villa Astolfi",
  "Pilar",
  "Manzanares",
  "Dr. Domingo Cabred",
]

export type ItemFachadaKey =
  | "vereda"
  | "ventanales"
  | "paredes"
  | "puertas"
  | "grafittis"
  | "techos"
  | "tunel"
  | "maseteros"
  | "luminarias"
  | "desmalezado"
  | "hidro"

export const ITEMS_FACHADA: { key: ItemFachadaKey; label: string }[] = [
  { key: "vereda", label: "Vereda" },
  { key: "ventanales", label: "Ventanales" },
  { key: "paredes", label: "Paredes" },
  { key: "puertas", label: "Puertas" },
  { key: "grafittis", label: "Grafittis o pinturas" },
  { key: "techos", label: "Techos" },
  { key: "tunel", label: "Túnel" },
  { key: "maseteros", label: "Maseteros" },
  { key: "luminarias", label: "Luminarias" },
  { key: "desmalezado", label: "Desmalezado o poda" },
  { key: "hidro", label: "Hidro lavado intensivo" },
]

export type ItemsFachada = Record<ItemFachadaKey, EvaluacionTarea>

export function itemsVacios(): ItemsFachada {
  return {
    vereda: null,
    ventanales: null,
    paredes: null,
    puertas: null,
    grafittis: null,
    techos: null,
    tunel: null,
    maseteros: null,
    luminarias: null,
    desmalezado: null,
    hidro: null,
  }
}

export function normalizarItems(raw: unknown): ItemsFachada {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return itemsVacios()
  const vacio = itemsVacios()
  const fuente = raw as Record<string, unknown>
  for (const { key } of ITEMS_FACHADA) {
    const v = fuente[key]
    vacio[key] = v === "bueno" || v === "regular" || v === "malo" ? v : null
  }
  return vacio
}

export interface FachadaEntornoDB {
  id: number
  estacion: string | null
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
  items: Partial<Record<ItemFachadaKey, EvaluacionTarea>> | null
  eval_presentismo: EvaluacionTarea
  eval_maquinas: EvaluacionTarea
  eval_uniformidad: EvaluacionTarea
  eval_compromiso: EvaluacionTarea
  eval_objetivos: EvaluacionTarea
  observaciones: string | null
  created_at: string
}

export type FachadaEntorno = FachadaEntornoDB

export type CamposEditablesFachadaEntorno = Omit<FachadaEntornoDB, "id" | "created_at">

export type NuevaFachadaEntorno = CamposEditablesFachadaEntorno

export function fachadaEntornoVacia(fechaHoy: string, estacion: string): NuevaFachadaEntorno {
  return {
    estacion,
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
    items: itemsVacios(),
    eval_presentismo: null,
    eval_maquinas: null,
    eval_uniformidad: null,
    eval_compromiso: null,
    eval_objetivos: null,
    observaciones: "",
  }
}

import { toFechaKey } from "./dates"

export function claveOrdenFachada(r: { fecha: string | null; created_at: string }): string {
  return toFechaKey(r.fecha) ?? toFechaKey(r.created_at) ?? ""
}

export function ordenarPorRecienteFachada(lista: FachadaEntorno[]): FachadaEntorno[] {
  return [...lista].sort((a, b) => {
    const ka = claveOrdenFachada(a)
    const kb = claveOrdenFachada(b)
    if (ka < kb) return 1
    if (ka > kb) return -1
    if (a.created_at !== b.created_at) return a.created_at < b.created_at ? 1 : -1
    return b.id - a.id
  })
}

export const EVAL_ITEMS: { key: keyof Pick<FachadaEntornoDB, "eval_presentismo" | "eval_maquinas" | "eval_uniformidad" | "eval_compromiso" | "eval_objetivos">; label: string }[] = [
  { key: "eval_presentismo", label: "Presentismo e inicios de tareas" },
  { key: "eval_maquinas", label: "Máquinas, equipamiento e insumos" },
  { key: "eval_uniformidad", label: "Uniformidad y EPP" },
  { key: "eval_compromiso", label: "Compromiso y colaboración" },
  { key: "eval_objetivos", label: "Cumplimiento de objetivos generales" },
]

export interface GrupoEstacion {
  estacion: string
  registros: FachadaEntorno[]
}

export function agruparPorEstacion(registros: FachadaEntorno[]): GrupoEstacion[] {
  const mapa = new Map<string, FachadaEntorno[]>()
  for (const r of registros) {
    const est = (r.estacion ?? "").trim()
    if (!est) continue
    const arr = mapa.get(est)
    if (arr) arr.push(r)
    else mapa.set(est, [r])
  }
  return ESTACIONES_FACHADA.map((estacion) => ({
    estacion,
    registros: ordenarPorRecienteFachada(mapa.get(estacion) ?? []),
  }))
}

export function conteoItems(r: { items: unknown }): { bueno: number; regular: number; malo: number } {
  const it = normalizarItems(r.items)
  let bueno = 0
  let regular = 0
  let malo = 0
  for (const { key } of ITEMS_FACHADA) {
    if (it[key] === "bueno") bueno++
    else if (it[key] === "regular") regular++
    else if (it[key] === "malo") malo++
  }
  return { bueno, regular, malo }
}
