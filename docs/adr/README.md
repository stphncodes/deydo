# Architecture Decision Records

Decisions that are expensive to reverse are written down here. ADR-001 to ADR-010 come from Section 2.4 of [`technical-architecture.md`](../product/technical-architecture.md). New ADRs take the next number and use the template in Section 28 of that document.

Never edit an accepted ADR to change its decision. Write a new ADR that supersedes it.

| ADR                                             | Title                                                                | Status                                       |
| ----------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------- |
| [001](001-monolith-nextjs-supabase.md)          | Single Next.js monolith on Vercel plus Supabase                      | Accepted                                     |
| [002](002-authorization-via-rls.md)             | Authorization enforced via Postgres RLS                              | Accepted                                     |
| [003](003-server-actions-and-route-handlers.md) | Server Actions for UI mutations, Route Handlers for external callers | Accepted                                     |
| [004](004-zod-validation.md)                    | Zod as the single validation library                                 | Accepted                                     |
| [005](005-location-hierarchy.md)                | Location as a seeded hierarchy, PostGIS deferred                     | Accepted                                     |
| [006](006-deterministic-matching.md)            | Deterministic SQL matching in the MVP                                | Accepted                                     |
| [007](007-offline-payments.md)                  | Payments off-platform in the MVP                                     | Accepted                                     |
| [008](008-phone-otp-auth.md)                    | Phone OTP as primary auth via a Send SMS hook                        | Proposed                                     |
| [009](009-web-and-pwa-first.md)                 | Web app plus PWA before native apps                                  | Accepted                                     |
| [010](010-tooling.md)                           | Node LTS, Vitest, Playwright, pgTAP                                  | Accepted (package manager superseded by 011) |
| [011](011-npm-package-manager.md)               | npm instead of pnpm                                                  | Accepted                                     |
| [012](012-animation-libraries.md)               | Animation libraries and the JS budget                                | Accepted                                     |
| [013](013-reference-data-seeding.md)            | How reference data reaches each environment                          | Accepted                                     |
| [015](015-email-only-auth.md)                   | Email-only sign-in                                                   | Accepted                                     |
