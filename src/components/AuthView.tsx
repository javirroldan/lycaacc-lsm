import { useState } from "react"
import { Loader2, LogIn, ShieldCheck, KeyRound } from "lucide-react"
import { OtpInput, type OtpStatus } from "./ui/otp-input"
import { insforgeConfigurado } from "../lib/insforge"

interface Props {
  onIniciarSesion: (usuario: string, password: string) => Promise<string | null>
  onIniciarPorCodigo: (codigo: string) => Promise<string | null>
  onEntrarComoVisitante: () => void
}

type Modo = "codigo" | "form"

export function AuthView({ onIniciarSesion, onIniciarPorCodigo, onEntrarComoVisitante }: Props) {
  const [modo, setModo] = useState<Modo>("codigo")
  const [codigo, setCodigo] = useState("")
  const [estado, setEstado] = useState<OtpStatus>("idle")
  const [cargando, setCargando] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const [usuario, setUsuario] = useState("")
  const [password, setPassword] = useState("")

  const validar = async (value: string) => {
    if (value.length < 6 || cargando) return
    setCargando(true)
    setMsg(null)
    const err = await onIniciarPorCodigo(value)
    if (err) {
      setEstado("error")
      setMsg("Código inválido. Probá de nuevo.")
      setCodigo("")
    }
    setCargando(false)
  }

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)
    setMsg(null)
    const err = await onIniciarSesion(usuario, password)
    if (err) setMsg("Credenciales incorrectas.")
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

        {modo === "codigo" ? (
          <div className="space-y-5">
            <div className="flex flex-col items-center gap-3">
              <KeyRound className="w-5 h-5 text-brand" />
              <p className="text-sm text-slate-600 text-center">
                Ingresá el código de acceso de 6 dígitos
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

            <button
              type="button"
              onClick={() => setModo("form")}
              className="w-full text-center text-sm text-slate-400 hover:text-brand transition"
            >
              ¿Problemas con el código? Entrar con usuario y contraseña
            </button>
          </div>
        ) : (
          <form onSubmit={submitForm} className="space-y-3">
            <input
              type="text"
              required
              autoComplete="username"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="Usuario"
              className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-brand focus:ring-2 focus:ring-brand-mid outline-none transition"
            />
            <div className="relative">
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-brand focus:ring-2 focus:ring-brand-mid outline-none transition"
              />
            </div>

            {msg && (
              <p className="text-sm text-center rounded-lg bg-amber-50 text-amber-700 border border-amber-200 px-3 py-2">
                {msg}
              </p>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-brand text-white font-semibold hover:bg-brand-strong transition disabled:opacity-60"
            >
              {cargando ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              Iniciar sesión
            </button>

            <button
              type="button"
              onClick={() => setModo("codigo")}
              className="w-full text-center text-sm text-slate-400 hover:text-brand transition"
            >
              Volver al código de acceso
            </button>
          </form>
        )}

        <p className="mt-5 text-center text-xs text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 inline-block mr-1" />
          Acceso restringido
        </p>

        <div className="mt-3 pt-4 border-t border-slate-100">
          <button
            onClick={onEntrarComoVisitante}
            className="w-full py-3 rounded-lg border-2 border-brand text-brand font-semibold hover:bg-brand-soft transition"
          >
            Ver como empleado
          </button>
          <p className="text-xs text-slate-400 text-center mt-3">
            Los empleados solo pueden leer. Para editar necesitás iniciar sesión.
          </p>
        </div>
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