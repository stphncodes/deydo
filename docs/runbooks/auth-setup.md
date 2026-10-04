# Runbook: auth setup on the hosted Supabase project

Local auth is configured in `supabase/config.toml`. The hosted project is configured once in the Supabase dashboard (Authentication section), because `supabase db push` does not change auth settings. Redo these steps if the project is ever recreated.

## 1. Custom Access Token hook (staff roles)

Authentication > Hooks > Customize Access Token (JWT) Claims:

- Type: Postgres function
- Function: `public.custom_access_token_hook`

Check: sign in as an admin and open `/admin/providers`. Non-admins get a 404.

## 2. Send SMS hook (phone sign-in)

1. Generate a secret in the dashboard (Authentication > Hooks > Send SMS, type HTTPS). It looks like `v1,whsec_...`.
2. URL: `https://<production domain>/api/auth/hooks/send-sms`
3. In Vercel, set for Production and Preview:
   - `SEND_SMS_HOOK_SECRET` = the same secret (sensitive)
   - `SMS_PROVIDER` = `disabled` until an SMS vendor is chosen (ADR-008)
4. Authentication > Providers > Phone: enable phone sign-in. No built-in SMS provider is needed; the hook sends every SMS.

While `SMS_PROVIDER=disabled`, phone sign-in fails politely and people use email. Choosing a vendor means adding an adapter in `services/sms` and an ADR.

## 3. Email sign-in code

Authentication > Email Templates. For both "Magic Link" and "Confirm signup", use the subject and body from `supabase/templates/sign-in-code.html` (it shows `{{ .Token }}`, a 6-digit code, instead of a link).

Authentication > Providers > Email: set the OTP expiry to 600 seconds and the OTP length to 6.

**Before launch:** Supabase's built-in email sender allows only a few emails per hour. Set up custom SMTP (Authentication > SMTP Settings) with a transactional email provider. This is an open decision.

## 4. URLs

Authentication > URL Configuration:

- Site URL: the production URL
- Redirect URLs: the production URL and `https://*-<vercel team>.vercel.app/**` for previews

## Never on the hosted project

- `[auth.sms.test_otp]` fixed codes (local only)
- The placeholder Twilio values in `config.toml` (local only)
- `supabase/seed/dev-fixtures.sql` (ADR-014)
