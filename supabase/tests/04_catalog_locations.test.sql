begin;
create extension if not exists pgtap with schema extensions;
select plan(22);

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'user@test.local'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'admin@test.local');

-- Reference data
select is((select count(*)::int from public.locations where type = 'country'), 1, 'one country is seeded');
select is((select count(*)::int from public.locations where type = 'state'), 37, '36 states plus FCT are seeded');
select is(
  (select count(*)::int from public.locations a join public.locations c on c.id = a.parent_id
   where a.type = 'area' and a.is_active and c.slug = 'sample-city'),
  10, 'the wedge city seed has 10 active areas');
select is(
  (select array_agg(c.slug::text order by c.sort_order)
   from public.categories c join public.categories p on p.id = c.parent_id
   where p.slug = 'home-device-repair'),
  array['ac-refrigeration-repair', 'electrical-work', 'plumbing', 'generator-inverter-solar', 'phone-laptop-repair'],
  'the five wedge categories sit under Home & Device Repair');
select is(
  (select count(*)::int from public.categories c
   where c.parent_id is not null
     and (select count(*) from public.category_synonyms s where s.category_id = c.id) < 10),
  0, 'every wedge category has at least 10 synonyms');
select ok(
  (select count(*) > 0 from public.category_synonyms where language = 'pcm'),
  'Pidgin synonyms are seeded');

-- Constraints and helpers
select ok(public.is_leaf_category((select id from public.categories where slug = 'plumbing')),
  'a wedge category is a leaf');
select ok(not public.is_leaf_category((select id from public.categories where slug = 'home-device-repair')),
  'a parent category is not a leaf');
select ok(not public.required_fields_valid('[{"key": "x", "label": "X", "type": "select", "required": true}]'),
  'select fields need options');
select ok(not public.required_fields_valid(
  '[{"key": "a", "label": "A", "type": "text", "required": true}, {"key": "a", "label": "B", "type": "text", "required": false}]'),
  'required field keys must be unique');
select throws_ok(
  $$insert into public.category_synonyms (category_id, term)
    select id, 'AC  Repair' from public.categories where slug = 'plumbing'$$,
  '23514', null, 'synonyms must be stored normalised');
select throws_ok(
  $$insert into public.locations (parent_id, type, name, slug, country_code)
    select id, 'area', 'Bad Area', 'bad-area', 'NG' from public.locations where slug = 'lagos'$$,
  '23514', null, 'an area cannot sit directly under a state');
select throws_ok(
  $$insert into public.locations (type, name, slug, country_code) values ('country', 'Nigeria Again', 'ng', 'NG')$$,
  '23505', null, 'country slugs are unique even though they have no parent');

-- Hide one category to test visibility.
update public.categories set is_active = false where slug = 'plumbing';

-- Anonymous visitors
set local role anon;
select set_config('request.jwt.claims', '{"role": "anon"}', true);
select is((select count(*)::int from public.categories where slug = 'electrical-work'), 1,
  'anon can read active categories');
select is((select count(*)::int from public.categories where slug = 'plumbing'), 0,
  'anon cannot read inactive categories');
select is(
  (select count(*)::int from public.category_synonyms s join public.categories c on c.id = s.category_id
   where c.slug = 'plumbing'),
  0, 'anon cannot read synonyms of inactive categories');
select ok((select count(*) = 37 from public.locations where type = 'state'), 'anon can read locations');
select throws_ok(
  $$insert into public.categories (slug, name) values ('hack', 'Hack')$$,
  '42501', null, 'anon cannot create categories');

-- Customers
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}', true);
select throws_ok(
  $$insert into public.category_synonyms (category_id, term)
    select id, 'hack term' from public.categories where slug = 'electrical-work'$$,
  '42501', null, 'a customer cannot add synonyms');
update public.categories set name = 'Hacked' where slug = 'electrical-work';

-- Admins
select set_config('request.jwt.claims',
  '{"sub": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "role": "authenticated", "staff_role": "admin"}', true);
select is((select count(*)::int from public.categories where slug = 'plumbing'), 1,
  'staff can read inactive categories');
select lives_ok(
  $$insert into public.category_synonyms (category_id, term, language)
    select id, 'light don go', 'pcm' from public.categories where slug = 'electrical-work'$$,
  'an admin can add synonyms');

reset role;
select is((select name from public.categories where slug = 'electrical-work'), 'Electrical work',
  'a customer cannot edit categories');

select * from finish();
rollback;
