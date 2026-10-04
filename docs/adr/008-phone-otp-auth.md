# ADR-008: Phone OTP as primary auth via a Send SMS hook

- Status: Superseded by [ADR-015](015-email-only-auth.md) (email-only sign-in)
- Date: 2026-10-04

## Context

Nigerians identify online by phone number, and providers must be reachable by phone. SMS costs money and delivery can suffer from operator routing and DND settings.

## Decision

Supabase Auth phone OTP is the primary sign-in, with SMS delivered through a Send SMS Auth Hook to an SMS provider behind a small adapter in `services/sms`. Email is the fallback. The adapter is mockable and no vendor is hardcoded.

## Alternatives considered

- Email only: weaker fit for artisans.
- WhatsApp OTP: later option.

## Consequences

- OTP delivery rate and cost are measured before launch. If delivery is unreliable, customers fall back to email and phone verification stays a provider trust step.
- Build Order step 2 (the real SMS spike) has not been run yet. This ADR stays Proposed until it is.
