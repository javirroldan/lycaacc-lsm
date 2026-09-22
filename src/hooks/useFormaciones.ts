import { useCallback, useEffect, useRef, useState } from "react"
import type { SocketMessage } from "@insforge/sdk"
import { insforge } from "../lib/insforge"
import { calcularDias, ordenarPorCriticidad, semaforo } from "../lib/dates"
import type { CamposEditables, Formacion, FormacionDB } from "../lib/types"
import {
  ordenarServicios,
  type ServicioFormacion,
  type ServicioFormacionDB,
  type SituacionFormacion,
} from "../lib/typesServicios"
import { addOp, getOps, removeOp } from "../lib/offline"

const CANAL = "formaciones"
const EVENTO_CAMBIO = "formacion:changed"
const EVENTO_BORRADO = "formacion:deleted"

const CANAL_SERVICIOS = "servicios_formaciones"
const EVENTO_SERVICIO_CAMBIO = "servicio_formacion:changed"
const EVENTO_SERVICIO_BORRADO = "servicio_formacion:deleted"

// Deriva ultima/anteultima/estado de la formación a partir del historial
// de lavados. La Situación de la card es la del registro más reciente.
function derivarFormacion(f: Formacion, historial: ServicioFormacion[]): Formacion {
  const ordenada = ordenarServicios(historial)
  const ultima = ordenada[0]?.fecha ?? f.ultima
  const anteultima = ordenada[1]?.fecha ?? f.anteultima
  const estado = ordenada[0]?.situacion ?? f.estado
  const dias = calcularDias(ultima)
  return { ...f, historial: ordenada, ultima, anteultima, estado, dias, sem: semaforo(dias).sem }
}

function aFormacion(db: FormacionDB, historial: ServicioFormacion[]): Formacion {
  return derivarFormacion({ ...db, dias: null, sem: "sin", historial }, historial)
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
    const [a, b] = await Promise.all([getOps("formaciones"), getOps("serviciosFormaciones")])
    setPendientes(a.length + b.length)
  }, [])

  const syncPending = useCallback(async () => {
    const ops = await getOps("serviciosFormaciones")
    for (const op of ops) {
      if (op.tipo === "insert") {
        const { data, error: err } = await insforge.database
          .from("servicios_formaciones")
          .upsert(op.campos)
          .select()
          .single()
        if (err) continue
        const real = data as ServicioFormacionDB
        setFormaciones((prev) =>
          prev.map((f) =>
            f.id !== real.formacion_id
              ? f
              : derivarFormacion(
                  f,
                  f.historial.map((s) => (s.id === op.registroId ? (real as ServicioFormacion) : s)),
                ),
          ),
        )
        await removeOp(op.id)
      } else if (op.tipo === "delete") {
        const { error: err } = await insforge.database
          .from("servicios_formaciones")
          .delete()
          .eq("id", op.registroId)
        if (err) continue
        await removeOp(op.id)
      } else {
        const { error: err } = await insforge.database
          .from("servicios_formaciones")
          .update(op.campos)
          .eq("id", op.registroId)
        if (err) continue
        await removeOp(op.id)
      }
    }

    const opsRow = await getOps("formaciones")
    if (opsRow.length === 0) {
      await refreshPendientes()
      return
    }
    for (const op of opsRow) {
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
    const [{ data, error: err }, serviciosRes] = await Promise.all([
      insforge.database.from("formaciones").select("*").order("formacion"),
      insforge.database.from("servicios_formaciones").select("*").order("fecha"),
    ])
    if (err) {
      setError(err.message)
    } else if (data) {
      const porFormacion = new Map<number, ServicioFormacion[]>()
      for (const s of (serviciosRes.data as ServicioFormacionDB[]) ?? []) {
        const lista = porFormacion.get(s.formacion_id) ?? []
        lista.push(s as ServicioFormacion)
        porFormacion.set(s.formacion_id, lista)
      }
      setFormaciones(
        ordenarPorCriticidad(
          (data as FormacionDB[]).map((f) => aFormacion(f, porFormacion.get(f.id) ?? [])),
        ),
      )
    }
    setLoading(false)
  }, [])

  const aplicarCambio = useCallback(
    async (formacionId: number, campos: Partial<CamposEditables>) => {
      setFormaciones((prev) =>
        ordenarPorCriticidad(
          prev.map((f) => {
            if (f.id !== formacionId) return f
            const mezcla = { ...f, ...campos }
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
        if (existe) {
          return ordenarPorCriticidad(
            prev.map((f) => (f.id === nuevo.id ? aFormacion(nuevo as FormacionDB, f.historial) : f)),
          )
        }
        return ordenarPorCriticidad([...prev, aFormacion(nuevo as FormacionDB, [])])
      })
    }

    const onBorrado = (msg: SocketMessage) => {
      const viejo = msg as unknown as FormacionDB | null
      if (!viejo?.id) return
      setFormaciones((prev) => prev.filter((f) => f.id !== viejo.id))
    }

    const onServicioCambio = (msg: SocketMessage) => {
      const s = msg as unknown as ServicioFormacionDB | null
      if (!s?.id) return
      setFormaciones((prev) =>
        ordenarPorCriticidad(
          prev.map((f) => {
            if (f.id !== s.formacion_id) return f
            const existe = f.historial.some((x) => x.id === s.id)
            const hist = existe
              ? f.historial.map((x) => (x.id === s.id ? (s as ServicioFormacion) : x))
              : ordenarServicios([...f.historial, s as ServicioFormacion])
            return derivarFormacion(f, hist)
          }),
        ),
      )
    }

    const onServicioBorrado = (msg: SocketMessage) => {
      const viejo = msg as unknown as ServicioFormacionDB | null
      if (!viejo?.id) return
      setFormaciones((prev) =>
        ordenarPorCriticidad(
          prev.map((f) =>
            f.id !== viejo.formacion_id ? f : derivarFormacion(f, f.historial.filter((x) => x.id !== viejo.id)),
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
      .catch((e) => console.error("Error al suscribirse a realtime de formaciones:", e))

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
    (formacionId: number, nuevaHistorial: ServicioFormacion[]) => {
      const ordenada = ordenarServicios(nuevaHistorial)
      const anterior = formacionesRef.current.find((x) => x.id === formacionId)

      setFormaciones((prev) =>
        ordenarPorCriticidad(prev.map((f) => (f.id !== formacionId ? f : derivarFormacion(f, ordenada)))),
      )

      if (!anterior) return
      const ultima = ordenada[0]?.fecha ?? null
      const anteultima = ordenada[1]?.fecha ?? null
      const estado = ordenada[0]?.situacion ?? anterior.estado
      const campos: Partial<CamposEditables> = {}
      if (ultima !== anterior.ultima) campos.ultima = ultima
      if (anteultima !== anterior.anteultima) campos.anteultima = anteultima
      if (estado !== anterior.estado) campos.estado = estado
      if (Object.keys(campos).length > 0) void aplicarCambio(formacionId, campos)
    },
    [aplicarCambio],
  )

  const agregarServicio = useCallback(
    async (formacionId: number, fecha: string, situacion: SituacionFormacion) => {
      const base = formacionesRef.current.find((x) => x.id === formacionId)
      if (!base) return
      if (base.historial.some((s) => s.fecha === fecha)) return
      const tempId = -Date.now()
      const temp: ServicioFormacion = {
        id: tempId,
        formacion_id: formacionId,
        fecha,
        situacion,
        created_at: new Date().toISOString(),
      }
      mutarServicio(formacionId, [...base.historial, temp])
      await addOp("serviciosFormaciones", tempId, { formacion_id: formacionId, fecha, situacion }, "insert")
      await refreshPendientes()
      if (navigator.onLine) syncPending()
    },
    [refreshPendientes, syncPending, mutarServicio],
  )

  const aplicarCambioServicio = useCallback(
    async (servicioId: number, formacionId: number, fecha: string, situacion: SituacionFormacion) => {
      const base = formacionesRef.current.find((x) => x.id === formacionId)
      if (!base) return
      if (base.historial.some((s) => s.id !== servicioId && s.fecha === fecha)) return
      mutarServicio(
        formacionId,
        base.historial.map((s) => (s.id === servicioId ? { ...s, fecha, situacion } : s)),
      )
      await addOp("serviciosFormaciones", servicioId, { fecha, situacion })
      await refreshPendientes()
      if (navigator.onLine) syncPending()
    },
    [refreshPendientes, syncPending, mutarServicio],
  )

  const eliminarServicio = useCallback(
    async (servicioId: number, formacionId: number) => {
      const base = formacionesRef.current.find((x) => x.id === formacionId)
      if (!base) return
      mutarServicio(
        formacionId,
        base.historial.filter((s) => s.id !== servicioId),
      )
      await addOp("serviciosFormaciones", servicioId, {}, "delete")
      await refreshPendientes()
      if (navigator.onLine) syncPending()
    },
    [refreshPendientes, syncPending, mutarServicio],
  )

  return {
    formaciones,
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