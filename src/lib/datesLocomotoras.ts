import { getSemaforosConfig, type UmbralesSemaforo } from "./semaforoConfig"
import { semColor } from "./semaforo"
import type { Locomotora, SemColorLocomotora } from "./typesLocomotoras"

export function semaforoLoco(
  dias: number | null,
  umbrales: UmbralesSemaforo = getSemaforosConfig().locomotoras,
): SemColorLocomotora {
  return semColor(dias, umbrales) as SemColorLocomotora
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