-- ============================================================
-- Migración: situación por registro en el historial de lavados
-- Cada lavado guarda además una "situación" (estado) en ese momento.
-- La card deriva su Situación actual del registro más reciente.
-- ============================================================

alter table public.servicios_formaciones
  add column if not exists situacion text not null default 'fuera-servicio';
alter table public.servicios_locomotoras
  add column if not exists situacion text not null default 'en-servicio';

-- Backfill: el registro más reciente toma la situación actual de la fila,
-- para que la card mantenga el estado que mostraba antes de esta migración.
update public.servicios_formaciones sf
set situacion = f.estado
from public.formaciones f
where sf.formacion_id = f.id
  and sf.fecha = (select max(sf2.fecha) from public.servicios_formaciones sf2 where sf2.formacion_id = sf.formacion_id);

update public.servicios_locomotoras sl
set situacion = l.estado
from public.locomotoras l
where sl.locomotora_id = l.id
  and sl.fecha = (select max(sl2.fecha) from public.servicios_locomotoras sl2 where sl2.locomotora_id = sl.locomotora_id);