import { jsPDF } from "jspdf"
import autoTable, { type CellHookData } from "jspdf-autotable"
import { fmtDMY, fmtFechaLavado, parseISO, semaforo } from "./dates"
import { ESTADO_LABEL, type Formacion } from "./types"
import {
  ESTADO_LOCO_LABEL,
  SERVICIO_LABEL,
  type Locomotora,
} from "./typesLocomotoras"
import { ordenarPorRecienteLavado, type Lavado } from "./typesLavado"
import { ordenarServicios } from "./typesServicios"

export type ColorRGB = [number, number, number]

export const COLOR_AZUL: ColorRGB = [9, 82, 226]
export const COLOR_VERDE: ColorRGB = [22, 163, 74]
export const COLOR_NARANJA: ColorRGB = [249, 115, 22]

const TEXTO = [15, 23, 42] as const
const MUTED = [100, 116, 139] as const

const MM_POR_PT = 2.8346

function textoDias(dias: number | null): string {
  if (dias === null) return "-"
  return dias === 0 ? "Hoy" : String(dias)
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

function dateKey(iso: string | null): string | null {
  const d = parseISO(iso)
  if (!d) return null
  const a = String(d.getUTCFullYear()).padStart(4, "0")
  const m = String(d.getUTCMonth() + 1).padStart(2, "0")
  const dd = String(d.getUTCDate()).padStart(2, "0")
  return `${a}-${m}-${dd}`
}

function enRango(iso: string | null, desde?: string, hasta?: string): boolean {
  const k = dateKey(iso)
  if (k === null) return !desde && !hasta
  if (desde && k < desde) return false
  if (hasta && k > hasta) return false
  return true
}

function fmtPerido(fecha: string | undefined): string {
  if (!fecha) return "—"
  const [a, m, d] = fecha.split("-")
  return `${d}/${m}/${a}`
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

function encabezado(doc: jsPDF, logo: string | null, color: ColorRGB): void {
  const x = 14
  const y = 14
  const tam = 16

  if (logo) doc.addImage(logo, "PNG", x, y, tam, tam)

  const fontSize = 15
  const lh = (fontSize * 1.2) / MM_POR_PT
  doc.setFont("helvetica", "bold")
  doc.setFontSize(fontSize)
  doc.setTextColor(...color)
  const lineas = ["Planificación y", "Control de servicios"]
  const startY = y + tam / 2 - (lh * lineas.length) / 2 + lh * 0.85
  lineas.forEach((l, i) => doc.text(l, x + tam + 6, startY + i * lh))

  doc.setDrawColor(...color)
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
  for (const a of lista) {
    const s = semaforo(a.dias).sem
    if (s === "verde") verde++
    else if (s === "amarillo") amarillo++
    else if (s === "rojo") rojo++
  }
  const total = lista.length

  const boxX = 14
  const boxW = 182
  const boxH = 34

  doc.setFillColor(17, 24, 39)
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

function resumenLavado(doc: jsPDF, y0: number, lista: Lavado[]): number {
  const total = lista.length
  const formaciones = new Set(lista.map((l) => l.formacion)).size
  let si = 0
  let no = 0
  let sin = 0
  for (const l of lista) {
    if (l.ok === true) si++
    else if (l.ok === false) no++
    else sin++
  }

  const boxX = 14
  const boxW = 182
  const boxH = 34

  doc.setFillColor(17, 24, 39)
  doc.roundedRect(boxX, y0, boxW, boxH, 2, 2, "F")

  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.text("RESUMEN", boxX + 4, y0 + 7)
  doc.setFontSize(13)
  doc.text("Lavado de formaciones", boxX + 4, y0 + 15)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.text(`Total: ${total} lavados`, boxX + 4, y0 + 22)
  doc.text(`Formaciones: ${formaciones}`, boxX + 4, y0 + 28)

  const datos: { label: string; valor: number; color: [number, number, number] }[] = [
    { label: "OK", valor: si, color: [34, 197, 94] },
    { label: "Pendiente", valor: no, color: [245, 158, 11] },
    { label: "Sin datos", valor: sin, color: [148, 163, 184] },
  ]

  const cx = 112
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

function seccionTitulo(doc: jsPDF, y0: number, texto: string, color: ColorRGB): number {
  doc.setFont("helvetica", "bold")
  doc.setFontSize(13)
  doc.setTextColor(...color)
  doc.text(texto, 14, y0)
  return y0 + 5
}

function pieDeInforme(doc: jsPDF, titulo: string, desde?: string, hasta?: string): number {
  doc.setFont("helvetica", "bold")
  doc.setFontSize(15)
  doc.setTextColor(...TEXTO)
  doc.text(titulo, 14, 44)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9.5)
  doc.setTextColor(...MUTED)
  doc.text(`Generado: ${fechaGeneracion()}`, 14, 49.5)
  doc.text(`Período: ${fmtPerido(desde)} — ${fmtPerido(hasta)}`, 14, 54.5)
  return 58
}

interface FilaInforme {
  body: (string | number)[]
  nuevo: boolean
  par: boolean
}

interface FilasInforme {
  filas: FilaInforme[]
  totalLavados: number
}

function filasFormaciones(formaciones: Formacion[], desde?: string, hasta?: string): FilasInforme {
  const ordenadas = [...formaciones].sort((a, b) => a.formacion - b.formacion)
  const filas: FilaInforme[] = []
  let totalLavados = 0
  let grupo = 0
  for (const f of ordenadas) {
    const enRangoList = f.historial.filter((s) => enRango(s.fecha, desde, hasta))
    if (enRangoList.length === 0) continue
    const historial = ordenarServicios(enRangoList)
    totalLavados += historial.length
    historial.forEach((s, j) => {
      filas.push({
        body: [
          j === 0 ? String(f.formacion) : "",
          fmtDMY(s.fecha) || "-",
          ESTADO_LABEL[s.situacion],
          j === 0 ? textoDias(f.dias) : "",
          j === 0 ? ESTADO_LABEL[f.estado] : "",
        ],
        nuevo: j === 0,
        par: grupo % 2 === 1,
      })
    })
    grupo++
  }
  return { filas, totalLavados }
}

function filasLocomotoras(locomotoras: Locomotora[], desde?: string, hasta?: string): FilasInforme {
  const ordenadas = [...locomotoras].sort((a, b) =>
    a.locomotora.localeCompare(b.locomotora, "es", { numeric: true, sensitivity: "base" }),
  )
  const filas: FilaInforme[] = []
  let totalLavados = 0
  let grupo = 0
  for (const l of ordenadas) {
    const enRangoList = l.historial.filter((s) => enRango(s.fecha, desde, hasta))
    if (enRangoList.length === 0) continue
    const historial = ordenarServicios(enRangoList)
    totalLavados += historial.length
    const situacion = semaforo(l.dias).texto
    historial.forEach((s, j) => {
      filas.push({
        body: [
          j === 0 ? l.locomotora : "",
          fmtDMY(s.fecha) || "-",
          SERVICIO_LABEL[s.servicio],
          j === 0 ? textoDias(l.dias) : "",
          j === 0 ? ESTADO_LOCO_LABEL[l.estado] : "",
          situacion,
        ],
        nuevo: j === 0,
        par: grupo % 2 === 1,
      })
    })
    grupo++
  }
  return { filas, totalLavados }
}

function filasLavados(lavados: Lavado[], desde?: string, hasta?: string): FilasInforme {
  const porFormacion = new Map<number, Lavado[]>()
  for (const l of lavados) {
    if (!enRango(l.fecha ?? l.created_at, desde, hasta)) continue
    const arr = porFormacion.get(l.formacion)
    if (arr) arr.push(l)
    else porFormacion.set(l.formacion, [l])
  }
  const formaciones = [...porFormacion.keys()].sort((a, b) => a - b)
  const filas: FilaInforme[] = []
  formaciones.forEach((num, grupo) => {
    const historial = ordenarPorRecienteLavado(porFormacion.get(num) ?? [])
    historial.forEach((l, j) => {
      filas.push({
        body: [
          j === 0 ? `N° ${num}` : "",
          fmtFechaLavado(l.fecha ?? l.created_at) || "-",
          l.ingreso ? l.ingreso.slice(0, 5) : "-",
          l.egreso ? l.egreso.slice(0, 5) : "-",
          l.pasadas === null ? "-" : String(l.pasadas),
          l.ok === true ? "OK" : l.ok === false ? "Pendiente" : "Sin datos",
        ],
        nuevo: j === 0,
        par: grupo % 2 === 1,
      })
    })
  })
  return { filas, totalLavados: filas.length }
}

const BLANCO: ColorRGB = [255, 255, 255]
const COLOR_ALTERNO_AZUL: ColorRGB = [240, 245, 255]
const COLOR_ALTERNO_VERDE: ColorRGB = [240, 253, 244]
const COLOR_ALTERNO_NARANJA: ColorRGB = [255, 247, 237]

function didParseGrupo(
  filas: FilaInforme[],
  colGrupo: number,
  colsSoloPrimera: number[],
  colorAlterno: ColorRGB,
): (d: CellHookData) => void {
  return (d) => {
    if (d.section !== "body") return
    const fila = filas[d.row.index]
    if (!fila) return
    d.cell.styles.fillColor = fila.par ? colorAlterno : BLANCO
    if (d.column.index === colGrupo) {
      if (fila.nuevo) d.cell.styles.fontStyle = "bold"
      else d.cell.text = []
      return
    }
    if (!fila.nuevo && colsSoloPrimera.includes(d.column.index)) d.cell.text = []
  }
}

function formacionesEnRango(formaciones: Formacion[], desde?: string, hasta?: string): Formacion[] {
  return formaciones.filter((f) => f.historial.some((s) => enRango(s.fecha, desde, hasta)))
}

function locomotorasEnRango(locomotoras: Locomotora[], desde?: string, hasta?: string): Locomotora[] {
  return locomotoras.filter((l) => l.historial.some((s) => enRango(s.fecha, desde, hasta)))
}

export async function generarInformeFormaciones(
  formaciones: Formacion[],
  desde?: string,
  hasta?: string,
): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  const logo = await dataUrlDe("/icons/icon-512.png")

  encabezado(doc, logo, COLOR_AZUL)

  const yPie = pieDeInforme(doc, "Informe de formaciones", desde, hasta)

  const y1 = resumenSeccion(doc, yPie + 2, "Formaciones", formacionesEnRango(formaciones, desde, hasta))

  const { filas, totalLavados } = filasFormaciones(formaciones, desde, hasta)
  if (filas.length === 0) return doc

  doc.setTextColor(...TEXTO)
  autoTable(doc, {
    startY: seccionTitulo(doc, y1, `Lavados por formación (${totalLavados})`, COLOR_AZUL),
    head: [["N°", "Fecha", "Situación", "Días", "Estado"]],
    body: filas.map((f) => f.body),
    theme: "grid",
    headStyles: { fillColor: [...COLOR_AZUL] as [number, number, number], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 1.8, textColor: TEXTO as unknown as [number, number, number] },
    columnStyles: {
      0: { halign: "center", cellWidth: 14 },
      1: { halign: "center", cellWidth: 26 },
      3: { halign: "center", cellWidth: 14 },
    },
    margin: { left: 14, right: 14 },
    pageBreak: "auto",
    didParseCell: didParseGrupo(filas, 0, [3, 4], COLOR_ALTERNO_AZUL),
  })

  return doc
}

export async function generarInformeLocomotoras(
  locomotoras: Locomotora[],
  desde?: string,
  hasta?: string,
): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  const logo = await dataUrlDe("/icons/icon-512.png")

  encabezado(doc, logo, COLOR_VERDE)

  const yPie = pieDeInforme(doc, "Informe de locomotoras", desde, hasta)

  const y1 = resumenSeccion(doc, yPie + 2, "Locomotoras", locomotorasEnRango(locomotoras, desde, hasta))

  const { filas, totalLavados } = filasLocomotoras(locomotoras, desde, hasta)
  if (filas.length === 0) return doc

  doc.setTextColor(...TEXTO)
  autoTable(doc, {
    startY: seccionTitulo(doc, y1, `Lavados por locomotora (${totalLavados})`, COLOR_VERDE) + 2,
    head: [["Locomotora", "Fecha", "Servicio", "Días", "Estado", "Situación"]],
    body: filas.map((f) => f.body),
    theme: "grid",
    headStyles: { fillColor: [...COLOR_VERDE] as [number, number, number], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 1.8, textColor: TEXTO as unknown as [number, number, number] },
    columnStyles: {
      0: { cellWidth: 36 },
      1: { halign: "center", cellWidth: 26 },
      2: { halign: "center", cellWidth: 18 },
      3: { halign: "center", cellWidth: 14 },
    },
    margin: { left: 14, right: 14 },
    pageBreak: "auto",
    didParseCell: didParseGrupo(filas, 0, [3, 4], COLOR_ALTERNO_VERDE),
  })

  return doc
}

export async function generarInformeLavados(
  lavados: Lavado[],
  desde?: string,
  hasta?: string,
): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  const logo = await dataUrlDe("/icons/icon-512.png")

  encabezado(doc, logo, COLOR_NARANJA)

  const yPie = pieDeInforme(doc, "Informe de lavado", desde, hasta)

  const filtrados = lavados.filter((l) => enRango(l.fecha ?? l.created_at, desde, hasta))

  const y1 = resumenLavado(doc, yPie + 2, filtrados)

  const { filas, totalLavados } = filasLavados(lavados, desde, hasta)
  if (filas.length === 0) return doc

  doc.setTextColor(...TEXTO)
  autoTable(doc, {
    startY: seccionTitulo(doc, y1, `Lavados por formación (${totalLavados})`, COLOR_NARANJA) + 2,
    head: [["Formación", "Fecha", "Ingreso", "Egreso", "Pasadas", "Lavado"]],
    body: filas.map((f) => f.body),
    theme: "grid",
    headStyles: { fillColor: [...COLOR_NARANJA] as [number, number, number], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 1.8, textColor: TEXTO as unknown as [number, number, number] },
    columnStyles: {
      0: { halign: "center", cellWidth: 20 },
      1: { halign: "center", cellWidth: 26 },
      2: { halign: "center" },
      3: { halign: "center" },
      4: { halign: "center" },
    },
    margin: { left: 14, right: 14 },
    pageBreak: "auto",
    didParseCell: didParseGrupo(filas, 0, [], COLOR_ALTERNO_NARANJA),
  })

  return doc
}

export function descargarInformePDF(doc: jsPDF, nombre: string): Promise<boolean> {
  try {
    doc.save(`${nombre}.pdf`)
    return Promise.resolve(true)
  } catch {
    return Promise.resolve(false)
  }
}

export function puedeCompartirPDF(doc: jsPDF): boolean {
  try {
    return !!(navigator.canShare && navigator.canShare({ files: [new File([doc.output("blob")], "informe.pdf", { type: "application/pdf" })] }))
  } catch {
    return false
  }
}

export async function compartirInformePDF(doc: jsPDF, nombre: string): Promise<boolean> {
  try {
    const file = new File([doc.output("blob")], `${nombre}.pdf`, { type: "application/pdf" })
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: "Informe de demoras" })
      return true
    }
  } catch {
    // cancelado o falla → el botón vuelve al estado listo
  }
  return false
}