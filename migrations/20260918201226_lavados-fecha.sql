-- ============================================================
-- Migración: fecha del lavado en public.lavados
-- Nueva columna `fecha` (date): el día en que se realizó el
-- lavado (permite cargar registros históricos). `created_at`
-- sigue siendo la fecha de carga/auditoría.
-- ============================================================

alter table public.lavados
  add column if not exists fecha date;

-- Backfill: los registros existentes toman la fecha de su created_at
update public.lavados
  set fecha = date(created_at)
  where fecha is null;

alter table public.lavados
  alter column fecha set default (now() at time zone 'utc')::date;

alter table public.lavados
  alter column fecha set not null;