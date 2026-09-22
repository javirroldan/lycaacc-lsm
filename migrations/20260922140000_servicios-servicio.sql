-- ============================================================
-- Migración: servicio (Local/LD) por registro en el historial
-- de lavados de locomotoras. Cada lavado guarda además el
-- servicio (Local o Larga Distancia) en ese momento.
-- La card deriva su Servicio actual del registro más reciente.
-- ============================================================

alter table public.servicios_locomotoras
  add column if not exists servicio text not null default 'local';

-- Backfill: todos los registros existentes toman el servicio actual de la locomotora.
update public.servicios_locomotoras sl
set servicio = l.servicio
from public.locomotoras l
where sl.locomotora_id = l.id;