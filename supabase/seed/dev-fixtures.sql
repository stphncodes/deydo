-- =============================================================================
-- DEVELOPMENT FIXTURES. LOCAL ONLY. NEVER LOAD INTO A HOSTED PROJECT.
-- =============================================================================
-- Loaded locally by `npm run db:reset` through supabase/config.toml. While one
-- hosted project serves staging and production (ADR-014), these accounts with
-- a known password must never reach it. Idempotent.
--
-- Every fixture user signs in with the password: password123
-- Phase 1 fixtures: 2 customers and 1 admin. Providers and requests are added
-- in the phases that create those tables.
-- =============================================================================

do $$
declare
  v_area_central uuid;
  v_area_riverside uuid;
begin
  if exists (select 1 from auth.users where email = 'admin@deydo.test') then
    return;
  end if;

  select a.id into strict v_area_central
  from public.locations a join public.locations c on c.id = a.parent_id
  where a.type = 'area' and a.slug = 'central-district' and c.slug = 'sample-city';

  select a.id into strict v_area_riverside
  from public.locations a join public.locations c on c.id = a.parent_id
  where a.type = 'area' and a.slug = 'riverside' and c.slug = 'sample-city';

  insert into auth.users (
    instance_id, id, aud, role, email, phone, encrypted_password,
    email_confirmed_at, phone_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token,
    email_change_token_new, email_change
  )
  select
    '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated',
    u.email, u.phone, extensions.crypt('password123', extensions.gen_salt('bf')),
    now(), now(),
    '{"provider": "email", "providers": ["email", "phone"]}'::jsonb,
    jsonb_build_object('full_name', u.full_name),
    now(), now(), '', '', '', ''
  from (values
    ('00000000-0000-4000-a000-000000000001'::uuid, 'admin@deydo.test', '2348000000001', 'Ada Admin'),
    ('00000000-0000-4000-a000-000000000101'::uuid, 'chidi@deydo.test', '2348000000101', 'Chidi Okeke'),
    ('00000000-0000-4000-a000-000000000102'::uuid, 'amina@deydo.test', '2348000000102', 'Amina Bello')
  ) as u (id, email, phone, full_name);

  insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  select gen_random_uuid(), u.id, u.id::text, 'email',
         jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
         now(), now(), now()
  from auth.users u
  where u.email like '%@deydo.test';

  update public.profiles p
  set handle = f.handle, default_location_id = f.location_id, onboarded_at = now()
  from (values
    ('00000000-0000-4000-a000-000000000001'::uuid, 'ada_admin', v_area_central),
    ('00000000-0000-4000-a000-000000000101'::uuid, 'chidi', v_area_central),
    ('00000000-0000-4000-a000-000000000102'::uuid, 'amina', v_area_riverside)
  ) as f (id, handle, location_id)
  where p.id = f.id;

  insert into public.user_roles (user_id, role)
  values ('00000000-0000-4000-a000-000000000001', 'admin');
end;
$$;
