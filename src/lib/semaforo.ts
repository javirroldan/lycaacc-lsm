import type { SemColor } from "./types"

export const UMBRAL_VERDE = 15
export const UMBRAL_AMARILLO = 28

const COLOR_SEM: Record<Exclude<SemColor, "sin">, string> = {
  verde: "text-green-600",
  amarillo: "text-amber-600",
  rojo: "text-red-600",
}

export const LEYENDA_SEMAFORO: { color: string; texto: string }[] = [
  { color: "bg-green-500", texto: `Verde: 0-${UMBRAL_VERDE} días` },
  { color: "bg-amber-400", texto: `Amarillo: ${UMBRAL_VERDE + 1}-${UMBRAL_AMARILLO} días` },
  { color: "bg-red-500", texto: `Rojo: ${UMBRAL_AMARILLO + 1}+ días` },
]

export function colorDias(dias: number | null): string {
  if (dias === null) return ""
  if (dias <= UMBRAL_VERDE) return COLOR_SEM.verde
  if (dias <= UMBRAL_AMARILLO) return COLOR_SEM.amarillo
  return COLOR_SEM.rojo
}
