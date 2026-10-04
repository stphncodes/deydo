# ADR-007: Payments off-platform in the MVP

- Status: Accepted
- Date: 2026-10-04

## Context

In-platform payments bring regulatory, engineering and support work. Small on-site jobs are mostly paid by cash or transfer.

## Decision

The MVP records the agreed price (`agreed_price_kobo` plus `currency`) and `payment_method = 'offline'`. Customers pay providers directly. No payment provider code is written in the MVP. When payments arrive (Phase 10) they use a ledger-based design.

## Alternatives considered

- Paystack split payments at launch: adds friction and compliance work before liquidity is proven.

## Consequences

- GMV is self-reported in the MVP.
- No payment leverage in disputes until Phase 10.
