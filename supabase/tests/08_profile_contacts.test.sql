begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'a@test.local'),
  ('22222222-2222-4222-8222-222222222222', 'b@test.local'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'support@test.local');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}', true);
select lives_ok(
  $$insert into public.profile_contacts (profile_id, phone) values ('11111111-1111-4111-8111-111111111111', '2348031234567')$$,
  'a user can add their own phone number');
select throws_ok(
  $$insert into public.profile_contacts (profile_id, phone) values ('22222222-2222-4222-8222-222222222222', '2348031234568')$$,
  '42501', null, 'a user cannot add a number for someone else');
select throws_ok(
  $$update public.profile_contacts set phone = '08031234567' where profile_id = '11111111-1111-4111-8111-111111111111'$$,
  '23514', null, 'numbers must be stored in 234XXXXXXXXXX form');
select is((select phone from public.profile_contacts where profile_id = '11111111-1111-4111-8111-111111111111'),
  '2348031234567', 'a user can read their own number');

select set_config('request.jwt.claims', '{"sub": "22222222-2222-4222-8222-222222222222", "role": "authenticated"}', true);
select is((select count(*)::int from public.profile_contacts), 0, 'other users cannot see anyone''s number');
update public.profile_contacts set phone = '2348099999999' where profile_id = '11111111-1111-4111-8111-111111111111';

set local role anon;
select set_config('request.jwt.claims', '{"role": "anon"}', true);
select is((select count(*)::int from public.profile_contacts), 0, 'anon cannot see any number');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "role": "authenticated", "staff_role": "support"}', true);
select is((select count(*)::int from public.profile_contacts where profile_id = '11111111-1111-4111-8111-111111111111'),
  1, 'staff can read numbers to call providers');

reset role;
select is((select phone from public.profile_contacts where profile_id = '11111111-1111-4111-8111-111111111111'),
  '2348031234567', 'another user cannot change someone''s number');

select * from finish();
rollback;
