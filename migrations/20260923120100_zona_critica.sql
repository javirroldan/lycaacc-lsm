-- Migración: sección Zona Crítica (historial de cargas TXT)
create table if not exists public.zona_critica (
  id bigint generated always as identity primary key,
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
  sectores jsonb,
  eval_presentismo text check (eval_presentismo in ('bueno','regular','malo')),
  eval_maquinas text check (eval_maquinas in ('bueno','regular','malo')),
  eval_uniformidad text check (eval_uniformidad in ('bueno','regular','malo')),
  eval_compromiso text check (eval_compromiso in ('bueno','regular','malo')),
  eval_objetivos text check (eval_objetivos in ('bueno','regular','malo')),
  observaciones text,
  created_at timestamptz not null default now()
);

create or replace function public.notificar_cambio_zona_critica()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform realtime.publish('zona_critica', 'zona_critica:deleted', to_jsonb(old));
    return old;
  end if;
  perform realtime.publish('zona_critica', 'zona_critica:changed', to_jsonb(new));
  return new;
end;
$$;

drop trigger if exists trg_realtime_zona_critica on public.zona_critica;
create trigger trg_realtime_zona_critica
  after insert or update or delete on public.zona_critica
  for each row execute function public.notificar_cambio_zona_critica();

alter table public.zona_critica enable row level security;

create policy "Lectura pública de zona_critica"
  on public.zona_critica for select using (true);
create policy "Insertar solo editores zona_critica"
  on public.zona_critica for insert with check (public.es_editor());
create policy "Actualizar solo editores zona_critica"
  on public.zona_critica for update using (public.es_editor()) with check (public.es_editor());
create policy "Eliminar solo editores zona_critica"
  on public.zona_critica for delete using (public.es_editor());

grant usage on schema public to anon, authenticated;
grant select on public.zona_critica to anon;
grant select, insert, update, delete on public.zona_critica to authenticated;
grant usage on sequence public.zona_critica_id_seq to anon, authenticated;
