## What changed for users

## Checklist

- [ ] Migration included for any schema change (never edit an applied migration)
- [ ] RLS policies and pgTAP tests for every new table
- [ ] `npm run db:types` run and `types/database.ts` committed
- [ ] Zod schemas match the database constraints
- [ ] Tests added (unit, pgTAP, integration or E2E as fits)
- [ ] No personal data sent to analytics, Sentry or logs
- [ ] No em dashes, no gradients
- [ ] ADR written if this is hard to reverse
