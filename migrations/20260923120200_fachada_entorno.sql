-- Migración: sección Fachada entorno (historial de cargas TXT por estación)
create table if not exists public.fachada_entorno (
  id bigint generated always as identity primary key,
  estacion text,
  fecha date,
  proveedor text,
  oc text,
  sector_intervenciones text,
  supervisor_nombre text,
  supervisor_telefono text,
  supervisor_legajo text,
  horarios text,
  suspendida_mal_tiempo boolean,
  insumos text,
  items jsonb,
  eval_presentismo text check (eval_presentismo in ('bueno','regular','malo')),
  eval_maquinas text check (eval_maquinas in ('bueno','regular','malo')),
  eval_uniformidad text check (eval_uniformidad in ('bueno','regular','malo')),
  eval_compromiso text check (eval_compromiso in ('bueno','regular','malo')),
  eval_objetivos text check (eval_objetivos in ('bueno','regular','malo')),
  observaciones text,
  created_at timestamptz not null default now()
);

create or replace function public.notificar_cambio_fachada_entorno()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform realtime.publish('fachada_entorno', 'fachada_entorno:deleted', to_jsonb(old));
    return old;
  end if;
  perform realtime.publish('fachada_entorno', 'fachada_entorno:changed', to_jsonb(new));
  return new;
end;
$$;

drop trigger if exists trg_realtime_fachada_entorno on public.fachada_entorno;
create trigger trg_realtime_fachada_entorno
  after insert or update or delete on public.fachada_entorno
  for each row execute function public.notificar_cambio_fachada_entorno();

alter table public.fachada_entorno enable row level security;

create policy "Lectura pública de fachada_entorno"
  on public.fachada_entorno for select using (true);
create policy "Insertar solo editores fachada_entorno"
  on public.fachada_entorno for insert with check (public.es_editor());
create policy "Actualizar solo editores fachada_entorno"
  on public.fachada_entorno for update using (public.es_editor()) with check (public.es_editor());
create policy "Eliminar solo editores fachada_entorno"
  on public.fachada_entorno for delete using (public.es_editor());

grant usage on schema public to anon, authenticated;
grant select on public.fachada_entorno to anon;
grant select, insert, update, delete on public.fachada_entorno to authenticated;
grant usage on sequence public.fachada_entorno_id_seq to anon, authenticated;
