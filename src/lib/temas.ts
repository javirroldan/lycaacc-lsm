export type TemaColor = "azul" | "verde" | "naranja"

export interface Tema {
  header: string
  boton: string
  foco: string
  textoActivo: string
  underline: string
}

export const TEMAS: Record<TemaColor, Tema> = {
  azul: {
    header: "bg-brand text-white",
    boton: "bg-brand text-white hover:bg-brand-strong",
    foco: "focus:border-brand focus:ring-2 focus:ring-brand-mid",
    textoActivo: "text-blue-600",
    underline: "bg-blue-500",
  },
  verde: {
    header: "bg-green-600 text-white",
    boton: "bg-green-600 text-white hover:bg-green-700",
    foco: "focus:border-green-600 focus:ring-2 focus:ring-green-300",
    textoActivo: "text-green-600",
    underline: "bg-green-500",
  },
  naranja: {
    header: "bg-orange-600 text-white",
    boton: "bg-orange-600 text-white hover:bg-orange-700",
    foco: "focus:border-orange-500 focus:ring-2 focus:ring-orange-200",
    textoActivo: "text-orange-600",
    underline: "bg-orange-500",
  },
}