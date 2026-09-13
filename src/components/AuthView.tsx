import { useState } from "react"
import { KeyRound, Loader2, ShieldCheck } from "lucide-react"
import { OtpInput, type OtpStatus } from "./ui/otp-input"
import { insforgeConfigurado } from "../lib/insforge"

interface Props {
  onIniciarPorCodigo: (codigo: string) => Promise<string | null>
}

export function AuthView({ onIniciarPorCodigo }: Props) {
  const [codigo, setCodigo] = useState("")
  const [estado, setEstado] = useState<OtpStatus>("idle")
  const [cargando, setCargando] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const validar = async (value: string) => {
    if (value.length < 6 || cargando) return
    setCargando(true)
    setMsg(null)
    const err = await onIniciarPorCodigo(value)
    if (err) {
      setEstado("error")
      setMsg(err)
      setCodigo("")
    }
    setCargando(false)
  }

  if (!insforgeConfigurado) {
    return (
      <LoadingScreen
        titulo="Falta la configuración de InsForge"
        detalle="Definí VITE_INSFORGE_URL y VITE_INSFORGE_ANON_KEY en el archivo .env"
      />
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white overflow-hidden mb-4 shadow">
            <img src="/icons/icon-192.png" alt="Trenes" className="w-12 h-12 rounded-xl" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">Planificación y control de servicios</h1>
          <p className="text-slate-500 text-sm">Lavado de formaciones</p>
        </div>

        <div className="space-y-5">
          <div className="flex flex-col items-center gap-3">
            <KeyRound className="w-5 h-5 text-brand" />
            <p className="text-sm text-slate-600 text-center">
              Ingresá tu código de acceso de 6 dígitos
            </p>
            <OtpInput
              length={6}
              value={codigo}
              status={estado}
              autoFocus
              disabled={cargando}
              onChange={(value) => {
                setCodigo(value)
                setEstado("idle")
                setMsg(null)
              }}
              onComplete={validar}
            />
          </div>

          {msg && (
            <p className="text-sm text-center rounded-lg bg-amber-50 text-amber-700 border border-amber-200 px-3 py-2">
              {msg}
            </p>
          )}

          {cargando && (
            <p className="flex items-center justify-center gap-2 text-sm text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" /> Verificando…
            </p>
          )}
        </div>

        <p className="mt-5 text-center text-xs text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 inline-block mr-1" />
          Acceso restringido · Solo personal autorizado
        </p>
      </div>
    </div>
  )
}

export function LoadingScreen({ titulo, detalle }: { titulo: string; detalle: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
        <img src="/icons/icon-192.png" alt="Trenes" className="w-14 h-14 mx-auto rounded-2xl mb-4" />
        <h1 className="text-lg font-bold text-slate-800 mb-2">{titulo}</h1>
        <p className="text-slate-500 text-sm">{detalle}</p>
      </div>
    </div>
  )
}