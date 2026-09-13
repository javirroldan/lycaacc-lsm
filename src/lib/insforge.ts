import { createClient } from "@insforge/sdk"

const url = import.meta.env.VITE_INSFORGE_URL ?? ""
const anonKey = import.meta.env.VITE_INSFORGE_ANON_KEY ?? ""

export const insforgeConfigurado = url.startsWith("http") && anonKey.length > 20

export const insforge = insforgeConfigurado
  ? createClient({ baseUrl: url, anonKey })
  : createClient({ baseUrl: "http://127.0.0.1", anonKey: "sin-configuracion" })

export type Rol = "admin" | "editor" | null

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
export type TipoAcceso = "admin" | "empleado" | null

/** Valida el código contra la nube: devuelve el tipo de cuenta o null. */
export async function validarCodigo(codigo: string): Promise<TipoAcceso> {
  if (!insforgeConfigurado) return null
  try {
    for (const tipo of ["admin", "empleado"] as const) {
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
  return tipo === "empleado"
    ? import.meta.env.VITE_EMPLEADO_EMAIL ?? "empleado@trenes.local"
    : import.meta.env.VITE_ADMIN_EMAIL ?? "admin@trenes.local"
}

/** Contraseña de la cuenta oculta (solo se usa tras validar el código). */
export function passwordDeCuenta(tipo: TipoAcceso): string {
  return tipo === "empleado"
    ? import.meta.env.VITE_EMPLEADO_PASSWORD ?? ""
    : import.meta.env.VITE_ADMIN_PASSWORD ?? ""
}