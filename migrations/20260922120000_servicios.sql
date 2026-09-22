-- ============================================================
-- Migración: historial de lavados de Formaciones y Locomotoras
-- Cada registro guarda la fecha de un lavado (solo fecha).
-- `ultima`/`anteultima` se derivan de este historial en el cliente.
-- ============================================================

-- ---------- Tabla: servicios_formaciones ----------
create table if not exists public.servicios_formaciones (
  id bigint generated always as identity primary key,
  formacion_id bigint not null references public.formaciones (id) on delete cascade,
  fecha date not null,
  created_at timestamptz not null default now(),
  unique (formacion_id, fecha)
);

create index if not exists idx_servicios_formaciones_fecha
  on public.servicios_formaciones (formacion_id, fecha desc);

-- ---------- Tabla: servicios_locomotoras ----------
create table if not exists public.servicios_locomotoras (
  id bigint generated always as identity primary key,
  locomotora_id bigint not null references public.locomotoras (id) on delete cascade,
  fecha date not null,
  created_at timestamptz not null default now(),
  unique (locomotora_id, fecha)
);

create index if not exists idx_servicios_locomotoras_fecha
  on public.servicios_locomotoras (locomotora_id, fecha desc);

-- ---------- Trigger realtime: servicios_formaciones ----------
create or replace function public.notificar_cambio_servicio_formacion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform realtime.publish('servicios_formaciones', 'servicio_formacion:deleted', to_jsonb(old));
    return old;
  end if;
  perform realtime.publish('servicios_formaciones', 'servicio_formacion:changed', to_jsonb(new));
  return new;
end;
$$;

drop trigger if exists trg_realtime_servicios_formaciones on public.servicios_formaciones;
create trigger trg_realtime_servicios_formaciones
  after insert or update or delete on public.servicios_formaciones
  for each row execute function public.notificar_cambio_servicio_formacion();

-- ---------- Trigger realtime: servicios_locomotoras ----------
create or replace function public.notificar_cambio_servicio_locomotora()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform realtime.publish('servicios_locomotoras', 'servicio_locomotora:deleted', to_jsonb(old));
    return old;
  end if;
  perform realtime.publish('servicios_locomotoras', 'servicio_locomotora:changed', to_jsonb(new));
  return new;
end;
$$;

drop trigger if exists trg_realtime_servicios_locomotoras on public.servicios_locomotoras;
create trigger trg_realtime_servicios_locomotoras
  after insert or update or delete on public.servicios_locomotoras
  for each row execute function public.notificar_cambio_servicio_locomotora();

-- ---------- RLS ----------
alter table public.servicios_formaciones enable row level security;
alter table public.servicios_locomotoras enable row level security;

-- Lectura pública / escritura solo editores (usual de las otras tablas)
create policy "Lectura pública de servicios_formaciones"
  on public.servicios_formaciones for select
  using (true);

create policy "Insertar solo editores servicios_formaciones"
  on public.servicios_formaciones for insert
  with check (public.es_editor());

create policy "Actualizar solo editores servicios_formaciones"
  on public.servicios_formaciones for update
  using (public.es_editor())
  with check (public.es_editor());

create policy "Eliminar solo editores servicios_formaciones"
  on public.servicios_formaciones for delete
  using (public.es_editor());

create policy "Lectura pública de servicios_locomotoras"
  on public.servicios_locomotoras for select
  using (true);

create policy "Insertar solo editores servicios_locomotoras"
  on public.servicios_locomotoras for insert
  with check (public.es_editor());

create policy "Actualizar solo editores servicios_locomotoras"
  on public.servicios_locomotoras for update
  using (public.es_editor())
  with check (public.es_editor());

create policy "Eliminar solo editores servicios_locomotoras"
  on public.servicios_locomotoras for delete
  using (public.es_editor());

-- ---------- Permisos ----------
grant usage on schema public to anon, authenticated;
grant select on public.servicios_formaciones, public.servicios_locomotoras to anon;
grant select, insert, update, delete on public.servicios_formaciones, public.servicios_locomotoras to authenticated;
grant usage on sequence public.servicios_formaciones_id_seq, public.servicios_locomotoras_id_seq to anon, authenticated;

-- ---------- Backfill: arrastrar ultima/anteultima al historial ----------
insert into public.servicios_formaciones (formacion_id, fecha)
select id, ultima from public.formaciones where ultima is not null
on conflict (formacion_id, fecha) do nothing;

insert into public.servicios_formaciones (formacion_id, fecha)
select id, anteultima from public.formaciones where anteultima is not null
on conflict (formacion_id, fecha) do nothing;

insert into public.servicios_locomotoras (locomotora_id, fecha)
select id, ultima from public.locomotoras where ultima is not null
on conflict (locomotora_id, fecha) do nothing;