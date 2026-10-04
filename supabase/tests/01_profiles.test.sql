begin;
create extension if not exists pgtap with schema extensions;
select plan(20);

-- Users: Alice (named), Bob (no name), Cara (suspended), Dan (name too short).
insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-4111-8111-111111111111', 'alice@test.local', '{"full_name": "  Alice Ade  "}'),
  ('22222222-2222-4222-8222-222222222222', 'bob@test.local', '{}'),
  ('33333333-3333-4333-8333-333333333333', 'cara@test.local', '{"full_name": "Cara Cee"}'),
  ('44444444-4444-4444-8444-444444444444', 'dan@test.local', '{"full_name": "D"}');
update public.profiles set status = 'suspended' where id = '33333333-3333-4333-8333-333333333333';
update public.profiles set created_at = now() - interval '1 day', updated_at = now() - interval '1 day';

-- Profile creation trigger
select is((select full_name from public.profiles where id = '11111111-1111-4111-8111-111111111111'),
  'Alice Ade', 'auth sign-up creates a profile with the trimmed name');
select is((select full_name from public.profiles where id = '22222222-2222-4222-8222-222222222222'),
  null, 'sign-up without a name leaves full_name empty until onboarding');
select is((select full_name from public.profiles where id = '44444444-4444-4444-8444-444444444444'),
  null, 'an invalid name from metadata is dropped instead of failing sign-up');
select is((select phone_verified from public.profiles where id = '11111111-1111-4111-8111-111111111111'),
  false, 'phone_verified starts false');

update auth.users set phone_confirmed_at = now() where id = '11111111-1111-4111-8111-111111111111';
select is((select phone_verified from public.profiles where id = '11111111-1111-4111-8111-111111111111'),
  true, 'confirming the phone in auth sets phone_verified');

-- Constraints
select throws_ok(
  $$update public.profiles set onboarded_at = now() where id = '22222222-2222-4222-8222-222222222222'$$,
  '23514', null, 'cannot be onboarded without a name');
select throws_ok(
  $$update public.profiles set handle = 'Alice' where id = '11111111-1111-4111-8111-111111111111'$$,
  '23514', null, 'handles must be lowercase');

-- Anonymous visitors
set local role anon;
select set_config('request.jwt.claims', '{"role": "anon"}', true);
select is((select count(*)::int from public.profiles where id = '11111111-1111-4111-8111-111111111111'),
  1, 'anon can read an active profile');
select is((select count(*)::int from public.profiles where id = '33333333-3333-4333-8333-333333333333'),
  0, 'anon cannot read a suspended profile');
select throws_ok(
  $$insert into public.profiles (id) values ('55555555-5555-4555-8555-555555555555')$$,
  '42501', null, 'anon cannot insert profiles');

-- Alice
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}', true);

select lives_ok(
  $$update public.profiles set full_name = 'Alice Adeyemi', handle = 'alice' where id = '11111111-1111-4111-8111-111111111111'$$,
  'a user can edit their own name and handle');
update public.profiles set full_name = 'Hacked' where id = '22222222-2222-4222-8222-222222222222';
select throws_ok(
  $$update public.profiles set status = 'active' where id = '11111111-1111-4111-8111-111111111111'$$,
  '42501', 'You cannot change this field', 'a user cannot change their own status');
select throws_ok(
  $$update public.profiles set phone_verified = false where id = '11111111-1111-4111-8111-111111111111'$$,
  '42501', 'You cannot change this field', 'a user cannot change their own phone_verified');
delete from public.profiles where id = '11111111-1111-4111-8111-111111111111';

-- Cara (suspended) can still read her own profile but not edit it.
select set_config('request.jwt.claims',
  '{"sub": "33333333-3333-4333-8333-333333333333", "role": "authenticated"}', true);
select is((select count(*)::int from public.profiles where id = '33333333-3333-4333-8333-333333333333'),
  1, 'a suspended user can read their own profile');
update public.profiles set full_name = 'Cara Changed' where id = '33333333-3333-4333-8333-333333333333';

-- An admin token does not bypass the column guard or edit others directly.
select set_config('request.jwt.claims',
  '{"sub": "44444444-4444-4444-8444-444444444444", "role": "authenticated", "staff_role": "admin"}', true);
select is((select count(*)::int from public.profiles where id = '33333333-3333-4333-8333-333333333333'),
  1, 'staff can read suspended profiles');
update public.profiles set full_name = 'Admin Edit' where id = '11111111-1111-4111-8111-111111111111';

reset role;
select is((select full_name from public.profiles where id = '22222222-2222-4222-8222-222222222222'),
  null, 'a user cannot edit another user''s profile');
select is((select full_name from public.profiles where id = '33333333-3333-4333-8333-333333333333'),
  'Cara Cee', 'a suspended user cannot edit their profile');
select is((select full_name from public.profiles where id = '11111111-1111-4111-8111-111111111111'),
  'Alice Adeyemi', 'admins cannot edit other profiles directly');
select is((select count(*)::int from public.profiles where id = '11111111-1111-4111-8111-111111111111'),
  1, 'a user cannot delete profiles');
select cmp_ok(
  (select updated_at from public.profiles where id = '11111111-1111-4111-8111-111111111111'),
  '>', now() - interval '1 hour', 'updated_at is refreshed on update');

select * from finish();
rollback;
