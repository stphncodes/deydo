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

Sign in locally with a test phone number: `0800 000 0900` to `0800 000 0903` (new users) or a fixture number below, with the code `123456`. Other numbers send a real code through the Send SMS hook, which prints it in the `npm run dev` terminal.

Local Studio runs at http://127.0.0.1:54323. Emails (sign-in codes) arrive in Mailpit at http://127.0.0.1:54324. Fixture users (local only): admin `0800 000 0001`, customers `0800 000 0101` and `0800 000 0102`, providers `0800 000 0201` to `0800 000 0206` (all use the code `123456`).

### Troubleshooting

- **Real phone numbers time out locally (`hook_timeout`)**: the Supabase containers cannot reach `npm run dev` on port 3000 through your firewall. On Linux with ufw: `sudo ufw allow in from 172.16.0.0/12 to any port 3000 proto tcp`. Test numbers do not need this.

## Working without Docker (current setup)

Local development can point at the hosted Supabase project instead of the Docker stack. **That project is also production (ADR-014): anything you create locally is real data.**

```bash
npm ci
cp .env.hosted.local .env.local   # or fill in .env.local from .env.example with the hosted keys
npm run dev
```

- Sign in with your email (6-digit code). Phone sign-in needs an SMS vendor, which is not chosen yet.
- `npm run check:quick` runs lint, types, style rules and unit tests. Database tests (pgTAP) and the E2E journeys that create users need Docker, so CI runs them on every pull request.
- `npm run test:e2e` runs the read-only E2E tests against the hosted data; journeys tagged `@writes` are skipped automatically.
- New migrations: see "Without Docker" in [`docs/runbooks/migrations.md`](docs/runbooks/migrations.md). Never `db push` from a feature branch.

To go back to Docker: start Docker, `npm run db:start`, then `npm run env:local`.

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
