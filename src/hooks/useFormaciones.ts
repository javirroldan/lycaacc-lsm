import { useCallback, useEffect, useRef, useState } from "react"
import { supabase } from "../lib/supabase"
import { calcularDias, ordenarPorCriticidad, semaforo } from "../lib/dates"
import type { CamposEditables, Formacion, FormacionDB } from "../lib/types"
import { addOp, getOps, removeOp } from "../lib/offline"

function derivar(db: FormacionDB[]): Formacion[] {
  return ordenarPorCriticidad(
    db.map((f) => {
      const dias = calcularDias(f.ultima)
      return { ...f, dias, sem: semaforo(dias).sem }
    }),
  )
}

export function useFormaciones() {
  const [formaciones, setFormaciones] = useState<Formacion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendientes, setPendientes] = useState(0)
  const [online, setOnline] = useState(navigator.onLine)
  const formacionesRef = useRef<Formacion[]>([])

  formacionesRef.current = formaciones

  const refreshPendientes = useCallback(async () => {
    const ops = await getOps("formaciones")
    setPendientes(ops.length)
  }, [])

  const syncPending = useCallback(async () => {
    const ops = await getOps("formaciones")
    if (ops.length === 0) return
    for (const op of ops) {
      const { error } = await supabase
        .from("formaciones")
        .update(op.campos)
        .eq("id", op.registroId)
      if (error) continue
      await removeOp(op.id)
    }
    await refreshPendientes()
  }, [refreshPendientes])

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("formaciones")
      .select("*")
      .order("formacion")
    if (error) {
      setError(error.message)
    } else if (data) {
      setFormaciones(derivar(data as FormacionDB[]))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    refreshPendientes()

    const onOnline = () => {
      setOnline(true)
      syncPending()
    }
    const onOffline = () => setOnline(false)
    window.addEventListener("online", onOnline)
    window.addEventListener("offline", onOffline)

    const channel = supabase
      .channel("realtime-formaciones")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "formaciones" },
        (payload) => {
          const nuevo = payload.new as FormacionDB | null
          const viejo = payload.old as FormacionDB | null
          setFormaciones((prev) => {
            if (payload.eventType === "DELETE" || !nuevo) {
              if (!viejo) return prev
              return prev.filter((f) => f.id !== viejo.id)
            }
            const existe = prev.some((f) => f.id === nuevo.id)
            const act = derivar([nuevo])
            if (existe) {
              return prev.map((f) => (f.id === nuevo.id ? act[0] : f))
            }
            return ordenarPorCriticidad([...prev, act[0]])
          })
        },
      )
      .subscribe()

    return () => {
      window.removeEventListener("online", onOnline)
      window.removeEventListener("offline", onOffline)
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const aplicarCambio = useCallback(
    async (formacionId: number, campos: Partial<CamposEditables>) => {
      setFormaciones((prev) =>
        ordenarPorCriticidad(
          prev.map((f) => {
            if (f.id !== formacionId) return f
            const mezcla = { ...f, ...campos } as FormacionDB
            const dias = calcularDias(mezcla.ultima)
            return { ...mezcla, dias, sem: semaforo(dias).sem }
          }),
        ),
      )
      await addOp("formaciones", formacionId, campos)
      await refreshPendientes()
      if (navigator.onLine) syncPending()
    },
    [refreshPendientes, syncPending],
  )

  return {
    formaciones,
    loading,
    error,
    online,
    pendientes,
    aplicarCambio,
    syncPending,
    load,
    refreshPendientes,
  }
}