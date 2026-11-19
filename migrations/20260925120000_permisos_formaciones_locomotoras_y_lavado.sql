-- Reemplaza editores separados (Formaciones / Locomotoras) por:
-- 1) Un usuario que puede editar y agregar en Formaciones y Locomotoras.
-- 2) Otro usuario que puede editar y agregar solo en Lavado.
-- Se eliminan los accesos/tipos/códigos anteriores de editores por sección.

-- 1) Roles: migrar filas antiguas y actualizar constraint
delete from public.roles
where rol in ('editor_formaciones', 'editor_locomotoras');

do $$
begin
  alter table public.roles drop constraint if exists roles_rol_check;
  alter table public.roles add constraint roles_rol_check
    check (rol in ('admin', 'editor', 'gerencia', 'editor_formaciones_locomotoras', 'editor_lavado'));
exception when undefined_table then
  null;
end $$;

-- 2) Helpers de permisos por sección
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
        and rol in ('admin', 'editor_formaciones_locomotoras')
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
        and rol in ('admin', 'editor_formaciones_locomotoras')
    ),
    false
  );
$$;

create or replace function public.puede_editar_lavados()
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
        and rol in ('admin', 'editor_lavado')
    ),
    false
  );
$$;

-- 3) Políticas: Lavado (antes solo admin vía es_editor)
drop policy if exists "Insertar solo editores lavados" on public.lavados;
drop policy if exists "Actualizar solo editores lavados" on public.lavados;
drop policy if exists "Eliminar solo editores lavados" on public.lavados;
drop policy if exists "Insertar lavados (admin o editor de lavado)" on public.lavados;
drop policy if exists "Actualizar lavados (admin o editor de lavado)" on public.lavados;
drop policy if exists "Eliminar lavados (admin o editor de lavado)" on public.lavados;

create policy "Insertar lavados (admin o editor de lavado)"
  on public.lavados for insert
  with check (public.puede_editar_lavados());

create policy "Actualizar lavados (admin o editor de lavado)"
  on public.lavados for update
  using (public.puede_editar_lavados())
  with check (public.puede_editar_lavados());

create policy "Eliminar lavados (admin o editor de lavado)"
  on public.lavados for delete
  using (public.puede_editar_lavados());

-- 4) Validación de código de acceso: nuevos tipos por sección combinada y lavado
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
        when 'formaciones_locomotoras' then 'codigo_formaciones_locomotoras'
        when 'lavado' then 'codigo_lavado'
        else ''
      end
      and c.valor = crypt(p_codigo, c.valor)
  )
$$;

revoke all on function public.validar_codigo_acceso(text, text) from public;
grant execute on function public.validar_codigo_acceso(text, text) to anon, authenticated;

-- 5) Códigos: eliminar accesos anteriores y definir nuevos (cambiar en producción si se desea)
delete from public.configuracion
where clave in ('codigo_formaciones', 'codigo_locomotoras');

insert into public.configuracion (clave, valor) values
  ('codigo_formaciones_locomotoras', crypt('738264', gen_salt('bf'))),
  ('codigo_lavado', crypt('419573', gen_salt('bf')))
on conflict (clave) do update set valor = excluded.valor;

-- Nota: recrear/asignar cuentas ocultas en Auth y roles en public.roles con:
--   npm run setup:cuentas
-- Cuentas esperadas:
--   formaciones_locomotoras@trenes.local -> rol 'editor_formaciones_locomotoras'
--   lavado@trenes.local                  -> rol 'editor_lavado'
-- Configurar VITE_FORMACIONES_LOCOMOTORAS_* y VITE_LAVADO_* en el build/deploy.
