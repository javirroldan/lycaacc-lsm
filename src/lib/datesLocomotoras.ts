import { UMBRAL_AMARILLO, UMBRAL_VERDE } from "./semaforo"
import type { Locomotora, SemColorLocomotora } from "./typesLocomotoras"

export function semaforoLoco(dias: number | null): SemColorLocomotora {
  if (dias === null) return "sin"
  if (dias <= UMBRAL_VERDE) return "verde"
  if (dias <= UMBRAL_AMARILLO) return "amarillo"
  return "rojo"
}

export function ordenarPorCriticidadLoco(lista: Locomotora[]): Locomotora[] {
  return [...lista].sort((a, b) => {
    if (a.dias === null && b.dias === null) return a.locomotora.localeCompare(b.locomotora)
    if (a.dias === null) return 1
    if (b.dias === null) return -1
    if (b.dias !== a.dias) return b.dias - a.dias
    return a.locomotora.localeCompare(b.locomotora)
  })
}