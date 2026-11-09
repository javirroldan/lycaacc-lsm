# Trenes App — Planificación y control de servicios

Webapp móvil (PWA) para la planificación y control de servicios de lavado de formaciones y de locomotoras. React + Vite + Tailwind, backend en **InsForge** (PostgreSQL + Auth + Realtime), desplegado en InsForge Sites / Vercel. Proyecto paralelo del repo original `aacc-lsm` (trenes-app).

> **Estado local (pendiente):** los cambios de las secciones **Basurales**, **Zona crítica** y **Fachada entorno**, más el campo **Orden de servicio** en Basurales/Zona crítica (pantallas, formularios/historial, migraciones, informes PDF e integración en el menú) están implementados **solo en local** en este workspace. Las tablas `basurales`, `zona_critica` y `fachada_entorno` y la columna `orden_servicio` fueron aplicadas al backend InsForge del proyecto para pruebas (vía `db import`; el CLI no las tiene trackeadas en `migrations up` por un error de nombre de archivo en las migraciones de Basurales/Zona crítica), pero **no hay commit/push** de estos cambios al repositorio remoto todavía.

Seis secciones navegables desde el **menú flotante** inferior (orden: **Formaciones · Locomotoras · Lavado · Basurales · Z. crítica · Fachada**):
- **Formaciones**: planificación y control de servicios de lavado de formaciones.
- **Locomotoras**: días sin lavado de las locomotoras, con su propio semáforo por criticidad.
- **Lavado**: lavado automático por formación: tarjetas que acumulan **N lavados** (fecha, horarios, pasadas y resultado).
- **Basurales** *(nuevo, local)*: carga de datos por formulario (**orden de servicio** primero, fecha, proveedor, OC, domicilio, supervisor, horarios, suspensión por mal tiempo, insumos, residuos retirados y evaluación diaria) con **historial** de registros.
- **Zona crítica** *(nuevo, local)*: carga de datos por formulario (**orden de servicio** primero, fecha, proveedor, OC, sector de intervenciones, supervisor, horarios, suspensión por mal tiempo, insumos, datos por **4 sectores/tramos** (`0–0.650`, `0.650–1.100`, `1.100–1.600`, `1.600–2.100 km`) y evaluación diaria) con **historial**.
- **Fachada entorno** *(nuevo, local)*: **22 tarjetas fijas por estación** (Retiro, Palermo, Villa Crespo, La Paternal, Villa del Parque, Devoto, Sáenz Peña, Santos Lugares, Caseros, El Palomar, Hurlingham, William Morris, Bella Vista, Muñiz, San Miguel, José C. Paz, Sol y Verde, Presidente Derqui, Villa Astolfi, Pilar, Manzanares, Dr. Domingo Cabred) que **acumulan historial de cargas** (estilo Lavado/Formaciones) con formulario tipo Basurales/Zona crítica (fecha, proveedor, OC, sector, supervisor, horarios, suspensión por mal tiempo, insumos, **11 ítems de fachada** Bueno/Regular/Malo y evaluación diaria). La carga se hace **solo desde cada tarjeta** (sin botón global; sin selector de estación).

- **Admin**: edita fechas, estado y descripción en Formaciones/Locomotoras, carga/edita/elimina lavados y gestiona registros de Basurales/Zona crítica/Fachada entorno. Login con **usuario + contraseña** (no hay registro público).
- **Empleado**: acceso en solo lectura, sin login; los cambios del admin se ven en vivo. No tiene acceso a los informes PDF.

## Puesta en marcha

### 1. InsForge

1. Creá un proyecto en [insforge.app](https://insforge.app). Anotá la **URL** (`https://<proyecto>.insforge.app`) y las claves **ANON_KEY** y **API_KEY** (panel de secretos, o `npx @insforge/cli secrets get`).
2. Aplicá las migraciones con el CLI:
   ```bash
   npx @insforge/cli login
   npx @insforge/cli link            # vinculá el proyecto en esta carpeta
   npx @insforge/cli db migrations up --all
   ```
   Esto crea tablas (`formaciones`, `roles`, `historial`, `locomotoras`, `historial_locomotoras`, `lavados`, `servicios_*`, y —local/aplicado para pruebas vía `db import`— `basurales`, `zona_critica`, `fachada_entorno` y columna `orden_servicio` en Basurales/Zona crítica), funciones, RLS, triggers de auditoría y triggers **Realtime**, y aplica el seed base (23 formaciones + 26 locomotoras) y el seed de lavados demo. Ver carpeta `migrations/`.
3. **Login de admin**: es con **usuario + contraseña** (p. ej. `admin`). La app resuelve el usuario a un email interno (`admin` → `admin@trenes.local`) y la contraseña vive únicamente hasheada en InsForge Auth. Para crear la cuenta y asignarle el rol:
   ```bash
   cp .env.example .env
   # completá VITE_INSFORGE_ANON_KEY y, en .env.local, INSFORGE_URL / INSFORGE_API_KEY / INSFORGE_ADMIN_PASSWORD
   npm run setup:admin             # crea admin@trenes.local (auto-confirm) + rol admin
   ```
4. Sincronizá los datos de producción desde `backuotrenes.json` (opcional, ver `npm run sync`).

### 2. Configuración local

```bash
npm install
cp .env.example .env   # completá VITE_INSFORGE_URL y VITE_INSFORGE_ANON_KEY
npm run dev            # http://localhost:5173
```

Variables de entorno:

| Variable                    | Dónde      | Uso                                   |
| --------------------------- | ---------- | ------------------------------------- |
| `VITE_INSFORGE_URL`         | `.env`     | Cliente de la app                     |
| `VITE_INSFORGE_ANON_KEY`    | `.env`     | Cliente de la app (lectura + auth)    |
| `INSFORGE_API_KEY`          | `.env.local` | Solo para scripts (nunca en el front ni en git) |
| `INSFORGE_ADMIN_PASSWORD`   | `.env.local` | Password inicial del admin (setup:admin) |

`.env*` están en `.gitignore`; nunca se commitean.

### 3. Vercel / InsForge Sites

1. Subí el repo a GitHub.
2. En [vercel.com](https://vercel.com) → **Add New → Project**, importá el repo (o deployá desde InsForge Sites).
3. Framework preset: **Vite**. Build: `npm run build`. Output: `dist`.
4. En **Environment Variables** agregá `VITE_INSFORGE_URL` y `VITE_INSFORGE_ANON_KEY` y hacé **Deploy**.

## Funcionalidades

- **Seis secciones** (Formaciones, Locomotoras, Lavado, Basurales, Zona crítica y Fachada) navegadas con un **menú flotante** inferior; el ítem activo se resalta con el color de su sección (azul Formaciones, verde Locomotoras, naranja Lavado, **teal Basurales**, **rose Zona crítica**, **violeta Fachada**) y los inactivos quedan en gris. Basurales/Zona crítica/Fachada usan íconos temporales en el menú. En **teléfono el menú es desplazable horizontalmente** (ítems de 80px con scroll sin barra visible, clase `no-scrollbar`, y el ítem activo se centra solo); en desktop se reparte parejo.
- **Login solo admin** (usuario/contraseña) y **"Ver como empleado"** en solo lectura.
- El modo empleado **persiste al recargar** (se guarda en `localStorage`) y tiene su botón **Salir**.
- **Edición del admin con botones**: en modo admin la card es clicable (chevron en el header) y, al tocarla, se revelan abajo las acciones: **Editar card** y **Agregar lavado** (en Lavado, **Agregar**). Al tocar **Editar card** se activa el modo edición (botón pasa a **Listo**): ahí aparecen los botones **Editar / Eliminar** de cada registro del historial, más el bloque de **descripción** (y en Locomotoras el **servicio** Local/LD) con su **Guardar cambios**. Los cambios de historial se aplican al instante (optimista → IndexedDB → Sync a InsForge); descripción/servicio se persisten con su botón Guardar. Sin conexión queda encolado y sincroniza al reconectar. Aplica en Formaciones, Locomotoras y Lavado.
- **Eliminar** (de un registro del historial) pide **doble confirmación** con un `ConfirmModal` del color de la sección (**azul** en Formaciones, **verde** en Locomotoras) y elimina ese lavado; al quedar sin registros la card deriva a su estado por defecto.
- **Descripción/detalle** editable por admin (en modo edición); el **empleado** la ve (solo lectura) arriba de la línea de situación.
- **Historial de lavados en Formaciones y Locomotoras** (estilo Lavado): cada card acumula los lavados en un registro (`servicios_formaciones` / `servicios_locomotoras`). Cada registro guarda **fecha**, **situación** al momento de ingresar (en Formaciones: Limpieza / Reparación / Fuera de servicio / Activa; en Locomotoras: En servicio / Detenida) y, en Locomotoras, **servicio Local / LD**. El historial se ve expandiendo la card (más reciente primero, scroll interno) **en solo lectura**: cada fila muestra la fecha y sus badges de situación y servicio. Con **Editar card** se habilita la edición por registro (cambiar fecha, situación o servicio) y la baja. El botón **Agregar lavado** pide **fecha + situación** (+ servicio en Locomotoras, con `DateSelect` azul/verde y `SituacionSelect`). `ultima` = el registro más reciente, `anteultima` = el segundo, y **la Situación y el Servicio de la card se derivan del registro más reciente**; los **días de demora** se recalculan solos.
- **Locomotoras**: la card muestra último lavado, días sin lavar, semáforo por criticidad (verde 0-15, amarillo 16-28, rojo 29+), servicio (Local / LD), situación (En servicio / Detenida, derivada del último lavado) y descripción.
- **Lavado**: estadísticas clicables arriba de las tarjetas (**Registros**, **Formaciones**, **Sin lavados**) que abren un modal de detalle (`LavadoInfoModal`). El título **"Lavados"** muestra el **contador de tarjetas** en gris, igual que Formaciones y Locomotoras. Debajo, tarjetas acumulativas por formación (1–23, solo las que tienen ≥ 1 registro), clicables en toda la card. Colapsada muestra el **último lavado** con la etiqueta y el valor **en la misma línea** y su **fecha del lavado**; al tocarla se expande con el **historial completo** (scroll interno, más reciente primero por **fecha del lavado**), en **solo lectura**, y con **Editar card** en el pie se habilita la edición por registro: **Editar / Eliminar** (editar modifica **fecha del lavado** y **horas ingreso/egreso**; `pasadas` y OK quedan fijos). El pie muestra **Editar card** y **Agregar** lado a lado (como en Formaciones y Locomotoras), y el **Agregar** solo aparece al expandir la card. Mientras está abierto el formulario de nuevo lavado o una edición, tocar la card (incluidos los campos de fecha y hora) **no la colapsa ni cancela** la carga. La fila "Lavado" muestra **OK** en verde, **Pendiente** en ámbar y **Sin datos** en gris.
- **Alta de lavado** (**solo admin**): **Formación** + **fecha del lavado** + horas de ingreso/egreso; `pasadas=2` y `ok=true` se completan en automático (`PASADAS_DEFAULT` / `OK_DEFAULT`). La fecha permite **cargar registros pasados** (por defecto "hoy" y sin fechas futuras). El botón "+ Agregar lavado" (ancho completo de la card, entre el header y las tarjetas) solo lista las formaciones que todavía no tienen tarjeta; si todas ya tienen, se muestra un aviso y se usa el botón "Agregar" de cada tarjeta.
- **Selector de Formación propio** (`DropdownSelect`): renderizado por portal a `document.body` con **scroll interno**, ancho del campo, abre hacia abajo (o arriba si no hay espacio) y no se desborda en móvil (reemplaza el `<select>` nativo que se cortaba). Cierra tocando afuera, con `Escape` o scrolleando la página (no al scrollear dentro del panel).
- **Selector de hora propio** (`TimeSelect`): por portal a `document.body`, con columnas **Hora** (00–23) y **Minuto** (00–59) con scroll propio, la selección actual marcada y auto-scroll; abre hacia abajo (o arriba si no hay espacio) para que el menú nunca salga de la pantalla (el `<input type="time">` nativo se cortaba). Cierra tocando afuera, con `Escape` o al scrollear la página, y tiene opción **Limpiar**. Se usa en toda la sección Lavado (alta y edición de registros).
- **Calendario propio** (`DateSelect`): por portal a `document.body`, calendario mensual naranja para elegir la **fecha del lavado**; navegación de mes, **días futuros deshabilitados**, botón **Hoy** y opción **Limpiar**. Abre hacia abajo (o arriba si no hay espacio) y cierra tocando afuera, con `Escape` o al scrollear la página. Permite **cargar y editar lavados de días pasados**. Se usa en la alta, en el "Agregar" de cada tarjeta y en la edición de cada registro.
- **Realtime**: empleados y admin ven los cambios en vivo entre dispositivos (en todas las secciones). Lavado usa el canal `lavados` (`lavado:changed` / `lavado:deleted`) vía trigger `notificar_cambio_lavado`; Basurales usa `basurales` (`basural:changed` / `basural:deleted`), Zona crítica usa `zona_critica` (`zona_critica:changed` / `zona_critica:deleted`) y Fachada entorno usa `fachada_entorno` (`fachada_entorno:changed` / `fachada_entorno:deleted`).
- **Tarjetas informativas clicables**: los botones de `Limpieza`, `Reparación` y `Fuera de servicio` (Formaciones) abren un modal azul que enumera las formaciones en ese estado; el indicador `Locomotoras` (En servicio / Detenidas) abre un modal verde; y las tarjetas de Lavado (**Registros** / **Formaciones** / **Sin lavados**) abren un modal naranja que lista los registros de lavado, las formaciones con tarjeta y las formaciones 1–23 sin registros respectivamente. Útil para que los empleados sepan el detalle de cada grupo.
- **Orden por criticidad**: más días de demora arriba; las "fuera de servicio" (sin datos) abajo, separadas en su grupo.
- Solo se muestran **tarjetas** (se eliminó la vista de tabla / el toggle).
- Semáforo: verde 0-15 días, amarillo 16-28, rojo 29+ (los días y el semáforo se **calculan en el cliente** a partir de `ultima`). El día de ingreso cuenta **0 días** y se muestra como **"Hoy"** (la formación que entró ayer muestra **1 día**). Los días se calculan con **UTC** para que la fecha de ingreso (`ultima`) no se desplace por la zona horaria del dispositivo. La **leyenda del semáforo** (chips verde/amarillo/rojo con los rangos) está en el **header** de Formaciones y Locomotoras, en el mismo estilo del header (en Lavado, Basurales, Zona crítica y Fachada la fila queda vacía con igual alto —`min-h-[26px]`— para mantener el tamaño del header). Se eliminaron la leyenda del pie de página (toda la tarjeta blanca "Leyenda") y el badge de "modo edición / empleado (solo lectura)" de las tres secciones originales.
- **Informes PDF por sección** (**solo admin**): botón "Informe PDF" en cada sección que abre un modal de **rango de fechas** (`DateRangeModal`) con **Desde / Hasta**; si quedan vacíos se genera el informe completo. Formaciones (**azul**), Locomotoras (**verde**) y Lavado (**naranja**) generan una tabla agrupada por entidad con resumen/semáforo según corresponda. **Basurales** (**teal**), **Zona crítica** (**rose**) y **Fachada entorno** (**violeta**) generan informes con formato **tipo formulario/tablas** (inspirado en el PDF de ejemplo): datos generales, residuos/evaluación con columnas `Bueno | Regular | Malo` marcadas con `X`, y en Zona crítica una grilla por **4 sectores**; filtran por fecha (`fecha`, fallback `created_at`) dentro del período. En estos tres informes **la primera carga (la más reciente) va en la primera hoja** con el encabezado y el resumen, y **cada carga siguiente tiene su hoja propia** (de la última fecha a la más vieja). En Basurales/Zona crítica el título de cada carga es **`Orden de servicio N° XXXX — fecha`** (fallback a `Registro N — fecha` si no tiene orden) y la tabla empieza con **Orden de servicio | Fecha**; el resumen **no** incluye línea de intervalo. Compatible con `navigator.share` y fallback a descarga.
- **Basurales, Zona crítica y Fachada entorno** *(nuevo, local)*: formularios de carga con **historial** de registros (alta, edición, eliminación, sync offline y realtime). Basurales/Zona crítica llevan **orden de servicio primero** (fila completa arriba de fecha/proveedor), visible en tarjeta (`Orden N° XXXX · fecha · proveedor`), modales y PDF. Campos según el formulario de referencia (proveedor, OC, domicilio/sector, supervisor, horarios, suspensión por mal tiempo, insumos, residuos/cantidades, evaluación diaria y observaciones). Zona crítica almacena los datos de los 4 sectores en `jsonb` (`sectores`); las cantidades se guardan como texto para admitir formatos como `18 B.` / `5m3`. Fachada entorno: **22 tarjetas fijas por estación con historial interno**, sin botón global de nueva carga y sin selector de estación (la estación queda fija por tarjeta); el campo de insumos **queda en blanco** (sin placeholder del ejemplo). Tarjetas expandibles (Fachada colapsada = solo header, sin resumen Bueno/Regular/Malo; cargas del historial desplegables de a una), stats clicables e informe PDF por rango de fechas.
- **Modales centrados (por portal)**: `ConfirmModal`, `DateRangeModal`, `InfoModal`, `LocomotoraInfoModal` y `LavadoInfoModal` se renderizan con `createPortal(..., document.body)` para que queden **siempre centrados en la pantalla** (los headers usan `backdrop-blur`, que atrapaba los `position: fixed` y los dejaba cortados en móvil).
- Color de marca **`#0952E2`** (azul) en toda la UI; verde para Locomotoras, naranja para Lavado, teal para Basurales, rose para Zona crítica y violeta para Fachada entorno.
- PWA instalable con **icono propio**, scroll oculto, header con efecto **glass** y fondo fijo con foto `trenes.jpg` (configurado con `background-image` + `background-attachment: fixed` en `body`, para que no se redimensione al scrollear). Barra de estado del teléfono en tono oscuro (`#0a0e1a`).

## Scripts

| Comando         | Acción                                      |
| --------------- | ------------------------------------------- |
| `npm run dev`   | Servidor de desarrollo                      |
| `npm run build` | Compila TS + Vite (genera PWA)              |
| `npm run lint`  | Lint con oxlint                             |
| `npm run preview` | Previsualiza el build                     |
| `npm run sync`  | Upsert de `formaciones` desde `backuotrenes.json` usando la API key admin (ver `scripts/sync-backup.mjs`) |
| `npm run setup:admin` | Crea `admin@trenes.local` (auto-confirm) y le asigna rol `admin` (ver `scripts/setup-admin.mjs`) |

## Estructura del proyecto

```
src/
  main.tsx                  Punto de entrada (React + index.css + App)
  App.tsx                   Pantalla principal: gate de login/empleado, y
                            navegación entre Formaciones, Locomotoras, Lavado,
                            Basurales, Zona crítica y Fachada entorno con el
                            menú flotante (FloatingNav)
  index.css                 Tokens @theme (marca #0952E2), fondo fijo con
                            background-attachment: fixed, scroll oculto y
                            clase `no-scrollbar` para el menú flotante
  hooks/
    useAuth.ts              Sesión, rol, signIn/signOut (signIn resuelve
                            usuario → email con usuarioAEmail)
    useFormaciones.ts       Carga, orden por criticidad, suscripción
                            Realtime, cola de pendientes y sync; ahora
                            también maneja el historial (servicios_formaciones):
                            agregarServicio / aplicarCambioServicio /
                            eliminarServicio y deriva ultima/anteultima
    useLocomotoras.ts       Ídem para la tabla locomotoras (carga, Realtime,
                            cola de pendientes, sync e historial
                            servicios_locomotoras)
    useLavados.ts           Ídem para lavados (canal 'lavados', eventos
                            lavado:changed / lavado:deleted; insert/update/
                            delete con offline)
    useBasurales.ts         *(local)* Carga, Realtime, offline y CRUD para
                            `basurales` (historial de registros)
    useZonaCritica.ts       *(local)* Carga, Realtime, offline y CRUD para
                            `zona_critica` (historial, sectores en jsonb)
    useFachadaEntorno.ts    *(local)* Carga, Realtime, offline y CRUD para
                            `fachada_entorno` (historial por estación)
  lib/
    insforge.ts             Cliente InsForge, DOMINIO_ADMIN, usuarioAEmail,
                            fetchRol
    types.ts                Tipos: Estado, FormacionDB, Formacion,
                            CamposEditables, ESTADOS/ESTADO_LABEL
    typesLocomotoras.ts     Tipos: ServicioLocomotora, EstadoLocomotora,
                            LocomotoraDB, Locomotora, CamposEditablesLocomotora
    typesLavado.ts          Tipos de Lavado: LavadoDB/Lavado, NuevoLavado
                            (formacion/fecha/ingreso/egreso), PASADAS_DEFAULT=2,
                            OK_DEFAULT=true, FORMACIONES_LAVADO (1–23), okLabel,
                            claveOrdenLavado y ordenarPorRecienteLavado
                            (ordena por fecha del lavado, fallback a created_at)
    typesBasurales.ts       *(local)* Tipos/formulario de Basurales (orden de
                            servicio, residuos, evaluaciones, orden por fecha)
    typesZonaCritica.ts     *(local)* Tipos/formulario de Zona crítica
                            (orden de servicio, 4 sectores/tramos en jsonb,
                            evaluaciones)
    typesFachadaEntorno.ts  *(local)* Tipos/formulario de Fachada entorno
                            (22 ESTACIONES_FACHADA, 11 ítems de fachada en
                            jsonb `items`, agrupado por estación)
    typesServicios.ts       Tipos del historial de lavados (fecha + 
                            situacion por registro): ServicioFormacion/
                            ServicioLocomotora, ordenarServicios,
                            derivarFechas (ultima/anteultima) y los
                            tipos Nuevo/CamposEditables por tabla
    temas.ts                TemaColor ("azul" | "verde" | "naranja" | "teal" | "rose" |
                            "violeta") y TEMAS con clases de header/botón/foco
                            por sección
    dates.ts                parse/fmt de fechas, calcularDias, semaforo,
                            ordenarPorCriticidad; fechaHoy, toFechaKey y
                            fmtFechaLavado (fecha de lavado en "YYYY-MM-DD")
    datesLocomotoras.ts     semaforoLoco y ordenarPorCriticidadLoco (locomotoras)
    semaforo.ts             Umbrales del semáforo (UMBRAL_VERDE=15,
                             UMBRAL_AMARILLO=28), LEYENDA_SEMAFORO para los
                             chips del header y colorDias() para el color del
                             texto de días en cards y modales
    offline.ts              Cola de operaciones pendientes en IndexedDB
                            (formaciones, locomotoras, lavados,
                            servicios_formaciones/locomotoras, basurales,
                            zona_critica y fachada_entorno; soporta
                            insert/update/delete)
    report.ts               Generadores de PDF por sección con rango de fechas
                            y línea "Período" (jspdf + jspdf-autotable).
                            Formaciones/Locomotoras/Lavado: tabla agrupada por
                            entidad. Basurales/Zona crítica/Fachada entorno
                            *(local)*: informes tipo formulario/tablas
                            (evaluación B/R/M con X, sectores en Zona crítica,
                            11 ítems en Fachada); la primera carga en la
                            primera hoja y cada siguiente en hoja propia;
                            descarga y share
  components/
    AuthView.tsx            Login usuario/contraseña, "Ver como empleado",
                            LoadingScreen
    FloatingNav.tsx         Menú flotante inferior (blanco) para navegar
                            entre Formaciones, Locomotoras, Lavado, Basurales,
                            Zona crítica y Fachada; en teléfono desplazable
                            horizontal con scroll oculto y activo centrado
    FormacionesPage.tsx     Página Formaciones: header, stats, tarjetas,
                            informe PDF azul y modal de situación
    LocomotoraPage.tsx      Página Locomotoras: header, stats, tarjetas e
                            informe PDF verde
    LavadoPage.tsx          Página Lavado: stats clicables, agrupa por
                            formación, alta con DropdownSelect + DateSelect +
                            TimeSelect (fecha y horas), informe PDF naranja
    BasuralesPage.tsx       *(local)* Página Basurales: formulario (orden de
                            servicio primero), historial, stats, info modal e
                            informe PDF teal
    BasuralesCard.tsx       *(local)* Tarjeta expandible de registro de basurales
                            (header con orden + fecha + proveedor)
    BasuralesStats.tsx      *(local)* Stats clicables (registros/suspendidas/activas)
    BasuralesInfoModal.tsx  *(local)* Modal de detalle por categoría
    ZonaCriticaPage.tsx     *(local)* Página Zona crítica: formulario (orden de
                            servicio primero, 4 sectores), historial, stats,
                            info modal e informe PDF rose
    ZonaCriticaCard.tsx     *(local)* Tarjeta expandible de registro (sectores/evaluación)
    ZonaCriticaStats.tsx    *(local)* Stats clicables
    ZonaCriticaInfoModal.tsx *(local)* Modal de detalle por categoría
    FachadaPage.tsx         *(local)* Página Fachada entorno: formulario sin
                            botón global ni selector de estación, agrupado
                            por estación, stats, info modal e informe PDF violeta
    FachadaCard.tsx         *(local)* Tarjeta por estación: colapsada solo
                            header, historial desplegable de a una
    FachadaStats.tsx        *(local)* Stats clicables (registros/estaciones/suspendidas)
    FachadaInfoModal.tsx    *(local)* Modal de detalle por categoría
    FormationCard.tsx       Tarjeta de formación (gris claro translúcido):
                            historial expandible (badge N lavados, Editar/
                            Eliminar/Agregar por registro con DateSelect azul),
                            clicable en admin para revelar Editar/Eliminar/
                            Guardar, modo edición, descripción y ConfirmModal azul
    LocomotoraCard.tsx      Tarjeta de locomotora: último lavado, días sin
                            lavar, servicio, situación, descripción; historial
                            expandible (badge N lavados, Editar/Eliminar/Agregar
                            con DateSelect verde); clicable en admin para
                            revelar Editar/Cancelar/Guardar
    LavadoCard.tsx          Tarjeta de lavado acumulativa y clicable en toda
                            la card: último lavado + fecha del lavado, historial
                            con scroll (Editar/Eliminar solo en modo "Editar
                            card", incluye fecha), pie con Editar card/Agregar,
                            DateSelect + TimeSelect para fecha y horas,
                            ConfirmModal naranja; la edición / alta no
                            colapsa la card
    StatsCards.tsx          Contadores verdes/amarillos/rojos y por estado;
                            las tarjetas clicables llevan borde + sombra
    LocomotoraStats.tsx     Contadores por criticidad y situación de locomotoras
    LavadoStats.tsx         Contadores clicables de Lavado: Registros,
                            Formaciones (con tarjeta) y Sin lavados (1–23
                            que no tienen registros)
    InfoModal.tsx           Modal (por portal a <body>) con el listado de
                            formaciones en Limpieza/Reparación/Fuera de servicio
    LocomotoraInfoModal.tsx Modal (por portal) con detalle de estado de locomotoras
    LavadoInfoModal.tsx     Modal (por portal, naranja) con detalle de Lavado:
                            registros (formación + horas + fecha + OK), las
                            formaciones con lavado y las que aún no tienen
    ConfirmModal.tsx        Modal de doble confirmación por portal, tema
                            azul/verde/naranja
    DateRangeModal.tsx      Modal de rango de fechas (Desde/Hasta) por portal,
                            usado por los informes PDF
    DropdownSelect.tsx      Desplegable propio por portal: scroll interno,
                            abre hacia abajo/arriba, cierra tocando afuera /
                            Escape / scroll de la página
    TimeSelect.tsx          Selector de hora propio por portal: columnas
                            Hora/Minuto con scroll, abre abajo/arriba según
                            espacio, opción Limpiar y cierre por fuera/Escape
    DateSelect.tsx          Calendario propio por portal (tema azul/verde/
                            naranja/teal/rose/violeta según la sección) para fechas:
                            navegación de mes, botón Hoy, opción Limpiar y
                            cierre por fuera/Escape (en Lavado deshabilita
                            días futuros; configurable por uso)
    InformeButton.tsx       Botón "Informe PDF" (solo admin) por sección;
                            abre DateRangeModal y descarga/comparte el PDF
                            (incluye basurales, zona_critica y fachada_entorno, local)
    SyncBadge.tsx           Indicador online / pendientes / sincronizando
public/
  trenes.jpg                Imagen de fondo (redimensionada desde
                            San-Martin-Trenes.jpg)
  favicon.png               Favicon
  icons/                    Iconos de la PWA y del menú flotante
                            (formacion24px.png, locomotora24px.png,
                            rodillolavado24px.png, icon-192.png, icon-512.png)
scripts/
  sync-backup.mjs           Sincroniza formaciones desde backuotrenes.json
                            (usa INSFORGE_API_KEY)
  setup-admin.mjs           Crea admin@trenes.local con auto-confirm y le
                            asigna rol admin
migrations/
  20260912101500_init.sql   Esquema + RLS + functions + grants + triggers
                            Realtime (InsForge)
  20260912101601_seed.sql   Seed base (23 formaciones + 26 locomotoras)
20260918120000_lavados.sql Tabla lavados, trigger realtime 'lavados', RLS
                             con es_editor() y seed inicial
  20260918150000_seed-lavados.sql  Seed multi-registro de lavados demo
                             (formaciones 1, 4, 8, 13, 20)
  20260918201226_lavados-fecha.sql Columna fecha (date) en lavados: el día
                             en que se realizó el lavado (permite cargar
                             registros pasados); backfill desde created_at
   20260922120000_servicios.sql Tablas servicios_formaciones y
                             servicios_locomotoras (historial de lavados):
                             RLS, triggers Realtime
                             (servicios_formaciones / servicios_locomotoras)
                             y backfill desde ultima/anteultima
   20260922130000_servicios-situacion.sql Columna situacion (estado en ese
                             momento) por registro de historial; backfill
                             del registro más reciente con el estado actual
                             de cada fila
   20260922140000_servicios-servicio.sql Columna servicio (Local/LD) por
                             registro en servicios_locomotoras; backfill
                             con el servicio actual de cada locomotora
   20260923120000_basurales.sql *(local, aplicada para pruebas)* Tabla `basurales`
                             (historial de cargas): campos de formulario,
                             evaluación B/R/M, trigger realtime
                             `basurales` (basural:changed/deleted), RLS y grants
   20260923120100_zona_critica.sql *(local, aplicada para pruebas)* Tabla
                             `zona_critica` (historial): campos + `sectores`
                             jsonb (4 tramos), evaluación B/R/M, trigger realtime
                             `zona_critica`, RLS y grants
   20260923120200_fachada_entorno.sql *(local, aplicada para pruebas)* Tabla
                             `fachada_entorno` (historial por estación):
                             campos + `items` jsonb (11 ítems de fachada),
                             evaluación B/R/M, trigger realtime
                             `fachada_entorno`, RLS y grants
   20260923120300_orden_servicio.sql *(local, aplicada para pruebas)* Columna
                             `orden_servicio` (text) en `basurales` y
                             `zona_critica`
```

### Flujo de datos

1. **Admin edita** una tarjeta → entra en modo edición y toca **Guardar** → `FormationCard.guardar` / `LocomotoraCard.guardar` → `onCambio` → `aplicarCambio` (`useFormaciones.ts` / `useLocomotoras.ts`). **Eliminar** llama a `aplicarCambio` con fechas/estado/descripción en blanco (con `ConfirmModal` de por medio).
2. `aplicarCambio` actualiza el estado al instante, lo encola en **IndexedDB** (`offline.ts`, con la tabla correspondiente) y, si hay red, hace `.update()` a InsForge.
3. Los triggers `notificar_cambio_formacion` / `notificar_cambio_locomotora` publican el cambio con `realtime.publish` en los canales `formaciones` (evento `formacion:changed`/`formacion:deleted`) y `locomotoras` (`locomotora:changed`/`locomotora:deleted`) → todos los clientes suscritos (admin y empleados) reciben el payload y rederivan `dias`/semáforo.
4. **Lavado**: `LavadoPage`/`LavadoCard` llaman a `agregarLavado` / `aplicarCambio` / `eliminarLavado` de `useLavados`. El alta recibe `{ formacion, fecha, ingreso, egreso }` y el hook inserta `pasadas=2` y `ok=true` (`PASADAS_DEFAULT` / `OK_DEFAULT`). El trigger `notificar_cambio_lavado` publica en el canal `lavados` (`lavado:changed` / `lavado:deleted`) y los clientes reordenan/agrupan las tarjetas en vivo por **fecha del lavado**, más reciente primero.
5. **Historial de Formaciones/Locomotoras**: `FormationCard`/`LocomotoraCard` llaman a `agregarServicio(fecha, situacion[, servicio])` / `aplicarCambioServicio` / `eliminarServicio` de los hooks; cada operación actualiza el estado al instante, encola la op en **IndexedDB** y, si hay red, hace `.upsert`/`.update`/`.delete` en `servicios_formaciones` / `servicios_locomotoras`. Después recalcula `ultima`/`anteultima` desde el historial (`derivarFechas`) y rederiva `estado` (y `servicio` en locomotoras) de la card a partir del registro más reciente, aplicando a la fila solo lo que cambió (misma lógica de `aplicarCambio`). Los triggers `notificar_cambio_servicio_formacion`/`notificar_cambio_servicio_locomotora` publican en los canales `servicios_formaciones` (`servicio_formacion:changed`/`deleted`) y `servicios_locomotoras` (`servicio_locomotora:changed`/`deleted`) para que todos los clientes recalibren días/semáforo/situación en vivo.
6. **Basurales / Zona crítica / Fachada entorno** *(local)*: cada envío del formulario crea un registro histórico (`agregarBasural`/`agregar`), editable/eliminable; cambios optimistas + cola **IndexedDB** + sync a InsForge. Realtime vía canales `basurales` (`basural:changed/deleted`), `zona_critica` (`zona_critica:changed/deleted`) y `fachada_entorno` (`fachada_entorno:changed/deleted`). RLS: lectura pública, escritura solo editores (`public.es_editor()`).
7. **Vista como empleado**: el `select` está abierto a todos (`RLS using(true)`); el `update/insert/delete` requiere rol `admin`/`editor` (`public.es_editor()`), igual en `lavados` y en las tablas nuevas. Los triggers `log_cambio` (formaciones) y `log_cambio_locomotora` (locomotoras) auditan los cambios en `historial` / `historial_locomotoras`.

### Base de datos

- `public.formaciones`: `id`, `formacion` (único), `anteultima` (date), `ultima` (date), `estado` (`activa | limpieza | reparacion | fuera-servicio`), `descripcion` (text), `updated_at`. `dias` y `sem` NO se guardan: se calculan en el cliente.
- `public.locomotoras`: `id`, `locomotora` (único), `servicio` (`local | ld`), `ultima` (date), `estado` (`en-servicio | detenida`), `descripcion` (text), `updated_at`. `dias` y `sem` NO se guardan: se calculan en el cliente.
- `public.lavados`: `id`, `formacion` (int, 1–23), `fecha` (date, día del lavado, default hoy), `ingreso` / `egreso` (time), `pasadas` (int ≥ 0), `ok` (bool), `created_at` (timestamptz, fecha de carga). El alta siempre crea `pasadas=2` y `ok=true`. Sin conexión, el alta offline lleva la `fecha` elegida y sincroniza igual.
- `public.servicios_formaciones`: `id`, `formacion_id` (FK → `formaciones.id`), `fecha` (date, día del lavado), `situacion` (`activa | limpieza | reparacion | fuera-servicio`, por defecto `fuera-servicio`), `created_at`. Único por `(formacion_id, fecha)`. Es el **historial de lavados** de cada formación; `ultima`/`anteultima` y `estado` se derivan de él.
- `public.servicios_locomotoras`: `id`, `locomotora_id` (FK → `locomotoras.id`), `fecha` (date), `situacion` (`en-servicio | detenida`, por defecto `en-servicio`), `servicio` (`local | ld`, por defecto `local`), `created_at`. Único por `(locomotora_id, fecha)`. Historial de lavados de cada locomotora.
- `public.basurales` *(local, aplicada para pruebas)*: `id`, `orden_servicio` (text), datos de carga (fecha, proveedor, OC, domicilio, supervisor, horarios, `suspendida_mal_tiempo`), insumos, residuos retirados (`rsu_bolsas`, `escombro_m3`, `pastizales_m2` como texto), evaluaciones (`eval_*` = `bueno|regular|malo`), observaciones, `created_at`. Historial por registro; RLS + trigger realtime `basurales`.
- `public.zona_critica` *(local, aplicada para pruebas)*: `id`, `orden_servicio` (text), datos de carga (fecha, proveedor, OC, sector de intervenciones, supervisor, horarios, `suspendida_mal_tiempo`), insumos, `sectores` (**jsonb**, 4 tramos con cantidades por sector), evaluaciones (`eval_*`), observaciones, `created_at`. Historial por registro; RLS + trigger realtime `zona_critica`.
- `public.fachada_entorno` *(local, aplicada para pruebas)*: `id`, `estacion` (text, una de las 22), datos de carga (fecha, proveedor, OC, sector de intervenciones, supervisor, horarios, `suspendida_mal_tiempo`), insumos, `items` (**jsonb**, 11 ítems de fachada `bueno|regular|malo`), evaluaciones (`eval_*`), observaciones, `created_at`. Historial por estación; RLS + trigger realtime `fachada_entorno`.
- `public.roles`: `user_id` → `rol` (`admin` | `editor`).
- `public.historial`: auditoría de cambios de formaciones (`campo`, valor anterior/nuevo, actor).
- `public.historial_locomotoras`: auditoría de cambios de locomotoras (`campo`, valor anterior/nuevo, actor).

### Notas / pendientes

- **Local / sin commit ni push**: Basurales, Zona crítica, Fachada entorno y `orden_servicio` (código + migraciones `20260923120000_basurales.sql`, `20260923120100_zona_critica.sql`, `20260923120200_fachada_entorno.sql`, `20260923120300_orden_servicio.sql`) están en el workspace local; las tablas/columna fueron creadas en el InsForge del proyecto para pruebas vía `db import`. Falta commitear/pushear cuando se valide.
- **Supuestos (Basurales/Zona crítica)**: campos derivados del PDF `basuras_zonacritica.pdf` vía extracción de texto (revisar contra el original); Zona crítica asume **4 sectores** (`1.600–2.100 km` como 4.º tramo); cantidades guardadas como **texto** (ej. `18 B.`, `5m3`); historial como registros independientes (sin agrupación por entidad fija). Íconos del menú son temporales. `orden_servicio` es **texto libre** (acepta números y prefijos como `N° 232111`).
- **Supuestos (Fachada entorno)**: campos derivados del PDF `Fachada entorno.pdf` (datos generales + tabla de **11 ítems** Vereda/Ventanales/Paredes/Puertas/Grafittis o pinturas/Techos/Túnel/Maseteros/Luminarias/Desmalezado o poda/Hidro lavado intensivo con Bueno/Regular/Malo + evaluación diaria de 5 ítems); **22 estaciones** de la lista de estaciones (se usa **Devoto**, no *Villa Devoto* del ejemplo); el historial está **agrupado por estación** (22 tarjetas fijas con sus cargas adentro, más reciente primero); insumos **sin placeholder** del ejemplo.
- `dias`/semáforo se recalculan al cargar, con cada evento Realtime y al editar; no hay aún un reloj que los actualice solo al pasar la medianoche (pendiente).
- Conteo de días: se toma desde `ultima` (fecha de ingreso). El día de ingreso es **0 días** (se muestra "Hoy"); días `1`, `2`, `3`… indican cuántos días lleva en el taller. `anteultima` es solo referencia y no participa del cálculo. Se corrigió un bug de zona horaria que desplazaba la fecha de ingreso un día atrás (el cálculo ahora es en UTC).
- El seed de lavados (`20260918150000_seed-lavados.sql`) **reinicia** los registros de ejemplo (formaciones 1, 4, 8, 13 y 20 con 2–3 lavados cada una, `pasadas=2`, `ok=true`). Para probar el historial acumulado, re-cargar ese seed o dar de alta nuevos lavados.
- Al regenerar la base, el camino es `npx @insforge/cli db migrations up --all` + `npm run sync` con `backuotrenes.json`.
- El color de la barra de estado del teléfono (theme color) se lee al instalar la PWA; si ya está instalada y se cambió, puede requerir desinstalar y reinstalar para verlo.
- `lavados.fecha` (día del lavado) se agregó en `20260918201226_lavados-fecha.sql`: los registros existentes tomaron la fecha de su `created_at`. La UI ordena por `fecha` (fallback `created_at` en datos sin fecha) y no permite cargar fechas futuras.