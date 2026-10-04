-- Supabase Auth calls this before issuing every access token. It adds the
-- `staff_role` claim that public.is_admin() and public.is_staff() read, so
-- RLS does not need a join on user_roles for every query.

create function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_claims jsonb := coalesce(event -> 'claims', '{}'::jsonb);
  v_role text;
begin
  -- admin outranks support when a person holds both
  select r.role into v_role
  from public.user_roles r
  where r.user_id = (event ->> 'user_id')::uuid
  order by (r.role <> 'admin'), r.role
  limit 1;

  if v_role is null then
    v_claims := v_claims - 'staff_role';
  else
    v_claims := jsonb_set(v_claims, '{staff_role}', to_jsonb(v_role));
  end if;

  return jsonb_set(event, '{claims}', v_claims);
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from public, anon, authenticated;

grant select on table public.user_roles to supabase_auth_admin;
create policy "auth server reads roles for the token hook" on public.user_roles
  for select to supabase_auth_admin
  using (true);
