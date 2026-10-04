import { afterEach, describe, expect, it, vi } from 'vitest'

const ENV = {
  NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_0123456789abcdef',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  SUPABASE_SECRET_KEY: 'sb_secret_0123456789abcdef',
}

async function loadSms(env: Record<string, string>) {
  vi.resetModules()
  for (const [key, value] of Object.entries({ ...ENV, ...env })) vi.stubEnv(key, value)
  return import('@/services/sms')
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('SMS adapter', () => {
  it('is disabled unless configured, and fails clearly', async () => {
    const sms = await loadSms({})
    const adapter = sms.getSmsAdapter()
    expect(adapter.name).toBe('disabled')
    await expect(adapter.send('2348031234567', 'hi')).rejects.toBeInstanceOf(
      sms.SmsUnavailableError,
    )
  })

  it('prints messages in development with the console adapter', async () => {
    const sms = await loadSms({ SMS_PROVIDER: 'console', NODE_ENV: 'development' })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    await sms.getSmsAdapter().send('2348031234567', 'Your DeyDo code is 123456')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('123456'))
  })

  it('never prints codes in a production build', async () => {
    const sms = await loadSms({ SMS_PROVIDER: 'console', NODE_ENV: 'production' })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    await expect(sms.getSmsAdapter().send('2348031234567', 'code 123456')).rejects.toBeInstanceOf(
      sms.SmsUnavailableError,
    )
    expect(warn.mock.calls.flat().join(' ')).not.toContain('123456')
  })
})
