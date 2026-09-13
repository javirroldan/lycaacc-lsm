-- ============================================================
-- Migración 0004: Tabla locomotoras
-- Tabla, RLS, realtime, historial y seed de 26 locomotoras
-- ============================================================

begin;

-- ---------- Tabla: locomotoras ----------
create table if not exists public.locomotoras (
  id bigint generated always as identity primary key,
  locomotora text not null unique,
  servicio text not null default 'local'
    check (servicio in ('local', 'ld')),
  ultima date,
  estado text not null default 'en-servicio'
    check (estado in ('en-servicio', 'detenida')),
  updated_at timestamptz not null default now()
);

alter table public.locomotoras replica identity full;

-- ---------- Tabla: historial_locomotoras (auditoría) ----------
create table if not exists public.historial_locomotoras (
  id bigint generated always as identity primary key,
  locomotora_id bigint not null references public.locomotoras (id) on delete cascade,
  campo text not null,
  valor_anterior text,
  valor_nuevo text,
  creado_en timestamptz not null default now(),
  actor uuid references auth.users (id)
);

-- ---------- Trigger de auditoría: locomotoras ----------
create or replace function public.log_cambio_locomotora()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  old_val text;
  new_val text;
begin
  if old is distinct from new then
    if old.ultima is distinct from new.ultima then
      old_val := to_char(old.ultima, 'DD/MM/YYYY');
      new_val := to_char(new.ultima, 'DD/MM/YYYY');
      insert into public.historial_locomotoras (locomotora_id, campo, valor_anterior, valor_nuevo, actor)
      values (new.id, 'ultima', old_val, new_val, auth.uid());
    end if;
    if old.servicio is distinct from new.servicio then
      insert into public.historial_locomotoras (locomotora_id, campo, valor_anterior, valor_nuevo, actor)
      values (new.id, 'servicio', old.servicio, new.servicio, auth.uid());
    end if;
    if old.estado is distinct from new.estado then
      insert into public.historial_locomotoras (locomotora_id, campo, valor_anterior, valor_nuevo, actor)
      values (new.id, 'estado', old.estado, new.estado, auth.uid());
    end if;
    new.updated_at := now();
    return new;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_log_cambio_locomotora on public.locomotoras;
create trigger trg_log_cambio_locomotora
  before update on public.locomotoras
  for each row execute function public.log_cambio_locomotora();

-- ---------- RLS ----------
alter table public.locomotoras enable row level security;
alter table public.historial_locomotoras enable row level security;

-- Lectura pública
create policy "Lectura pública de locomotoras"
  on public.locomotoras for select
  using (true);

create policy "Insertar solo editores locomotoras"
  on public.locomotoras for insert
  with check (public.es_editor());

create policy "Actualizar solo editores locomotoras"
  on public.locomotoras for update
  using (public.es_editor())
  with check (public.es_editor());

create policy "Eliminar solo editores locomotoras"
  on public.locomotoras for delete
  using (public.es_editor());

-- Historial locomotoras: lectura para editores
create policy "Leer historial locomotoras"
  on public.historial_locomotoras for select
  using (public.es_editor());

-- ---------- Seed: 26 locomotoras ----------
insert into public.locomotoras (locomotora, servicio, ultima, estado) values
  ('B970', 'local', '2026-09-08', 'en-servicio'),
  ('B956', 'local', '2026-09-07', 'en-servicio'),
  ('A715', 'ld',    '2026-09-04', 'en-servicio'),
  ('B950', 'local', '2026-09-02', 'en-servicio'),
  ('B967', 'local', '2026-09-01', 'en-servicio'),
  ('B975', 'local', '2026-08-31', 'en-servicio'),
  ('B816', 'local', '2026-08-29', 'en-servicio'),
  ('B963', 'local', '2026-08-28', 'en-servicio'),
  ('B957', 'local', '2026-08-27', 'en-servicio'),
  ('B969', 'local', '2026-08-24', 'detenida'),
  ('B960', 'local', '2026-08-21', 'en-servicio'),
  ('B959', 'local', '2026-08-20', 'en-servicio'),
  ('A924', 'local', '2026-08-19', 'en-servicio'),
  ('B954', 'local', '2026-08-18', 'en-servicio'),
  ('A707', 'local', '2026-08-13', 'en-servicio'),
  ('B952', 'local', '2026-08-12', 'en-servicio'),
  ('B976', 'local', '2026-08-11', 'en-servicio'),
  ('G004', 'ld',    '2026-08-10', 'en-servicio'),
  ('B966', 'local', '2026-08-07', 'en-servicio'),
  ('B965', 'local', '2026-08-06', 'en-servicio'),
  ('B974', 'local', '2026-08-04', 'en-servicio'),
  ('B955', 'local', '2026-07-29', 'detenida'),
  ('B953', 'local', '2026-07-28', 'en-servicio'),
  ('B961', 'local', '2026-06-30', 'en-servicio'),
  ('H003', 'ld',    '2026-06-18', 'en-servicio'),
  ('B964', 'local', '2026-05-19', 'en-servicio')
on conflict (locomotora) do update
set ultima = excluded.ultima,
    servicio = excluded.servicio,
    estado = excluded.estado;

-- ---------- Realtime ----------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.locomotoras;
  end if;
end
$$;

commit;