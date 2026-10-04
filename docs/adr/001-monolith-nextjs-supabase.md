# ADR-001: Single Next.js monolith on Vercel plus Supabase

- Status: Accepted
- Date: 2026-10-04

## Context

DeyDo is built by a very small team and must reach a liquid marketplace in one city before anything else matters. Every extra deployable adds operational load.

## Decision

One Next.js (App Router) application deployed on Vercel, backed by one Supabase project per environment (Postgres, Auth, Storage, Realtime). There is no separate API server. Postgres does as much as it reasonably can: constraints, RLS, SQL functions, trigram search and scheduled jobs.

## Alternatives considered

- Separate API service (Node or Go) behind the web app: more code paths to secure and deploy, no benefit at this scale.
- Microservices or a message queue: solves problems we do not have.

## Consequences

- One repository, one deploy, one place to look.
- Business logic lives in `features/*/server` and SQL functions.
- A second deployable (for example a native app) is the trigger to revisit the repo layout.
