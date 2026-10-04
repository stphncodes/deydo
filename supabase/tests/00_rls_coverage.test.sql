-- CI fails if any table in public lacks RLS, or any view bypasses it.
begin;
create extension if not exists pgtap with schema extensions;
select plan(2);

select is(
  (select coalesce(array_agg(c.relname::text order by c.relname), '{}')
   from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity),
  '{}'::text[],
  'every table in public has row level security enabled'
);

select is(
  (select coalesce(array_agg(c.relname::text order by c.relname), '{}')
   from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind in ('v', 'm')
     and not (coalesce(c.reloptions, '{}') && array['security_invoker=true', 'security_invoker=on'])),
  '{}'::text[],
  'every view in public runs with security_invoker'
);

select * from finish();
rollback;
