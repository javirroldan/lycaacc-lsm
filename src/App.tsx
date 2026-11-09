import { useEffect, useState } from "react"
import { AlertTriangle, Building2, Trash2 } from "lucide-react"
import { AuthView, LoadingScreen } from "./components/AuthView"
import { FloatingNav } from "./components/FloatingNav"
import { FormacionesPage } from "./components/FormacionesPage"
import { LavadoPage } from "./components/LavadoPage"
import { LocomotoraPage } from "./components/LocomotoraPage"
import { BasuralesPage } from "./components/BasuralesPage"
import { ZonaCriticaPage } from "./components/ZonaCriticaPage"
import { FachadaPage } from "./components/FachadaPage"
import { useAuth } from "./hooks/useAuth"
import { useFormaciones } from "./hooks/useFormaciones"
import { useLavados } from "./hooks/useLavados"
import { useLocomotoras } from "./hooks/useLocomotoras"
import { useBasurales } from "./hooks/useBasurales"
import { useZonaCritica } from "./hooks/useZonaCritica"
import { useFachadaEntorno } from "./hooks/useFachadaEntorno"
import { fechaAhora } from "./lib/dates"

type Pagina = "formaciones" | "lavado" | "locomotoras" | "basurales" | "zona_critica" | "fachada_entorno"

// Basurales, Zona crítica y Fachada entorno quedan ocultas para todos
// (ni admin ve menú ni páginas) hasta que estén 100% listas.
// Para habilitarlas: poné VITE_SECCIONES_NUEVAS=true en el deploy (Vercel)
// o cambiá el default a true acá.
// Ejemplo .env: VITE_SECCIONES_NUEVAS=true
const SECCIONES_NUEVAS_ACTIVAS = import.meta.env.VITE_SECCIONES_NUEVAS === "true"

export default function App() {
  const { usuario, rol, loading: authLoading, iniciarPorCodigo, signOut } = useAuth()
  const [pagina, setPagina] = useState<Pagina>("formaciones")
  const [ahora, setAhora] = useState(fechaAhora())

  const formaciones = useFormaciones()
  const lavados = useLavados()
  const locomotoras = useLocomotoras()
  const basurales = useBasurales()
  const zonaCritica = useZonaCritica()
  const fachadaEntorno = useFachadaEntorno()

  useEffect(() => {
    const t = setInterval(() => setAhora(fechaAhora()), 30000)
    return () => clearInterval(t)
  }, [])

  const esEditor = !!usuario && (rol === "admin" || rol === "editor")
  const esGerencia = !!usuario && rol === "gerencia"

  if (authLoading) {
    return <LoadingScreen titulo="Cargando…" detalle="Recuperando tu sesión" />
  }

  if (!usuario) {
    return <AuthView onIniciarPorCodigo={iniciarPorCodigo} />
  }

  const salir = () => {
    void signOut()
  }

  const paginaEl =
    !SECCIONES_NUEVAS_ACTIVAS && (pagina === "basurales" || pagina === "zona_critica" || pagina === "fachada_entorno") ? (
      <FormacionesPage datos={formaciones} esEditor={esEditor} esGerencia={esGerencia} rol={rol} ahora={ahora} onSalir={salir} />
    ) : pagina === "formaciones" ? (
      <FormacionesPage datos={formaciones} esEditor={esEditor} esGerencia={esGerencia} rol={rol} ahora={ahora} onSalir={salir} />
    ) : pagina === "locomotoras" ? (
      <LocomotoraPage datos={locomotoras} esEditor={esEditor} esGerencia={esGerencia} rol={rol} ahora={ahora} onSalir={salir} />
    ) : pagina === "lavado" ? (
      <LavadoPage datos={lavados} esEditor={esEditor} esGerencia={esGerencia} rol={rol} ahora={ahora} onSalir={salir} />
    ) : pagina === "basurales" ? (
      <BasuralesPage datos={basurales} esEditor={esEditor} esGerencia={esGerencia} rol={rol} ahora={ahora} onSalir={salir} />
    ) : pagina === "fachada_entorno" ? (
      <FachadaPage datos={fachadaEntorno} esEditor={esEditor} esGerencia={esGerencia} rol={rol} ahora={ahora} onSalir={salir} />
    ) : (
      <ZonaCriticaPage datos={zonaCritica} esEditor={esEditor} esGerencia={esGerencia} rol={rol} ahora={ahora} onSalir={salir} />
    )

  return (
    <div className="min-h-screen overflow-x-hidden relative z-10 pb-20">
      {paginaEl}

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
          ...(SECCIONES_NUEVAS_ACTIVAS
            ? [
                {
                  key: "basurales" as const,
                  label: "Basurales",
                  icon: <Trash2 className="h-5 w-5" />,
                  active: pagina === "basurales",
                  onClick: () => setPagina("basurales" as Pagina),
                  activeText: "text-teal-600",
                  underline: "bg-teal-500",
                },
                {
                  key: "zona_critica" as const,
                  label: "Z. crítica",
                  icon: <AlertTriangle className="h-5 w-5" />,
                  active: pagina === "zona_critica",
                  onClick: () => setPagina("zona_critica" as Pagina),
                  activeText: "text-rose-600",
                  underline: "bg-rose-500",
                },
                {
                  key: "fachada_entorno" as const,
                  label: "Fachada",
                  icon: <Building2 className="h-5 w-5" />,
                  active: pagina === "fachada_entorno",
                  onClick: () => setPagina("fachada_entorno" as Pagina),
                  activeText: "text-violet-600",
                  underline: "bg-violet-500",
                },
              ]
            : []),
        ]}
      />
    </div>
  )
}