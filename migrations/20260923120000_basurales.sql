-- Migración: sección Basurales (historial de cargas TXT)
create table if not exists public.basurales (
  id bigint generated always as identity primary key,
  fecha date,
  proveedor text,
  oc text,
  domicilio text,
  supervisor_nombre text,
  supervisor_telefono text,
  supervisor_legajo text,
  horarios text,
  suspendida_mal_tiempo boolean,
  insumos text,
  rsu_bolsas text,
  escombro_m3 text,
  pastizales_m2 text,
  eval_presentismo text check (eval_presentismo in ('bueno','regular','malo')),
  eval_maquinas text check (eval_maquinas in ('bueno','regular','malo')),
  eval_uniformidad text check (eval_uniformidad in ('bueno','regular','malo')),
  eval_compromiso text check (eval_compromiso in ('bueno','regular','malo')),
  eval_objetivos text check (eval_objetivos in ('bueno','regular','malo')),
  observaciones text,
  created_at timestamptz not null default now()
);

create or replace function public.notificar_cambio_basural()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform realtime.publish('basurales', 'basural:deleted', to_jsonb(old));
    return old;
  end if;
  perform realtime.publish('basurales', 'basural:changed', to_jsonb(new));
  return new;
end;
$$;

drop trigger if exists trg_realtime_basurales on public.basurales;
create trigger trg_realtime_basurales
  after insert or update or delete on public.basurales
  for each row execute function public.notificar_cambio_basural();

alter table public.basurales enable row level security;

create policy "Lectura pública de basurales"
  on public.basurales for select using (true);
create policy "Insertar solo editores basurales"
  on public.basurales for insert with check (public.es_editor());
create policy "Actualizar solo editores basurales"
  on public.basurales for update using (public.es_editor()) with check (public.es_editor());
create policy "Eliminar solo editores basurales"
  on public.basurales for delete using (public.es_editor());

grant usage on schema public to anon, authenticated;
grant select on public.basurales to anon;
grant select, insert, update, delete on public.basurales to authenticated;
grant usage on sequence public.basurales_id_seq to anon, authenticated;
