begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'user@test.local'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'admin@test.local'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'support@test.local');
insert into public.user_roles (user_id, role) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'support'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'admin'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'support');

-- Called as the owner: the test runner cannot switch to supabase_auth_admin.
select ok(
  has_function_privilege('supabase_auth_admin', 'public.custom_access_token_hook(jsonb)', 'execute'),
  'the auth server can execute the hook');
select is(
  public.custom_access_token_hook('{"user_id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "claims": {"role": "authenticated"}}') #>> '{claims,staff_role}',
  'admin', 'admin outranks support when a person has both');
select is(
  public.custom_access_token_hook('{"user_id": "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "claims": {"role": "authenticated"}}') #>> '{claims,staff_role}',
  'support', 'support staff get the support claim');
select ok(
  not (public.custom_access_token_hook('{"user_id": "11111111-1111-4111-8111-111111111111", "claims": {"staff_role": "admin"}}') -> 'claims' ? 'staff_role'),
  'a customer never keeps a staff_role claim, even a forged one');
select is(
  public.custom_access_token_hook('{"user_id": "11111111-1111-4111-8111-111111111111", "claims": {"role": "authenticated", "aal": "aal1"}}') #>> '{claims,aal}',
  'aal1', 'other claims pass through untouched');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}', true);
select throws_ok(
  $$select public.custom_access_token_hook('{"user_id": "11111111-1111-4111-8111-111111111111", "claims": {}}')$$,
  '42501', null, 'API users cannot call the token hook');

set local role anon;
select throws_ok(
  $$select public.custom_access_token_hook('{"user_id": "11111111-1111-4111-8111-111111111111", "claims": {}}')$$,
  '42501', null, 'anon cannot call the token hook');

select * from finish();
rollback;
