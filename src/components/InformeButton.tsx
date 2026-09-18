import { useState } from "react"
import { Download, FileDown, Share2, X } from "lucide-react"
import type { jsPDF } from "jspdf"
import { DateRangeModal } from "./DateRangeModal"
import { TEMAS, type TemaColor } from "../lib/temas"
import type { Formacion } from "../lib/types"
import type { Locomotora } from "../lib/typesLocomotoras"
import type { Lavado } from "../lib/typesLavado"

interface Props {
  tipo: "formaciones" | "locomotoras" | "lavados"
  datos: Formacion[] | Locomotora[] | Lavado[]
  tema: TemaColor
  tituloModal: string
}

export function InformeButton({ tipo, datos, tema, tituloModal }: Props) {
  const [rangoAbierto, setRangoAbierto] = useState(false)
  const [generando, setGenerando] = useState(false)
  const [listo, setListo] = useState<{ doc: jsPDF; nombre: string } | null>(null)
  const t = TEMAS[tema]

  const generar = async (desde?: string, hasta?: string) => {
    setGenerando(true)
    try {
      const report = await import("../lib/report")
      let doc: jsPDF
      let nombre: string
      if (tipo === "formaciones") {
        doc = await report.generarInformeFormaciones(datos as Formacion[], desde, hasta)
        nombre = `informe-formaciones-${new Date().toISOString().slice(0, 10)}`
      } else if (tipo === "locomotoras") {
        doc = await report.generarInformeLocomotoras(datos as Locomotora[], desde, hasta)
        nombre = `informe-locomotoras-${new Date().toISOString().slice(0, 10)}`
      } else {
        doc = await report.generarInformeLavados(datos as Lavado[], desde, hasta)
        nombre = `informe-lavado-${new Date().toISOString().slice(0, 10)}`
      }
      if (report.puedeCompartirPDF(doc)) {
        setListo({ doc, nombre })
      } else {
        await report.descargarInformePDF(doc, nombre)
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
        onClick={() => setRangoAbierto(true)}
        disabled={generando}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/15 hover:bg-white/25 transition text-xs font-semibold cursor-pointer disabled:opacity-60"
      >
        <FileDown className="w-4 h-4" /> {generando ? "Generando…" : "Informe PDF"}
      </button>

      <DateRangeModal
        abierto={rangoAbierto}
        titulo={tituloModal}
        tema={tema}
        onCerrar={() => setRangoAbierto(false)}
        onGenerar={(desde, hasta) => {
          setRangoAbierto(false)
          void generar(desde, hasta)
        }}
      />

      {listo && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"
          onClick={() => setListo(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between px-5 py-4 ${t.header}`}>
              <h3 className="flex items-center gap-2 font-bold">
                <FileDown className="w-5 h-5" />
                {tituloModal}
              </h3>
              <button onClick={() => setListo(null)} className="hover:bg-white/20 rounded-lg p-1.5 transition cursor-pointer" aria-label="Cerrar">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-2">
              <button
                onClick={() => void descargar()}
                className={`inline-flex items-center justify-center gap-2 w-full px-3 py-3 rounded-lg text-sm font-semibold transition cursor-pointer ${t.boton}`}
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