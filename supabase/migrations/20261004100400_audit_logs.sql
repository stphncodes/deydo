-- Append-only audit trail for admin and sensitive actions.

create table public.audit_logs (
  id bigint generated always as identity primary key,
  -- No ON DELETE action: an audited actor cannot be hard-deleted. Account
  -- deletion requests anonymise the profile instead.
  actor_id uuid references public.profiles (id),
  action text not null check (action ~ '^[a-z_]+(\.[a-z_]+)+$'),
  entity_type text not null check (char_length(entity_type) between 1 and 60),
  entity_id text check (char_length(entity_id) <= 200),
  before jsonb,
  after jsonb,
  reason text check (char_length(reason) <= 1000),
  created_at timestamptz not null default now()
  -- No updated_at: rows are never updated.
);

create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id, created_at desc);
create index audit_logs_actor_idx on public.audit_logs (actor_id, created_at desc);

create function public.audit_logs_reject_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'audit_logs is append-only' using errcode = 'insufficient_privilege';
end;
$$;

create trigger audit_logs_no_update_delete
  before update or delete on public.audit_logs
  for each row execute function public.audit_logs_reject_change();

create trigger audit_logs_no_truncate
  before truncate on public.audit_logs
  for each statement execute function public.audit_logs_reject_change();

-- Writes an audit entry. Not callable by API roles directly; only security
-- definer functions and server code using the secret key call it.
create function public.log_audit(
  p_action text,
  p_entity_type text,
  p_entity_id text,
  p_before jsonb default null,
  p_after jsonb default null,
  p_reason text default null
)
returns bigint
language sql
security definer
set search_path = ''
as $$
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, before, after, reason)
  values ((select auth.uid()), p_action, p_entity_type, p_entity_id, p_before, p_after, p_reason)
  returning id
$$;

revoke execute on function public.log_audit(text, text, text, jsonb, jsonb, text)
  from public, anon, authenticated;
grant execute on function public.log_audit(text, text, text, jsonb, jsonb, text) to service_role;

-- Audits any row change made with a user token on admin-managed tables, so
-- an admin edit through RLS can never skip the audit log.
create function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  v_new jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
  v_row jsonb := coalesce(v_new, v_old);
  v_entity_id text := coalesce(v_row ->> 'id', v_row ->> 'user_id');
begin
  if (select auth.uid()) is not null then
    perform public.log_audit(
      tg_table_name || '.' || lower(tg_op),
      tg_table_name,
      v_entity_id,
      v_old,
      v_new
    );
  end if;
  return coalesce(new, old);
end;
$$;

create trigger locations_audit
  after insert or update or delete on public.locations
  for each row execute function public.audit_row_change();

alter table public.audit_logs enable row level security;

create policy "admin reads audit logs" on public.audit_logs
  for select to authenticated
  using (public.is_admin());
-- No insert, update or delete policies.
