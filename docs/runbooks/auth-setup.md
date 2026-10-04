# Runbook: auth setup on the hosted Supabase project

Sign-in is email only, with a 6-digit code (ADR-015). Local auth is configured in `supabase/config.toml`. The hosted project is configured in the Supabase dashboard (Authentication section), because `supabase db push` does not change auth settings. Redo these steps if the project is ever recreated.

## 1. Custom Access Token hook (staff roles)

Authentication > Hooks > Customize Access Token (JWT) Claims:

- Type: Postgres function
- Function: `public.custom_access_token_hook`

Check: sign in as an admin and open `/admin/providers`. Non-admins get a 404.

## 2. Email sign-in code

Authentication > Email Templates. For both "Magic Link" and "Confirm signup":

- Subject: `Your DeyDo sign-in code`
- Body: the contents of `supabase/templates/sign-in-code.html` (it shows `{{ .Token }}`, a 6-digit code, instead of a link)

Authentication > Providers > Email: email provider on, "Confirm email" on, OTP expiry 600 seconds, OTP length 6.

## 3. Phone

Authentication > Providers > Phone: **off**. There is no SMS hook.

## 4. URLs

Authentication > URL Configuration:

- Site URL: the production URL
- Redirect URLs: the production URL and the preview pattern `https://*-<vercel team>.vercel.app/**`

## 5. Email delivery (before launch)

Supabase's built-in sender allows only a few emails per hour and is not meant for production. Set up custom SMTP (Authentication > SMTP Settings) with a transactional email provider, then raise the email rate limit (Authentication > Rate Limits). Until then, sign-in works for a handful of people per hour.

## 6. First admin

After you sign in once, grant yourself the admin role (there is no UI for granting roles until Phase 9):

```bash
npx supabase db query --linked "insert into public.user_roles (user_id, role) select id, 'admin' from auth.users where email = 'you@example.com' on conflict do nothing"
```

Sign out and back in so your token picks up the role.

## Never on the hosted project

- `supabase/seed/dev-fixtures.sql` (known passwords, including an admin; ADR-014)
