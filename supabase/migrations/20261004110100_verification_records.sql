-- Evidence and outcome of each provider verification check, and the admin
-- function that approves, rejects or suspends providers.

create function public.reject_append_only_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception '% is append-only', tg_table_name using errcode = 'insufficient_privilege';
end;
$$;

create table public.verification_records (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.provider_profiles (id),
  check_type text not null
    check (check_type in ('phone', 'id_document', 'nin_lookup', 'in_person', 'reference', 'skill_test')),
  result text not null check (result in ('passed', 'failed', 'inconclusive')),
  evidence_path text check (char_length(evidence_path) <= 300), -- private bucket (later)
  vendor_reference text check (char_length(vendor_reference) <= 200),
  performed_by uuid references public.profiles (id),
  notes text check (char_length(notes) <= 1000),
  created_at timestamptz not null default now()
  -- No updated_at: records are never changed. A new check is a new row.
);

create index verification_records_provider_idx on public.verification_records (provider_id, created_at desc);
create index verification_records_performed_by_idx on public.verification_records (performed_by);

create trigger verification_records_append_only
  before update or delete on public.verification_records
  for each row execute function public.reject_append_only_change();

alter table public.verification_records enable row level security;

create policy "staff read verification records" on public.verification_records
  for select to authenticated
  using (public.is_staff());
-- No write policies: rows are written only by review_provider().

-- Records checks and applies a decision in one transaction, with an audit row.
-- p_checks: [{"check_type": "phone", "result": "passed", "notes": "..."}]
create function public.review_provider(
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
    if not exists (select 1 from public.profiles where id = p_provider_id and phone_verified) then
      raise exception 'The provider must verify their phone before approval' using errcode = 'check_violation';
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

revoke execute on function public.review_provider(uuid, text, smallint, text, jsonb) from public, anon;
grant execute on function public.review_provider(uuid, text, smallint, text, jsonb) to authenticated;
