import { useCallback, useEffect, useRef, useState } from "react"
import type { SocketMessage } from "@insforge/sdk"
import { insforge } from "../lib/insforge"
import type { CamposEditablesFachadaEntorno, FachadaEntorno, FachadaEntornoDB, NuevaFachadaEntorno } from "../lib/typesFachadaEntorno"
import { ordenarPorRecienteFachada } from "../lib/typesFachadaEntorno"
import { addOp, getOps, removeOp } from "../lib/offline"

const TABLA = "fachada_entorno"
const CANAL = "fachada_entorno"
const EVENTO_CAMBIO = "fachada_entorno:changed"
const EVENTO_BORRADO = "fachada_entorno:deleted"

export function useFachadaEntorno() {
  const [registros, setRegistros] = useState<FachadaEntorno[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendientes, setPendientes] = useState(0)
  const [online, setOnline] = useState(navigator.onLine)
  const ref = useRef<FachadaEntorno[]>([])
  ref.current = registros

  const refreshPendientes = useCallback(async () => {
    const ops = await getOps(TABLA)
    setPendientes(ops.length)
  }, [])

  const syncPending = useCallback(async () => {
    const ops = await getOps(TABLA)
    if (ops.length === 0) return
    for (const op of ops) {
      if (op.tipo === "insert") {
        const { data, error: err } = await insforge.database.from(TABLA).insert([op.campos]).select().single()
        if (err) continue
        const real = data as FachadaEntornoDB
        setRegistros((prev) =>
          ordenarPorRecienteFachada([real as FachadaEntorno, ...prev.filter((z) => z.id !== op.registroId && z.id !== real.id)]),
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
    else if (data) setRegistros(ordenarPorRecienteFachada(data as FachadaEntornoDB[]))
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
      const nuevo = msg as unknown as FachadaEntornoDB | null
      if (!nuevo?.id) return
      setRegistros((prev) => {
        const existe = prev.some((z) => z.id === nuevo.id)
        if (existe) return prev.map((z) => (z.id === nuevo.id ? (nuevo as FachadaEntorno) : z))
        return ordenarPorRecienteFachada([nuevo as FachadaEntorno, ...prev.filter((z) => z.id !== nuevo.id)])
      })
    }
    const onBorrado = (msg: SocketMessage) => {
      const viejo = msg as unknown as FachadaEntornoDB | null
      if (!viejo?.id) return
      setRegistros((prev) => prev.filter((z) => z.id !== viejo.id))
    }

    insforge.realtime.on(EVENTO_CAMBIO, onCambio)
    insforge.realtime.on(EVENTO_BORRADO, onBorrado)
    void insforge.realtime
      .connect()
      .then(() => insforge.realtime.subscribe(CANAL))
      .catch((e) => console.error("Error realtime fachada_entorno:", e))

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
    async (id: number, campos: Partial<CamposEditablesFachadaEntorno>) => {
      setRegistros((prev) => prev.map((z) => (z.id === id ? ({ ...z, ...campos } as FachadaEntorno) : z)))
      await addOp(TABLA, id, campos, "update")
      await refreshPendientes()
      if (navigator.onLine) syncPending()
    },
    [refreshPendientes, syncPending],
  )

  const agregar = useCallback(
    async (campos: NuevaFachadaEntorno) => {
      const tempId = -Date.now()
      const temp: FachadaEntorno = { ...campos, id: tempId, created_at: new Date().toISOString() }
      setRegistros((prev) => ordenarPorRecienteFachada([temp, ...prev]))
      await addOp(TABLA, tempId, campos, "insert")
      await refreshPendientes()
      if (navigator.onLine) syncPending()
    },
    [refreshPendientes, syncPending],
  )

  const eliminar = useCallback(
    async (id: number) => {
      setRegistros((prev) => prev.filter((z) => z.id !== id))
      await addOp(TABLA, id, {}, "delete")
      await refreshPendientes()
      if (navigator.onLine) syncPending()
    },
    [refreshPendientes, syncPending],
  )

  return { registros, loading, error, online, pendientes, aplicarCambio, agregar, eliminar, syncPending, load, refreshPendientes }
}

export type UseFachadaEntornoResult = ReturnType<typeof useFachadaEntorno>
