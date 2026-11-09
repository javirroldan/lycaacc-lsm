-- Código de acceso Gerencia (solo lectura + informes PDF)
-- Usar con: npx @insforge/cli db import -f migrations/20260923120400_codigo-gerencia.sql
-- o migrations up --all. Código inicial: 812346

create extension if not exists pgcrypto;

-- 1. Ampliar check de roles para incluir gerencia
do $$
begin
  alter table public.roles drop constraint if exists roles_rol_check;
  alter table public.roles add constraint roles_rol_check check (rol in ('admin','editor','gerencia'));
exception
  when others then null;
end $$;

-- 2. Actualizar función de validación para incluir gerencia
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
        else ''
      end
      and c.valor = crypt(p_codigo, c.valor)
  )
$$;

revoke all on function public.validar_codigo_acceso(text, text) from public;
grant execute on function public.validar_codigo_acceso(text, text) to anon, authenticated;

-- 3. Insertar código gerencia
insert into public.configuracion (clave, valor) values
  ('codigo_gerencia', crypt('812346', gen_salt('bf')))
on conflict (clave) do nothing;
