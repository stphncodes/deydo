-- Location hierarchy (ADR-005): country > state > city > area.

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.locations (id),
  type text not null check (type in ('country', 'state', 'city', 'area')),
  name text not null check (char_length(name) between 1 and 100),
  slug extensions.citext not null check (slug::text ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  country_code char(2) not null check (country_code ~ '^[A-Z]{2}$'),
  lat double precision check (lat between -90 and 90),
  lng double precision check (lng between -180 and 180),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint locations_parent_required check ((type = 'country') = (parent_id is null)),
  constraint locations_parent_slug_key unique nulls not distinct (parent_id, slug)
);

create index locations_parent_id_idx on public.locations (parent_id);
create index locations_type_country_idx on public.locations (type, country_code) where is_active;

create trigger locations_set_updated_at
  before update on public.locations
  for each row execute function public.set_updated_at();

-- A state must sit under a country, a city under a state, an area under a city.
create function public.locations_check_parent()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_parent_type text;
  v_parent_country char(2);
begin
  if new.parent_id is null then
    return new;
  end if;

  select type, country_code into v_parent_type, v_parent_country
  from public.locations
  where id = new.parent_id;

  if v_parent_type is distinct from case new.type
      when 'state' then 'country'
      when 'city' then 'state'
      when 'area' then 'city'
    end then
    raise exception 'A % cannot sit under a %', new.type, coalesce(v_parent_type, 'missing parent')
      using errcode = 'check_violation';
  end if;

  if v_parent_country <> new.country_code then
    raise exception 'Location country must match its parent' using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger locations_check_parent
  before insert or update of parent_id, type, country_code on public.locations
  for each row execute function public.locations_check_parent();

alter table public.locations enable row level security;

create policy "anyone reads active locations" on public.locations
  for select to anon, authenticated
  using (is_active or public.is_staff());

create policy "admin creates locations" on public.locations
  for insert to authenticated
  with check (public.is_admin());

create policy "admin updates locations" on public.locations
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());
-- No delete policy: locations are deactivated, never deleted, because
-- requests and providers point at them.
