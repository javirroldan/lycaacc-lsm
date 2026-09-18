-- ============================================================
-- Migración: sección Lavado automático
-- Tabla lavados, RLS, realtime (patrón InsForge) y seed
-- ============================================================

-- ---------- Tabla: lavados ----------
create table if not exists public.lavados (
  id bigint generated always as identity primary key,
  formacion int not null check (formacion between 1 and 23),
  ingreso time,
  egreso time,
  pasadas int check (pasadas >= 0),
  ok boolean,
  created_at timestamptz not null default now()
);

-- ---------- Trigger realtime: lavados ----------
-- Mismo patrón que formaciones/locomotoras: publicación explícita
-- en el canal 'lavados' (eventos 'lavado:changed' / 'lavado:deleted').
create or replace function public.notificar_cambio_lavado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform realtime.publish('lavados', 'lavado:deleted', to_jsonb(old));
    return old;
  end if;
  perform realtime.publish('lavados', 'lavado:changed', to_jsonb(new));
  return new;
end;
$$;

drop trigger if exists trg_realtime_lavados on public.lavados;
create trigger trg_realtime_lavados
  after insert or update or delete on public.lavados
  for each row execute function public.notificar_cambio_lavado();

-- ---------- RLS ----------
alter table public.lavados enable row level security;

-- Lectura pública / escritura solo editores (usual de las otras tablas)
create policy "Lectura pública de lavados"
  on public.lavados for select
  using (true);

create policy "Insertar solo editores lavados"
  on public.lavados for insert
  with check (public.es_editor());

create policy "Actualizar solo editores lavados"
  on public.lavados for update
  using (public.es_editor())
  with check (public.es_editor());

create policy "Eliminar solo editores lavados"
  on public.lavados for delete
  using (public.es_editor());

-- ---------- Permisos ----------
grant usage on schema public to anon, authenticated;
grant select on public.lavados to anon;
grant select, insert, update, delete on public.lavados to authenticated;
grant usage on sequence public.lavados_id_seq to anon, authenticated;

-- ---------- Seed de ejemplo ----------
insert into public.lavados (formacion, ingreso, egreso, pasadas, ok, created_at) values
  (1,  '08:30', '09:05', 2, true,  now() - interval '10 days'),
  (4,  '09:15', '09:50', 2, true,  now() - interval '8 days'),
  (8,  '10:00', '10:40', 2, false, now() - interval '6 days'),
  (13, '11:20', '11:55', 2, true,  now() - interval '4 days'),
  (20, '12:10', '12:45', 2, null,  now() - interval '2 days'),
  (1,  '14:00', '14:35', 2, true,  now() - interval '1 day');