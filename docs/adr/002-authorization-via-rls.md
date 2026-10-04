# ADR-002: Authorization enforced via Postgres RLS

- Status: Accepted
- Date: 2026-10-04

## Context

A marketplace holds personal data for two sides who must not see each other's private details until a job exists. A single missed check in application code could leak that data.

## Decision

Row Level Security is enabled on every table in `public`. Policies decide who can read and write each row for every query made with a user's token. The service layer still validates business rules, but authorization does not depend on it. A pgTAP test fails CI if any `public` table lacks RLS.

## Alternatives considered

- Authorization only in application code: one bug leaks data.
- Using the secret key everywhere and filtering in code: same problem, with a bigger blast radius.

## Consequences

- Every new table ships with policies and pgTAP tests in the same change.
- Column-level secrecy (for example the request address) needs views or guard triggers, since RLS is row-level.
- The secret key is reserved for webhooks, cron and isolated admin operations.
