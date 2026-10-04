# DeyDo

A Nigerian-first marketplace that turns a customer's stated need into a matched, completed and reviewed job with a skilled provider. Working title.

- Product: [`docs/product/product-vision.md`](docs/product/product-vision.md)
- Engineering: [`docs/product/technical-architecture.md`](docs/product/technical-architecture.md)
- Decisions: [`docs/adr/`](docs/adr/)
- Runbooks: [`docs/runbooks/`](docs/runbooks/)

## Local setup

You need Node 24 (Active LTS), Docker running, and Git.

```bash
git clone git@github.com:stphncodes/deydo.git && cd deydo
nvm use                # or install the Node version in .nvmrc
npm ci
npm run db:start       # local Supabase in Docker; applies migrations and seeds
npm run env:local      # writes .env.local from the local stack
npm run dev            # http://localhost:3000
```

Local Studio runs at http://127.0.0.1:54323. Fixture users (local only) sign in with the password `password123`: `admin@deydo.test`, `chidi@deydo.test`, `amina@deydo.test`.

## Everyday commands

| Command                             | What it does                                                            |
| ----------------------------------- | ----------------------------------------------------------------------- |
| `npm run check`                     | Lint, typecheck, style rules, unit tests and pgTAP. Run before every PR |
| `npm test`                          | Vitest unit tests                                                       |
| `npm run db:test`                   | pgTAP database and RLS tests                                            |
| `npm run test:e2e`                  | Playwright on a mobile profile with a slow network                      |
| `npm run db:reset`                  | Rebuild the local database from migrations and seeds                    |
| `npx supabase migration new <name>` | Create a migration                                                      |
| `npm run db:types`                  | Regenerate `types/database.ts` after a migration (commit it)            |
| `npm run check:style`               | Fail on em dashes or gradients                                          |

## Rules that matter most

1. Every table in `public` has RLS and pgTAP tests. CI fails otherwise.
2. Every schema change is a new migration. Never edit an applied one.
3. Zod at every boundary. Database constraints agree with the schemas.
4. Money is integer kobo plus a `currency` column.
5. The Supabase secret key never reaches the browser or ordinary user requests.
6. No personal data in analytics, Sentry or logs.
7. Mobile and slow connections first. Initial JS on core pages stays under about 150 KB compressed.
8. No em dashes and no gradients, anywhere.

## Environments

| Environment | App                                                           | Database                    |
| ----------- | ------------------------------------------------------------- | --------------------------- |
| Local       | `npm run dev`                                                 | Local Supabase in Docker    |
| Preview     | Vercel preview per PR                                         | Staging Supabase project    |
| Production  | Vercel production, deployed by `.github/workflows/deploy.yml` | Production Supabase project |

Merging to `main` applies migrations, then deploys. See [`docs/runbooks/migrations.md`](docs/runbooks/migrations.md).
