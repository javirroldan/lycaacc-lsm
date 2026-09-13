import { useCallback, useEffect, useRef, useState } from "react"
import type { SocketMessage } from "@insforge/sdk"
import { insforge } from "../lib/insforge"
import { calcularDias, ordenarPorCriticidad, semaforo } from "../lib/dates"
import type { CamposEditables, Formacion, FormacionDB } from "../lib/types"
import { addOp, getOps, removeOp } from "../lib/offline"

const CANAL = "formaciones"
const EVENTO_CAMBIO = "formacion:changed"
const EVENTO_BORRADO = "formacion:deleted"

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
      const { error } = await insforge.database
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
    const { data, error: err } = await insforge.database
      .from("formaciones")
      .select("*")
      .order("formacion")
    if (err) {
      setError(err.message)
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

    const onCambio = (msg: SocketMessage) => {
      const nuevo = msg as unknown as FormacionDB | null
      if (!nuevo?.id) return
      setFormaciones((prev) => {
        const existe = prev.some((f) => f.id === nuevo.id)
        const act = derivar([nuevo])
        if (existe) {
          return prev.map((f) => (f.id === nuevo.id ? act[0] : f))
        }
        return ordenarPorCriticidad([...prev, act[0]])
      })
    }

    const onBorrado = (msg: SocketMessage) => {
      const viejo = msg as unknown as FormacionDB | null
      if (!viejo?.id) return
      setFormaciones((prev) => prev.filter((f) => f.id !== viejo.id))
    }

    insforge.realtime.on(EVENTO_CAMBIO, onCambio)
    insforge.realtime.on(EVENTO_BORRADO, onBorrado)
    void insforge.realtime
      .connect()
      .then(() => insforge.realtime.subscribe(CANAL))
      .catch((e) => console.error("Error al suscribirse a realtime de formaciones:", e))

    return () => {
      window.removeEventListener("online", onOnline)
      window.removeEventListener("offline", onOffline)
      insforge.realtime.off(EVENTO_CAMBIO, onCambio)
      insforge.realtime.off(EVENTO_BORRADO, onBorrado)
      insforge.realtime.unsubscribe(CANAL)
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