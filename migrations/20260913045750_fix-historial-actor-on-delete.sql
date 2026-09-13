-- ============================================================
-- Fix: permite borrar usuarios de auth sin violar FK de auditoría
-- historial.actor y historial_locomotoras.actor quedan en NULL
-- al borrar el usuario, conservando el historial.
-- ============================================================

alter table public.historial
  drop constraint historial_actor_fkey;
alter table public.historial
  add constraint historial_actor_fkey
  foreign key (actor) references auth.users (id) on delete set null;

alter table public.historial_locomotoras
  drop constraint historial_locomotoras_actor_fkey;
alter table public.historial_locomotoras
  add constraint historial_locomotoras_actor_fkey
  foreign key (actor) references auth.users (id) on delete set null;