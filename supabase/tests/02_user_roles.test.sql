begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'user@test.local'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'admin@test.local'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'support@test.local');
insert into public.user_roles (user_id, role) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'admin'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'support');

set local role anon;
select set_config('request.jwt.claims', '{"role": "anon"}', true);
select is((select count(*)::int from public.user_roles), 0, 'anon cannot read roles');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}', true);
select is((select count(*)::int from public.user_roles), 0, 'a customer sees no roles');
select throws_ok(
  $$insert into public.user_roles (user_id, role) values ('11111111-1111-4111-8111-111111111111', 'admin')$$,
  '42501', null, 'a customer cannot grant themselves a role');

select set_config('request.jwt.claims',
  '{"sub": "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "role": "authenticated", "staff_role": "support"}', true);
select is((select count(*)::int from public.user_roles), 2, 'support can read all roles');
select throws_ok(
  $$insert into public.user_roles (user_id, role) values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'admin')$$,
  '42501', null, 'support cannot promote themselves');

select set_config('request.jwt.claims',
  '{"sub": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "role": "authenticated", "staff_role": "admin"}', true);
select throws_ok(
  $$insert into public.user_roles (user_id, role) values ('11111111-1111-4111-8111-111111111111', 'support')$$,
  '42501', null, 'admins cannot write roles directly; it goes through an audited function');
delete from public.user_roles where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

reset role;
select is((select count(*)::int from public.user_roles), 2, 'nobody can delete roles through the API');

select * from finish();
rollback;
