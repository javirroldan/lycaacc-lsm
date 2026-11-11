import { insforge, insforgeConfigurado } from "./insforge"

export interface UmbralesSemaforo {
  verde: number
  amarillo: number
}

export interface SemaforosConfig {
  formaciones: UmbralesSemaforo
  locomotoras: UmbralesSemaforo
}

export const SEMAFOROS_DEFAULT: SemaforosConfig = {
  formaciones: { verde: 15, amarillo: 28 },
  locomotoras: { verde: 15, amarillo: 28 },
}

let configActual: SemaforosConfig = structuredClone(SEMAFOROS_DEFAULT)

function toInt(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : Number.parseInt(String(v ?? ""), 10)
  return Number.isFinite(n) ? n : fallback
}

export function parseSemaforos(raw: Record<string, unknown> | null | undefined): SemaforosConfig {
  const r = raw ?? {}
  const fv = toInt(r.semaforo_formaciones_verde, SEMAFOROS_DEFAULT.formaciones.verde)
  const fa = toInt(r.semaforo_formaciones_amarillo, SEMAFOROS_DEFAULT.formaciones.amarillo)
  const lv = toInt(r.semaforo_locomotoras_verde, SEMAFOROS_DEFAULT.locomotoras.verde)
  const la = toInt(r.semaforo_locomotoras_amarillo, SEMAFOROS_DEFAULT.locomotoras.amarillo)
  return {
    formaciones: { verde: fv, amarillo: Math.max(fa, fv + 1) },
    locomotoras: { verde: lv, amarillo: Math.max(la, lv + 1) },
  }
}

export function getSemaforosConfig(): SemaforosConfig {
  return configActual
}

export function setSemaforosConfig(cfg: SemaforosConfig): void {
  configActual = cfg
}

export async function cargarSemaforosConfig(): Promise<SemaforosConfig> {
  if (!insforgeConfigurado) {
    configActual = structuredClone(SEMAFOROS_DEFAULT)
    return configActual
  }
  try {
    const { data, error } = await insforge.database.rpc("obtener_semaforos")
    if (error || !data || typeof data !== "object") {
      configActual = structuredClone(SEMAFOROS_DEFAULT)
      return configActual
    }
    configActual = parseSemaforos(data as Record<string, unknown>)
    return configActual
  } catch {
    configActual = structuredClone(SEMAFOROS_DEFAULT)
    return configActual
  }
}

export async function guardarSemaforosConfig(cfg: SemaforosConfig): Promise<{ ok: boolean; error?: string; config?: SemaforosConfig }> {
  if (!insforgeConfigurado) return { ok: false, error: "Backend no configurado" }
  try {
    const { data, error } = await insforge.database.rpc("guardar_semaforos", {
      p_formaciones_verde: cfg.formaciones.verde,
      p_formaciones_amarillo: cfg.formaciones.amarillo,
      p_locomotoras_verde: cfg.locomotoras.verde,
      p_locomotoras_amarillo: cfg.locomotoras.amarillo,
    })
    if (error) return { ok: false, error: error.message }
    if (data && typeof data === "object") {
      configActual = parseSemaforos(data as Record<string, unknown>)
    } else {
      configActual = cfg
    }
    return { ok: true, config: configActual }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al guardar semáforos" }
  }
}
