import { useState } from "react"
import { Download, FileDown, Share2, X } from "lucide-react"
import type { jsPDF } from "jspdf"
import type { Formacion } from "../lib/types"
import type { Locomotora } from "../lib/typesLocomotoras"

interface Props {
  formaciones: Formacion[]
  locomotoras: Locomotora[]
}

export function InformeButton({ formaciones, locomotoras }: Props) {
  const [generando, setGenerando] = useState(false)
  const [listo, setListo] = useState<{ doc: jsPDF; nombre: string } | null>(null)

  const generar = async () => {
    setGenerando(true)
    try {
      const { descargarInformePDF, generarInformePDF, puedeCompartirPDF } = await import("../lib/report")
      const doc = await generarInformePDF(formaciones, locomotoras)
      const nombre = `informe-demoras-${new Date().toISOString().slice(0, 10)}`
      if (puedeCompartirPDF(doc)) {
        setListo({ doc, nombre })
      } else {
        await descargarInformePDF(doc, nombre)
      }
    } finally {
      setGenerando(false)
    }
  }

  const descargar = async () => {
    if (!listo) return
    const { descargarInformePDF } = await import("../lib/report")
    await descargarInformePDF(listo.doc, listo.nombre)
    setListo(null)
  }

  const compartir = async () => {
    if (!listo) return
    const { compartirInformePDF } = await import("../lib/report")
    await compartirInformePDF(listo.doc, listo.nombre)
    setListo(null)
  }

  return (
    <>
      <button
        onClick={() => void generar()}
        disabled={generando}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/15 hover:bg-white/25 transition text-xs font-semibold cursor-pointer disabled:opacity-60"
      >
        <FileDown className="w-4 h-4" /> {generando ? "Generando…" : "Informe PDF"}
      </button>

      {listo && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setListo(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 bg-brand text-white">
              <h3 className="flex items-center gap-2 font-bold">
                <FileDown className="w-5 h-5" />
                Informe de demoras
              </h3>
              <button onClick={() => setListo(null)} className="hover:bg-white/20 rounded-lg p-1.5 transition cursor-pointer" aria-label="Cerrar">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-2">
              <button
                onClick={() => void descargar()}
                className="inline-flex items-center justify-center gap-2 w-full px-3 py-3 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-strong transition cursor-pointer"
              >
                <Download className="w-5 h-5" /> Descargar al teléfono
              </button>
              <button
                onClick={() => void compartir()}
                className="inline-flex items-center justify-center gap-2 w-full px-3 py-3 rounded-lg bg-white border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition cursor-pointer"
              >
                <Share2 className="w-5 h-5" /> Compartir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}