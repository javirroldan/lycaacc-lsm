import { useCallback, useEffect, useRef, useState } from "react"
import type { SocketMessage } from "@insforge/sdk"
import { insforge } from "../lib/insforge"
import { calcularDias } from "../lib/dates"
import { ordenarPorCriticidadLoco, semaforoLoco } from "../lib/datesLocomotoras"
import type { CamposEditablesLocomotora, Locomotora, LocomotoraDB } from "../lib/typesLocomotoras"
import { addOp, getOps, removeOp } from "../lib/offline"

const CANAL = "locomotoras"
const EVENTO_CAMBIO = "locomotora:changed"
const EVENTO_BORRADO = "locomotora:deleted"

function derivar(db: LocomotoraDB[]): Locomotora[] {
  return ordenarPorCriticidadLoco(
    db.map((l) => {
      const dias = calcularDias(l.ultima)
      return { ...l, dias, sem: semaforoLoco(dias) }
    }),
  )
}

export function useLocomotoras() {
  const [locomotoras, setLocomotoras] = useState<Locomotora[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendientes, setPendientes] = useState(0)
  const [online, setOnline] = useState(navigator.onLine)
  const locomotorasRef = useRef<Locomotora[]>([])

  locomotorasRef.current = locomotoras

  const refreshPendientes = useCallback(async () => {
    const ops = await getOps("locomotoras")
    setPendientes(ops.length)
  }, [])

  const syncPending = useCallback(async () => {
    const ops = await getOps("locomotoras")
    if (ops.length === 0) return
    for (const op of ops) {
      const { error } = await insforge.database
        .from("locomotoras")
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
      .from("locomotoras")
      .select("*")
      .order("ultima")
    if (err) {
      setError(err.message)
    } else if (data) {
      setLocomotoras(derivar(data as LocomotoraDB[]))
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
      const nuevo = msg as unknown as LocomotoraDB | null
      if (!nuevo?.id) return
      setLocomotoras((prev) => {
        const existe = prev.some((l) => l.id === nuevo.id)
        const act = derivar([nuevo])
        if (existe) {
          return prev.map((l) => (l.id === nuevo.id ? act[0] : l))
        }
        return ordenarPorCriticidadLoco([...prev, act[0]])
      })
    }

    const onBorrado = (msg: SocketMessage) => {
      const viejo = msg as unknown as LocomotoraDB | null
      if (!viejo?.id) return
      setLocomotoras((prev) => prev.filter((l) => l.id !== viejo.id))
    }

    insforge.realtime.on(EVENTO_CAMBIO, onCambio)
    insforge.realtime.on(EVENTO_BORRADO, onBorrado)
    void insforge.realtime
      .connect()
      .then(() => insforge.realtime.subscribe(CANAL))
      .catch((e) => console.error("Error al suscribirse a realtime de locomotoras:", e))

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
    async (locomotoraId: number, campos: Partial<CamposEditablesLocomotora>) => {
      setLocomotoras((prev) =>
        ordenarPorCriticidadLoco(
          prev.map((l) => {
            if (l.id !== locomotoraId) return l
            const mezcla = { ...l, ...campos } as LocomotoraDB
            const dias = calcularDias(mezcla.ultima)
            return { ...mezcla, dias, sem: semaforoLoco(dias) }
          }),
        ),
      )
      await addOp("locomotoras", locomotoraId, campos)
      await refreshPendientes()
      if (navigator.onLine) syncPending()
    },
    [refreshPendientes, syncPending],
  )

  return {
    locomotoras,
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