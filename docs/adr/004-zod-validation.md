# ADR-004: Zod as the single validation library

- Status: Accepted
- Date: 2026-10-04

## Context

Input arrives from forms, Server Actions, Route Handlers, third-party APIs and environment variables. Several validation libraries would drift apart.

## Decision

Zod validates every boundary: forms, Server Actions, Route Handlers, external API responses and environment variables. Schemas live in `features/<feature>/schemas.ts` and are shared by client and server. Database constraints must agree with the Zod schemas; when they diverge the database wins and a test should catch it.

## Alternatives considered

- Valibot (smaller bundle) or hand-written checks: less familiar, or easy to get wrong.

## Consequences

- One mental model for validation.
- Zod adds weight to client bundles that import schemas, so client components import only the schemas they need.
