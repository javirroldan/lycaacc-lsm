-- Archivado y ABM de formaciones/locomotoras (solo admin)
-- - Agrega archivado (soft-delete) conservando historial/servicios/lavados.
-- - RPCs admin para crear, renombrar/renumerar y archivar/restaurar.
-- - Al renumerar una formación se actualizan sus lavados (mismo número).

alter table public.formaciones
  add column if not exists archivada boolean not null default false,
  add column if not exists archivada_en timestamptz;

alter table public.locomotoras
  add column if not exists archivada boolean not null default false,
  add column if not exists archivada_en timestamptz;

-- ---------- Formaciones ----------
create or replace function public.admin_crear_formacion(p_formacion int, p_estado text default 'fuera-servicio', p_descripcion text default null)
returns public.formaciones
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.formaciones;
begin
  if not public.es_admin() then
    raise exception 'Solo el administrador puede crear formaciones';
  end if;
  if p_formacion is null or p_formacion < 1 then
    raise exception 'El número de formación debe ser mayor a 0';
  end if;
  insert into public.formaciones (formacion, estado, descripcion)
  values (p_formacion, coalesce(p_estado, 'fuera-servicio'), nullif(p_descripcion, ''))
  returning * into v_row;
  return v_row;
end;
$$;

create or replace function public.admin_renumerar_formacion(p_id bigint, p_nuevo_numero int)
returns public.formaciones
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actual int;
  v_row public.formaciones;
begin
  if not public.es_admin() then
    raise exception 'Solo el administrador puede renumerar formaciones';
  end if;
  if p_nuevo_numero is null or p_nuevo_numero < 1 then
    raise exception 'El número de formación debe ser mayor a 0';
  end if;

  select formacion into v_actual from public.formaciones where id = p_id for update;
  if not found then
    raise exception 'Formación no encontrada';
  end if;

  if v_actual is distinct from p_nuevo_numero then
    -- Actualizar historial de lavados asociado al número para conservarlo
    update public.lavados set formacion = p_nuevo_numero where formacion = v_actual;
    update public.formaciones set formacion = p_nuevo_numero where id = p_id returning * into v_row;
  else
    select * into v_row from public.formaciones where id = p_id;
  end if;

  return v_row;
end;
$$;

create or replace function public.admin_archivar_formacion(p_id bigint, p_archivar boolean default true)
returns public.formaciones
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.formaciones;
begin
  if not public.es_admin() then
    raise exception 'Solo el administrador puede archivar formaciones';
  end if;
  update public.formaciones
    set archivada = coalesce(p_archivar, true),
        archivada_en = case when coalesce(p_archivar, true) then now() else null end
  where id = p_id
  returning * into v_row;
  if not found then
    raise exception 'Formación no encontrada';
  end if;
  return v_row;
end;
$$;

revoke all on function public.admin_crear_formacion(int, text, text) from public;
revoke all on function public.admin_renumerar_formacion(bigint, int) from public;
revoke all on function public.admin_archivar_formacion(bigint, boolean) from public;
grant execute on function public.admin_crear_formacion(int, text, text) to authenticated;
grant execute on function public.admin_renumerar_formacion(bigint, int) to authenticated;
grant execute on function public.admin_archivar_formacion(bigint, boolean) to authenticated;

-- ---------- Locomotoras ----------
create or replace function public.admin_crear_locomotora(
  p_locomotora text,
  p_servicio text default 'local',
  p_estado text default 'en-servicio',
  p_descripcion text default null
)
returns public.locomotoras
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.locomotoras;
begin
  if not public.es_admin() then
    raise exception 'Solo el administrador puede crear locomotoras';
  end if;
  if coalesce(trim(p_locomotora), '') = '' then
    raise exception 'El identificador de la locomotora es obligatorio';
  end if;
  insert into public.locomotoras (locomotora, servicio, estado, descripcion)
  values (trim(p_locomotora), coalesce(p_servicio, 'local'), coalesce(p_estado, 'en-servicio'), nullif(p_descripcion, ''))
  returning * into v_row;
  return v_row;
end;
$$;

create or replace function public.admin_renombrar_locomotora(p_id bigint, p_nuevo_nombre text)
returns public.locomotoras
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.locomotoras;
begin
  if not public.es_admin() then
    raise exception 'Solo el administrador puede renombrar locomotoras';
  end if;
  if coalesce(trim(p_nuevo_nombre), '') = '' then
    raise exception 'El identificador de la locomotora es obligatorio';
  end if;
  update public.locomotoras
    set locomotora = trim(p_nuevo_nombre)
  where id = p_id
  returning * into v_row;
  if not found then
    raise exception 'Locomotora no encontrada';
  end if;
  return v_row;
end;
$$;

create or replace function public.admin_archivar_locomotora(p_id bigint, p_archivar boolean default true)
returns public.locomotoras
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.locomotoras;
begin
  if not public.es_admin() then
    raise exception 'Solo el administrador puede archivar locomotoras';
  end if;
  update public.locomotoras
    set archivada = coalesce(p_archivar, true),
        archivada_en = case when coalesce(p_archivar, true) then now() else null end
  where id = p_id
  returning * into v_row;
  if not found then
    raise exception 'Locomotora no encontrada';
  end if;
  return v_row;
end;
$$;

revoke all on function public.admin_crear_locomotora(text, text, text, text) from public;
revoke all on function public.admin_renombrar_locomotora(bigint, text) from public;
revoke all on function public.admin_archivar_locomotora(bigint, boolean) from public;
grant execute on function public.admin_crear_locomotora(text, text, text, text) to authenticated;
grant execute on function public.admin_renombrar_locomotora(bigint, text) to authenticated;
grant execute on function public.admin_archivar_locomotora(bigint, boolean) to authenticated;
