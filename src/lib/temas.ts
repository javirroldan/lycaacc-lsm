export type TemaColor = "azul" | "verde" | "naranja" | "teal" | "rose" | "violeta"

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
  teal: {
    header: "bg-teal-600 text-white",
    boton: "bg-teal-600 text-white hover:bg-teal-700",
    foco: "focus:border-teal-500 focus:ring-2 focus:ring-teal-200",
    textoActivo: "text-teal-600",
    underline: "bg-teal-500",
  },
  rose: {
    header: "bg-rose-600 text-white",
    boton: "bg-rose-600 text-white hover:bg-rose-700",
    foco: "focus:border-rose-500 focus:ring-2 focus:ring-rose-200",
    textoActivo: "text-rose-600",
    underline: "bg-rose-500",
  },
  violeta: {
    header: "bg-violet-600 text-white",
    boton: "bg-violet-600 text-white hover:bg-violet-700",
    foco: "focus:border-violet-500 focus:ring-2 focus:ring-violet-200",
    textoActivo: "text-violet-600",
    underline: "bg-violet-500",
  },
}