begin;
create extension if not exists pgtap with schema extensions;
select plan(25);

-- P: applicant with a contact number. U: applicant without. Q: other user.
insert into auth.users (id, email, phone, phone_confirmed_at) values
  ('11111111-1111-4111-8111-111111111111', 'p@test.local', '2348011111111', now()),
  ('22222222-2222-4222-8222-222222222222', 'u@test.local', '2348022222222', null),
  ('33333333-3333-4333-8333-333333333333', 'q@test.local', null, null),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'admin@test.local', null, null);

-- Contact number on file for P only (ADR-015).
insert into public.profile_contacts (profile_id, phone) values
  ('11111111-1111-4111-8111-111111111111', '2348011111111');

create temp table area as
  select a.id from public.locations a join public.locations c on c.id = a.parent_id
  where a.type = 'area' and c.slug = 'sample-city' and a.slug = 'riverside';
grant select on area to authenticated;

-- Applying
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}', true);
select lives_ok(
  $$insert into public.provider_profiles (id, headline, base_location_id)
    select '11111111-1111-4111-8111-111111111111', 'AC and fridge repair, 10 years', id from area$$,
  'a user can apply as a provider');
select is((select status from public.provider_profiles where id = '11111111-1111-4111-8111-111111111111'),
  'pending', 'new applications are pending');
select throws_ok(
  $$insert into public.provider_profiles (id, headline, base_location_id)
    select '33333333-3333-4333-8333-333333333333', 'Not me at all', id from area$$,
  '42501', null, 'a user cannot apply on behalf of someone else');
select lives_ok(
  $$update public.provider_profiles set headline = 'AC, fridge and freezer repair' where id = '11111111-1111-4111-8111-111111111111'$$,
  'a provider can edit their headline');
select throws_ok(
  $$update public.provider_profiles set status = 'approved' where id = '11111111-1111-4111-8111-111111111111'$$,
  '42501', 'You cannot change this field', 'a provider cannot approve themselves');
select throws_ok(
  $$update public.provider_profiles set verification_level = 3 where id = '11111111-1111-4111-8111-111111111111'$$,
  '42501', 'You cannot change this field', 'a provider cannot set their verification level');
select throws_ok(
  $$select public.review_provider('11111111-1111-4111-8111-111111111111', 'approved', 1::smallint)$$,
  '42501', 'Only admins can review providers', 'a provider cannot call review_provider');

select set_config('request.jwt.claims', '{"sub": "33333333-3333-4333-8333-333333333333", "role": "authenticated"}', true);
select throws_ok(
  $$insert into public.provider_profiles (id, headline, base_location_id, status)
    select '33333333-3333-4333-8333-333333333333', 'Sneaky approval', id, 'approved' from area$$,
  '42501', 'New applications start as pending', 'an application cannot start approved');
select throws_ok(
  $$insert into public.provider_profiles (id, headline, base_location_id)
    select '33333333-3333-4333-8333-333333333333', 'Whole of Lagos', id from public.locations where slug = 'lagos'$$,
  '23514', 'Base location must be an active area', 'the base location must be an area');
select is((select count(*)::int from public.provider_profiles where id = '11111111-1111-4111-8111-111111111111'),
  0, 'another user cannot see a pending provider');

select set_config('request.jwt.claims', '{"sub": "22222222-2222-4222-8222-222222222222", "role": "authenticated"}', true);
insert into public.provider_profiles (id, headline, base_location_id)
  select '22222222-2222-4222-8222-222222222222', 'Plumber, quick response', id from area;

set local role anon;
select set_config('request.jwt.claims', '{"role": "anon"}', true);
select is((select count(*)::int from public.provider_profiles where id in (
  '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222')), 0,
  'anon cannot see pending providers');

-- Admin review
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "role": "authenticated", "staff_role": "admin"}', true);
select throws_ok(
  $$select public.review_provider('11111111-1111-4111-8111-111111111111', 'approved', 1::smallint)$$,
  '23514', 'Record at least one passed check before approving', 'approval needs a passed check');
select throws_ok(
  $$select public.review_provider('22222222-2222-4222-8222-222222222222', 'approved', 1::smallint, null,
      '[{"check_type": "in_person", "result": "passed"}]')$$,
  '23514', 'The provider must add a phone number before approval', 'approval needs a phone number on file');
select throws_ok(
  $$select public.review_provider('22222222-2222-4222-8222-222222222222', 'rejected')$$,
  '22023', 'A reason is required to reject or suspend', 'rejection needs a reason');
select lives_ok(
  $$select public.review_provider('11111111-1111-4111-8111-111111111111', 'approved', 1::smallint, null,
      '[{"check_type": "phone", "result": "passed", "notes": "Called and confirmed"}]')$$,
  'an admin can approve with a passed check');
select lives_ok(
  $$select public.review_provider('22222222-2222-4222-8222-222222222222', 'rejected', null, 'Please add a clear headline')$$,
  'an admin can reject with a reason');

reset role;
select results_eq(
  $$select status, verification_level::int, approved_at is not null from public.provider_profiles
    where id = '11111111-1111-4111-8111-111111111111'$$,
  $$values ('approved'::text, 1, true)$$,
  'approval sets status, level and approved_at');
select is(
  (select count(*)::int from public.verification_records
   where provider_id = '11111111-1111-4111-8111-111111111111' and performed_by = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
     and check_type = 'phone' and result = 'passed'),
  1, 'the check is recorded with the admin who did it');
select is(
  (select count(*)::int from public.audit_logs where action = 'provider_profiles.review'
   and entity_id = '11111111-1111-4111-8111-111111111111' and actor_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  1, 'the review is audit-logged');
select throws_ok($$update public.verification_records set notes = 'edited'$$,
  '42501', 'verification_records is append-only', 'verification records cannot be edited');

-- Resubmitting after rejection
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "22222222-2222-4222-8222-222222222222", "role": "authenticated"}', true);
select is((select status_reason from public.provider_profiles where id = '22222222-2222-4222-8222-222222222222'),
  'Please add a clear headline', 'a rejected provider sees the reason');
select lives_ok(
  $$update public.provider_profiles set headline = 'Licensed plumber, leaks and blockages', status = 'pending', status_reason = null
    where id = '22222222-2222-4222-8222-222222222222'$$,
  'a rejected provider can resubmit');
select is((select count(*)::int from public.verification_records), 0, 'providers cannot read verification records');

-- Public visibility
set local role anon;
select set_config('request.jwt.claims', '{"role": "anon"}', true);
select is((select count(*)::int from public.provider_profiles where id = '11111111-1111-4111-8111-111111111111'),
  1, 'anon can see an approved provider');
reset role;
update public.profiles set status = 'suspended' where id = '11111111-1111-4111-8111-111111111111';
set local role anon;
select is((select count(*)::int from public.provider_profiles where id = '11111111-1111-4111-8111-111111111111'),
  0, 'a suspended account hides the provider profile');

select * from finish();
rollback;
