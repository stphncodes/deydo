# ADR-013: How reference data reaches each environment

- Status: Accepted
- Date: 2026-10-04

## Context

`supabase db push` applies migrations to hosted projects but does not run seed files. Staging and production still need Nigerian states, the wedge categories and the wedge city's areas. The wedge city is not decided yet, so its areas must be easy to replace. Applied migrations must never be edited.

## Decision

1. **National reference data in a data migration.** The country, all 36 states plus FCT, the "Home & Device Repair" parent, the five wedge leaf categories and their synonyms are inserted by a migration. Admins edit categories and synonyms through the admin console after that, never by editing the migration.
2. **Wedge city in a replaceable file.** `supabase/seed/wedge-city.sql` holds the city and its areas. It is idempotent: it upserts by slug and only adds or reactivates rows. Replacing the city means editing this one file and deactivating the old areas, never deleting them, because requests and providers may point at them.
3. **Applying it.** Locally, `supabase db reset` runs it through `[db.seed]` in `supabase/config.toml`. In CI, the deploy workflow runs it against staging and production with `psql` right after `supabase db push`.
4. **Dev fixtures.** `supabase/seed/dev-fixtures.sql` runs locally (through `db reset`) and is applied to staging by the deploy workflow so preview E2E runs have known users. It is idempotent and is never applied to production.

## Alternatives considered

- Everything in `seed.sql`: production would have no states or categories.
- Everything in migrations: replacing the wedge city would need a new migration each time, and the "one easy file" requirement would be lost.

## Consequences

- The deploy workflow needs database connection strings for staging and production as secrets.
- The wedge city file must stay idempotent. A pgTAP or CI check that running it twice changes nothing guards this.
