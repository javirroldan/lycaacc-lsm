import { useCallback, useEffect, useRef, useState } from "react"
import type { SocketMessage } from "@insforge/sdk"
import { insforge } from "../lib/insforge"
import { calcularDias } from "../lib/dates"
import { ordenarPorCriticidadLoco, semaforoLoco } from "../lib/datesLocomotoras"
import type { CamposEditablesLocomotora, Locomotora, LocomotoraDB } from "../lib/typesLocomotoras"
import {
  ordenarServicios,
  type ServicioLocomotora,
  type ServicioLocomotoraDB,
  type SituacionLocomotora,
  type TipoServicioLocomotora,
} from "../lib/typesServicios"
import { addOp, getOps, removeOp } from "../lib/offline"

const CANAL = "locomotoras"
const EVENTO_CAMBIO = "locomotora:changed"
const EVENTO_BORRADO = "locomotora:deleted"

const CANAL_SERVICIOS = "servicios_locomotoras"
const EVENTO_SERVICIO_CAMBIO = "servicio_locomotora:changed"
const EVENTO_SERVICIO_BORRADO = "servicio_locomotora:deleted"

// Deriva ultima, estado y servicio de la locomotora a partir del historial
// de lavados. La Situación y el Servicio de la card son los del registro más reciente.
function derivarLocomotora(l: Locomotora, historial: ServicioLocomotora[]): Locomotora {
  const ordenada = ordenarServicios(historial)
  const ultima = ordenada[0]?.fecha ?? l.ultima
  const estado = ordenada[0]?.situacion ?? l.estado
  const servicio = ordenada[0]?.servicio ?? l.servicio
  const dias = calcularDias(ultima)
  return { ...l, historial: ordenada, ultima, estado, servicio, dias, sem: semaforoLoco(dias) }
}

function aLocomotora(db: LocomotoraDB, historial: ServicioLocomotora[]): Locomotora {
  return derivarLocomotora({ ...db, dias: null, sem: "sin", historial }, historial)
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
    const [a, b] = await Promise.all([getOps("locomotoras"), getOps("serviciosLocomotoras")])
    setPendientes(a.length + b.length)
  }, [])

  const syncPending = useCallback(async () => {
    const ops = await getOps("serviciosLocomotoras")
    for (const op of ops) {
      if (op.tipo === "insert") {
        const { data, error: err } = await insforge.database
          .from("servicios_locomotoras")
          .upsert(op.campos)
          .select()
          .single()
        if (err) continue
        const real = data as ServicioLocomotoraDB
        setLocomotoras((prev) =>
          prev.map((l) =>
            l.id !== real.locomotora_id
              ? l
              : derivarLocomotora(
                  l,
                  l.historial.map((s) => (s.id === op.registroId ? (real as ServicioLocomotora) : s)),
                ),
          ),
        )
        await removeOp(op.id)
      } else if (op.tipo === "delete") {
        const { error: err } = await insforge.database
          .from("servicios_locomotoras")
          .delete()
          .eq("id", op.registroId)
        if (err) continue
        await removeOp(op.id)
      } else {
        const { error: err } = await insforge.database
          .from("servicios_locomotoras")
          .update(op.campos)
          .eq("id", op.registroId)
        if (err) continue
        await removeOp(op.id)
      }
    }

    const opsRow = await getOps("locomotoras")
    if (opsRow.length === 0) {
      await refreshPendientes()
      return
    }
    for (const op of opsRow) {
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
    const [{ data, error: err }, serviciosRes] = await Promise.all([
      insforge.database.from("locomotoras").select("*").order("ultima"),
      insforge.database.from("servicios_locomotoras").select("*").order("fecha"),
    ])
    if (err) {
      setError(err.message)
    } else if (data) {
      const porLocomotora = new Map<number, ServicioLocomotora[]>()
      for (const s of (serviciosRes.data as ServicioLocomotoraDB[]) ?? []) {
        const lista = porLocomotora.get(s.locomotora_id) ?? []
        lista.push(s as ServicioLocomotora)
        porLocomotora.set(s.locomotora_id, lista)
      }
      setLocomotoras(
        ordenarPorCriticidadLoco((data as LocomotoraDB[]).map((l) => aLocomotora(l, porLocomotora.get(l.id) ?? []))),
      )
    }
    setLoading(false)
  }, [])

  const aplicarCambio = useCallback(
    async (locomotoraId: number, campos: Partial<CamposEditablesLocomotora>) => {
      setLocomotoras((prev) =>
        ordenarPorCriticidadLoco(
          prev.map((l) => {
            if (l.id !== locomotoraId) return l
            const mezcla = { ...l, ...campos }
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
        if (existe) {
          return ordenarPorCriticidadLoco(
            prev.map((l) => (l.id === nuevo.id ? aLocomotora(nuevo as LocomotoraDB, l.historial) : l)),
          )
        }
        return ordenarPorCriticidadLoco([...prev, aLocomotora(nuevo as LocomotoraDB, [])])
      })
    }

    const onBorrado = (msg: SocketMessage) => {
      const viejo = msg as unknown as LocomotoraDB | null
      if (!viejo?.id) return
      setLocomotoras((prev) => prev.filter((l) => l.id !== viejo.id))
    }

    const onServicioCambio = (msg: SocketMessage) => {
      const s = msg as unknown as ServicioLocomotoraDB | null
      if (!s?.id) return
      setLocomotoras((prev) =>
        ordenarPorCriticidadLoco(
          prev.map((l) => {
            if (l.id !== s.locomotora_id) return l
            const existe = l.historial.some((x) => x.id === s.id)
            const hist = existe
              ? l.historial.map((x) => (x.id === s.id ? (s as ServicioLocomotora) : x))
              : ordenarServicios([...l.historial, s as ServicioLocomotora])
            return derivarLocomotora(l, hist)
          }),
        ),
      )
    }

    const onServicioBorrado = (msg: SocketMessage) => {
      const viejo = msg as unknown as ServicioLocomotoraDB | null
      if (!viejo?.id) return
      setLocomotoras((prev) =>
        ordenarPorCriticidadLoco(
          prev.map((l) =>
            l.id !== viejo.locomotora_id ? l : derivarLocomotora(l, l.historial.filter((x) => x.id !== viejo.id)),
          ),
        ),
      )
    }

    insforge.realtime.on(EVENTO_CAMBIO, onCambio)
    insforge.realtime.on(EVENTO_BORRADO, onBorrado)
    insforge.realtime.on(EVENTO_SERVICIO_CAMBIO, onServicioCambio)
    insforge.realtime.on(EVENTO_SERVICIO_BORRADO, onServicioBorrado)
    void insforge.realtime
      .connect()
      .then(() => Promise.all([insforge.realtime.subscribe(CANAL), insforge.realtime.subscribe(CANAL_SERVICIOS)]))
      .catch((e) => console.error("Error al suscribirse a realtime de locomotoras:", e))

    return () => {
      window.removeEventListener("online", onOnline)
      window.removeEventListener("offline", onOffline)
      insforge.realtime.off(EVENTO_CAMBIO, onCambio)
      insforge.realtime.off(EVENTO_BORRADO, onBorrado)
      insforge.realtime.off(EVENTO_SERVICIO_CAMBIO, onServicioCambio)
      insforge.realtime.off(EVENTO_SERVICIO_BORRADO, onServicioBorrado)
      insforge.realtime.unsubscribe(CANAL)
      insforge.realtime.unsubscribe(CANAL_SERVICIOS)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const mutarServicio = useCallback(
    (locomotoraId: number, nuevaHistorial: ServicioLocomotora[]) => {
      const ordenada = ordenarServicios(nuevaHistorial)
      const anterior = locomotorasRef.current.find((x) => x.id === locomotoraId)

      setLocomotoras((prev) =>
        ordenarPorCriticidadLoco(prev.map((l) => (l.id !== locomotoraId ? l : derivarLocomotora(l, ordenada)))),
      )

      if (!anterior) return
      const ultima = ordenada[0]?.fecha ?? null
      const estado = ordenada[0]?.situacion ?? anterior.estado
      const servicio = ordenada[0]?.servicio ?? anterior.servicio
      const campos: Partial<CamposEditablesLocomotora> = {}
      if (ultima !== anterior.ultima) campos.ultima = ultima
      if (estado !== anterior.estado) campos.estado = estado
      if (servicio !== anterior.servicio) campos.servicio = servicio
      if (Object.keys(campos).length > 0) void aplicarCambio(locomotoraId, campos)
    },
    [aplicarCambio],
  )

  const agregarServicio = useCallback(
    async (locomotoraId: number, fecha: string, situacion: SituacionLocomotora, servicio: TipoServicioLocomotora) => {
      const base = locomotorasRef.current.find((x) => x.id === locomotoraId)
      if (!base) return
      if (base.historial.some((s) => s.fecha === fecha)) return
      const tempId = -Date.now()
      const temp: ServicioLocomotora = {
        id: tempId,
        locomotora_id: locomotoraId,
        fecha,
        situacion,
        servicio,
        created_at: new Date().toISOString(),
      }
      mutarServicio(locomotoraId, [...base.historial, temp])
      await addOp(
        "serviciosLocomotoras",
        tempId,
        { locomotora_id: locomotoraId, fecha, situacion, servicio },
        "insert",
      )
      await refreshPendientes()
      if (navigator.onLine) syncPending()
    },
    [refreshPendientes, syncPending, mutarServicio],
  )

  const aplicarCambioServicio = useCallback(
    async (
      servicioId: number,
      locomotoraId: number,
      fecha: string,
      situacion: SituacionLocomotora,
      servicio: TipoServicioLocomotora,
    ) => {
      const base = locomotorasRef.current.find((x) => x.id === locomotoraId)
      if (!base) return
      if (base.historial.some((s) => s.id !== servicioId && s.fecha === fecha)) return
      mutarServicio(
        locomotoraId,
        base.historial.map((s) => (s.id === servicioId ? { ...s, fecha, situacion, servicio } : s)),
      )
      await addOp("serviciosLocomotoras", servicioId, { fecha, situacion, servicio })
      await refreshPendientes()
      if (navigator.onLine) syncPending()
    },
    [refreshPendientes, syncPending, mutarServicio],
  )

  const eliminarServicio = useCallback(
    async (servicioId: number, locomotoraId: number) => {
      const base = locomotorasRef.current.find((x) => x.id === locomotoraId)
      if (!base) return
      mutarServicio(
        locomotoraId,
        base.historial.filter((s) => s.id !== servicioId),
      )
      await addOp("serviciosLocomotoras", servicioId, {}, "delete")
      await refreshPendientes()
      if (navigator.onLine) syncPending()
    },
    [refreshPendientes, syncPending, mutarServicio],
  )

  return {
    locomotoras,
    loading,
    error,
    online,
    pendientes,
    aplicarCambio,
    agregarServicio,
    aplicarCambioServicio,
    eliminarServicio,
    syncPending,
    load,
    refreshPendientes,
  }
}