import { useCallback, useEffect, useRef, useState } from "react"
import type { SocketMessage } from "@insforge/sdk"
import { insforge } from "../lib/insforge"
import type { Basural, BasuralDB, CamposEditablesBasural, NuevoBasural } from "../lib/typesBasurales"
import { ordenarPorRecienteBasural } from "../lib/typesBasurales"
import { addOp, getOps, removeOp } from "../lib/offline"

const TABLA = "basurales"
const CANAL = "basurales"
const EVENTO_CAMBIO = "basural:changed"
const EVENTO_BORRADO = "basural:deleted"

export function useBasurales() {
  const [basurales, setBasurales] = useState<Basural[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendientes, setPendientes] = useState(0)
  const [online, setOnline] = useState(navigator.onLine)
  const ref = useRef<Basural[]>([])
  ref.current = basurales

  const refreshPendientes = useCallback(async () => {
    const ops = await getOps(TABLA)
    setPendientes(ops.length)
  }, [])

  const syncPending = useCallback(async () => {
    const ops = await getOps(TABLA)
    if (ops.length === 0) return
    for (const op of ops) {
      if (op.tipo === "insert") {
        const { data, error: err } = await insforge.database
          .from(TABLA)
          .insert([op.campos])
          .select()
          .single()
        if (err) continue
        const real = data as BasuralDB
        setBasurales((prev) =>
          ordenarPorRecienteBasural([real as Basural, ...prev.filter((b) => b.id !== op.registroId && b.id !== real.id)]),
        )
        await removeOp(op.id)
      } else if (op.tipo === "delete") {
        const { error: err } = await insforge.database.from(TABLA).delete().eq("id", op.registroId)
        if (err) continue
        await removeOp(op.id)
      } else {
        const { error: err } = await insforge.database.from(TABLA).update(op.campos).eq("id", op.registroId)
        if (err) continue
        await removeOp(op.id)
      }
    }
    await refreshPendientes()
  }, [refreshPendientes])

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error: err } = await insforge.database.from(TABLA).select("*").order("created_at", { ascending: false })
    if (err) setError(err.message)
    else if (data) setBasurales(ordenarPorRecienteBasural(data as BasuralDB[]))
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
      const nuevo = msg as unknown as BasuralDB | null
      if (!nuevo?.id) return
      setBasurales((prev) => {
        const existe = prev.some((b) => b.id === nuevo.id)
        if (existe) return prev.map((b) => (b.id === nuevo.id ? (nuevo as Basural) : b))
        return ordenarPorRecienteBasural([nuevo as Basural, ...prev.filter((b) => b.id !== nuevo.id)])
      })
    }
    const onBorrado = (msg: SocketMessage) => {
      const viejo = msg as unknown as BasuralDB | null
      if (!viejo?.id) return
      setBasurales((prev) => prev.filter((b) => b.id !== viejo.id))
    }

    insforge.realtime.on(EVENTO_CAMBIO, onCambio)
    insforge.realtime.on(EVENTO_BORRADO, onBorrado)
    void insforge.realtime
      .connect()
      .then(() => insforge.realtime.subscribe(CANAL))
      .catch((e) => console.error("Error realtime basurales:", e))

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
    async (id: number, campos: Partial<CamposEditablesBasural>) => {
      setBasurales((prev) => prev.map((b) => (b.id === id ? ({ ...b, ...campos } as Basural) : b)))
      await addOp(TABLA, id, campos, "update")
      await refreshPendientes()
      if (navigator.onLine) syncPending()
    },
    [refreshPendientes, syncPending],
  )

  const agregarBasural = useCallback(
    async (campos: NuevoBasural) => {
      const tempId = -Date.now()
      const temp: Basural = { ...campos, id: tempId, created_at: new Date().toISOString() }
      setBasurales((prev) => ordenarPorRecienteBasural([temp, ...prev]))
      await addOp(TABLA, tempId, campos, "insert")
      await refreshPendientes()
      if (navigator.onLine) syncPending()
    },
    [refreshPendientes, syncPending],
  )

  const eliminarBasural = useCallback(
    async (id: number) => {
      setBasurales((prev) => prev.filter((b) => b.id !== id))
      await addOp(TABLA, id, {}, "delete")
      await refreshPendientes()
      if (navigator.onLine) syncPending()
    },
    [refreshPendientes, syncPending],
  )

  return { basurales, loading, error, online, pendientes, aplicarCambio, agregarBasural, eliminarBasural, syncPending, load, refreshPendientes }
}

export type UseBasuralesResult = ReturnType<typeof useBasurales>
