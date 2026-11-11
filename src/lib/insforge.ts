import { createClient } from "@insforge/sdk"

const url = import.meta.env.VITE_INSFORGE_URL ?? ""
const anonKey = import.meta.env.VITE_INSFORGE_ANON_KEY ?? ""

export const insforgeConfigurado = url.startsWith("http") && anonKey.length > 20

export const insforge = insforgeConfigurado
  ? createClient({ baseUrl: url, anonKey })
  : createClient({ baseUrl: "http://127.0.0.1", anonKey: "sin-configuracion" })

export type Rol = "admin" | "editor" | "gerencia" | "editor_formaciones" | "editor_locomotoras" | null

export const DOMINIO_ADMIN = "trenes.local"

export function usuarioAEmail(usuario: string): string {
  return usuario.includes("@") ? usuario : `${usuario}@${DOMINIO_ADMIN}`
}

export async function fetchRol(userId: string): Promise<Rol> {
  if (!insforgeConfigurado) return null
  try {
    const { data } = await insforge.database
      .from("roles")
      .select("rol")
      .eq("user_id", userId)
      .maybeSingle()
    return ((data?.rol as Rol | undefined) ?? null) as Rol
  } catch (e) {
    console.error("Error al consultar rol desde InsForge:", e)
    return null
  }
}

// ---------- Login por código de acceso (6 dígitos) ----------
export type TipoAcceso = "admin" | "empleado" | "gerencia" | "formaciones" | "locomotoras" | null

/** Valida el código contra la nube: devuelve el tipo de cuenta o null. */
export async function validarCodigo(codigo: string): Promise<TipoAcceso> {
  if (!insforgeConfigurado) return null
  try {
    for (const tipo of ["admin", "gerencia", "empleado", "formaciones", "locomotoras"] as const) {
      const { data } = await insforge.database.rpc("validar_codigo_acceso", {
        p_codigo: codigo,
        p_tipo: tipo,
      })
      if (data === true) return tipo
    }
  } catch (e) {
    console.error("Error al validar código de acceso:", e)
  }
  return null
}

/** Email de la cuenta oculta correspondiente (definida en .env.local). */
export function emailDeCuenta(tipo: TipoAcceso): string {
  if (tipo === "empleado") {
    return import.meta.env.VITE_EMPLEADO_EMAIL ?? "empleado@trenes.local"
  }
  if (tipo === "gerencia") {
    return import.meta.env.VITE_GERENCIA_EMAIL ?? "gerencia@trenes.local"
  }
  if (tipo === "formaciones") {
    return import.meta.env.VITE_FORMACIONES_EMAIL ?? "formaciones@trenes.local"
  }
  if (tipo === "locomotoras") {
    return import.meta.env.VITE_LOCOMOTORAS_EMAIL ?? "locomotoras@trenes.local"
  }
  return import.meta.env.VITE_ADMIN_EMAIL ?? "admin@trenes.local"
}

/** Contraseña de la cuenta oculta (solo se usa tras validar el código). */
export function passwordDeCuenta(tipo: TipoAcceso): string {
  if (tipo === "empleado") {
    return import.meta.env.VITE_EMPLEADO_PASSWORD ?? ""
  }
  if (tipo === "gerencia") {
    return import.meta.env.VITE_GERENCIA_PASSWORD ?? ""
  }
  if (tipo === "formaciones") {
    return import.meta.env.VITE_FORMACIONES_PASSWORD ?? ""
  }
  if (tipo === "locomotoras") {
    return import.meta.env.VITE_LOCOMOTORAS_PASSWORD ?? ""
  }
  return import.meta.env.VITE_ADMIN_PASSWORD ?? ""
}