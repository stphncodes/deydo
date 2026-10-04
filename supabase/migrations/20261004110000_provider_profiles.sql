-- Provider capability: a provider_profiles row. Status and verification are
-- set only by admins through public.review_provider().

create table public.provider_profiles (
  id uuid primary key references public.profiles (id) on delete cascade,
  headline text not null check (char_length(btrim(headline)) between 5 and 120),
  bio text check (char_length(bio) <= 2000),
  base_location_id uuid not null references public.locations (id),
  work_modes text[] not null default '{onsite}'
    check (cardinality(work_modes) >= 1 and work_modes <@ array['onsite', 'remote', 'hybrid']),
  is_available boolean not null default true,
  -- 0 none, 1 phone, 2 ID document, 3 met in person
  verification_level smallint not null default 0 check (verification_level between 0 and 3),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'suspended')),
  -- Shown to the provider when an application is rejected or suspended.
  status_reason text check (char_length(status_reason) <= 500),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint provider_profiles_approved_has_date check (status <> 'approved' or approved_at is not null)
);

create index provider_profiles_base_location_approved_idx
  on public.provider_profiles (base_location_id) where status = 'approved';
create index provider_profiles_status_idx on public.provider_profiles (status);

create trigger provider_profiles_set_updated_at
  before update on public.provider_profiles
  for each row execute function public.set_updated_at();

-- A provider's base must be an active area (the level customers pick from).
create function public.provider_profiles_check_location()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.locations
    where id = new.base_location_id and type = 'area' and is_active
  ) then
    raise exception 'Base location must be an active area' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger provider_profiles_check_location
  before insert or update of base_location_id on public.provider_profiles
  for each row execute function public.provider_profiles_check_location();

-- Users never set their own status, verification or approval. The one move a
-- provider may make is resubmitting a rejected application (rejected to
-- pending). Admin changes run inside review_provider() as the function owner.
create function public.provider_profiles_guard_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.status <> 'pending' or new.verification_level <> 0
      or new.approved_at is not null or new.status_reason is not null then
      raise exception 'New applications start as pending' using errcode = 'insufficient_privilege';
    end if;
    return new;
  end if;

  if new.id is distinct from old.id
    or new.verification_level is distinct from old.verification_level
    or new.approved_at is distinct from old.approved_at
    or new.created_at is distinct from old.created_at
    or (new.status_reason is distinct from old.status_reason
        and not (old.status = 'rejected' and new.status = 'pending' and new.status_reason is null))
    or (new.status is distinct from old.status
        and not (old.status = 'rejected' and new.status = 'pending'))
  then
    raise exception 'You cannot change this field' using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

create trigger provider_profiles_guard_columns
  before insert or update on public.provider_profiles
  for each row execute function public.provider_profiles_guard_columns();

alter table public.provider_profiles enable row level security;

-- Approved providers with an active account are public (shareable profile).
create policy "anyone reads approved providers; owners and staff read all" on public.provider_profiles
  for select to anon, authenticated
  using (
    id = (select auth.uid())
    or public.is_staff()
    or (status = 'approved' and exists (
      select 1 from public.profiles p where p.id = provider_profiles.id and p.status = 'active'))
  );

create policy "user applies as a provider for themselves" on public.provider_profiles
  for insert to authenticated
  with check (id = (select auth.uid()) and public.is_active_user());

create policy "provider updates own profile" on public.provider_profiles
  for update to authenticated
  using (id = (select auth.uid()) and public.is_active_user())
  with check (id = (select auth.uid()));
-- No delete policy: provider history matters; suspension is a status.
