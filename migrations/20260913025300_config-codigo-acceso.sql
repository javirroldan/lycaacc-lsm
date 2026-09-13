-- Códigos de acceso por tipo (admin/empleado). El hash nunca viaja al frontend.
create extension if not exists pgcrypto;

create table if not exists public.configuracion (
  clave text primary key,
  valor text not null,
  actualizado_en timestamptz not null default now()
);

alter table public.configuracion enable row level security;

-- Solo editores leen/editan config desde el cliente; la validación va por función security definer
create policy "Leer configuración solo editores"
  on public.configuracion for select
  using (public.es_editor());

create policy "Editar configuración solo editores"
  on public.configuracion for update
  using (public.es_editor())
  with check (public.es_editor());

grant select, update on public.configuracion to authenticated;

-- Validación sin exponer el hash: responde true/false según tipo
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
        else ''
      end
      and c.valor = crypt(p_codigo, c.valor)
  )
$$;

revoke all on function public.validar_codigo_acceso(text, text) from public;
grant execute on function public.validar_codigo_acceso(text, text) to anon, authenticated;

-- Códigos iniciales (on conflict do nothing: si se rotaron luego, la migración no los pisara)
insert into public.configuracion (clave, valor) values
  ('codigo_admin', crypt('914818', gen_salt('bf'))),
  ('codigo_empleado', crypt('308575', gen_salt('bf')))
on conflict (clave) do nothing;