# Trenes App — Planificación y control de servicios

Webapp móvil (PWA) para la planificación y control de servicios de lavado de formaciones y de locomotoras. React + Vite + Tailwind, backend en Supabase (PostgreSQL + Auth + Realtime), desplegado en Vercel.

Dos secciones navegables desde el **menú flotante** inferior:
- **Formaciones**: planificación y control de servicios de lavado de formaciones.
- **Locomotoras**: días sin lavado de las locomotoras, con su propio semáforo por criticidad.

- **Admin**: edita fechas, estado y descripción en ambas secciones. Login con **usuario + contraseña** (no hay registro público).
- **Empleado**: acceso en solo lectura, sin login; los cambios del admin se ven en vivo. No tiene acceso al informe TXT.

## Puesta en marcha

### 1. Supabase

1. Creá un proyecto en [supabase.com](https://supabase.com) (plan gratuito). Anotá la **Project URL** y la **anon key** (Dashboard → Settings → Data API).
2. En el **SQL Editor**, ejecutá `supabase/migrations/0001_init.sql` (tablas `formaciones`, `roles`, `historial`, RLS, Realtime y seed de 23 formaciones). Si la base ya existe, corré también `0003_descripcion.sql` para agregar el campo `descripcion` a `formaciones`. Para la sección de locomotoras, corré `0004_locomotoras.sql` (tabla `locomotoras`, `historial_locomotoras`, trigger de auditoría, RLS, Realtime y seed de 26 locomotoras) y `0005_descripcion_locomotoras.sql` (agrega el campo `descripcion` a `locomotoras` y audita ese campo).
3. **Login de admin**: es con **usuario + contraseña** (p. ej. `admin`). La app resuelve el usuario a un email interno (`admin` → `admin@trenes.local`) y la contraseña vive únicamente hasheada en Supabase Auth:
   - La cuenta se crea con la service role (`auth.admin.createUser`), normalmente vía script de Node con `SUPABASE_SERVICE_ROLE_KEY`.
   - Después se asigna el rol (SQL Editor):
     ```sql
     insert into public.roles (user_id, rol)
     select id, 'admin' from auth.users where email = 'admin@trenes.local'
     on conflict (user_id) do update set rol = 'admin';
     ```
4. **Importante**: desactivá el alta pública de usuarios — Dashboard → **Authentication → Sign In / Providers → Email** → apagá *Allow new users to sign up*. El registro está quitado de la UI; este ajuste lo bloquea también por API.

### 2. Configuración local

```bash
npm install
cp .env.example .env   # completá VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
npm run dev            # http://localhost:5173
```

Variables de entorno:

| Variable                    | Dónde      | Uso                                   |
| --------------------------- | ---------- | ------------------------------------- |
| `VITE_SUPABASE_URL`         | `.env`     | Cliente de la app                     |
| `VITE_SUPABASE_ANON_KEY`    | `.env`     | Cliente de la app (lectura + auth)    |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env.local` | Solo para scripts (nunca en el front ni en git) |

`.env*` están en `.gitignore`; nunca se commitean.

### 3. Vercel

1. Subí el repo a GitHub.
2. En [vercel.com](https://vercel.com) → **Add New → Project**, importá el repo.
3. Framework preset: **Vite**. Build: `npm run build`. Output: `dist`.
4. En **Environment Variables** agregá `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` y hacé **Deploy**.

## Funcionalidades

- **Dos secciones** (Formaciones y Locomotoras) navegadas con un **menú flotante** blanco en la parte inferior; los iconos activos son azul oscuro y los inactivos grises.
- **Login solo admin** (usuario/contraseña) y **"Ver como empleado"** en solo lectura.
- El modo empleado **persiste al recargar** (se guarda en `localStorage`) y tiene su botón **Salir**.
- **Edición del admin con botones**: la card tiene modo edición (fechas, estado y **descripción**) con botones **Editar / Guardar / Eliminar**. Los cambios se persisten solo al tocar **Guardar** (optimista → IndexedDB → Sync a Supabase). Sin conexión queda encolado y sincroniza al reconectar. Aplica en Formaciones y Locomotoras.
- **Eliminar** limpia el contenido de la formación (fechas, estado a `fuera-servicio` y descripción); no borra la fila.
- **Descripción/detalle** editable por admin; el **empleado** la ve (solo lectura) arriba de la línea de situación.
- **Locomotoras**: la card muestra último lavado, días sin lavar, semáforo por criticidad (verde 0-10, amarillo 11-20, rojo 21+), servicio (Local / LD), situación (En servicio / Detenida) y descripción.
- **Realtime**: empleados y admin ven los cambios en vivo entre dispositivos (en ambas secciones).
- **Tarjetas informativas clicables**: los botones de `Limpieza`, `Reparación` y `Fuera de servicio` abren una ventana flotante (modal) que enumera las formaciones en ese estado (número, fechas y días de demora), útil para que los empleados sepan cuáles son. Las clicables se distinguen visualmente de las que solo muestran contador con un borde de marca y una sombra más marcada.
- **Orden por criticidad**: más días de demora arriba; las "fuera de servicio" (sin datos) abajo, separadas en su grupo.
- Vista por **tarjetas** (móvil) o **tabla** (toggle).
- Semáforo: verde 0-10 días, amarillo 11-20, rojo 21+ (los días y el semáforo se **calculan en el cliente** a partir de `ultima`). El día de ingreso cuenta **0 días** y se muestra como **"Hoy"** (la formación que entró ayer muestra **1 día**). Los días se calculan con **UTC** para que la fecha de ingreso (`ultima`) no se desplace por la zona horaria del dispositivo.
- Informe TXT descargable/compartible (**solo admin**). Compatible con `navigator.share` y fallback a descarga con BOM UTF-8 (acentos correctos).
- Color de marca **`#0952E2`** (azul) en toda la UI.
- PWA instalable con **icono propio**, scroll oculto, header con efecto **glass** y fondo fijo con foto `trenes.jpg` (configurado con `background-image` + `background-attachment: fixed` en `body`, para que no se redimensione al scrollear). Barra de estado del teléfono en tono oscuro (`#0a0e1a`).

## Scripts

| Comando         | Acción                                      |
| --------------- | ------------------------------------------- |
| `npm run dev`   | Servidor de desarrollo                      |
| `npm run build` | Compila TS + Vite (genera PWA)              |
| `npm run lint`  | Lint con oxlint                             |
| `npm run preview` | Previsualiza el build                     |
| `npm run sync`  | Upsert de `formaciones` desde `backuotrenes.json` usando la service role (ver `scripts/sync-backup.mjs`) |

## Estructura del proyecto

```
src/
  main.tsx                  Punto de entrada (React + index.css + App)
  App.tsx                   Pantalla principal: gate de login/empleado, y
                            navegación entre Formaciones y Locomotoras con
                            el menú flotante (FloatingNav)
  index.css                 Tokens @theme (marca #0952E2), fondo fijo con
                            background-attachment: fixed, scroll oculto
  hooks/
    useAuth.ts              Sesión, rol, signIn/signOut (signIn resuelve
                            usuario → email con usuarioAEmail)
    useFormaciones.ts       Carga, orden por criticidad, suscripción
                            Realtime, cola de pendientes y sync
    useLocomotoras.ts       Ídem para la tabla locomotoras (carga, Realtime,
                            cola de pendientes y sync)
  lib/
    supabase.ts             Cliente Supabase, DOMINIO_ADMIN, usuarioAEmail,
                            fetchRol
    types.ts                Tipos: Estado, FormacionDB, Formacion,
                            CamposEditables, ESTADOS/ESTADO_LABEL
    typesLocomotoras.ts     Tipos: ServicioLocomotora, EstadoLocomotora,
                            LocomotoraDB, Locomotora, CamposEditablesLocomotora
    dates.ts                parse/fmt de fechas, calcularDias, semaforo,
                            ordenarPorCriticidad
    datesLocomotoras.ts     semaforoLoco y ordenarPorCriticidadLoco (locomotoras)
    offline.ts              Cola de operaciones pendientes en IndexedDB
                            (soporta las tablas formaciones y locomotoras)
    report.ts               generaInforme() y compartirInforme() (TXT, solo admin)
  components/
    AuthView.tsx            Login usuario/contraseña, "Ver como empleado",
                            LoadingScreen
    FloatingNav.tsx         Menú flotante inferior (blanco) para navegar
                            entre Formaciones y Locomotoras
    FormacionesPage.tsx     Página Formaciones: header, stats, vista tarjetas/
                            tabla, informe y modal de situación
    LocomotoraPage.tsx      Página Locomotoras: header, stats, tarjetas y modal
    FormationCard.tsx       Tarjeta de formación (gris claro translúcido),
                            modo edición, descripción y botones Editar/
                            Eliminar/Guardar
    LocomotoraCard.tsx      Tarjeta de locomotora: último lavado, días sin
                            lavar, servicio, situación, descripción y modo edición
    FormationTable.tsx      Vista tabla
    LocomotoraStats.tsx     Contadores por criticidad y situación de locomotoras
    LocomotoraInfoModal.tsx Modal con detalle de estado de las locomotoras
    StatsCards.tsx          Contadores verdes/amarillos/rojos y por estado;
                            las tarjetas clicables llevan borde + sombra
    InfoModal.tsx           Modal con el listado de formaciones en
                            Limpieza/Reparación/Fuera de servicio
    SyncBadge.tsx           Indicador online / pendientes / sincronizando
public/
  trenes.jpg                Imagen de fondo (redimensionada desde
                            San-Martin-Trenes.jpg)
  favicon.png               Favicon (generado desde icon_PyC.jpeg)
  icons/                    Iconos de la PWA (generados desde icon_PyC.jpeg)
icon_PyC.jpeg               Fuente del icono de la app (logo de la marca)
scripts/
  sync-backup.mjs           Sincroniza formaciones desde backuotrenes.json
                            (usa SUPABASE_SERVICE_ROLE_KEY)
supabase/migrations/
  0001_init.sql             Esquema + RLS + realtime + seed inicial
  0002_actualizar_datos.sql Snapshot de datos (hoy el sync se hace por
                            script; no volver a aplicar por SQL)
  0003_descripcion.sql      Agrega columna `descripcion` a formaciones
                            y audita ese campo en `historial`
  0004_locomotoras.sql      Tabla `locomotoras`, `historial_locomotoras`,
                            trigger de auditoría, RLS, Realtime y seed de 26
                            locomotoras
  0005_descripcion_locomotoras.sql
                            Agrega columna `descripcion` a locomotoras
                            y audita ese campo en `historial_locomotoras`
```

### Flujo de datos

1. **Admin edita** una tarjeta → entra en modo edición y toca **Guardar** → `FormationCard.guardar` / `LocomotoraCard.guardar` → `onCambio` → `aplicarCambio` (`useFormaciones.ts` / `useLocomotoras.ts`). **Eliminar** llama a `aplicarCambio` con fechas/estado/descripción en blanco.
2. `aplicarCambio` actualiza el estado al instante, lo encola en **IndexedDB** (`offline.ts`, con la tabla correspondiente) y, si hay red, hace `.update()` a Supabase.
3. Supabase dispara **Realtime** → todos los clientes suscritos (admin y empleados) reciben el payload y rederivan `dias`/semáforo.
4. **Vista como empleado**: el `select` está abierto a todos (`RLS using(true)`); el `update/insert/delete` requiere rol `admin`/`editor` (`public.es_editor()`). Los triggers `log_cambio` (formaciones) y `log_cambio_locomotora` (locomotoras) auditan los cambios en `historial` / `historial_locomotoras`.

### Base de datos

- `public.formaciones`: `id`, `formacion` (único), `anteultima` (date), `ultima` (date), `estado` (`activa | limpieza | reparacion | fuera-servicio`), `descripcion` (text), `updated_at`. `dias` y `sem` NO se guardan: se calculan en el cliente.
- `public.locomotoras`: `id`, `locomotora` (único), `servicio` (`local | ld`), `ultima` (date), `estado` (`en-servicio | detenida`), `descripcion` (text), `updated_at`. `dias` y `sem` NO se guardan: se calculan en el cliente.
- `public.roles`: `user_id` → `rol` (`admin` | `editor`).
- `public.historial`: auditoría de cambios de formaciones (`campo`, valor anterior/nuevo, actor).
- `public.historial_locomotoras`: auditoría de cambios de locomotoras (`campo`, valor anterior/nuevo, actor).

### Notas / pendientes

- `dias`/semáforo se recalculan al cargar, con cada evento Realtime y al editar; no hay aún un reloj que los actualice solo al pasar la medianoche (pendiente).
- Conteo de días: se toma desde `ultima` (fecha de ingreso). El día de ingreso es **0 días** (se muestra "Hoy"); días `1`, `2`, `3`… indican cuántos días lleva en el taller. `anteultima` es solo referencia y no participa del cálculo. Se corrigió un bug de zona horaria que desplazaba la fecha de ingreso un día atrás (el cálculo ahora es en UTC).
- Al regenerar la base, `0002_actualizar_datos.sql` quedó como respaldo: el camino actual es `npm run sync` con `backuotrenes.json`.
- El color de la barra de estado del teléfono (theme color) se lee al instalar la PWA; si ya está instalada y se cambió, puede requerir desinstalar y reinstalar para verlo.