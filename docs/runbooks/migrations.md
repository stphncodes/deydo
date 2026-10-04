# Runbook: database migrations

## Rules

- Every schema change is a file in `supabase/migrations/`. No dashboard edits.
- Never edit a migration that has been applied anywhere outside your machine. Fix forward with a new migration.
- Migrations must work with the app version that is currently live (expand, migrate, contract):
  1. Add new columns as nullable, or with a default. Deploy.
  2. Deploy code that writes the new column. Backfill.
  3. Add the constraint or drop the old column in a later migration.
- Every new table enables RLS and ships with pgTAP tests in the same PR.

## Writing a migration

```bash
npx supabase migration new add_something
# edit supabase/migrations/<timestamp>_add_something.sql
npm run db:reset        # rebuild locally from scratch
npm run db:test         # pgTAP
npm run db:types        # regenerate types/database.ts and commit it
```

## How migrations reach staging and production

`.github/workflows/deploy.yml` runs on every merge to `main`:

1. `supabase db push` to staging, then applies `supabase/seed/wedge-city.sql` and `supabase/seed/dev-fixtures.sql`.
2. `supabase db push` to production, then applies `supabase/seed/wedge-city.sql` only.
3. Builds and deploys the app to Vercel production.

If step 1 or 2 fails, the app is not deployed and production keeps running the previous version.

### Required GitHub secrets

Per GitHub environment (`staging` and `production`):

| Secret                 | Where to find it                                              |
| ---------------------- | ------------------------------------------------------------- |
| `SUPABASE_PROJECT_REF` | Supabase dashboard, project settings                          |
| `SUPABASE_DB_PASSWORD` | Set when the project was created                              |
| `SUPABASE_DB_URL`      | Supabase dashboard, Connect, session pooler connection string |

Repository-wide: `SUPABASE_ACCESS_TOKEN`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `VERCEL_AUTOMATION_BYPASS_SECRET`.

## When a migration fails in CI

1. Read the failing step's log. Nothing was deployed.
2. If the migration failed partway on a hosted project, Postgres rolled back that migration's transaction. Confirm with `supabase migration list --linked`.
3. Fix forward: change the migration only if it never applied anywhere; otherwise add a new migration.

## Emergency dashboard change

If someone changed the hosted schema by hand during an incident, capture it straight away:

```bash
npx supabase link --project-ref <ref>
npx supabase db diff --linked -f capture_manual_change
```

Review the generated file, commit it, and note the incident in the PR.

## Rolling back

- App: Vercel instant rollback to the previous production deployment.
- Database: never roll back by editing history. Write a forward migration that undoes the change, and make sure it is compatible with the app version you rolled back to.

## Replacing the wedge city

Edit `supabase/seed/wedge-city.sql` (instructions at the top of the file). Merge to `main`; the deploy workflow applies it. Old areas are deactivated, never deleted.
