-- ADR-015: sign-in is email only, so phone numbers no longer live in
-- auth.users. A phone number is still needed: ops call providers to verify
-- them, and later phases reveal it to the other party once a job exists.
-- It lives here, readable only by its owner and staff.

create table public.profile_contacts (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  -- Nigerian mobile in Supabase format: 234 then 10 digits (features/auth/phone.ts)
  phone text not null check (phone ~ '^234[789][01][0-9]{8}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profile_contacts_set_updated_at
  before update on public.profile_contacts
  for each row execute function public.set_updated_at();

alter table public.profile_contacts enable row level security;

create policy "owners and staff read contact details" on public.profile_contacts
  for select to authenticated
  using (profile_id = (select auth.uid()) or public.is_staff());

create policy "users add their own contact details" on public.profile_contacts
  for insert to authenticated
  with check (profile_id = (select auth.uid()) and public.is_active_user());

create policy "users update their own contact details" on public.profile_contacts
  for update to authenticated
  using (profile_id = (select auth.uid()) and public.is_active_user())
  with check (profile_id = (select auth.uid()));
-- No delete policy. Contact details are removed with the account.

comment on column public.profiles.phone_verified is
  'Unused since ADR-015 (email-only sign-in). Kept to avoid a destructive change.';

-- Same function as before, but approval now needs a phone number on file
-- (to call the provider) instead of a phone verified through sign-in.
create or replace function public.review_provider(
  p_provider_id uuid,
  p_decision text,
  p_verification_level smallint default null,
  p_reason text default null,
  p_checks jsonb default '[]'
)
returns public.provider_profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_before public.provider_profiles;
  v_after public.provider_profiles;
  v_check jsonb;
  v_level smallint;
begin
  if not public.is_admin() then
    raise exception 'Only admins can review providers' using errcode = 'insufficient_privilege';
  end if;

  if p_decision not in ('approved', 'rejected', 'suspended') then
    raise exception 'Unknown decision %', p_decision using errcode = 'invalid_parameter_value';
  end if;

  if jsonb_typeof(p_checks) <> 'array' then
    raise exception 'p_checks must be an array' using errcode = 'invalid_parameter_value';
  end if;

  select * into v_before from public.provider_profiles where id = p_provider_id for update;
  if not found then
    raise exception 'Provider not found' using errcode = 'no_data_found';
  end if;

  if p_decision in ('rejected', 'suspended') and coalesce(btrim(p_reason), '') = '' then
    raise exception 'A reason is required to reject or suspend' using errcode = 'invalid_parameter_value';
  end if;

  for v_check in select * from jsonb_array_elements(p_checks) loop
    insert into public.verification_records (provider_id, check_type, result, notes, performed_by)
    values (p_provider_id, v_check ->> 'check_type', v_check ->> 'result', v_check ->> 'notes', (select auth.uid()));
  end loop;

  v_level := coalesce(p_verification_level, v_before.verification_level);

  if p_decision = 'approved' then
    if v_level < 1 then
      raise exception 'Set a verification level of at least 1 to approve' using errcode = 'check_violation';
    end if;
    if not exists (select 1 from public.profile_contacts where profile_id = p_provider_id) then
      raise exception 'The provider must add a phone number before approval' using errcode = 'check_violation';
    end if;
    if not exists (
      select 1 from public.verification_records
      where provider_id = p_provider_id and result = 'passed'
    ) then
      raise exception 'Record at least one passed check before approving' using errcode = 'check_violation';
    end if;
  end if;

  update public.provider_profiles
  set status = p_decision,
      verification_level = v_level,
      status_reason = nullif(btrim(p_reason), ''),
      approved_at = case when p_decision = 'approved' then coalesce(approved_at, now()) else approved_at end
  where id = p_provider_id
  returning * into v_after;

  perform public.log_audit(
    'provider_profiles.review',
    'provider_profiles',
    p_provider_id::text,
    to_jsonb(v_before),
    to_jsonb(v_after),
    p_reason
  );

  return v_after;
end;
$$;
