import type { Formacion, SemColor } from "./types"

export function parseISO(iso: string | null): Date | null {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

export function fmtDMY(iso: string | null): string {
  const d = parseISO(iso)
  if (!d) return ""
  const dd = String(d.getUTCDate()).padStart(2, "0")
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0")
  return `${dd}/${mm}/${d.getUTCFullYear()}`
}

export function toInputValue(iso: string | null): string {
  const d = parseISO(iso)
  if (!d) return ""
  const dd = String(d.getUTCDate()).padStart(2, "0")
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0")
  return `${d.getUTCFullYear()}-${mm}-${dd}`
}

export function fechaHoy(): string {
  const d = new Date()
  const dd = String(d.getDate()).padStart(2, "0")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  return `${d.getFullYear()}-${mm}-${dd}`
}

export function toFechaKey(v: string | null | undefined): string | null {
  if (!v) return null
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(v)
  if (m) return m[1]
  const d = parseISO(v)
  if (!d) return null
  const a = String(d.getUTCFullYear()).padStart(4, "0")
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0")
  const dd = String(d.getUTCDate()).padStart(2, "0")
  return `${a}-${mm}-${dd}`
}

export function fmtFechaLavado(v: string | null | undefined): string {
  const k = toFechaKey(v)
  if (!k) return ""
  const [, mm, dd] = k.split("-")
  return `${dd}/${mm}/${k.slice(0, 4)}`
}

export function calcularDias(ultima: string | null): number | null {
  const fecha = parseISO(ultima)
  if (!fecha) return null
  const hoy = new Date()
  const hoyUTC = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate()))
  const base = new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate()))
  const diff = (hoyUTC.getTime() - base.getTime()) / (1000 * 60 * 60 * 24)
  const dias = Math.floor(diff)
  return dias >= 0 ? dias : 0
}

export function semaforo(dias: number | null): { sem: SemColor; texto: string } {
  if (dias === null) return { sem: "sin", texto: "Sin datos" }
  if (dias <= 15) return { sem: "verde", texto: "OK" }
  if (dias <= 20) return { sem: "amarillo", texto: "Precaución" }
  return { sem: "rojo", texto: "Crítico" }
}

export function ordenarPorCriticidad(lista: Formacion[]): Formacion[] {
  return [...lista].sort((a, b) => {
    if (a.dias === null && b.dias === null) return a.formacion - b.formacion
    if (a.dias === null) return 1
    if (b.dias === null) return -1
    if (b.dias !== a.dias) return b.dias - a.dias
    return a.formacion - b.formacion
  })
}

export function fechaAhora(): string {
  return new Date().toLocaleString("es-AR", {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}