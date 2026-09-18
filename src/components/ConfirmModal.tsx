import { createPortal } from "react-dom"
import { AlertTriangle, X } from "lucide-react"
import { TEMAS, type TemaColor } from "../lib/temas"

interface Props {
  abierto: boolean
  titulo: string
  mensaje?: string
  tema: TemaColor
  etiquetaConfirmar?: string
  onCancelar: () => void
  onConfirmar: () => void
}

export function ConfirmModal({
  abierto,
  titulo,
  mensaje,
  tema,
  etiquetaConfirmar = "Confirmar",
  onCancelar,
  onConfirmar,
}: Props) {
  if (!abierto) return null
  const t = TEMAS[tema]

  return createPortal(
    <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4" onClick={onCancelar}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between px-5 py-4 ${t.header}`}>
          <h3 className="flex items-center gap-2 font-bold">
            <AlertTriangle className="w-5 h-5" />
            {titulo}
          </h3>
          <button onClick={onCancelar} className="hover:bg-white/20 rounded-lg p-1.5 transition cursor-pointer" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {mensaje && <p className="text-sm text-slate-600 mb-4">{mensaje}</p>}
          <div className="flex gap-2">
            <button
              onClick={onCancelar}
              className="inline-flex items-center justify-center flex-1 px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirmar}
              className={`inline-flex items-center justify-center flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${t.boton}`}
            >
              {etiquetaConfirmar}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}