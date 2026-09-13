import { fmtDMY } from "./dates"
import { ESTADO_LABEL, type Formacion } from "./types"

export function generarInforme(formaciones: Formacion[]): string {
  const hoy = new Date().toLocaleString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const verde = formaciones.filter((f) => f.sem === "verde").length
  const amarillo = formaciones.filter((f) => f.sem === "amarillo").length
  const rojo = formaciones.filter((f) => f.sem === "rojo").length

  const ordenadas = [...formaciones].sort((a, b) => {
    if (a.dias !== null && b.dias !== null) return b.dias - a.dias
    if (a.dias !== null) return -1
    if (b.dias !== null) return 1
    return a.formacion - b.formacion
  })

  const lineas = [
    "==================================================",
    "  INFORME DE DEMORAS - LAVADO DE FORMACIONES",
    "==================================================",
    `Generado: ${hoy}`,
    "",
    `Total de formaciones: ${formaciones.length}`,
    `Al día (0-10 días):        ${verde}`,
    `Precaución (11-20 días):   ${amarillo}`,
    `Crítico (21+ días):        ${rojo}`,
    "",
    "--------------------------------------------------",
    "  N°  Anteúltima   Última       Días  Estado         Situación",
    "--------------------------------------------------",
    ...ordenadas.map((f) => {
      const n = String(f.formacion).padStart(3, " ")
      const a = (fmtDMY(f.anteultima) || "-").padEnd(11, " ")
      const u = (fmtDMY(f.ultima) || "-").padEnd(11, " ")
      const d = (f.dias === null ? "-" : f.dias === 0 ? "Hoy" : String(f.dias)).padStart(4, " ")
      const e = ESTADO_LABEL[f.estado].padEnd(14, " ")
      const s = f.dias === null ? "Sin datos" : f.dias <= 10 ? "OK" : f.dias <= 20 ? "Precaución" : "CRITICO"
      return `  ${n}  ${a}  ${u}  ${d}  ${e}  ${s}`
    }),
    "--------------------------------------------------",
    "",
    "Leyenda:",
    "  Verde: 0-10 días (OK)  |  Amarillo: 11-20 días (Precaución)  |  Rojo: 21+ días (Intervención)",
    "",
  ]

  return lineas.join("\n")
}

export async function compartirInforme(texto: string, nombre: string): Promise<boolean> {
  try {
    const file = new File([texto], `${nombre}.txt`, { type: "text/plain" })

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "Informe de demoras" })
        return true
      } catch {
        // cancelado o falla → cae a descarga
      }
    }

    const url = URL.createObjectURL(file)
    const a = document.createElement("a")
    a.href = url
    a.download = `${nombre}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    return true
  } catch {
    // Si algo falla (ej. entorno sin soporte), generamos la descarga por fallback con datos URI
    try {
      const blob = new Blob([`\uFEFF${texto}`], { type: "text/plain;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${nombre}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      return true
    } catch {
      return false
    }
  }
}