-- Usuarios editores por sección: Formaciones y Locomotoras
-- - Pueden leer todo (como empleado), pero editar/agregar solo en su sección.
-- - No tienen acceso a informes desde la UI (controlado en frontend) ni a otras secciones.
-- - Implementado como cuentas ocultas fijas (como admin/empleado/gerencia).

-- 1) Ampliar roles permitidos
do $$
begin
  alter table public.roles drop constraint if exists roles_rol_check;
  alter table public.roles add constraint roles_rol_check
    check (rol in ('admin', 'editor', 'gerencia', 'editor_formaciones', 'editor_locomotoras'));
exception when undefined_table then
  null;
end $$;

-- 2) Helpers de permisos por sección (admin o editor de la sección)
create or replace function public.puede_editar_formaciones()
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
        and rol in ('admin', 'editor_formaciones')
    ),
    false
  );
$$;

create or replace function public.puede_editar_locomotoras()
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
        and rol in ('admin', 'editor_locomotoras')
    ),
    false
  );
$$;

-- 3) Políticas: Formaciones (fila + historial de servicios)
drop policy if exists "Insertar solo editores" on public.formaciones;
drop policy if exists "Actualizar solo editores" on public.formaciones;
drop policy if exists "Eliminar solo editores" on public.formaciones;

create policy "Insertar formaciones (admin o editor de sección)"
  on public.formaciones for insert
  with check (public.puede_editar_formaciones());

create policy "Actualizar formaciones (admin o editor de sección)"
  on public.formaciones for update
  using (public.puede_editar_formaciones())
  with check (public.puede_editar_formaciones());

create policy "Eliminar formaciones (admin o editor de sección)"
  on public.formaciones for delete
  using (public.puede_editar_formaciones());

drop policy if exists "Insertar solo editores servicios_formaciones" on public.servicios_formaciones;
drop policy if exists "Actualizar solo editores servicios_formaciones" on public.servicios_formaciones;
drop policy if exists "Eliminar solo editores servicios_formaciones" on public.servicios_formaciones;

create policy "Insertar servicios_formaciones (admin o editor de sección)"
  on public.servicios_formaciones for insert
  with check (public.puede_editar_formaciones());

create policy "Actualizar servicios_formaciones (admin o editor de sección)"
  on public.servicios_formaciones for update
  using (public.puede_editar_formaciones())
  with check (public.puede_editar_formaciones());

create policy "Eliminar servicios_formaciones (admin o editor de sección)"
  on public.servicios_formaciones for delete
  using (public.puede_editar_formaciones());

-- 4) Políticas: Locomotoras (fila + historial de servicios)
drop policy if exists "Insertar solo editores locomotoras" on public.locomotoras;
drop policy if exists "Actualizar solo editores locomotoras" on public.locomotoras;
drop policy if exists "Eliminar solo editores locomotoras" on public.locomotoras;

create policy "Insertar locomotoras (admin o editor de sección)"
  on public.locomotoras for insert
  with check (public.puede_editar_locomotoras());

create policy "Actualizar locomotoras (admin o editor de sección)"
  on public.locomotoras for update
  using (public.puede_editar_locomotoras())
  with check (public.puede_editar_locomotoras());

create policy "Eliminar locomotoras (admin o editor de sección)"
  on public.locomotoras for delete
  using (public.puede_editar_locomotoras());

drop policy if exists "Insertar solo editores servicios_locomotoras" on public.servicios_locomotoras;
drop policy if exists "Actualizar solo editores servicios_locomotoras" on public.servicios_locomotoras;
drop policy if exists "Eliminar solo editores servicios_locomotoras" on public.servicios_locomotoras;

create policy "Insertar servicios_locomotoras (admin o editor de sección)"
  on public.servicios_locomotoras for insert
  with check (public.puede_editar_locomotoras());

create policy "Actualizar servicios_locomotoras (admin o editor de sección)"
  on public.servicios_locomotoras for update
  using (public.puede_editar_locomotoras())
  with check (public.puede_editar_locomotoras());

create policy "Eliminar servicios_locomotoras (admin o editor de sección)"
  on public.servicios_locomotoras for delete
  using (public.puede_editar_locomotoras());

-- 5) Validación de código de acceso: agregar tipos por sección
create or replace function public.validar_codigo_acceso(p_codigo text, p_tipo text)
returns boolean
language sql
security definer
stable
as $$
  select exists(
    select 1 from public.configuracion c
    where c.clave = case p_tipo
        when 'admin' then 'codigo_admin'
        when 'empleado' then 'codigo_empleado'
        when 'gerencia' then 'codigo_gerencia'
        when 'formaciones' then 'codigo_formaciones'
        when 'locomotoras' then 'codigo_locomotoras'
        else ''
      end
      and c.valor = crypt(p_codigo, c.valor)
  )
$$;

revoke all on function public.validar_codigo_acceso(text, text) from public;
grant execute on function public.validar_codigo_acceso(text, text) to anon, authenticated;

-- 6) Códigos iniciales por sección (cambiar en producción si se desea)
insert into public.configuracion (clave, valor) values
  ('codigo_formaciones', crypt('246810', gen_salt('bf'))),
  ('codigo_locomotoras', crypt('135790', gen_salt('bf')))
on conflict (clave) do nothing;

-- Nota: crear las cuentas ocultas en Auth y asignar roles en public.roles:
--   formaciones@trenes.local  -> rol 'editor_formaciones'
--   locomotoras@trenes.local  -> rol 'editor_locomotoras'
-- y configurar VITE_FORMACIONES_* / VITE_LOCOMOTORAS_* en el build.
