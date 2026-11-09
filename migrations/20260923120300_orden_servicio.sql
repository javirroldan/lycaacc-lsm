-- Migración: campo Orden de servicio en Basurales y Zona crítica
alter table if exists public.basurales add column if not exists orden_servicio text;
alter table if exists public.zona_critica add column if not exists orden_servicio text;
