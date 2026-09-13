-- ============================================================
-- Fix: auth_actor() debe leer los claims canónicos
-- InsForge escribe el JWT en request.jwt.claims (JSON) y ya no
-- puebla los GUC "dotted" (request.jwt.claim.sub).
-- Se lee primero el JSON y se cae al dotted como respaldo.
-- ============================================================

create or replace function public.auth_actor()
returns uuid
language plpgsql
stable
as $$
declare
  v_sub text;
begin
  begin
    v_sub := nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '');
  exception when others then
    v_sub := null;
  end;
  if v_sub is null or v_sub = '' then
    begin
      v_sub := nullif(current_setting('request.jwt.claim.sub', true), '');
    exception when others then
      v_sub := null;
    end;
  end if;
  if v_sub is null or v_sub = '' then return null; end if;
  begin
    return v_sub::uuid;
  exception when invalid_text_representation then
    return null;
  end;
end;
$$;