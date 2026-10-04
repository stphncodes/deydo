-- Shared helpers: updated_at maintenance and staff role checks.

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Staff role comes from the `staff_role` JWT claim, set by the Custom Access
-- Token hook (Phase 2) from public.user_roles. Suspensions also flip
-- profiles.status, which policies check directly, so a stale token cannot
-- outlive a suspension.
create function public.staff_role()
returns text
language sql
stable
set search_path = ''
as $$
  select nullif(auth.jwt() ->> 'staff_role', '')
$$;

create function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(public.staff_role() = 'admin', false)
$$;

create function public.is_staff()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(public.staff_role() in ('admin', 'support'), false)
$$;
