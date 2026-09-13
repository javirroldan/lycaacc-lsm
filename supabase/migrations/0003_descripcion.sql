-- ============================================================
-- Migración 0003: columna descripcion en formaciones
-- Agrega un campo de detalle/descripción editable por el admin.
-- Ejecutar en el SQL Editor de Supabase.
-- ============================================================

begin;

-- Columna de descripción (nullable, texto libre)
alter table public.formaciones add column if not exists descripcion text;

-- Auditamos también la descripción en el historial
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
    if old.descripcion is distinct from new.descripcion then
      insert into public.historial (formacion_id, campo, valor_anterior, valor_nuevo, actor)
      values (new.id, 'descripcion', old.descripcion, new.descripcion, auth.uid());
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

commit;
