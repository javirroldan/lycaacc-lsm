import { useState } from "react"
import { FileDown } from "lucide-react"
import type { Formacion } from "../lib/types"
import type { Locomotora } from "../lib/typesLocomotoras"

interface Props {
  formaciones: Formacion[]
  locomotoras: Locomotora[]
}

export function InformeButton({ formaciones, locomotoras }: Props) {
  const [generando, setGenerando] = useState(false)

  const generar = async () => {
    setGenerando(true)
    try {
      const { compartirInformePDF, generarInformePDF } = await import("../lib/report")
      const doc = await generarInformePDF(formaciones, locomotoras)
      const nombre = `informe-demoras-${new Date().toISOString().slice(0, 10)}`
      await compartirInformePDF(doc, nombre)
    } finally {
      setGenerando(false)
    }
  }

  return (
    <button
      onClick={() => void generar()}
      disabled={generando}
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/15 hover:bg-white/25 transition text-xs font-semibold cursor-pointer disabled:opacity-60"
    >
      <FileDown className="w-4 h-4" /> {generando ? "Generando…" : "Informe PDF"}
    </button>
  )
}