import { useState } from "react"
import { Loader2, LogIn, ShieldCheck } from "lucide-react"
import { supabaseConfigurado } from "../lib/supabase"

interface Props {
  onIniciarSesion: (usuario: string, password: string) => Promise<string | null>
  onEntrarComoVisitante: () => void
}

export function AuthView({ onIniciarSesion, onEntrarComoVisitante }: Props) {
  const [usuario, setUsuario] = useState("")
  const [password, setPassword] = useState("")
  const [cargando, setCargando] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)
    setMsg(null)
    const err = await onIniciarSesion(usuario, password)
    if (err) setMsg("Credenciales incorrectas.")
    setCargando(false)
  }

  if (!supabaseConfigurado) {
    return (
      <LoadingScreen
        titulo="Falta la configuración de Supabase"
        detalle="Definí VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en el archivo .env"
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

        <form onSubmit={submit} className="space-y-3">
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
        </form>

        <p className="mt-3 text-center text-xs text-slate-400">
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