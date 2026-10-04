# ADR-015: Email-only sign-in

- Status: Accepted
- Date: 2026-10-05
- Supersedes: [ADR-008](008-phone-otp-auth.md)

## Context

ADR-008 made phone OTP the primary sign-in, sent through a Supabase Send SMS hook, pending a test of SMS delivery and cost. No SMS vendor was chosen, so phone sign-in could not work on the hosted project. The founder decided to use email only.

## Decision

- Sign-in and sign-up use a 6-digit code sent by email (`signInWithOtp` with `type: 'email'`). No passwords, no magic links (links often open in a different browser from the installed app).
- Phone sign-in, the Send SMS hook route, the `services/sms` adapter and the webhook verifier are removed.
- Phone numbers are still collected where the product needs them: providers give one in their application so ops can call them to verify. It lives in `public.profile_contacts`, readable only by its owner and staff. Later phases reveal it to the other party once a job exists (contact reveal rule).
- Provider approval now requires a phone number on file instead of a phone verified through sign-in. `profiles.phone_verified` stays in the schema, unused, to avoid a destructive migration.

## Alternatives considered

- Keep phone OTP and choose a vendor (Termii, Africa's Talking, Twilio): costs money per message and needs a delivery test first. Can be revisited.
- Email plus password: adds password resets and weak passwords for no real gain over codes.

## Consequences

- Some artisans have little or no email habit. Watch onboarding drop-off for providers; assisted onboarding by ops covers the gap in the wedge.
- Production needs a transactional email provider (custom SMTP): Supabase's built-in sender is limited to a few emails per hour.
- Phone numbers are typed by the user and not verified by OTP. Ops confirm them by calling during verification.

## Review trigger

Provider onboarding completion below target, or ops reporting that providers cannot use email.
