# Cambios para aplicar en producción

Guía para replicar en el proyecto real todos los cambios hechos en el demo:
iconos del menú, colores por sección, gradientes en tarjetas y la nueva sección **Lavado automático**.

---

## Resumen

| Área | Antes | Ahora |
| --- | --- | --- |
| Menú inferior | Iconos lucide (`TrainFront`, `Wrench`) | Iconos PNG 24×24 (`formacion24px.png`, `rodillolavado24px.png`, `locomotora24px.png`) |
| Color Formaciones | Azul | Azul (sin cambios, gradiente suave en cabecera de tarjeta) |
| Color Lavado | — (nuevo) | Naranja |
| Color Locomotoras | Azul | Verde (menú, tarjetas, tabla, estadísticas, modal) |
| Tarjetas | Cabecera gris `bg-slate-200/40` | Gradiente suave del color de la sección |
| Nueva sección | — | Lavado automático (formaciones 1–23) |

---

## Archivos creados

| Archivo | Descripción |
| --- | --- |
| `public/icons/formacion24px.png` | Icono Formaciones (24×24) |
| `public/icons/locomotora24px.png` | Icono Locomotoras (24×24) |
| `public/icons/rodillolavado24px.png` | Icono Lavado (24×24, generado desde `lavado.png`) |
| `src/lib/typesLavado.ts` | Tipos, opciones y estilos OK de lavado |
| `src/hooks/useLavados.ts` | Hook con realtime, offline y alta/baja/modificación |
| `src/components/LavadoCard.tsx` | Tarjeta de lavado (edición incl. pasadas, alta y eliminar) |
| `src/components/LavadoPage.tsx` | Página Lavado con formulario "Agregar lavado" |
| `supabase/migrations/0006_lavados.sql` | Tabla `lavados`, RLS, realtime y seed |

## Archivos modificados

| Archivo | Cambio |
| --- | --- |
| `src/App.tsx` | Ruta `"lavado"`, item del menú entre Formaciones y Locomotoras, colores por item |
| `src/components/FloatingNav.tsx` | `icon` acepta `ReactNode` (img), color activo por item, inactivo en gris (`grayscale opacity-60`) |
| `src/components/FormationCard.tsx` | Gradiente azul en cabecera |
| `src/components/LocomotoraCard.tsx` | Gradiente verde + toda la paleta a verde |
| `src/components/LocomotoraTable.tsx` | Verde (cabecera y foco) |
| `src/components/LocomotoraStats.tsx` | Borde verde en tarjetas clickeables |
| `src/components/LocomotoraInfoModal.tsx` | Verde (cabecera y chip) |
| `src/lib/seed.ts` | Nuevo `lavadosDemo()` |
| `src/lib/offline.ts` | Tabla `"lavados"` y tipos de operación `insert` / `delete` |

---

## 1. Iconos del menú flotante

### 1.1 Imágenes
Copiar y **redimensionar a 24×24** en `public/icons/`:

```bash
# Desde las imágenes originales (1536×1024) → cuadrado centrado 24×24
magick formacion24px.png -resize 24x24^ -gravity center -extent 24x24 public/icons/formacion24px.png
magick locomotora24px.png -resize 24x24^ -gravity center -extent 24x24 public/icons/locomotora24px.png
magick lavado.png         -resize 24x24^ -gravity center -extent 24x24 public/icons/rodillolavado24px.png
```

> Nota: en el demo los PNG originales ya estaban a 24×24; en producción generar el cuadrado 24×24 a partir de la fuente que tengas.

### 1.2 `src/components/FloatingNav.tsx`
El tipo `icon` pasa de `LucideIcon` a `ReactNode` (permite `<img>`), se agregan `activeText`/`underline` opcionales por item y el inactivo se atenúa:

```tsx
import type { ReactNode } from "react"          // antes: import type { LucideIcon } from "lucide-react"

export interface FloatingNavItem {
  key: string
  label: string
  icon: ReactNode                                  // antes: LucideIcon
  active?: boolean
  onClick?: () => void
  activeText?: string                              // nuevo
  underline?: string                               // nuevo
}
```

En el render, por item:

```tsx
const iconActive = item.activeText ?? activeText
const iconUnderline = item.underline ?? underline
const cs = item.active ? iconActive : "text-gray-400"
// ...
<span className={`transition ${item.active ? "" : "grayscale opacity-60"}`}>
  {item.icon}
</span>
<span className={`text-[10px] font-medium ${cs}`}>{item.label}</span>
{item.active && <span className={`h-0.5 w-6 rounded-full ${iconUnderline}`} />}
```

> El icono inactivo se muestra en gris (`grayscale + opacity-60`); el activo a pleno color. Esto sustituyó a `<Icon className="h-5 w-5 ..." />`.

### 1.3 `src/App.tsx` — items del menú (orden: Formaciones → Lavado → Locomotoras)

```tsx
type Pagina = "formaciones" | "lavado" | "locomotoras"
```

```tsx
<FloatingNav
  className="lg:bottom-6"
  items={[
    {
      key: "formaciones",
      label: "Formaciones",
      icon: <img src="/icons/formacion24px.png" alt="Formaciones" className="h-5 w-5 object-contain" />,
      active: pagina === "formaciones",
      onClick: () => setPagina("formaciones"),
      // activo usa el azul por defecto del componente
    },
    {
      key: "lavado",
      label: "Lavado",
      icon: <img src="/icons/rodillolavado24px.png" alt="Lavado" className="h-5 w-5 object-contain" />,
      active: pagina === "lavado",
      onClick: () => setPagina("lavado"),
      activeText: "text-orange-600",   // naranja
      underline: "bg-orange-500",
    },
    {
      key: "locomotoras",
      label: "Locomotoras",
      icon: <img src="/icons/locomotora24px.png" alt="Locomotoras" className="h-5 w-5 object-contain" />,
      active: pagina === "locomotoras",
      onClick: () => setPagina("locomotoras"),
      activeText: "text-green-600",    // verde
      underline: "bg-green-500",
    },
  ]}
/>
```

Eliminar el import de `TrainFront, Wrench` de `lucide-react` (quedan sin uso). Formaciones conserva el azul por defecto de `FloatingNav` (`text-blue-600` / `bg-blue-500`).

---

## 2. Colores por sección

| Sección | Menú activo | Cabecera de tarjeta (gradiente suave) | Chip número | Botones Acción | Focos de inputs |
| --- | --- | --- | --- | --- | --- |
| **Formaciones** | azul (default) | `from-blue-50 via-blue-100 to-sky-100` | `bg-brand text-white` | `bg-brand hover:bg-brand-strong` | `focus:border-brand focus:ring-brand-mid` |
| **Lavado** | `text-orange-600` / `bg-orange-500` | `from-orange-50 via-orange-100 to-amber-100` | `bg-orange-600 text-white` | `bg-orange-600 hover:bg-orange-700` | `focus:border-orange-500 focus:ring-orange-200` |
| **Locomotoras** | `text-green-600` / `bg-green-500` | `from-green-50 via-green-100 to-emerald-100` | `bg-green-600 text-white` | `bg-green-600 hover:bg-green-700` | `focus:border-green-600 focus:ring-green-300` |

### 2.1 Locomotoras (todo a verde)

**`src/components/LocomotoraCard.tsx`** — reemplazar los usos de `bg-brand` / `brand-*`:
```
bg-brand                     →  bg-green-600
hover:bg-brand-strong        →  hover:bg-green-700
focus:border-brand focus:ring-2 focus:ring-brand-mid → focus:border-green-600 focus:ring-2 focus:ring-green-300
focus:border-brand           →  focus:border-green-600
```

**`src/components/LocomotoraTable.tsx`**
```
<tr className="bg-brand text-white text-left">   →   bg-green-600
focus:border-brand                               →   focus:border-green-600
```

**`src/components/LocomotoraStats.tsx`**
```
border-brand/30  →  border-green-600/30
```

**`src/components/LocomotoraInfoModal.tsx`**
```
bg-brand (header)          →  bg-green-600
bg-brand-soft text-brand-strong (chip)  →  bg-green-100 text-green-700
```

### 2.2 Formaciones
No cambió la paleta base (azul `brand` intacto). Solo el gradiente de cabecera (ver abajo).

### 2.3 Lavado
Todo el tema naranja se define dentro de los archivos nuevos (`LavadoCard.tsx`, `LavadoPage.tsx`, `typesLavado.ts`), ver sección 4.

---

## 3. Gradiente en la parte superior de las tarjetas

**`src/components/FormationCard.tsx`** (línea del header):
```tsx
// Antes:
<div className="flex items-center justify-between px-4 py-3 bg-slate-200/40 border-b border-slate-200">
// Después (suave, semitransparente, mismo "blur" visual que el cuerpo bg-slate-100/90):
```

```tsx
<div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-50 via-blue-100 to-sky-100 border-b border-slate-200">
```
El chip del número se mantiene `bg-brand text-white` y el texto de la cabecera vuelve a oscuro:
```tsx
<span className="inline-flex ... rounded-lg bg-brand text-white font-bold text-sm">{f.formacion}</span>
<p className="text-xs text-slate-400 uppercase tracking-wide">Formación</p>
<p className="font-semibold text-slate-700 leading-none">N° {f.formacion}</p>
```

**`src/components/LocomotoraCard.tsx`**:
```tsx
// Antes:
<div className="flex items-center justify-between px-4 py-3 bg-slate-200/40 border-b border-slate-200">
// Después:
<div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-green-50 via-green-100 to-emerald-100 border-b border-slate-200">
```
Chip y textos:
```tsx
<span className="inline-flex ... rounded-lg bg-green-600 text-white font-bold text-sm">{l.locomotora}</span>
<p className="text-xs text-slate-400 uppercase tracking-wide">Locomotora</p>
<p className="font-semibold text-slate-700 leading-none">N° {l.locomotora}</p>
```

> Usamos la versión **suave** (pastel). Los stops llevan opacidad para que la cabecera conserve la translucidez del cuerpo de la tarjeta (`bg-slate-100/90`).

---

## 4. Nueva sección: Lavado automático

### 4.1 `src/lib/typesLavado.ts`
```ts
export interface LavadoDB {
  id: number
  formacion: number            // 1–23
  ingreso: string | null       // "HH:MM"
  egreso: string | null
  pasadas: number | null
  ok: boolean | null
  created_at: string
}
export type Lavado = LavadoDB
export type CamposEditablesLavado = Pick<LavadoDB, "formacion" | "ingreso" | "egreso" | "pasadas" | "ok">

export const FORMACIONES_LAVADO: number[] = Array.from({ length: 23 }, (_, i) => i + 1)

export const OK_OPCIONES = [
  { value: "si", label: "Sí" }, { value: "no", label: "No" }, { value: "sin", label: "Sin datos" },
]
export const OK_LABEL: Record<string, string> = { si: "OK", no: "Pendiente", sin: "Sin datos" }

// Badge superior de la tarjeta: OK verde, Pendiente naranja, Sin datos gris
export const OK_STYLE: Record<string, string> = {
  si:  "bg-green-100 text-green-700 border-green-400",
  no:  "bg-orange-100 text-orange-700 border-orange-400",
  sin: "bg-slate-100 text-slate-500 border-slate-300",
}
export function okValor(ok: boolean | null): string { /* si / no / sin */ }
```

### 4.2 `src/lib/seed.ts` — `lavadosDemo()`
Devuelve registros de ejemplo `LavadoDB[]` con `created_at` decreciente y algunas formaciones sin datos (`null`).

### 4.3 `src/lib/offline.ts`
```ts
export type TablaOp = "formaciones" | "locomotoras" | "lavados"
export type TipoOp = "insert" | "update" | "delete"

export interface PendingOp {
  id: string
  tabla: TablaOp
  registroId: number
  campos: Partial<CamposEditables> | Partial<CamposEditablesLocomotora> | Partial<CamposEditablesLavado>
  tipo: TipoOp
  ts: number
}
```
`addOp(tabla, registroId, campos, tipo = "update")`.

### 4.4 `src/hooks/useLavados.ts`
Espejo de `useFormaciones` + **alta/baja/edición**:
- `load()` → tabla `lavados`, realtime `realtime-lavados`; orden por `created_at` desc.
- `aplicarCambio(id, campos)` → edición (op `update`).
- `agregarLavado(campos)` → inserta con id temporal negativo; si online hace `.insert().select().single()` y reemplaza el temporal por el real; si offline lo encola como `tipo: "insert"`.
- `eliminarLavado(id)` → elimina de estado y encola op `tipo: "delete"` (o borra en Supabase si está online).
- `syncPending()` → procesa `insert` / `update` / `delete` pendientes.

### 4.5 `src/components/LavadoCard.tsx`
Misma estructura que `FormationCard` con tema naranja:
- Header: `bg-gradient-to-r from-orange-50 via-orange-100 to-amber-100`, chip `bg-orange-600 text-white`, título "Formación · N° X".
- Badge superior: `OK_STYLE[okValor(l.ok)]` (verde/naranja/gris).
- Cuerpo: Hora ingreso, Hora egreso (`type="time"`), **Pasadas rodillos** (`type="number"`, editable), **Lavado OK** (select Sí/No/Sin datos).
  - ⚠️ La fila "Pasadas rodillos" DEBE tener su input en modo edición (era el bug: solo estaba en modo lectura).
  - El valor "Lavado OK" **abajo** es neutro (sin color): `bg-white border-slate-300 text-slate-700`.
- Fila con botones: Eliminar (si `onEliminar`), Cancelar, Guardar (`bg-orange-600 hover:bg-orange-700`).

### 4.6 `src/components/LavadoPage.tsx`
- Header oscuro tipo las demás secciones + subtítulo "Lavado automático de formaciones".
- Solo vista de tarjetas (sin toggle tabla).
- **Botón "＋ Agregar lavado"** (visible solo para `esEditor`): formulario inline con Formación (select 1–23), Hora ingreso/egreso, Pasadas rodillos y Lavado OK → `agregarLavado(...)`.
- Card de cada registro con `aplicarCambio` y `eliminarLavado`.
- Footer leyenda: verde = OK, naranja = Pendiente, gris = Sin datos.

### 4.7 `src/App.tsx` — enrutado
```tsx
const lavados = useLavados()
// ...
) : pagina === "lavado" ? (
  <LavadoPage
    datos={lavados}
    esEditor={esEditor} esVisitante={esVisitante} usuario={usuario} rol={rol}
    ahora={ahora}
    onSalir={usuario ? salirYVerComoVisitante : salirDelModoVisitante}
  />
) : (
```
El item del menú "Lavado" ya está descrito en la sección 1.3.

### 4.8 Migración `supabase/migrations/0006_lavados.sql`
```sql
create table if not exists public.lavados (
  id bigint generated always as identity primary key,
  formacion int not null check (formacion between 1 and 23),
  ingreso time,
  egreso time,
  pasadas int check (pasadas >= 0),
  ok boolean,
  created_at timestamptz not null default now()
);
alter table public.lavados replica identity full;
alter table public.lavados enable row level security;

-- Lectura pública / escritura solo editores (usual de las otras tablas)
create policy "Lectura pública de lavados"     on public.lavados for select using (true);
create policy "Insertar solo editores lavados" on public.lavados for insert with check (public.es_editor());
create policy "Actualizar solo editores lavados" on public.lavados for update using (public.es_editor()) with check (public.es_editor());
create policy "Eliminar solo editores lavados" on public.lavados for delete using (public.es_editor());

-- Seed de ejemplo + publicación realtime (mismo patrón que 0004)
```
> No hay `unique` en `formacion`: pueden existir varios lavados por formación (registro por evento).

---

## Checklist para producción

1. Copiar/comprimir las 3 imágenes PNG en `public/icons/` (24×24).
2. Modificar `FloatingNav.tsx` (ReactNode + color por item + gris inactivo).
3. Actualizar `App.tsx`: import `LavadoPage`/`useLavados`, tipo `Pagina`, render condicional, items del menú.
4. Aplicar paleta verde en los 4 archivos de Locomotoras.
5. Aplicar gradientes azul/verde en las cabeceras de `FormationCard` y `LocomotoraCard`.
6. Copiar archivos nuevos de lavado (`typesLavado`, `useLavados`, `LavadoCard`, `LavadoPage`) y modificar `seed.ts` + `offline.ts`.
7. Ejecutar en Supabase: `supabase/migrations/0006_lavados.sql`.
8. Verificar:
   ```bash
   npm run build && npm run lint
   ```