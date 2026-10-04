# ADR-003: Server Actions for UI mutations, Route Handlers for external callers

- Status: Accepted
- Date: 2026-10-04

## Context

Next.js offers several ways to run server code. Mixing them without a rule makes it unclear where validation and rate limiting happen.

## Decision

- React Server Components read data for pages.
- Server Actions handle mutations started from our own UI. They stay thin: check the user, parse input with Zod, call a service, revalidate.
- Route Handlers (`app/api/**`) are only for webhooks, cron and future external callers that need a stable URL.
- The browser Supabase client is used for Realtime subscriptions and signed uploads, not general writes.
- Multi-step atomic operations run as SQL functions called over RPC.

## Alternatives considered

- A REST or GraphQL API layer for everything: more surface area, no current consumer besides our UI.

## Consequences

- All user writes pass through server code where validation and rate limits run.
- A future mobile app will need Route Handlers for the operations it uses.
