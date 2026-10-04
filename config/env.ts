import { parseEnv, PublicEnvSchema } from './env.schema'

function vercelUrl(): string | undefined {
  const host =
    process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'
      ? process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
      : process.env.NEXT_PUBLIC_VERCEL_URL
  return host ? `https://${host}` : undefined
}

// NEXT_PUBLIC_ variables must be referenced one by one so Next.js can inline
// them into the browser bundle.
export const publicEnv = parseEnv(
  PublicEnvSchema,
  {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    // On Vercel, fall back to the project's production domain or, on
    // previews, the deployment URL (system variables Vercel exposes).
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || vercelUrl(),
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  },
  'public',
)
