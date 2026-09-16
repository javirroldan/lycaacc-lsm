# Implementar el informe PDF (reemplazo del informe TXT)

> Guía para aplicar en el proyecto final el cambio de informe TXT → **Informe PDF**
> con logo, resumen con gráfico de barras y una página por sección.

---

## 1. Objetivo

El informe descargable pasa de un archivo `.txt` (solo formaciones, sin marca) a un
**PDF de dos páginas**:

- **Encabezado del documento**: logo de la app arriba a la izquierda y el texto
  **"Planificación y / Control de servicios"** en dos líneas, en azul marca
  (`#0952E2`), verticalmente centradas al alto del logo.
- **Hoja 1 — Formaciones**: caja de **resumen** oscura (total + **gráfico de barras**
  Verde/Precaución/Crítico) y la tabla de formaciones.
- **Hoja 2 — Locomotoras**: caja de **resumen** con su gráfico de barras y la tabla
  de locomotoras.
- Compatible con `navigator.share` (móvil) y fallback a descarga directa.
- Accesible en **ambas secciones** (Formaciones y Locomotoras), solo para admin.

---

## 2. Dependencias nuevas

```bash
npm install jspdf jspdf-autotable
```

| Paquete            | Versión usada | Uso                                   |
| ------------------ | ------------- | ------------------------------------- |
| `jspdf`            | ^4.2.1        | Generación del PDF (A4)               |
| `jspdf-autotable`  | ^5.0.8        | Tablas con estilo (theme grid)        |

> Nota: suman ~350 KB al bundle del build (el warning de Vite de chunk > 500 KB es esperado).

---

## 3. Archivos: resumen

| Archivo                                   | Acción                 |
| ----------------------------------------- | ---------------------- |
| `src/lib/report.ts`                       | **Reemplazar**         |
| `src/components/InformeButton.tsx`        | **Crear**              |
| `src/components/FormacionesPage.tsx`      | Modificar (props + botón) |
| `src/components/LocomotoraPage.tsx`       | Modificar (props + botón) |
| `src/App.tsx`                             | Modificar (datos cruzados) |

---

## 4. Paso 1 — `src/lib/report.ts` (reemplazo completo)

Reemplazar el contenido de `src/lib/report.ts` por el siguiente. Se eliminan
`generarInforme()` y `compartirInforme()` (TXT) y se agregan
`generarInformePDF()` y `compartirInformePDF()`.

```ts
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
```

### Detalles a tener en cuenta

- **Dos líneas al alto del logo**: `encabezado()` dibuja el logo de 16 mm y coloca las dos
  líneas con interlineado `fontSize * 1.2 / MM_POR_PT` mm, centradas verticalmente sobre el
  alto del logo.
- **Hoja separada por sección**: `doc.addPage()` entre las dos tablas; cada hoja arranca con
  su propia caja `resumenSeccion()`.
- **Gráfico de barras**: escala las barras al máximo (`Math.max(1, ...)` evita dividir por 0)
  con colores semáforo `#22c55e` / `#f59e0b` / `#ef4444` y el valor sobre cada barra.
- **Acentos**: los textos (í, ó, á, é, ñ) funcionan con las fuentes estándar de jsPDF (WinAnsi).
- Si no hay carpeta `public/icons/icon-512.png`, el encabezado se dibuja sin logo (no rompe).

---

## 5. Paso 2 — `src/components/InformeButton.tsx` (crear)

```tsx
import { useState } from "react"
import { FileDown } from "lucide-react"
import { compartirInformePDF, generarInformePDF } from "../lib/report"
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
```

> El botón se usa en los headers translúcidos de ambas páginas (por eso `bg-white/15`).
> Ajustá la clase si el header del proyecto final es distinto.

---

## 6. Paso 3 — Conectar el botón en las páginas

### 6.1 `src/components/FormacionesPage.tsx`

1. Reemplazar los imports:

```ts
// Antes
import { FileDown, LayoutGrid, LogOut, Table2 } from "lucide-react"
// Después
import { LayoutGrid, LogOut, Table2 } from "lucide-react"
```

```ts
// Agregar
import { InformeButton } from "./InformeButton"
import type { Locomotora } from "../lib/typesLocomotoras"
```

2. Quitar el import de `report`:
```ts
import { compartirInforme, generarInforme } from "../lib/report"   // ELIMINAR
```

3. Agregar la prop `locomotoras` a la interfaz y al desestructurado:

```ts
interface Props {
  datos: UseFormacionesResult
  esEditor: boolean
  esVisitante: boolean
  usuario: { email?: string | undefined } | null
  rol: "admin" | "editor" | null
  ahora: string
  locomotoras: Locomotora[]            // NUEVO
  onSalir: () => void
}

export function FormacionesPage({ datos, esEditor, esVisitante, usuario, rol, ahora, locomotoras, onSalir }: Props) {
```

4. Eliminar el estado y la función del informe TXT:

```ts
const [tipoInforme, setTipoInforme] = useState<string | null>(null)   // ELIMINAR

const informe = (tipo: string) => { ... }                             // ELIMINAR (función completa)
```

5. Reemplazar el botón TXT por el componente (sigue dentro de `{esEditor && …}`):

```tsx
{esEditor && (
  <InformeButton formaciones={formaciones} locomotoras={locomotoras} />
)}
```

### 6.2 `src/components/LocomotoraPage.tsx`

1. Agregar imports:
```ts
import { InformeButton } from "./InformeButton"
import type { Formacion } from "../lib/types"
```

2. Agregar la prop `formaciones` a la interfaz y al desestructurado (igual que arriba).

3. Debajo del bloque del `SyncBadge`, agregar la fila de botones:

```tsx
<div className="mt-3 flex gap-2 flex-wrap items-center">
  {supabaseConfigurado && (
    <SyncBadge online={online} pendientes={pendientes} onSync={() => void syncPending()} />
  )}
</div>

{/* NUEVO */}
<div className="mt-3 flex gap-2 flex-wrap">
  {esEditor && <InformeButton formaciones={formaciones} locomotoras={locomotoras} />}
</div>
```

### 6.3 `src/App.tsx` — pasar los datos cruzados

Pasar a cada página también los datos de la otra sección (el informe usa ambas):

```tsx
<FormacionesPage
  datos={formaciones}
  esEditor={esEditor}
  esVisitante={esVisitante}
  usuario={usuario}
  rol={rol}
  ahora={ahora}
  locomotoras={locomotoras.locomotoras}   // NUEVO
  onSalir={usuario ? salirYVerComoVisitante : salirDelModoVisitante}
/>
…
<LocomotoraPage
  datos={locomotoras}
  ...
  formaciones={formaciones.formaciones}   // NUEVO
  onSalir={usuario ? salirYVerComoVisitante : salirDelModoVisitante}
/>
```

---

## 7. Verificación

```bash
npm install            # 1° (jspdf + jspdf-autotable)
npm run lint          # oxlint, sin warnings
npm run build         # tsc -b && vite build (puede avisar por tamaño de chunk, es esperado)
npm run dev           # http://localhost:5173
```

Prueba manual:

1. Entrar como admin (en el proyecto original: login real; en local con
   `VITE_MODODEMO=1` entrás directo o tocás "Entrar como admin (modo local)").
2. En **Formaciones** y en **Locomotoras**, tocar **Informe PDF**.
3. Comprobar:
   - Encabezado con logo + dos líneas "Planificación y / Control de servicios" en azul.
   - Hoja 1: resumen de formaciones + gráfico de barras + tabla.
   - Hoja 2: resumen de locomotoras + gráfico de barras + tabla.
   - En el celular con `navigator.share` disponible, ofrece compartir el archivo.

---

## 8. Estructura final (referencia)

```
src/
  lib/
    report.ts               generaInformePDF() + compartirInformePDF()
                            (logo, resumen con gráfico, tablas por hoja)
  components/
    InformeButton.tsx       Botón "Informe PDF" (solo admin)
    FormacionesPage.tsx     Header con InformeButton + prop locomotoras
    LocomotoraPage.tsx      Header con InformeButton + prop formaciones
```

---

## 9. Notas / pendientes

- El PDF se genera **en el cliente** con jsPDF: no requiere backend ni Supabase
  (funciona offline para la generación local).
- Si el bundle crece demasiado por jsPDF, se puede hacer `import()` dinámico del
  módulo `report.ts` para cargarlo solo al tocar el botón.
- Los días/semáforo se calculan como en la app (`calcularDias`/`semaforo` en UTC);
  el informe usa exactamente los mismos datos que muestra la UI.