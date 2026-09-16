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

type Pagina = "formaciones" | "locomotoras"

export default function App() {
  const { usuario, rol, loading: authLoading, iniciarPorCodigo, signOut } = useAuth()
  const [pagina, setPagina] = useState<Pagina>("formaciones")
  const [ahora, setAhora] = useState(fechaAhora())

  const formaciones = useFormaciones()
  const locomotoras = useLocomotoras()

  useEffect(() => {
    const t = setInterval(() => setAhora(fechaAhora()), 30000)
    return () => clearInterval(t)
  }, [])

  const esEditor = !!usuario && rol !== null

  if (authLoading) {
    return <LoadingScreen titulo="Cargando…" detalle="Recuperando tu sesión" />
  }

  if (!usuario) {
    return <AuthView onIniciarPorCodigo={iniciarPorCodigo} />
  }

  const salir = () => {
    void signOut()
  }

  return (
    <div className="min-h-screen overflow-x-hidden relative z-10">
      {pagina === "formaciones" ? (
        <FormacionesPage
          datos={formaciones}
          esEditor={esEditor}
          rol={rol}
          ahora={ahora}
          locomotoras={locomotoras.locomotoras}
          onSalir={salir}
        />
      ) : (
        <LocomotoraPage
          datos={locomotoras}
          esEditor={esEditor}
          rol={rol}
          ahora={ahora}
          formaciones={formaciones.formaciones}
          onSalir={salir}
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