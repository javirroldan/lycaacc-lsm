-- Semáforos configurables por sección y ajuste: solo admin (sin rol editor efectivo)
-- Umbrales independientes para Formaciones y Locomotoras, editables por admin.

-- 1) Permisos: solo admin puede editar (no hay editores). Se redefine es_editor()
--    para que todas las políticas/RLS existentes queden restringidas a admin.
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
        and rol = 'admin'
    ),
    false
  );
$$;

-- 2) Helper explícito de admin (alias claro para nuevas funciones/políticas)
create or replace function public.es_admin()
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
        and rol = 'admin'
    ),
    false
  );
$$;

-- 3) Valores iniciales de semáforos (mismos rangos que hoy: 0-15 verde, 16-28 amarillo, 29+ rojo)
insert into public.configuracion (clave, valor) values
  ('semaforo_formaciones_verde', '15'),
  ('semaforo_formaciones_amarillo', '28'),
  ('semaforo_locomotoras_verde', '15'),
  ('semaforo_locomotoras_amarillo', '28')
on conflict (clave) do nothing;

-- 4) Lectura pública de semáforos (todos los usuarios necesitan ver colores/leyendas)
--    No expone otras claves sensibles (códigos).
drop policy if exists "Lectura pública de semáforos" on public.configuracion;
create policy "Lectura pública de semáforos"
  on public.configuracion for select
  using (clave like 'semaforo_%');

grant select on public.configuracion to anon, authenticated;

-- 5) RPC para obtener semáforos (conveniente para el cliente)
create or replace function public.obtener_semaforos()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    jsonb_object_agg(clave, valor),
    '{}'::jsonb
  )
  from public.configuracion
  where clave in (
    'semaforo_formaciones_verde',
    'semaforo_formaciones_amarillo',
    'semaforo_locomotoras_verde',
    'semaforo_locomotoras_amarillo'
  );
$$;

revoke all on function public.obtener_semaforos() from public;
grant execute on function public.obtener_semaforos() to anon, authenticated;

-- 6) RPC para guardar semáforos (solo admin) con validación
create or replace function public.guardar_semaforos(
  p_formaciones_verde int,
  p_formaciones_amarillo int,
  p_locomotoras_verde int,
  p_locomotoras_amarillo int
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.es_admin() then
    raise exception 'Solo el administrador puede modificar los semáforos';
  end if;

  if p_formaciones_verde < 0 or p_locomotoras_verde < 0 then
    raise exception 'El umbral verde debe ser >= 0';
  end if;
  if p_formaciones_amarillo <= p_formaciones_verde then
    raise exception 'El umbral amarillo de formaciones debe ser mayor al verde';
  end if;
  if p_locomotoras_amarillo <= p_locomotoras_verde then
    raise exception 'El umbral amarillo de locomotoras debe ser mayor al verde';
  end if;

  insert into public.configuracion (clave, valor, actualizado_en) values
    ('semaforo_formaciones_verde', p_formaciones_verde::text, now()),
    ('semaforo_formaciones_amarillo', p_formaciones_amarillo::text, now()),
    ('semaforo_locomotoras_verde', p_locomotoras_verde::text, now()),
    ('semaforo_locomotoras_amarillo', p_locomotoras_amarillo::text, now())
  on conflict (clave) do update
    set valor = excluded.valor,
        actualizado_en = now();

  return public.obtener_semaforos();
end;
$$;

revoke all on function public.guardar_semaforos(int, int, int, int) from public;
grant execute on function public.guardar_semaforos(int, int, int, int) to authenticated;
