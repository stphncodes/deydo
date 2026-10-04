-- Service taxonomy. Leaf categories are the services customers request and
-- providers offer. Synonyms map free text (including Pidgin and local terms)
-- to categories.

-- Validates category.required_fields. Mirrors RequiredFieldSchema in
-- features/catalog/schemas.ts; keep the two in step.
-- Each element: {"key": "ac_type", "label": "AC type", "type": "select" | "text",
--                "required": bool, "options": [text, ...] (select only)}
create function public.required_fields_valid(p_fields jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(p_fields) = 'array'
    and jsonb_array_length(p_fields) <= 10
    and not exists (
      select 1
      from jsonb_array_elements(p_fields) as f
      where jsonb_typeof(f) <> 'object'
        or coalesce(f ->> 'key', '') !~ '^[a-z][a-z0-9_]{0,39}$'
        or char_length(coalesce(f ->> 'label', '')) not between 1 and 80
        or coalesce(f ->> 'type', '') not in ('select', 'text')
        or jsonb_typeof(coalesce(f -> 'required', 'null'::jsonb)) <> 'boolean'
        or (f ->> 'type' = 'select' and (
              jsonb_typeof(f -> 'options') is distinct from 'array'
              or jsonb_array_length(f -> 'options') not between 2 and 20
              or exists (
                select 1 from jsonb_array_elements(f -> 'options') as o
                where jsonb_typeof(o) <> 'string' or char_length(o #>> '{}') not between 1 and 60
              )))
        or (f ->> 'type' = 'text' and f ? 'options')
    )
    and (
      select count(distinct f ->> 'key') = count(*)
      from jsonb_array_elements(p_fields) as f
    )
$$;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories (id),
  slug extensions.citext not null unique check (slug::text ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug::text) <= 60),
  name text not null check (char_length(name) between 2 and 80),
  description text check (char_length(description) <= 300),
  default_mode text not null default 'onsite' check (default_mode in ('onsite', 'remote', 'hybrid')),
  required_fields jsonb not null default '[]'
    constraint categories_required_fields_valid check (public.required_fields_valid(required_fields)),
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_not_own_parent check (parent_id is distinct from id)
);

create index categories_parent_id_idx on public.categories (parent_id);

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

create trigger categories_audit
  after insert or update or delete on public.categories
  for each row execute function public.audit_row_change();

-- Only active leaf categories can be attached to requests and provider
-- services. Later tables call this from a check trigger.
create function public.is_leaf_category(p_category_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.categories c
    where c.id = p_category_id
      and c.is_active
      and not exists (select 1 from public.categories child where child.parent_id = c.id)
  )
$$;

create table public.category_synonyms (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete cascade,
  -- Stored normalised (lowercase, trimmed, single spaces) so trigram and
  -- exact matching behave predictably.
  term text not null check (
    char_length(term) between 2 and 80
    and term = lower(regexp_replace(btrim(term), '\s+', ' ', 'g'))
  ),
  language text not null default 'en' check (language in ('en', 'pcm', 'ha', 'yo', 'ig')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint category_synonyms_category_term_key unique (category_id, term)
);

create index category_synonyms_term_trgm_idx
  on public.category_synonyms using gin (term extensions.gin_trgm_ops);

create trigger category_synonyms_set_updated_at
  before update on public.category_synonyms
  for each row execute function public.set_updated_at();

create trigger category_synonyms_audit
  after insert or update or delete on public.category_synonyms
  for each row execute function public.audit_row_change();

alter table public.categories enable row level security;
alter table public.category_synonyms enable row level security;

create policy "anyone reads active categories" on public.categories
  for select to anon, authenticated
  using (is_active or public.is_staff());

create policy "admin creates categories" on public.categories
  for insert to authenticated
  with check (public.is_admin());

create policy "admin updates categories" on public.categories
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());
-- No delete policy: deactivate instead, because requests point at categories.

create policy "anyone reads synonyms of active categories" on public.category_synonyms
  for select to anon, authenticated
  using (
    public.is_staff()
    or exists (
      select 1 from public.categories c
      where c.id = category_synonyms.category_id and c.is_active
    )
  );

create policy "admin creates synonyms" on public.category_synonyms
  for insert to authenticated
  with check (public.is_admin());

create policy "admin updates synonyms" on public.category_synonyms
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "admin deletes synonyms" on public.category_synonyms
  for delete to authenticated
  using (public.is_admin());
