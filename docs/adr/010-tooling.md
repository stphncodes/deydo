# ADR-010: Node LTS, Vitest, Playwright, pgTAP

- Status: Accepted. The package manager part (pnpm) is superseded by [ADR-011](011-npm-package-manager.md).
- Date: 2026-10-04

## Context

The team needs fast, reproducible tooling that matches the Vercel runtime.

## Decision

- Node Active LTS, pinned in `.nvmrc` and `package.json#engines`.
- Vitest for unit and integration tests.
- pgTAP via `supabase test db` for database and RLS tests.
- Playwright for end-to-end journeys on a mobile viewport with network throttling.
- The original decision named pnpm as the package manager. See ADR-011.

## Alternatives considered

- Jest: slower and needs more config with ESM and TypeScript.
- Cypress: heavier, weaker multi-browser story.

## Consequences

- CI runs lint, typecheck, Vitest and pgTAP on every PR, and Playwright against preview deploys.
