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

-- Phase 2: six providers in different areas. Five approved, one pending.
-- Services and service areas are added with Phase 3.
do $$
declare
  v_admin uuid := '00000000-0000-4000-a000-000000000001';
begin
  if exists (select 1 from auth.users where email = 'musa@deydo.test') then
    return;
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, phone, encrypted_password,
    email_confirmed_at, phone_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token,
    email_change_token_new, email_change
  )
  select
    '00000000-0000-0000-0000-000000000000', p.id, 'authenticated', 'authenticated',
    p.email, p.phone, extensions.crypt('password123', extensions.gen_salt('bf')),
    now(), now(),
    '{"provider": "email", "providers": ["email", "phone"]}'::jsonb,
    jsonb_build_object('full_name', p.full_name),
    now(), now(), '', '', '', ''
  from (values
    ('00000000-0000-4000-a000-000000000201'::uuid, 'musa@deydo.test', '2348000000201', 'Musa Ibrahim'),
    ('00000000-0000-4000-a000-000000000202'::uuid, 'ngozi@deydo.test', '2348000000202', 'Ngozi Eze'),
    ('00000000-0000-4000-a000-000000000203'::uuid, 'tunde@deydo.test', '2348000000203', 'Tunde Bakare'),
    ('00000000-0000-4000-a000-000000000204'::uuid, 'emeka@deydo.test', '2348000000204', 'Emeka Obi'),
    ('00000000-0000-4000-a000-000000000205'::uuid, 'david@deydo.test', '2348000000205', 'David Okon'),
    ('00000000-0000-4000-a000-000000000206'::uuid, 'halima@deydo.test', '2348000000206', 'Halima Sani')
  ) as p (id, email, phone, full_name);

  insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  select gen_random_uuid(), u.id, u.id::text, 'email',
         jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
         now(), now(), now()
  from auth.users u
  where u.id::text like '00000000-0000-4000-a000-0000000002%';

  update public.profiles p
  set handle = f.handle,
      default_location_id = (select a.id from public.locations a join public.locations c on c.id = a.parent_id
                             where a.type = 'area' and a.slug = f.area and c.slug = 'sample-city'),
      onboarded_at = now()
  from (values
    ('00000000-0000-4000-a000-000000000201'::uuid, 'musa_cool', 'central-district'),
    ('00000000-0000-4000-a000-000000000202'::uuid, 'ngozi_sparks', 'riverside'),
    ('00000000-0000-4000-a000-000000000203'::uuid, 'tunde_pipes', 'hilltop'),
    ('00000000-0000-4000-a000-000000000204'::uuid, 'emeka_power', 'old-market'),
    ('00000000-0000-4000-a000-000000000205'::uuid, 'david_fixes', 'university-area'),
    ('00000000-0000-4000-a000-000000000206'::uuid, 'halima_volts', 'lakeview-estate')
  ) as f (id, handle, area)
  where p.id = f.id;

  insert into public.provider_profiles (id, headline, bio, base_location_id, verification_level, status, approved_at)
  select p.id, f.headline, f.bio, p.default_location_id, f.level, f.status,
         case when f.status = 'approved' then now() end
  from public.profiles p
  join (values
    ('00000000-0000-4000-a000-000000000201'::uuid, 'AC and fridge repair, 10 years experience',
     'Split units, standing units, fridges and deep freezers. Gas refill and servicing.', 3::smallint, 'approved'),
    ('00000000-0000-4000-a000-000000000202'::uuid, 'Electrician: wiring, faults and changeovers',
     'House and shop wiring, fault finding, sockets, lights and changeover installation.', 2::smallint, 'approved'),
    ('00000000-0000-4000-a000-000000000203'::uuid, 'Plumber for leaks, blockages and pumping machines',
     null, 2::smallint, 'approved'),
    ('00000000-0000-4000-a000-000000000204'::uuid, 'Generator and inverter repair',
     'Petrol and diesel generators, inverters, batteries and small solar setups.', 1::smallint, 'approved'),
    ('00000000-0000-4000-a000-000000000205'::uuid, 'Phone and laptop repair, screens and charging ports',
     'New to DeyDo. Fast screen replacement for Android phones and iPhones.', 1::smallint, 'approved'),
    ('00000000-0000-4000-a000-000000000206'::uuid, 'Solar and inverter installer',
     null, 0::smallint, 'pending')
  ) as f (id, headline, bio, level, status) on f.id = p.id;

  insert into public.verification_records (provider_id, check_type, result, notes, performed_by)
  select id, 'phone', 'passed', 'Dev fixture', v_admin
  from public.provider_profiles
  where status = 'approved' and id::text like '00000000-0000-4000-a000-0000000002%';
end;
$$;

-- ADR-015: provider contact numbers live in profile_contacts, not auth.users.
insert into public.profile_contacts (profile_id, phone)
select id, '23480000002' || right(id::text, 2)
from public.provider_profiles
where id::text like '00000000-0000-4000-a000-0000000002%'
on conflict (profile_id) do nothing;
