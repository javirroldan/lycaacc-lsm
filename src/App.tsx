import { useEffect, useState } from "react"
import { AuthView, LoadingScreen } from "./components/AuthView"
import { FloatingNav } from "./components/FloatingNav"
import { FormacionesPage } from "./components/FormacionesPage"
import { LavadoPage } from "./components/LavadoPage"
import { LocomotoraPage } from "./components/LocomotoraPage"
import { useAuth } from "./hooks/useAuth"
import { useFormaciones } from "./hooks/useFormaciones"
import { useLavados } from "./hooks/useLavados"
import { useLocomotoras } from "./hooks/useLocomotoras"
import { fechaAhora } from "./lib/dates"

type Pagina = "formaciones" | "lavado" | "locomotoras"

export default function App() {
  const { usuario, rol, loading: authLoading, iniciarPorCodigo, signOut } = useAuth()
  const [pagina, setPagina] = useState<Pagina>("formaciones")
  const [ahora, setAhora] = useState(fechaAhora())

  const formaciones = useFormaciones()
  const lavados = useLavados()
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
          onSalir={salir}
        />
      ) : pagina === "lavado" ? (
        <LavadoPage
          datos={lavados}
          esEditor={esEditor}
          rol={rol}
          ahora={ahora}
          onSalir={salir}
        />
      ) : (
        <LocomotoraPage
          datos={locomotoras}
          esEditor={esEditor}
          rol={rol}
          ahora={ahora}
          onSalir={salir}
        />
      )}

      <FloatingNav
        className="lg:bottom-6"
        items={[
          {
            key: "formaciones",
            label: "Formaciones",
            icon: <img src="/icons/formacion24px.png" alt="Formaciones" className="h-5 w-5 object-contain" />,
            active: pagina === "formaciones",
            onClick: () => setPagina("formaciones"),
          },
          {
            key: "locomotoras",
            label: "Locomotoras",
            icon: <img src="/icons/locomotora24px.png" alt="Locomotoras" className="h-5 w-5 object-contain" />,
            active: pagina === "locomotoras",
            onClick: () => setPagina("locomotoras"),
            activeText: "text-green-600",
            underline: "bg-green-500",
          },
          {
            key: "lavado",
            label: "Lavado",
            icon: <img src="/icons/rodillolavado24px.png" alt="Lavado" className="h-5 w-5 object-contain" />,
            active: pagina === "lavado",
            onClick: () => setPagina("lavado"),
            activeText: "text-orange-600",
            underline: "bg-orange-500",
          },
        ]}
      />
    </div>
  )
}