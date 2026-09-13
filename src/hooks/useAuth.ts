import { useCallback, useEffect, useState } from "react"
import { insforge, fetchRol, usuarioAEmail, type Rol } from "../lib/insforge"
import type { UserSchema } from "@insforge/sdk"

export function useAuth() {
  const [usuario, setUsuario] = useState<UserSchema | null>(null)
  const [rol, setRol] = useState<Rol>(null)
  const [loading, setLoading] = useState(true)

  const cargarRol = useCallback((userId: string) => {
    fetchRol(userId).then(setRol)
  }, [])

  useEffect(() => {
    insforge.auth.getCurrentUser().then(({ data }) => {
      const user = data?.user ?? null
      setUsuario(user)
      if (user?.id) cargarRol(user.id)
      setLoading(false)
    })

    const off = insforge.auth.onAuthStateChange(() => {
      insforge.auth.getCurrentUser().then(({ data }) => {
        const user = data?.user ?? null
        setUsuario(user)
        setRol(null)
        if (user?.id) cargarRol(user.id)
      })
    })
    return off
  }, [cargarRol])

  const signIn = useCallback(async (usuario: string, password: string) => {
    const { data, error } = await insforge.auth.signInWithPassword({
      method: "password",
      email: usuarioAEmail(usuario),
      password,
    })
    if (data?.user) {
      setUsuario(data.user)
      cargarRol(data.user.id)
    }
    return error?.message ?? null
  }, [cargarRol])

  const signOut = useCallback(async () => {
    await insforge.auth.signOut()
  }, [])

  return { usuario, rol, loading, signIn, signOut }
}

export type UseAuth = ReturnType<typeof useAuth>