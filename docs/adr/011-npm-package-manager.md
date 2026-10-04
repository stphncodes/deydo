# ADR-011: npm instead of pnpm

- Status: Accepted
- Date: 2026-10-04

## Context

ADR-010 and Section 4 of the technical document chose pnpm via Corepack. The founder asked to use npm. Corepack is also not installed on the development machine.

## Decision

Use npm, the version bundled with Node Active LTS, pinned in `packageManager`. The lockfile is `package-lock.json`. Scripts are run with `npm run <script>` and CI uses `npm ci`. Wherever the technical document says `pnpm <script>`, read `npm run <script>`.

## Alternatives considered

- pnpm: stricter dependency resolution and faster installs, but the founder prefers npm and the gain is small for a single-app repo.

## Consequences

- No Corepack step in setup.
- npm hoists dependencies, so an undeclared import can work by accident. ESLint and the typecheck catch most of these.
