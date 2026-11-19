# Trenes App — Planificación y control de servicios

Webapp móvil (PWA) para la planificación y control de servicios de lavado de formaciones y de locomotoras. React + Vite + Tailwind, backend en **InsForge** (PostgreSQL + Auth + Realtime), desplegado en InsForge Sites / Vercel. Proyecto paralelo del repo original `aacc-lsm` (trenes-app).

> **Estado (actualizado):** las secciones **Basurales**, **Zona crítica** y **Fachada entorno** (pantallas, formularios/historial, migraciones `20260923120000–20260923120400`, informes PDF) están **commiteadas/pusheadas** pero quedan **ocultas para todos** en producción hasta `VITE_SECCIONES_NUEVAS=true`. En local se muestran con `VITE_SECCIONES_NUEVAS=true` en `.env.local`.
>
> Se implementaron y **commitearon/pushearon** (`66659b2`): **semáforos configurables por sección** (Formaciones/Locomotoras independientes, editables por admin), **sección Admin** (solo rol admin) con configuración de semáforos y **ABM/archivado** de formaciones y locomotoras (alta, renumerar/renombrar, archivar con doble confirmación conservando historial) y **Lavado con universo dinámico** de formaciones activas.
>
> **Cambio de accesos (pendiente de aplicar en backend/deploy):** se reemplazan los editores separados de Formaciones y Locomotoras por **(1)** un usuario que puede **editar y agregar en Formaciones y Locomotoras** y **(2)** un usuario que puede **editar y agregar solo en Lavado**. Incluye la migración `20260925120000_permisos_formaciones_locomotoras_y_lavado.sql`, actualización de `setup:cuentas`, tipos/envs del front y políticas RLS (incluido `lavados`). Para activarlo: aplicar la migración, ejecutar `npm run setup:cuentas`, configurar las nuevas `VITE_*` en el build/deploy y redeployar (PWA puede requerir recarga/reinstalación).
>
> Quedan **solo en local sin commit/push** (por pedido expreso): buscador de Fachada, informe PDF de Fachada por estación individual (lista en el modal), ajustes locales de `README.md` previos y los archivos `Fachada entorno.pdf`, `basuras_zonacritica.pdf` y `estaciones`.

Secciones navegables desde el **menú flotante** inferior (orden base: **Formaciones · Locomotoras · Lavado · Basurales · Z. crítica · Fachada**; el ítem **Admin** se agrega al final solo para el rol `admin`). Basurales, Z. crítica y Fachada solo se muestran si `VITE_SECCIONES_NUEVAS=true`; en producción queda `false` y se ven solo las activas:
- **Formaciones**: planificación y control de servicios de lavado de formaciones.
- **Locomotoras**: días sin lavado de las locomotoras, con su propio semáforo por criticidad.
- **Lavado**: lavado automático por formación: tarjetas que acumulan **N lavados** (fecha, horarios, pasadas y resultado). El universo de formaciones es dinámico y se basa en las **formaciones activas**.
- **Basurales** *(oculta por flag)*: carga de datos por formulario (**orden de servicio** primero, fecha, proveedor, OC, domicilio, supervisor, horarios, suspensión por mal tiempo, insumos, residuos retirados y evaluación diaria) con **historial** de registros.
- **Zona crítica** *(oculta por flag)*: carga de datos por formulario (**orden de servicio** primero, fecha, proveedor, OC, sector de intervenciones, supervisor, horarios, suspensión por mal tiempo, insumos, datos por **4 sectores/tramos** y evaluación diaria) con **historial**.
- **Fachada entorno** *(oculta por flag)*: **22 tarjetas fijas por estación** que acumulan historial de cargas (fecha, proveedor, OC, sector, supervisor, horarios, suspensión por mal tiempo, insumos, 11 ítems de fachada y evaluación diaria).
- **Admin** *(solo admin)*: configuración de rangos de semáforo y gestión (alta, renumerar/renombrar y archivado) de formaciones y locomotoras activas.

### Accesos y permisos (login por código de 6 dígitos)
- **Admin** (`rol = admin`, código configurado): acceso completo. Edita/agrega en todas las secciones operativas, ve y usa la sección **Admin**, genera **Informe PDF** y puede cambiar semáforos y hacer ABM/archivado de formaciones/locomotoras. `es_admin()` en BD restringe operaciones administrativas a admin.
- **Gerencia** (`rol = gerencia`, ej. código `812346`): **solo lectura** como empleado, con botón **`GGO informe`** en los headers para generar informes PDF; no edita, no carga datos y no ve Admin.
- **Empleado** (sin rol editor): **solo lectura** en todas las secciones; ve cambios en vivo. Sin informes y sin Admin.
- **Editor de Formaciones y Locomotoras** (`rol = editor_formaciones_locomotoras`, código inicial `738264`): como empleado, pero puede **editar y agregar en las secciones Formaciones y Locomotoras** (incluye historial/servicios de esas secciones). Solo lectura en el resto de secciones (incluida Lavado y las secciones nuevas), sin informes y sin Admin.
- **Editor de Lavado** (`rol = editor_lavado`, código inicial `419573`): como empleado, pero puede **editar y agregar solo en la sección Lavado** (alta, edición y eliminación de registros). Solo lectura en el resto de secciones, sin informes y sin Admin.

> Los accesos por código usan cuentas ocultas fijas (Auth) con contraseñas embebidas en el build (`VITE_*_PASSWORD`). Los códigos se almacenan hasheados en `public.configuracion` y se validan con `validar_codigo_acceso`. Las cuentas de edición por sección son fijas (no autogestionables desde la UI). Los códigos iniciales pueden cambiarse en `public.configuracion`.

## Puesta en marcha

### 1. InsForge

1. Creá un proyecto en [insforge.app](https://insforge.app). Anotá la **URL** (`https://<proyecto>.insforge.app`) y las claves **ANON_KEY** y **API_KEY**.
2. Aplicá las migraciones con el CLI:
   ```bash
   npx @insforge/cli login
   npx @insforge/cli link
   npx @insforge/cli db migrations up --all
   ```
   Crea tablas (`formaciones`, `roles`, `historial`, `locomotoras`, `historial_locomotoras`, `lavados`, `servicios_*`, `basurales`, `zona_critica`, `fachada_entorno`), funciones, RLS, triggers de auditoría y Realtime, seeds base, y —según migraciones aplicadas— archivado de formaciones/locomotoras, configuración de semáforos y soporte de editores por sección. Ver carpeta `migrations/`.
   > Si `db migrations up --all` falla por nombres de archivo no aceptados por el CLI en migraciones antiguas, se pueden aplicar archivos específicos con `npx @insforge/cli db import <archivo.sql>`.
3. **Cuentas ocultas (login por código)**: crealas/asignalas con el script (lee `VITE_*_EMAIL/PASSWORD` e `INSFORGE_URL/API_KEY` de `.env/.env.local`):
   ```bash
   cp .env.example .env
   # completá variables en .env/.env.local
   npm run setup:cuentas           # crea/actualiza cuentas configuradas y asigna roles
   ```
   (Alternativa legacy para solo admin: `npm run setup:admin`).
4. Sincronizá datos desde `backuotrenes.json` si corresponde (`npm run sync`).

### 2. Configuración local

```bash
npm install
cp .env.example .env   # completá VITE_INSFORGE_URL y VITE_INSFORGE_ANON_KEY
npm run dev            # http://localhost:5173
```

Variables de entorno:

| Variable | Dónde | Uso |
| --- | --- | --- |
| `VITE_INSFORGE_URL` | `.env` | Cliente de la app |
| `VITE_INSFORGE_ANON_KEY` | `.env` | Cliente de la app (lectura + auth) |
| `VITE_ADMIN_EMAIL` / `VITE_ADMIN_PASSWORD` | `.env` / Vercel | Cuenta oculta admin (código + permisos admin) |
| `VITE_EMPLEADO_EMAIL` / `VITE_EMPLEADO_PASSWORD` | `.env` / Vercel | Cuenta oculta empleado (solo lectura) |
| `VITE_GERENCIA_EMAIL` / `VITE_GERENCIA_PASSWORD` | `.env` / Vercel | Cuenta oculta gerencia (solo lectura + `GGO informe`) |
| `VITE_FORMACIONES_LOCOMOTORAS_EMAIL` / `VITE_FORMACIONES_LOCOMOTORAS_PASSWORD` | `.env` / Vercel | Cuenta oculta editor de Formaciones y Locomotoras |
| `VITE_LAVADO_EMAIL` / `VITE_LAVADO_PASSWORD` | `.env` / Vercel | Cuenta oculta editor de Lavado |
| `VITE_SECCIONES_NUEVAS` | `.env` / Vercel | `true` muestra Basurales/Zona crítica/Fachada; `false` (prod) las oculta |
| `INSFORGE_API_KEY` | `.env.local` | Solo para scripts (nunca en el front ni en git) |
| `INSFORGE_ADMIN_PASSWORD` | `.env.local` | Password inicial del admin (`setup:admin`) |

`.env*` están en `.gitignore`; nunca se commitean. Las `VITE_*` se incrustan en el build: al cambiarlas hay que redeployar y, si hay PWA instalada, puede requerir recarga forzada/reinstalación.

### 3. Vercel / InsForge Sites

1. Subí el repo a GitHub.
2. En [vercel.com](https://vercel.com) → **Add New → Project**, importá el repo.
3. Framework preset: **Vite**. Build: `npm run build`. Output: `dist`.
4. En **Environment Variables** agregá las `VITE_*` necesarias (`URL`, `ANON_KEY`, cuentas ocultas que vayas a usar, `VITE_SECCIONES_NUEVAS=false`) y hacé **Deploy/Redoploy**.

## Funcionalidades

- **Navegación:** menú flotante inferior con secciones por color (azul Formaciones, verde Locomotoras, naranja Lavado, teal Basurales, rose Z. crítica, violeta Fachada) y **Admin** (slate) solo para `admin`. Basurales/Zona crítica/Fachada se muestran solo con `VITE_SECCIONES_NUEVAS=true`. En móvil es desplazable horizontalmente (ítems centrados cuando hay pocos).
- **Login por código de 6 dígitos:** valida contra `public.validar_codigo_acceso` y autentica con la cuenta oculta correspondiente. Error *“Código correcto, pero falta VITE_*_PASSWORD”* indica que falta la env en el build.
- **Roles/permisos:**
  - `admin`: edita/agrega en secciones operativas, ve **Admin**, genera **Informe PDF**.
  - `gerencia`: solo lectura + **`GGO informe`**.
  - `editor_formaciones_locomotoras`: edita/agrega en **Formaciones** y **Locomotoras** (incluido historial/servicios), sin informes ni Admin, resto solo lectura.
  - `editor_lavado`: edita/agrega solo en **Lavado**, sin informes ni Admin, resto solo lectura.
  - empleado/sin rol editor: solo lectura. Basurales/Zona crítica/Fachada (cuando están visibles) solo las edita admin.
- **Sección Admin (solo admin):**
  - **Rangos de semáforo configurables e independientes** para Formaciones y Locomotoras (verde/amarillo; rojo > amarillo), persistidos en `public.configuracion` vía `obtener_semaforos()` / `guardar_semaforos()` y aplicados a cálculo, leyendas, colores e informes.
  - **ABM de Formaciones y Locomotoras activas:** alta, **renumerar** formaciones / **renombrar** locomotoras y **archivar** (soft-delete). Las listas son desplegables (contraídas por defecto) y el alta queda visible en cada tarjeta con indicador de despliegue.
  - **Archivado con conservación de datos:** doble confirmación; si hay historial/lavados se avisa y se archiva (no se borra), ocultando la entidad de las vistas operativas/Lavado pero conservando historial y registros asociados.
  - Al **renumerar una formación** se actualizan sus registros en `lavados` para conservar el historial.
- **Formaciones y Locomotoras:** tarjetas con historial de servicios/lavados, edición/agregado de registros según permisos, semáforo por criticidad (umbral configurable por sección), estados, descripción, realtime y cola offline. Solo se listan entidades **activas** (no archivadas).
- **Lavado:** universo dinámico basado en **formaciones activas** (ya no fijo 1–23). Tarjetas acumulativas por formación con historial, alta/edición según permisos, stats y modal de detalle. Los lavados de formaciones archivadas se conservan pero quedan fuera de la vista operativa.
- **Informes PDF:** admin con “Informe PDF” y gerencia con “GGO informe” (rango de fechas; en Fachada, cuando la funcionalidad local esté habilitada, general o por estación). Formaciones/Locomotoras usan los umbrales de semáforo configurados.
- **Basurales / Zona crítica / Fachada entorno** *(ocultas por flag):* formularios con historial, stats, realtime/offline e informes, según lo implementado (ver estado/notas).
- **Realtime y offline:** suscripciones por canal/trigger, actualizaciones optimistas y cola en IndexedDB con sincronización al reconectar.
- **UI/PWA:** color de marca `#0952E2`, headers glass, fondo fijo, modales por portal, ícono propio, instalable.

## Scripts

| Comando | Acción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compila TS + Vite (genera PWA) |
| `npm run lint` | Lint con oxlint |
| `npm run preview` | Previsualiza el build |
| `npm run sync` | Upsert de `formaciones` desde `backuotrenes.json` (usa `INSFORGE_API_KEY`) |
| `npm run setup:admin` | Crea `admin@trenes.local` y le asigna rol `admin` |
| `npm run setup:cuentas` | Crea/actualiza cuentas ocultas configuradas (`admin`, `empleado`, `gerencia`, `formaciones_locomotoras`, `lavado`) y asigna roles |

## Estructura del proyecto (resumen)

```
src/
  App.tsx                   Gate auth, carga semáforos, navegación, permisos por rol/sección
  components/
    AdminPage.tsx           Solo admin: semáforos + ABM/archivado de formaciones/locomotoras
    FormacionesPage.tsx, LocomotoraPage.tsx, LavadoPage.tsx
    BasuralesPage.tsx, ZonaCriticaPage.tsx, FachadaPage.tsx  (ocultas por flag)
    FormationCard.tsx, LocomotoraCard.tsx, LavadoCard.tsx, *Stats*, *Modal*, etc.
  hooks/
    useAuth.ts, useFormaciones.ts, useLocomotoras.ts, useLavados.ts
    useBasurales.ts, useZonaCritica.ts, useFachadaEntorno.ts
  lib/
    insforge.ts             Cliente, roles/tipos de acceso, validación de código, helpers de cuenta
    semaforoConfig.ts       Carga/guarda config de semáforos (RPC)
    semaforo.ts, dates.ts, datesLocomotoras.ts
    types*.ts, offline.ts, report.ts, temas.ts
migrations/
  20260912101500_init.sql ... (esquema base, seeds, lavados, servicios, basurales, zona crítica, fachada, gerencia)
  20260924120000_semaforos_config.sql
  20260924121000_archivado_abm_formaciones_locomotoras.sql
  20260924123000_editores_por_seccion.sql
  20260925120000_permisos_formaciones_locomotoras_y_lavado.sql
scripts/
  setup-admin.mjs, setup-cuentas.mjs, sync-backup.mjs
```

## Flujo de datos (relevante)

1. **Edición/agregado** (según permisos de sección): la UI aplica cambios optimistas, encola en **IndexedDB** (`offline.ts`) y sincroniza con InsForge cuando hay conexión.
2. **Formaciones/Locomotoras:** `useFormaciones`/`useLocomotoras` cargan entidades activas (`archivada = false`, con fallback compatible si la migración no existe) y sus servicios; derivan `ultima/anteultima/estado/servicio/días/sem` desde el historial y la config de semáforos. Realtime (`formaciones`/`locomotoras`, `servicios_*`) recalcula en vivo; cambios archivados se retiran de la vista operativa.
3. **Lavado:** `useLavados` gestiona `lavados`; `LavadoPage` filtra/arma el universo desde **formaciones activas** recibidas de la app.
4. **Admin/ABM:** operaciones sensibles (semáforos, crear/renumerar-renombrar/archivar) se ejecutan vía RPCs `security definer` con chequeo admin en BD. Renumerar formación actualiza `lavados.formacion`.
5. **Permisos por sección:** RLS permite escritura en `formaciones`/`servicios_formaciones` y `locomotoras`/`servicios_locomotoras` a admin o `editor_formaciones_locomotoras`; en `lavados` a admin o `editor_lavado`; el resto de tablas de escritura quedan restringidas a admin según políticas vigentes.

## Base de datos (puntos clave)

- `public.formaciones`: `id`, `formacion` (único), `anteultima`, `ultima`, `estado`, `descripcion`, `updated_at`, `archivada`, `archivada_en`. `dias/sem` se calculan en cliente.
- `public.locomotoras`: `id`, `locomotora` (único), `servicio`, `ultima`, `estado`, `descripcion`, `updated_at`, `archivada`, `archivada_en`.
- `public.servicios_formaciones` / `public.servicios_locomotoras`: historial por entidad (fecha, situación y, en locomotoras, servicio) con Realtime y RLS por sección.
- `public.lavados`: registros de lavado por `formacion` (número), fecha/horas/pasadas/ok/created_at; orden por fecha de lavado.
- `public.configuracion`: claves/valores (códigos hasheados, umbrales de semáforo, etc.); lectura pública acotada para semáforos, escritura controlada.
- `public.roles`: `user_id -> rol` (`admin`, `editor`, `gerencia`, `editor_formaciones_locomotoras`, `editor_lavado`). Escritura administrativa efectiva: `admin` (`es_admin()`); edición operativa delegada por helpers de sección.
- `public.historial` / `public.historial_locomotoras`: auditoría de cambios.
- Tablas de secciones nuevas (`basurales`, `zona_critica`, `fachada_entorno`) según migraciones aplicadas/flag.

RPCs/funciones relevantes (según migraciones): `validar_codigo_acceso`, `obtener_semaforos`, `guardar_semaforos`, `admin_crear/renumerar/archivar_formacion`, `admin_crear/renombrar/archivar_locomotora`, `puede_editar_formaciones`, `puede_editar_locomotoras`, `puede_editar_lavados`.

## Notas y pendientes

- **Secciones nuevas ocultas en prod:** Basurales/Zona crítica/Fachada requieren `VITE_SECCIONES_NUEVAS=true` para mostrarse. Cambios locales no commiteados: buscador de Fachada, informe PDF de Fachada por estación individual (lista en modal) y archivos `Fachada entorno.pdf`, `basuras_zonacritica.pdf`, `estaciones`.
- **Usuarios editores por sección (nuevo modelo):** dos cuentas ocultas fijas — **Formaciones y Locomotoras** (código inicial `738264`, rol `editor_formaciones_locomotoras`) y **Lavado** (código inicial `419573`, rol `editor_lavado`). Reemplazan a los accesos separados anteriores. Requieren aplicar `20260925120000_permisos_formaciones_locomotoras_y_lavado.sql`, ejecutar `npm run setup:cuentas`, configurar `VITE_FORMACIONES_LOCOMOTORAS_*` y `VITE_LAVADO_*` en build/deploy y redeployar.
- **Caché/PWA:** tras cambios en env embebidas o builds, puede hacer falta recarga forzada o reinstalar la PWA para ver el bundle nuevo.
- **Archivado:** conserva historial/datos; las entidades archivadas no aparecen en vistas operativas ni en el universo de Lavado. (Restauración desde UI no implementada; posible vía RPC/BD si se requiere).
- **Lavado dinámico:** depende de las formaciones activas; renumeraciones se propagan a `lavados`.
- **Migraciones:** si `db migrations up --all` no procesa algún archivo por validación de nombre en el CLI, aplicar los SQL pendientes con `db import`.
- `dias`/semáforo se recalculan en carga/eventos/ediciones/cambio de config; no hay reloj de actualización automática al pasar la medianoche.
