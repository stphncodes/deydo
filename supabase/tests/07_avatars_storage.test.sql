begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'a@test.local'),
  ('22222222-2222-4222-8222-222222222222', 'b@test.local');

select results_eq(
  $$select public, file_size_limit, allowed_mime_types from storage.buckets where id = 'avatars'$$,
  $$values (true, 1048576::bigint, array['image/webp', 'image/jpeg', 'image/png'])$$,
  'avatars bucket is public, capped at 1 MB, images only');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}', true);
select lives_ok(
  $$insert into storage.objects (bucket_id, name, owner_id)
    values ('avatars', '11111111-1111-4111-8111-111111111111/avatar.webp', '11111111-1111-4111-8111-111111111111')$$,
  'a user can upload into their own folder');
select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner_id)
    values ('avatars', '22222222-2222-4222-8222-222222222222/avatar.webp', '11111111-1111-4111-8111-111111111111')$$,
  '42501', null, 'a user cannot upload into someone else''s folder');
select lives_ok(
  $$update public.profiles set avatar_path = '11111111-1111-4111-8111-111111111111/avatar.webp'
    where id = '11111111-1111-4111-8111-111111111111'$$,
  'a user can point their profile at their own avatar');
select throws_ok(
  $$update public.profiles set avatar_path = '22222222-2222-4222-8222-222222222222/avatar.webp'
    where id = '11111111-1111-4111-8111-111111111111'$$,
  '23514', null, 'a profile cannot point at another user''s file');

select set_config('request.jwt.claims', '{"sub": "22222222-2222-4222-8222-222222222222", "role": "authenticated"}', true);
-- Direct deletes are blocked by Supabase for everyone, so test overwriting.
update storage.objects set metadata = '{"hacked": true}'
  where name = '11111111-1111-4111-8111-111111111111/avatar.webp';
select is((select count(*)::int from storage.objects where bucket_id = 'avatars'), 0,
  'a user cannot list someone else''s files');

reset role;
select is((select metadata from storage.objects where name = '11111111-1111-4111-8111-111111111111/avatar.webp'), null,
  'a user cannot overwrite someone else''s avatar');

select * from finish();
rollback;
