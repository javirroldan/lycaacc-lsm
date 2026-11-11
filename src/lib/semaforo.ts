import type { SemColor } from "./types"
import { getSemaforosConfig, type UmbralesSemaforo } from "./semaforoConfig"

const COLOR_SEM: Record<Exclude<SemColor, "sin">, string> = {
  verde: "text-green-600",
  amarillo: "text-amber-600",
  rojo: "text-red-600",
}

export function semColor(dias: number | null, umbrales: UmbralesSemaforo): SemColor {
  if (dias === null) return "sin"
  if (dias <= umbrales.verde) return "verde"
  if (dias <= umbrales.amarillo) return "amarillo"
  return "rojo"
}

export function leyendaSemaforo(umbrales: UmbralesSemaforo): { color: string; texto: string }[] {
  return [
    { color: "bg-green-500", texto: `Verde: 0-${umbrales.verde} días` },
    { color: "bg-amber-400", texto: `Amarillo: ${umbrales.verde + 1}-${umbrales.amarillo} días` },
    { color: "bg-red-500", texto: `Rojo: ${umbrales.amarillo + 1}+ días` },
  ]
}

export function colorDias(dias: number | null, umbrales?: UmbralesSemaforo): string {
  if (dias === null) return ""
  const u = umbrales ?? getSemaforosConfig().formaciones
  const c = semColor(dias, u)
  if (c === "sin") return ""
  return COLOR_SEM[c]
}

// Compatibilidad: leyenda por defecto (formaciones) para usos que no pasen umbrales
export function leyendaSemaforoFormaciones() {
  return leyendaSemaforo(getSemaforosConfig().formaciones)
}

export function leyendaSemaforoLocomotoras() {
  return leyendaSemaforo(getSemaforosConfig().locomotoras)
}
