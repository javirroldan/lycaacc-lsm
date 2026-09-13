-- ============================================================
-- Migración inicial: LyCAACC-LSM (fork de trenes-app v2)
-- Tablas, RLS, realtime y helpers
-- ============================================================

-- ---------- Helper: id del actor actual (tolerante a sub no-uuid) ----------
create or replace function public.auth_actor()
returns uuid
language plpgsql
stable
as $$
declare
  v_sub text;
begin
  begin
    v_sub := nullif(current_setting('request.jwt.claim.sub', true), '');
  exception when others then
    v_sub := null;
  end;
  if v_sub is null or v_sub = '' then return null; end if;
  begin
    return v_sub::uuid;
  exception when invalid_text_representation then
    return null;
  end;
end;
$$;

-- ---------- Tabla: formaciones ----------
create table if not exists public.formaciones (
  id bigint generated always as identity primary key,
  formacion int not null unique,
  anteultima date,
  ultima date,
  estado text not null default 'fuera-servicio'
    check (estado in ('activa', 'limpieza', 'reparacion', 'fuera-servicio')),
  descripcion text,
  updated_at timestamptz not null default now()
);

-- ---------- Tabla: roles ----------
create table if not exists public.roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  rol text not null default 'editor' check (rol in ('admin', 'editor')),
  creado_en timestamptz not null default now()
);

-- ---------- Tabla: historial (auditoría de cambios en formaciones) ----------
create table if not exists public.historial (
  id bigint generated always as identity primary key,
  formacion_id bigint not null references public.formaciones (id) on delete cascade,
  campo text not null,
  valor_anterior text,
  valor_nuevo text,
  creado_en timestamptz not null default now(),
  actor uuid references auth.users (id)
);

-- ---------- Tabla: locomotoras ----------
create table if not exists public.locomotoras (
  id bigint generated always as identity primary key,
  locomotora text not null unique,
  servicio text not null default 'local'
    check (servicio in ('local', 'ld')),
  ultima date,
  estado text not null default 'en-servicio'
    check (estado in ('en-servicio', 'detenida')),
  descripcion text,
  updated_at timestamptz not null default now()
);

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
      where user_id = public.auth_actor()
        and rol in ('admin', 'editor')
    ),
    false
  );
$$;

-- ---------- Trigger de auditoría: formaciones ----------
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
      values (new.id, 'ultima', old_val, new_val, public.auth_actor());
    end if;
    if old.anteultima is distinct from new.anteultima then
      old_val := to_char(old.anteultima, 'DD/MM/YYYY');
      new_val := to_char(new.anteultima, 'DD/MM/YYYY');
      insert into public.historial (formacion_id, campo, valor_anterior, valor_nuevo, actor)
      values (new.id, 'anteultima', old_val, new_val, public.auth_actor());
    end if;
    if old.estado is distinct from new.estado then
      insert into public.historial (formacion_id, campo, valor_anterior, valor_nuevo, actor)
      values (new.id, 'estado', old.estado, new.estado, public.auth_actor());
    end if;
    if old.descripcion is distinct from new.descripcion then
      insert into public.historial (formacion_id, campo, valor_anterior, valor_nuevo, actor)
      values (new.id, 'descripcion', old.descripcion, new.descripcion, public.auth_actor());
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
      values (new.id, 'ultima', old_val, new_val, public.auth_actor());
    end if;
    if old.servicio is distinct from new.servicio then
      insert into public.historial_locomotoras (locomotora_id, campo, valor_anterior, valor_nuevo, actor)
      values (new.id, 'servicio', old.servicio, new.servicio, public.auth_actor());
    end if;
    if old.estado is distinct from new.estado then
      insert into public.historial_locomotoras (locomotora_id, campo, valor_anterior, valor_nuevo, actor)
      values (new.id, 'estado', old.estado, new.estado, public.auth_actor());
    end if;
    if old.descripcion is distinct from new.descripcion then
      insert into public.historial_locomotoras (locomotora_id, campo, valor_anterior, valor_nuevo, actor)
      values (new.id, 'descripcion', old.descripcion, new.descripcion, public.auth_actor());
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

-- ---------- Trigger realtime: formaciones ----------
-- InsForge no usa publicaciones: cada cambio se publica explícitamente
-- en el canal 'formaciones' (eventos 'formacion:changed' / 'formacion:deleted').
create or replace function public.notificar_cambio_formacion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform realtime.publish('formaciones', 'formacion:deleted', to_jsonb(old));
    return old;
  end if;
  perform realtime.publish('formaciones', 'formacion:changed', to_jsonb(new));
  return new;
end;
$$;

drop trigger if exists trg_realtime_formaciones on public.formaciones;
create trigger trg_realtime_formaciones
  after insert or update or delete on public.formaciones
  for each row execute function public.notificar_cambio_formacion();

-- ---------- Trigger realtime: locomotoras ----------
create or replace function public.notificar_cambio_locomotora()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform realtime.publish('locomotoras', 'locomotora:deleted', to_jsonb(old));
    return old;
  end if;
  perform realtime.publish('locomotoras', 'locomotora:changed', to_jsonb(new));
  return new;
end;
$$;

drop trigger if exists trg_realtime_locomotoras on public.locomotoras;
create trigger trg_realtime_locomotoras
  after insert or update or delete on public.locomotoras
  for each row execute function public.notificar_cambio_locomotora();

-- ---------- RLS ----------
alter table public.formaciones enable row level security;
alter table public.roles enable row level security;
alter table public.historial enable row level security;
alter table public.locomotoras enable row level security;
alter table public.historial_locomotoras enable row level security;

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

-- Lectura pública de locomotoras
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

-- Roles: cada usuario lee su rol; los editores leen todos (para gestión)
create policy "Leer roles"
  on public.roles for select
  using (user_id = public.auth_actor() or public.es_editor());

-- Rol no modificable desde el cliente (se gestiona por dashboard admin/sql)
create policy "Sin modificación de roles desde el cliente"
  on public.roles for all
  using (false)
  with check (false);

-- Historial: lectura para editores
create policy "Leer historial"
  on public.historial for select
  using (public.es_editor());

create policy "Leer historial locomotoras"
  on public.historial_locomotoras for select
  using (public.es_editor());

-- ---------- Permisos ----------
grant usage on schema public to anon, authenticated;
grant select on public.formaciones, public.locomotoras, public.roles, public.historial, public.historial_locomotoras to anon;
grant select, insert, update, delete on public.formaciones, public.locomotoras, public.roles, public.historial, public.historial_locomotoras to authenticated;
grant usage on sequence public.formaciones_id_seq, public.locomotoras_id_seq, public.historial_id_seq, public.historial_locomotoras_id_seq to anon, authenticated;