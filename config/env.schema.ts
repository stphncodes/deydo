import { z } from 'zod'

// Empty strings from .env files mean "not set".
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema.optional())

export const APP_ENVS = ['local', 'staging', 'production'] as const

export const PublicEnvSchema = z
  .object({
    NEXT_PUBLIC_SUPABASE_URL: z.url(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20),
    NEXT_PUBLIC_APP_URL: z.url(),
    NEXT_PUBLIC_APP_ENV: z.enum(APP_ENVS).default('local'),
    NEXT_PUBLIC_SENTRY_DSN: optional(z.url()),
    NEXT_PUBLIC_POSTHOG_KEY: optional(z.string().min(1)),
    NEXT_PUBLIC_POSTHOG_HOST: z.preprocess(
      (value) => (value === '' ? undefined : value),
      z.url().default('https://eu.i.posthog.com'),
    ),
  })
  .superRefine((env, ctx) => {
    if (env.NEXT_PUBLIC_APP_ENV !== 'production') return
    if (!env.NEXT_PUBLIC_SENTRY_DSN) {
      ctx.addIssue({
        code: 'custom',
        path: ['NEXT_PUBLIC_SENTRY_DSN'],
        message: 'Required in production',
      })
    }
    if (!env.NEXT_PUBLIC_POSTHOG_KEY) {
      ctx.addIssue({
        code: 'custom',
        path: ['NEXT_PUBLIC_POSTHOG_KEY'],
        message: 'Required in production',
      })
    }
  })

export const SMS_PROVIDERS = ['console', 'disabled'] as const

export const ServerEnvSchema = z.object({
  SUPABASE_SECRET_KEY: z.string().min(20),
  // Supabase Send SMS hook secret, in Standard Webhooks form: v1,whsec_<base64>
  SEND_SMS_HOOK_SECRET: optional(z.string().regex(/^v1,whsec_[A-Za-z0-9+/=]+$/)),
  // `console` prints messages in the server log (local development only).
  // Real vendors are added behind services/sms with an ADR (ADR-008).
  SMS_PROVIDER: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.enum(SMS_PROVIDERS).default('disabled'),
  ),
  // Added with the cron routes in later phases.
  CRON_SECRET: optional(z.string().min(32)),
})

export type PublicEnv = z.infer<typeof PublicEnvSchema>
export type ServerEnv = z.infer<typeof ServerEnvSchema>

export function parseEnv<T extends z.ZodType>(
  schema: T,
  source: unknown,
  label: string,
): z.infer<T> {
  const result = schema.safeParse(source)
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
      .join('\n')
    throw new Error(`Invalid ${label} environment variables:\n${problems}`)
  }
  return result.data
}
