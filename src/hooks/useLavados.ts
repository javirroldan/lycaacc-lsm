import { useCallback, useEffect, useRef, useState } from "react"
import type { SocketMessage } from "@insforge/sdk"
import { insforge } from "../lib/insforge"
import type {
  CamposEditablesLavado,
  Lavado,
  LavadoDB,
  NuevoLavado,
} from "../lib/typesLavado"
import { OK_DEFAULT, PASADAS_DEFAULT } from "../lib/typesLavado"
import { addOp, getOps, removeOp } from "../lib/offline"

const CANAL = "lavados"
const EVENTO_CAMBIO = "lavado:changed"
const EVENTO_BORRADO = "lavado:deleted"

function ordenarPorReciente(lista: Lavado[]): Lavado[] {
  return [...lista].sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0))
}

export function useLavados() {
  const [lavados, setLavados] = useState<Lavado[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendientes, setPendientes] = useState(0)
  const [online, setOnline] = useState(navigator.onLine)
  const lavadosRef = useRef<Lavado[]>([])

  lavadosRef.current = lavados

  const refreshPendientes = useCallback(async () => {
    const ops = await getOps("lavados")
    setPendientes(ops.length)
  }, [])

  const syncPending = useCallback(async () => {
    const ops = await getOps("lavados")
    if (ops.length === 0) return
    for (const op of ops) {
      if (op.tipo === "insert") {
        const { data, error: err } = await insforge.database
          .from("lavados")
          .insert([op.campos])
          .select()
          .single()
        if (err) continue
        const real = data as LavadoDB
        setLavados((prev) =>
          ordenarPorReciente([
            real as Lavado,
            ...prev.filter((l) => l.id !== op.registroId && l.id !== (real as Lavado).id),
          ]),
        )
        await removeOp(op.id)
      } else if (op.tipo === "delete") {
        const { error: err } = await insforge.database
          .from("lavados")
          .delete()
          .eq("id", op.registroId)
        if (err) continue
        await removeOp(op.id)
      } else {
        const { error: err } = await insforge.database
          .from("lavados")
          .update(op.campos)
          .eq("id", op.registroId)
        if (err) continue
        await removeOp(op.id)
      }
    }
    await refreshPendientes()
  }, [refreshPendientes])

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error: err } = await insforge.database
      .from("lavados")
      .select("*")
      .order("created_at", { ascending: false })
    if (err) {
      setError(err.message)
    } else if (data) {
      setLavados(ordenarPorReciente(data as LavadoDB[]))
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
      const nuevo = msg as unknown as LavadoDB | null
      if (!nuevo?.id) return
      setLavados((prev) => {
        const existe = prev.some((l) => l.id === nuevo.id)
        if (existe) {
          return prev.map((l) => (l.id === nuevo.id ? (nuevo as Lavado) : l))
        }
        return ordenarPorReciente([nuevo as Lavado, ...prev.filter((l) => l.id !== nuevo.id)])
      })
    }

    const onBorrado = (msg: SocketMessage) => {
      const viejo = msg as unknown as LavadoDB | null
      if (!viejo?.id) return
      setLavados((prev) => prev.filter((l) => l.id !== viejo.id))
    }

    insforge.realtime.on(EVENTO_CAMBIO, onCambio)
    insforge.realtime.on(EVENTO_BORRADO, onBorrado)
    void insforge.realtime
      .connect()
      .then(() => insforge.realtime.subscribe(CANAL))
      .catch((e) => console.error("Error al suscribirse a realtime de lavados:", e))

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
    async (id: number, campos: Partial<CamposEditablesLavado>) => {
      setLavados((prev) =>
        prev.map((l) => (l.id === id ? ({ ...l, ...campos } as Lavado) : l)),
      )
      await addOp("lavados", id, campos, "update")
      await refreshPendientes()
      if (navigator.onLine) syncPending()
    },
    [refreshPendientes, syncPending],
  )

  const agregarLavado = useCallback(
    async (campos: NuevoLavado) => {
      const full: CamposEditablesLavado = {
        formacion: campos.formacion,
        ingreso: campos.ingreso,
        egreso: campos.egreso,
        pasadas: PASADAS_DEFAULT,
        ok: OK_DEFAULT,
      }
      const tempId = -Date.now()
      const temp: Lavado = { ...full, id: tempId, created_at: new Date().toISOString() }
      setLavados((prev) => ordenarPorReciente([temp, ...prev]))
      await addOp("lavados", tempId, full, "insert")
      await refreshPendientes()
      if (navigator.onLine) syncPending()
    },
    [refreshPendientes, syncPending],
  )

  const eliminarLavado = useCallback(
    async (id: number) => {
      setLavados((prev) => prev.filter((l) => l.id !== id))
      await addOp("lavados", id, {}, "delete")
      await refreshPendientes()
      if (navigator.onLine) syncPending()
    },
    [refreshPendientes, syncPending],
  )

  return {
    lavados,
    loading,
    error,
    online,
    pendientes,
    aplicarCambio,
    agregarLavado,
    eliminarLavado,
    syncPending,
    load,
    refreshPendientes,
  }
}

export type UseLavadosResult = ReturnType<typeof useLavados>