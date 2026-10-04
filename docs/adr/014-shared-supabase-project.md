# ADR-014: One Supabase project for staging and production (temporary)

- Status: Accepted (temporary)
- Date: 2026-10-04
- Supersedes in part: Section 22.1 of the technical document and the staging fixture step of [ADR-013](013-reference-data-seeding.md)

## Context

The technical document asks for separate staging and production Supabase projects, with production data never flowing to staging. The founder wants one project for both until there is a reason to pay for and run a second one. There are no real users yet.

## Decision

- One hosted Supabase project (`deydo`) backs Vercel preview deployments and production.
- `NEXT_PUBLIC_APP_ENV` is `staging` on previews and `production` on production, so Sentry and analytics can still tell them apart.
- `supabase/seed/dev-fixtures.sql` is **never** applied to the hosted project. Its accounts have a known password, including an admin.
- The deploy workflow has a single migrate step before the production deploy.
- E2E tests against preview deployments must be read-only. Journeys that create data (sign-up, requests, jobs) run in CI against the local Supabase stack only.

## Alternatives considered

- Two projects now, as the document says: safest, but a second project costs money and setup time before there is anything to protect.
- Supabase branching: per-PR databases, but an extra paid feature and more moving parts.

## Consequences

- A preview deployment can read and write real production data. Treat preview URLs as production.
- A bad migration hits production with no staging rehearsal. CI's `db reset` plus pgTAP on every PR is the only rehearsal, so keep migrations backward compatible (see the migrations runbook).
- Test accounts made by hand on previews live in production. Delete them before launch.

## Review trigger

Split into two projects before the private beta (Build Order step 21) or before the first real user signs up, whichever comes first.
