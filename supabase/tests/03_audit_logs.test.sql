begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'user@test.local'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'admin@test.local');
insert into public.audit_logs (action, entity_type, entity_id) values ('test.seeded', 'test', '1');

-- Append-only, even for the database owner.
select throws_ok($$update public.audit_logs set reason = 'edited'$$,
  '42501', 'audit_logs is append-only', 'audit rows cannot be updated');
select throws_ok($$delete from public.audit_logs$$,
  '42501', 'audit_logs is append-only', 'audit rows cannot be deleted');
select throws_ok($$truncate public.audit_logs$$,
  '42501', 'audit_logs is append-only', 'audit_logs cannot be truncated');

-- Customers
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}', true);
select is((select count(*)::int from public.audit_logs), 0, 'a customer cannot read audit logs');
select throws_ok(
  $$insert into public.audit_logs (action, entity_type) values ('fake.entry', 'test')$$,
  '42501', null, 'a customer cannot insert audit rows');
select throws_ok(
  $$select public.log_audit('fake.entry', 'test', null)$$,
  '42501', null, 'API roles cannot call log_audit directly');

-- Admins
select set_config('request.jwt.claims',
  '{"sub": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "role": "authenticated", "staff_role": "admin"}', true);
select is((select count(*)::int from public.audit_logs where action = 'test.seeded'), 1,
  'an admin can read audit logs');
select throws_ok(
  $$select public.log_audit('fake.entry', 'test', null)$$,
  '42501', null, 'admins cannot write arbitrary audit rows either');

-- Admin edits through RLS are audited automatically.
update public.categories set sort_order = 99 where slug = 'plumbing';

reset role;
select is(
  (select count(*)::int from public.audit_logs
   where action = 'categories.update' and actor_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
     and (before ->> 'sort_order') = '30' and (after ->> 'sort_order') = '99'),
  1, 'an admin category edit writes an audit row with before and after');

-- Changes without a user token (migrations, secret key) are not row-audited.
select set_config('request.jwt.claims', '', true);
update public.categories set sort_order = 30 where slug = 'plumbing';
select is((select count(*)::int from public.audit_logs where action = 'categories.update'), 1,
  'system changes do not create row audit entries');

select * from finish();
rollback;
