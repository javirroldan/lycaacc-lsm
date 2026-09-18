# Migración a producción — 2026-09-18

Guía para replicar en la webapp de producción todos los cambios hechos hoy en el demo:
sección **Lavado** (tarjetas por formación que acumulan lavados), **confirmación al eliminar**
(modal por sección), **quitar vista de tabla**, **informes con rango de fechas**, **modales
centrados (portal)** y **selector desplegable propio** (bug del `<select>` nativo en móvil).

---

## Resumen

| Área | Antes | Ahora |
| --- | --- | --- |
| Vista Formaciones/Locomotoras | Tarjetas o tabla (toggle) | Solo tarjetas |
| Tarjeta de Lavado | Un lavado por formación | Tarjeta expansible que acumula **N lavados** (historial scrollable) |
| Alta de lavado | Pasadas y OK completados a mano | Solo Formación + ingreso/egreso; `pasadas=2` y `ok=true` por defecto |
| Eliminar | Confirmación simple | Doble confirmación (modal) con el color de la sección (azul/verde/naranja) |
| Informes PDF | Reporte completo | Modal con **rango de fechas** (desde/hasta) del color de la sección; filtra los datos y agrega línea "Período" |
| Modales | Podían aparecer arriba/cortados | Renderizados por **portal a `document.body`** → centrados siempre |
| Selector Formación (Agregar lavado) | `<select>` nativo (se desbordaba en móvil) | `DropdownSelect` propio con scroll y apertura hacia abajo/arriba |
| Leyenda de lavado | "Lavado OK: OK" | Etiqueta "Lavado" + valor "OK" en **verde** |

---

## Precedencia / Prerequisitos

Este documento **vale por sí solo** y **reemplaza por completo al informe PDF intermedio** de
`IMPLEMENTAR-INFORME-PDF.md` (un PDF de 2 páginas con los datos de Formaciones y Locomotoras
cruzados). **No hace falta aplicar aquel documento ni ninguna versión intermedia de reportes**:
los archivos finales listados acá (`report.ts`, `InformeButton.tsx`, páginas y `App.tsx`) ya los
sustituyen. Al aplicar esta guía quedan además eliminadas las **props cruzadas**
(`locomotoras` / `formaciones`) que agregó IMPLEMENTAR a las páginas y a `App.tsx`.

Producción ya tiene (no re-instalar ni re-crear):

| Ya presente | Detalle |
| --- | --- |
| Dependencias `jspdf` + `jspdf-autotable` | Instaladas con IMPLEMENTAR-INFORME-PDF.md |
| Logo `public/icons/icon-512.png` | Logo del encabezado del PDF |
| Base de la sección Lavado | Tabla `lavados` + RLS/realtime, `typesLavado.ts`, `useLavados.ts`, `0006_lavados.sql` (de CAMBIOS-PARA-PRODUCCION.md) |

> Si por algún motivo producción NO tuviera la base de Lavado o las dependencias del PDF,
> aplicarlas antes siguiendo CAMBIOS-PARA-PRODUCCION.md e IMPLEMENTAR-INFORME-PDF.md
> (solo su paso de instalación), y luego volver a esta guía.

---

## Archivos creados (nuevos en producción)

| Archivo | Descripción |
| --- | --- |
| `src/components/ConfirmModal.tsx` | Modal de doble confirmación reutilizable, temas `azul`/`verde`/`naranja`; render por portal |
| `src/components/DateRangeModal.tsx` | Modal de rango de fechas (Desde/Hasta) con el color de la sección; render por portal |
| `src/components/DropdownSelect.tsx` | Selector desplegable propio (portal a `document.body`): scroll interno, abre hacia abajo (o arriba si no hay espacio), cierra tocando afuera / `Escape` / scroll de la página |
| `src/lib/temas.ts` | `TemaColor` ("azul" | "verde" | "naranja") y `TEMAS` con clases de header/botón por sección |
| `src/components/InformeButton.tsx` | Botón "Informe PDF" (solo admin): abre `DateRangeModal` y genera/comparte el PDF con el rango elegido |

## Archivos modificados

| Archivo | Cambio |
| --- | --- |
| `src/lib/typesLavado.ts` | `NuevoLavado` (`formacion`, `ingreso`, `egreso`); `PASADAS_DEFAULT = 2`; `OK_DEFAULT = true`; se quitó `OK_STYLE` |
| `src/hooks/useLavados.ts` | `agregarLavado(campos: NuevoLavado)` inserta siempre `pasadas=2` y `ok=true` |
| `src/components/LavadoCard.tsx` | Reescrita: acumula registros, expandible (historial scrollable `max-h-[320px]`), editar/eliminar por registro, footer "Agregar", label "Lavado" + valor OK en verde/ámbar/gris, `ConfirmModal` naranja |
| `src/components/LavadoPage.tsx` | Agrupa por formación (solo con lavados, 1–23), `formacionesDisponibles`, form sin pasadas/OK, aviso "todas ya tienen tarjeta", contador registros·formaciones, informe naranja con rango, usa `DropdownSelect` |
| `src/components/FormationCard.tsx` | Eliminar ahora pasa por `ConfirmModal` azul |
| `src/components/FormacionesPage.tsx` | Sin prop `locomotoras`; sin `vista`/toggle/`FormationTable` (solo tarjetas); informe azul con rango |
| `src/components/LocomotoraPage.tsx` | Sin vista de tabla (solo tarjetas); informe verde con rango |
| `src/App.tsx` | Ya no pasa `locomotoras`/`formaciones` a las páginas |
| `src/lib/report.ts` | Tres generadores con firma `(datos, desde?, hasta?)`, filtro por rango (`ultima` en formaciones/locomotoras, `created_at` en lavados), línea "Período: X — Y" en el PDF |
| `src/lib/seed.ts` | `lavadosDemo()` con múltiples registros por formación (1, 4, 8, 13, 20), todos `pasadas=2`, `ok=true` |
| `supabase/migrations/0006_lavados.sql` | Seed actualizado a pasadas 2 / ok true y múltiples registros por formación |
| `src/components/InfoModal.tsx` | Render por portal a `document.body` (fija posición) |
| `src/components/LocomotoraInfoModal.tsx` | Render por portal a `document.body` |

## Archivos eliminados

| Archivo | Motivo |
| --- | --- |
| `src/components/FormationTable.tsx` | Ya no hay vista de tabla |
| `src/components/LocomotoraTable.tsx` | Ya no hay vista de tabla |

---

## Detalle por área

### 1. Sección Lavado

- **Datos**: `agregarLavado` recibe solo `{ formacion, ingreso, egreso }`; siempre crea el registro con `pasadas = 2` y `ok = true` (constantes `PASADAS_DEFAULT` / `OK_DEFAULT` en `typesLavado.ts`).
- **Tarjeta por formación**: acumula los registros de esa formación.
  - **Colapsada**: muestra "Último lavado" (el más reciente) y el chip con el número de registros.
  - **Clic en la tarjeta**: se expande al doble con el historial completo, scroll interno, más reciente primero.
  - **Editar / Eliminar** por registro (solo admin), dentro del historial expandido.
  - **Footer "Agregar"** (solo admin): formulario inline con Cancelar/Guardar (solo horarios ingreso/egreso).
  - Sin badge de OK en el encabezado; las filas "Pasadas rodillos" y "Lavado" van en la misma línea separadas por un divider.
- **Página**: agrupa los lavados por formación (solo formaciones con ≥ 1 registro, orden 1 → 23, registros más reciente primero). El botón **"+ Agregar lavado"** solo lista las formaciones que todavía no tienen tarjeta; si todas ya tienen, muestra un aviso y se usa el botón "Agregar" de cada tarjeta.
- **Leyenda** de la tarjeta: la etiqueta ahora dice "Lavado" y el valor muestra **OK en verde** (Pendiente en ámbar, Sin datos en gris) → sin repetir "OK".

### 2. Confirmación al eliminar

- Nuevo `ConfirmModal` con tema por sección: Formaciones **azul**, Locomotoras **verde** (aunque todavía no hay acción de eliminar ahí), Lavado **naranja**.
- El primero click en "Eliminar" abre el modal con **Confirmar / Cancelar**. Solo confirma al tocar el botón del tema (naranja en Lavado, azul en Formaciones).
- Locomotoras no tiene acción de eliminar; cuando se agregue, usar `ConfirmModal` con `tema="verde"`.

### 3. Quitar vista de tabla

- `FormacionesPage` y `LocomotoraPage`: eliminados el estado `vista`, el botón toggle ("Vista tabla/tarjetas") y las ramas que renderizaban `FormationTable` / `LocomotoraTable`. Ahora siempre se muestran las tarjetas.
- Se borraron los dos componentes de tabla (dead code).

### 4. Informes PDF con rango de fechas

- **Modal de rango**: al tocar "Informe PDF" se abre `DateRangeModal` (color de la sección) con **Desde / Hasta** y botones Cancelar / Generar informe.
  - Si quedan los dos vacíos → informe completo (todo el historial).
  - Validación: "Hasta" no puede ser anterior a "Desde".
- **Filtro**:
  - Formaciones y Locomotoras → se filtran por la fecha del último lavado (`ultima`).
  - Lavado → se filtra por la fecha de carga (`created_at`).
- El PDF agrega la línea **"Período: desde — hasta"** debajo de la fecha de generación, y el resumen + la tablas reflejan los datos filtrados.
- `InformeButton` recibe `tema` y `tituloModal` ("Informe de formaciones / locomotoras / lavado").

### 5. Modales centrados (portal)

- `ConfirmModal`, `DateRangeModal`, `InfoModal` y `LocomotoraInfoModal` se renderizan con `createPortal(..., document.body)`.
- **Por qué**: los headers de las páginas usan `backdrop-blur` (efecto glass), que crea un contenedor que atrapa los `position: fixed` → los modales aparecían arriba y cortados. Con el portal quedan **centrados en el centro de la pantalla** siempre.

### 6. DropdownSelect (selector de Formación en Agregar lavado)

- El `<select>` nativo en móviles (Chrome/Android) abría el popup desbordado a la derecha/arriba y el `overflow-x: clip` del `html` lo cortaba.
- Reemplazado por `DropdownSelect`: panel propio renderizado por portal, ancho del campo, **scroll interno** (funciona con rueda del mouse y touch), se abre hacia abajo (o hacia arriba si no hay espacio) y no sale de la pantalla.
- Extendible a los `<select>` de las tarjetas (pasadas/OK, servicio, estado) si aparece el mismo problema.

---

## Base de datos (Supabase)

- La tabla `lavados`, RLS, realtime y seed ya vienen de `supabase/migrations/0006_lavados.sql`.
- **Seed actualizado** en la migración: registros para las formaciones **1, 4, 8, 13 y 20** (2–3 lavados cada una), todos con `pasadas = 2` y `ok = true`, `created_at` espaciados cada 2 días.
- Si en producción ya se aplicó el seed anterior (un solo registro por formación), para probar el historial acumulado re-cargar los datos de ejemplo o cargar nuevos lavados desde el formulario (el alta ya crea `pasadas=2` / `ok=true` automáticamente).

---

## Pasos de verificación

```bash
npm install        # opcional — hoy no se agregan librerías nuevas (jspdf ya está en producción)
npm run build      # tsc -b + vite build
npm run lint
npm run dev        # probar en el teléfono (móvil) también
```

Checklist:

1. Abrir **Lavado**: las tarjetas agrupan los lavados; clic expande el historial con scroll; Editar/Eliminar/Agregar funcionan.
2. En **Agregar lavado**, elegir Formación: el desplegable no se desborda y el scroll interno funciona en móvil y PC.
3. **Eliminar** (lavado y formación) pide doble confirmación con el color de la sección.
4. **Informe PDF** en cada sección: la ventana aparece **centrada**, se elige el rango, se genera y el PDF muestra el período y los datos filtrados.
5. **Formaciones** y **Locomotoras**: ya no hay botón de vista tabla, solo tarjetas.
6. Los modales (info, confirmación, rango) quedan centrados en el teléfono.

> Nota de dependencias: si producción no tiene `react-dom` completo o ya usa React 19, el portal usa `react-dom` (ya es dependencia estándar). No se agregó ninguna librería nueva hoy.