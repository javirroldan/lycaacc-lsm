-- ============================================================
-- Migración inicial: Trenes App v2
-- Tablas, RLS, realtime y seed de las 23 formaciones
-- ============================================================

begin;

-- ---------- Tabla: formaciones ----------
create table if not exists public.formaciones (
  id bigint generated always as identity primary key,
  formacion int not null unique,
  anteultima date,
  ultima date,
  estado text not null default 'fuera-servicio'
    check (estado in ('activa', 'limpieza', 'reparacion', 'fuera-servicio')),
  updated_at timestamptz not null default now()
);

-- Necesario para que Realtime envíe la fila completa en cada cambio
alter table public.formaciones replica identity full;

-- ---------- Tabla: roles ----------
create table if not exists public.roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  rol text not null default 'editor' check (rol in ('admin', 'editor')),
  creado_en timestamptz not null default now()
);

-- ---------- Tabla: historial (auditoría de cambios) ----------
create table if not exists public.historial (
  id bigint generated always as identity primary key,
  formacion_id bigint not null references public.formaciones (id) on delete cascade,
  campo text not null,
  valor_anterior text,
  valor_nuevo text,
  creado_en timestamptz not null default now(),
  actor uuid references auth.users (id)
);

-- ---------- Función de seguridad: es_editor ----------
create or replace function public.es_editor()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    exists (
      select 1
      from public.roles
      where user_id = auth.uid()
        and rol in ('admin', 'editor')
    ),
    false
  );
$$;

-- ---------- Trigger de auditoría ----------
create or replace function public.log_cambio()
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
      insert into public.historial (formacion_id, campo, valor_anterior, valor_nuevo, actor)
      values (new.id, 'ultima', old_val, new_val, auth.uid());
    end if;
    if old.anteultima is distinct from new.anteultima then
      old_val := to_char(old.anteultima, 'DD/MM/YYYY');
      new_val := to_char(new.anteultima, 'DD/MM/YYYY');
      insert into public.historial (formacion_id, campo, valor_anterior, valor_nuevo, actor)
      values (new.id, 'anteultima', old_val, new_val, auth.uid());
    end if;
    if old.estado is distinct from new.estado then
      insert into public.historial (formacion_id, campo, valor_anterior, valor_nuevo, actor)
      values (new.id, 'estado', old.estado, new.estado, auth.uid());
    end if;
    new.updated_at := now();
    return new;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_log_cambio on public.formaciones;
create trigger trg_log_cambio
  before update on public.formaciones
  for each row execute function public.log_cambio();

-- ---------- RLS ----------
alter table public.formaciones enable row level security;
alter table public.roles enable row level security;
alter table public.historial enable row level security;

-- Lectura pública (≡ "ver como visitante" sin login)
create policy "Lectura pública de formaciones"
  on public.formaciones for select
  using (true);

create policy "Insertar solo editores"
  on public.formaciones for insert
  with check (public.es_editor());

create policy "Actualizar solo editores"
  on public.formaciones for update
  using (public.es_editor())
  with check (public.es_editor());

create policy "Eliminar solo editores"
  on public.formaciones for delete
  using (public.es_editor());

-- Roles: cada usuario lee su rol; los editores leen todos (para gestión)
create policy "Leer roles"
  on public.roles for select
  using (user_id = auth.uid() or public.es_editor());

-- Rol no modificable desde el cliente (se gestiona por dashboard admin/sql)
create policy "Sin modificación de roles desde el cliente"
  on public.roles for all
  using (false)
  with check (false);

-- Historial: lectura para editores
create policy "Leer historial"
  on public.historial for select
  using (public.es_editor());

-- ---------- Seed: 23 formaciones ----------
insert into public.formaciones (formacion, anteultima, ultima, estado) values
  (1, '2026-04-14', '2026-04-29', 'limpieza'),
  (2, NULL, NULL, 'fuera-servicio'),
  (3, NULL, NULL, 'fuera-servicio'),
  (4, '2026-02-04', '2026-02-18', 'reparacion'),
  (5, '2026-04-20', '2026-04-21', 'limpieza'),
  (6, '2026-04-16', '2026-04-28', 'limpieza'),
  (7, '2026-03-09', '2026-04-22', 'limpieza'),
  (8, '2026-03-23', '2026-04-17', 'limpieza'),
  (9, NULL, NULL, 'fuera-servicio'),
  (10, '2026-03-05', '2026-04-01', 'limpieza'),
  (11, NULL, NULL, 'fuera-servicio'),
  (12, '2026-03-13', '2026-04-23', 'limpieza'),
  (13, '2026-03-30', '2026-04-30', 'limpieza'),
  (14, '2026-03-27', '2026-04-07', 'limpieza'),
  (15, NULL, NULL, 'fuera-servicio'),
  (16, '2026-03-18', '2026-04-08', 'limpieza'),
  (17, '2026-03-06', '2026-04-13', 'limpieza'),
  (18, '2026-03-26', '2026-04-10', 'limpieza'),
  (19, '2026-03-03', '2026-04-24', 'limpieza'),
  (20, '2026-02-12', '2026-04-09', 'limpieza'),
  (21, '2026-02-25', '2026-03-11', 'reparacion'),
  (22, '2026-04-06', '2026-04-15', 'limpieza'),
  (23, '2026-03-31', '2026-04-27', 'limpieza')
on conflict (formacion) do update
set anteultima = excluded.anteultima,
    ultima = excluded.ultima,
    estado = excluded.estado;

-- ---------- Realtime ----------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.formaciones;
  end if;
end
$$;

commit;
