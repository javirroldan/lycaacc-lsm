export interface LavadoDB {
  id: number
  formacion: number
  ingreso: string | null
  egreso: string | null
  pasadas: number | null
  ok: boolean | null
  fecha: string | null
  created_at: string
}

export type Lavado = LavadoDB

export type CamposEditablesLavado = Pick<LavadoDB, "formacion" | "fecha" | "ingreso" | "egreso" | "pasadas" | "ok">

// Alta: solo se pasa formacion + fecha/horas; pasadas/ok se completan en automático
export interface NuevoLavado {
  formacion: number
  fecha?: string | null
  ingreso: string | null
  egreso: string | null
}

export function claveOrdenLavado(l: { fecha: string | null; created_at: string }): string {
  return toFechaKey(l.fecha) ?? toFechaKey(l.created_at) ?? ""
}

export function ordenarPorRecienteLavado(lista: Lavado[]): Lavado[] {
  return [...lista].sort((a, b) => {
    const ka = claveOrdenLavado(a)
    const kb = claveOrdenLavado(b)
    if (ka < kb) return 1
    if (ka > kb) return -1
    if (a.created_at !== b.created_at) return a.created_at < b.created_at ? 1 : -1
    return b.id - a.id
  })
}

import { toFechaKey } from "./dates"

export const FORMACIONES_LAVADO: number[] = Array.from({ length: 23 }, (_, i) => i + 1)

export const PASADAS_DEFAULT = 2
export const OK_DEFAULT = true

export type ValorOk = "si" | "no" | "sin"

export const OK_OPCIONES = [
  { value: "si", label: "Sí" },
  { value: "no", label: "No" },
  { value: "sin", label: "Sin datos" },
]

export function okValor(ok: boolean | null): ValorOk {
  if (ok === null) return "sin"
  return ok ? "si" : "no"
}

export function okABoolean(v: ValorOk): boolean | null {
  if (v === "si") return true
  if (v === "no") return false
  return null
}

export function okLabel(ok: boolean | null): string {
  const v = okValor(ok)
  if (v === "si") return "OK"
  if (v === "no") return "Pendiente"
  return "Sin datos"
}

export const OK_VALOR_CLASS: Record<ValorOk, string> = {
  si: "text-green-600",
  no: "text-amber-600",
  sin: "text-slate-500",
}