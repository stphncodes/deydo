-- =============================================================================
-- WEDGE CITY (ADR-013). REPLACE THIS FILE WHEN THE LAUNCH CITY IS CHOSEN.
-- =============================================================================
-- "Sample City" is a placeholder so the product can be built and tested.
--
-- To switch to the real city:
--   1. Change v_state_slug, v_city_name, v_city_slug and the areas list below.
--   2. Add the old city's slug to v_retired_city_slugs so it and its areas are
--      deactivated. Never delete locations: requests and providers point at them.
--   3. Run it: locally with `npm run db:reset`; in staging and production the
--      deploy workflow applies it after migrations.
--
-- This file must stay idempotent. Running it twice changes nothing.
-- =============================================================================

do $$
declare
  v_state_slug text := 'fct';
  v_city_name text := 'Sample City';
  v_city_slug text := 'sample-city';
  v_retired_city_slugs text[] := array[]::text[];
  v_areas text[][] := array[
    ['Central District', 'central-district'],
    ['Old Market', 'old-market'],
    ['Riverside', 'riverside'],
    ['Hilltop', 'hilltop'],
    ['Railway Estate', 'railway-estate'],
    ['New Layout', 'new-layout'],
    ['Airport Road', 'airport-road'],
    ['University Area', 'university-area'],
    ['Industrial Layout', 'industrial-layout'],
    ['Lakeview Estate', 'lakeview-estate']
  ];
  v_state_id uuid;
  v_city_id uuid;
  i int;
begin
  select id into strict v_state_id
  from public.locations
  where type = 'state' and slug = v_state_slug;

  insert into public.locations (parent_id, type, name, slug, country_code)
  values (v_state_id, 'city', v_city_name, v_city_slug, 'NG')
  on conflict (parent_id, slug) do update
    set name = excluded.name, is_active = true
    where locations.name is distinct from excluded.name or not locations.is_active
  returning id into v_city_id;

  if v_city_id is null then
    select id into strict v_city_id
    from public.locations
    where parent_id = v_state_id and slug = v_city_slug;
  end if;

  for i in 1 .. array_length(v_areas, 1) loop
    insert into public.locations (parent_id, type, name, slug, country_code)
    values (v_city_id, 'area', v_areas[i][1], v_areas[i][2], 'NG')
    on conflict (parent_id, slug) do update
      set name = excluded.name, is_active = true
      where locations.name is distinct from excluded.name or not locations.is_active;
  end loop;

  -- Areas removed from the list above are deactivated, not deleted.
  update public.locations
  set is_active = false
  where parent_id = v_city_id
    and is_active
    and slug::text <> all (select v_areas[j][2] from generate_subscripts(v_areas, 1) as j);

  -- Retired cities and their areas are deactivated.
  update public.locations
  set is_active = false
  where is_active
    and (
      (type = 'city' and slug::text = any (v_retired_city_slugs))
      or parent_id in (
        select id from public.locations
        where type = 'city' and slug::text = any (v_retired_city_slugs)
      )
    );
end;
$$;
