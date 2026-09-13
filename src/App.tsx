import { useEffect, useState } from "react"
import { TrainFront, Wrench } from "lucide-react"
import { AuthView, LoadingScreen } from "./components/AuthView"
import { FloatingNav } from "./components/FloatingNav"
import { FormacionesPage } from "./components/FormacionesPage"
import { LocomotoraPage } from "./components/LocomotoraPage"
import { useAuth } from "./hooks/useAuth"
import { useFormaciones } from "./hooks/useFormaciones"
import { useLocomotoras } from "./hooks/useLocomotoras"
import { fechaAhora } from "./lib/dates"

const STORAGE_VISITANTE = "trenes-app.visitante"

type Pagina = "formaciones" | "locomotoras"

export default function App() {
  const { session, rol, loading: authLoading, signIn, signOut } = useAuth()
  const [visitante, setVisitante] = useState(() => localStorage.getItem(STORAGE_VISITANTE) === "1")
  const [pagina, setPagina] = useState<Pagina>("formaciones")
  const [ahora, setAhora] = useState(fechaAhora())

  const formaciones = useFormaciones()
  const locomotoras = useLocomotoras()

  useEffect(() => {
    const t = setInterval(() => setAhora(fechaAhora()), 30000)
    return () => clearInterval(t)
  }, [])

  const usuario = session?.user ?? null
  const esVisitante = visitante && !usuario
  const esEditor = !!usuario && rol !== null

  const entrarComoVisitante = () => {
    localStorage.setItem(STORAGE_VISITANTE, "1")
    setVisitante(true)
  }

  const salirYVerComoVisitante = () => {
    void signOut()
    entrarComoVisitante()
  }

  const salirDelModoVisitante = () => {
    localStorage.removeItem(STORAGE_VISITANTE)
    setVisitante(false)
  }

  if (authLoading) {
    return <LoadingScreen titulo="Cargando…" detalle="Recuperando tu sesión" />
  }

  if (!usuario && !visitante) {
    return (
      <AuthView
        onIniciarSesion={signIn}
        onEntrarComoVisitante={entrarComoVisitante}
      />
    )
  }

  return (
    <div className="min-h-screen overflow-x-hidden relative z-10">
      {pagina === "formaciones" ? (
        <FormacionesPage
          datos={formaciones}
          esEditor={esEditor}
          esVisitante={esVisitante}
          usuario={usuario}
          rol={rol}
          ahora={ahora}
          onSalir={usuario ? salirYVerComoVisitante : salirDelModoVisitante}
        />
      ) : (
        <LocomotoraPage
          datos={locomotoras}
          esEditor={esEditor}
          esVisitante={esVisitante}
          usuario={usuario}
          rol={rol}
          ahora={ahora}
          onSalir={usuario ? salirYVerComoVisitante : salirDelModoVisitante}
        />
      )}

      <FloatingNav
        className="lg:bottom-6"
        items={[
          {
            key: "formaciones",
            label: "Formaciones",
            icon: TrainFront,
            active: pagina === "formaciones",
            onClick: () => setPagina("formaciones"),
          },
          {
            key: "locomotoras",
            label: "Locomotoras",
            icon: Wrench,
            active: pagina === "locomotoras",
            onClick: () => setPagina("locomotoras"),
          },
        ]}
      />
    </div>
  )
}