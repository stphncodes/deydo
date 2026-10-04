-- Staff roles. Customer is the default capability of every profile;
-- provider capability is the existence of a provider_profiles row.

create table public.user_roles (
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('admin', 'support')),
  granted_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, role)
);

create index user_roles_granted_by_idx on public.user_roles (granted_by);

create trigger user_roles_set_updated_at
  before update on public.user_roles
  for each row execute function public.set_updated_at();

create trigger user_roles_audit
  after insert or update or delete on public.user_roles
  for each row execute function public.audit_row_change();

alter table public.user_roles enable row level security;

create policy "user reads own roles, staff read all" on public.user_roles
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_staff());
-- No write policies. Roles are granted by an audited admin function
-- (Phase 9) or by the operator with the secret key.
