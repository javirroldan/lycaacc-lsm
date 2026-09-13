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