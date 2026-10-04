import { describe, expect, it } from 'vitest'

import { parseEnv, PublicEnvSchema, ServerEnvSchema } from '@/config/env.schema'

const validPublic = {
  NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_0123456789abcdef',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
}

describe('public env', () => {
  it('accepts a minimal local setup and applies defaults', () => {
    const env = parseEnv(PublicEnvSchema, validPublic, 'public')
    expect(env.NEXT_PUBLIC_APP_ENV).toBe('local')
    expect(env.NEXT_PUBLIC_POSTHOG_HOST).toBe('https://eu.i.posthog.com')
    expect(env.NEXT_PUBLIC_SENTRY_DSN).toBeUndefined()
  })

  it('treats empty strings as unset', () => {
    const env = parseEnv(
      PublicEnvSchema,
      { ...validPublic, NEXT_PUBLIC_SENTRY_DSN: '', NEXT_PUBLIC_POSTHOG_HOST: '' },
      'public',
    )
    expect(env.NEXT_PUBLIC_SENTRY_DSN).toBeUndefined()
    expect(env.NEXT_PUBLIC_POSTHOG_HOST).toBe('https://eu.i.posthog.com')
  })

  it('fails fast with every problem listed', () => {
    expect(() => parseEnv(PublicEnvSchema, { NEXT_PUBLIC_APP_URL: 'nope' }, 'public')).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL[\s\S]*NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY[\s\S]*NEXT_PUBLIC_APP_URL/,
    )
  })

  it('requires Sentry and analytics in production', () => {
    expect(() =>
      parseEnv(PublicEnvSchema, { ...validPublic, NEXT_PUBLIC_APP_ENV: 'production' }, 'public'),
    ).toThrow(/NEXT_PUBLIC_SENTRY_DSN: Required in production[\s\S]*NEXT_PUBLIC_POSTHOG_KEY/)
  })
})

describe('server env', () => {
  it('requires the secret key', () => {
    expect(() => parseEnv(ServerEnvSchema, {}, 'server')).toThrow(/SUPABASE_SECRET_KEY/)
  })

  it('ignores unrelated variables', () => {
    const env = parseEnv(
      ServerEnvSchema,
      { SUPABASE_SECRET_KEY: 'sb_secret_0123456789abcdef', PATH: '/usr/bin' },
      'server',
    )
    expect(env).toEqual({
      SUPABASE_SECRET_KEY: 'sb_secret_0123456789abcdef',
      SMS_PROVIDER: 'disabled',
    })
  })
})
