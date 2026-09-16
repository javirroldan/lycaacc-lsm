import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { fmtDMY, semaforo } from "./dates"
import { ESTADO_LABEL, type Formacion } from "./types"
import { ESTADO_LOCO_LABEL, SERVICIO_LABEL, type Locomotora } from "./typesLocomotoras"

const BRAND = [9, 82, 226] as const
const TEXTO = [15, 23, 42] as const
const MUTED = [100, 116, 139] as const

const MM_POR_PT = 2.8346

function textoDias(dias: number | null): string {
  if (dias === null) return "-"
  return dias === 0 ? "Hoy" : String(dias)
}

function textoSituacion(dias: number | null): string {
  return semaforo(dias).texto
}

function fechaGeneracion(): string {
  return new Date().toLocaleString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

async function dataUrlDe(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const blob = await res.blob()
    return await new Promise((resolve, reject) => {
      const fr = new FileReader()
      fr.onload = () => resolve(fr.result as string)
      fr.onerror = () => reject(fr.error)
      fr.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

function encabezado(doc: jsPDF, logo: string | null): void {
  const x = 14
  const y = 14
  const tam = 16

  if (logo) doc.addImage(logo, "PNG", x, y, tam, tam)

  const fontSize = 15
  const lh = (fontSize * 1.2) / MM_POR_PT
  doc.setFont("helvetica", "bold")
  doc.setFontSize(fontSize)
  doc.setTextColor(...BRAND)
  const lineas = ["Planificación y", "Control de servicios"]
  const startY = y + tam / 2 - (lh * lineas.length) / 2 + lh * 0.85
  lineas.forEach((l, i) => doc.text(l, x + tam + 6, startY + i * lh))

  doc.setDrawColor(...BRAND)
  doc.setLineWidth(0.8)
  doc.line(x, y + tam + 6, 196, y + tam + 6)
}

function resumenSeccion(
  doc: jsPDF,
  y0: number,
  titulo: string,
  lista: { dias: number | null }[],
): number {
  let verde = 0
  let amarillo = 0
  let rojo = 0
  for (const l of lista) {
    const s = semaforo(l.dias).sem
    if (s === "verde") verde++
    else if (s === "amarillo") amarillo++
    else if (s === "rojo") rojo++
  }
  const total = lista.length

  const boxX = 14
  const boxW = 182
  const boxH = 34

  const fondo = [17, 24, 39] as const
  doc.setFillColor(...fondo)
  doc.roundedRect(boxX, y0, boxW, boxH, 2, 2, "F")

  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.text("RESUMEN", boxX + 4, y0 + 7)
  doc.setFontSize(13)
  doc.text(titulo, boxX + 4, y0 + 15)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.text(`Total: ${total}`, boxX + 4, y0 + 22)

  const datos: { label: string; valor: number; color: [number, number, number] }[] = [
    { label: "Verde", valor: verde, color: [34, 197, 94] },
    { label: "Precaución", valor: amarillo, color: [245, 158, 11] },
    { label: "Crítico", valor: rojo, color: [239, 68, 68] },
  ]

  const cx = 98
  const cw = boxX + boxW - cx - 6
  const baseY = y0 + boxH - 10
  const maxH = 16
  const maxVal = Math.max(1, ...datos.map((d) => d.valor))
  const barW = 16
  const gap = (cw - barW * datos.length) / (datos.length + 1)

  doc.setDrawColor(148, 163, 184)
  doc.setLineWidth(0.3)
  doc.line(cx, baseY, cx + cw, baseY)

  datos.forEach((d, i) => {
    const x = cx + gap + i * (barW + gap)
    const h = (d.valor / maxVal) * maxH
    if (h > 0) {
      doc.setFillColor(...d.color)
      doc.rect(x, baseY - h, barW, h, "F")
    }
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.setTextColor(255, 255, 255)
    doc.text(String(d.valor), x + barW / 2, baseY - h - 1.5, { align: "center" })
    doc.setFont("helvetica", "normal")
    doc.setFontSize(6.5)
    doc.text(d.label, x + barW / 2, baseY + 4, { align: "center" })
  })

  return y0 + boxH + 6
}

function seccionTitulo(doc: jsPDF, y0: number, texto: string): number {
  doc.setFont("helvetica", "bold")
  doc.setFontSize(13)
  doc.setTextColor(...BRAND)
  doc.text(texto, 14, y0)
  return y0 + 5
}

export async function generarInformePDF(
  formaciones: Formacion[],
  locomotoras: Locomotora[],
): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  const logo = await dataUrlDe("/icons/icon-512.png")

  encabezado(doc, logo)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(15)
  doc.setTextColor(...TEXTO)
  doc.text("Informe de demoras — Lavado de formaciones y locomotoras", 14, 44)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9.5)
  doc.setTextColor(...MUTED)
  doc.text(`Generado: ${fechaGeneracion()}`, 14, 49.5)

  const y1 = resumenSeccion(doc, 54, "Formaciones", formaciones)

  const ordenadas = (lista: Formacion[] | Locomotora[]): (Formacion | Locomotora)[] =>
    [...lista].sort((a, b) => {
      if (a.dias !== null && b.dias !== null) return b.dias - a.dias
      if (a.dias !== null) return -1
      if (b.dias !== null) return 1
      return 0
    })

  const formacionesOrdenadas = ordenadas(formaciones)
  const locomotorasOrdenadas = ordenadas(locomotoras)

  doc.setTextColor(...TEXTO)
  autoTable(doc, {
    startY: seccionTitulo(doc, y1, `Formaciones (${formaciones.length})`),
    head: [["N°", "Anteúltima", "Última", "Días", "Estado", "Situación"]],
    body: formacionesOrdenadas.map((f) => [
      String((f as Formacion).formacion),
      fmtDMY((f as Formacion).anteultima) || "-",
      fmtDMY((f as Formacion).ultima) || "-",
      textoDias(f.dias),
      ESTADO_LABEL[(f as Formacion).estado],
      textoSituacion(f.dias),
    ]),
    theme: "grid",
    headStyles: { fillColor: [...BRAND] as [number, number, number], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 1.8, textColor: TEXTO as unknown as [number, number, number] },
    columnStyles: { 3: { halign: "center" }, 4: {}, 5: {} },
    margin: { left: 14, right: 14 },
    pageBreak: "auto",
  })

  doc.addPage()
  const yLoco = resumenSeccion(doc, 16, "Locomotoras", locomotoras)
  autoTable(doc, {
    startY: seccionTitulo(doc, yLoco, `Locomotoras (${locomotoras.length})`) + 2,
    head: [["Locomotora", "Servicio", "Último lavado", "Días", "Estado", "Situación"]],
    body: locomotorasOrdenadas.map((l) => {
      const lo = l as Locomotora
      return [
        lo.locomotora,
        SERVICIO_LABEL[lo.servicio],
        fmtDMY(lo.ultima) || "-",
        textoDias(lo.dias),
        ESTADO_LOCO_LABEL[lo.estado],
        textoSituacion(lo.dias),
      ]
    }),
    theme: "grid",
    headStyles: { fillColor: [...BRAND] as [number, number, number], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 1.8, textColor: TEXTO as unknown as [number, number, number] },
    margin: { left: 14, right: 14 },
    pageBreak: "auto",
  })

  return doc
}

export async function compartirInformePDF(doc: jsPDF, nombre: string): Promise<boolean> {
  try {
    const file = new File([doc.output("blob")], `${nombre}.pdf`, { type: "application/pdf" })

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "Informe de demoras" })
        return true
      } catch {
        // cancelado o falla → cae a descarga
      }
    }

    doc.save(`${nombre}.pdf`)
    return true
  } catch {
    return false
  }
}