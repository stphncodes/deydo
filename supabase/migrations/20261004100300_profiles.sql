-- One profile per auth user. Phone numbers stay in auth.users and are never
-- copied here, so public profile reads cannot leak them.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  -- Nullable until onboarding: phone sign-up does not collect a name.
  full_name text check (full_name is null or char_length(btrim(full_name)) between 2 and 100),
  handle extensions.citext unique check (handle::text ~ '^[a-z0-9_]{3,30}$'),
  avatar_path text check (char_length(avatar_path) <= 300),
  phone_verified boolean not null default false,
  default_location_id uuid references public.locations (id),
  onboarded_at timestamptz,
  status text not null default 'active' check (status in ('active', 'suspended', 'deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_onboarded_needs_name check (onboarded_at is null or full_name is not null)
);

create index profiles_default_location_id_idx on public.profiles (default_location_id);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create the profile when Supabase Auth creates a user.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := btrim(new.raw_user_meta_data ->> 'full_name');
begin
  insert into public.profiles (id, full_name, phone_verified)
  values (
    new.id,
    case when char_length(v_name) between 2 and 100 then v_name end,
    new.phone_confirmed_at is not null
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep phone_verified in step with Supabase Auth.
create function public.handle_user_phone_confirmed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set phone_verified = new.phone_confirmed_at is not null
  where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_phone_confirmed
  after update of phone_confirmed_at on auth.users
  for each row
  when (old.phone_confirmed_at is distinct from new.phone_confirmed_at)
  execute function public.handle_user_phone_confirmed();

-- Users may edit their own display data, never their status or verification.
-- Requests made with a user token run as `authenticated`. Admin changes to
-- these columns go through audited security definer functions (Phase 9),
-- which run as the function owner and pass this guard.
create function public.profiles_guard_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('authenticated', 'anon') and (
    new.id is distinct from old.id
    or new.status is distinct from old.status
    or new.phone_verified is distinct from old.phone_verified
    or new.created_at is distinct from old.created_at
  ) then
    raise exception 'You cannot change this field' using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_columns
  before update on public.profiles
  for each row execute function public.profiles_guard_columns();

-- Used by policies on other tables. Security definer so it can read
-- profiles without recursing through profiles RLS.
create function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and status = 'active'
  )
$$;

alter table public.profiles enable row level security;

-- Profiles hold no contact details, so active ones are public (needed for
-- the shareable /p/[handle] page).
create policy "anyone reads active profiles" on public.profiles
  for select to anon, authenticated
  using (status = 'active' or id = (select auth.uid()) or public.is_staff());

create policy "user updates own active profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) and status = 'active')
  with check (id = (select auth.uid()));
-- No insert policy (the auth trigger creates rows) and no delete policy
-- (accounts are soft-deleted through status).
