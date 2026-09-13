import { createClient } from "@supabase/supabase-js"

const url = import.meta.env.VITE_SUPABASE_URL ?? ""
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ""

export const supabaseConfigurado = url.startsWith("http") && anonKey.length > 20

export const supabase = supabaseConfigurado
  ? createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true } })
  : createClient("http://127.0.0.1", "sin-configuracion", {
      auth: { persistSession: true, autoRefreshToken: true },
    })

export type Rol = "admin" | "editor" | null

export const DOMINIO_ADMIN = "trenes.local"

export function usuarioAEmail(usuario: string): string {
  return usuario.includes("@") ? usuario : `${usuario}@${DOMINIO_ADMIN}`
}

export async function fetchRol(userId: string): Promise<Rol> {
  const { data } = await supabase
    .from("roles")
    .select("rol")
    .eq("user_id", userId)
    .maybeSingle()
  return ((data?.rol as Rol | undefined) ?? null) as Rol
}