import { afterEach, describe, expect, it, vi } from 'vitest'

import { signWebhook } from '@/lib/webhooks/standard-webhooks'

const SECRET = `v1,whsec_${Buffer.from('integration-test-hook-secret').toString('base64')}`
const ENV = {
  NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_0123456789abcdef',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  SUPABASE_SECRET_KEY: 'sb_secret_0123456789abcdef',
  SEND_SMS_HOOK_SECRET: SECRET,
}

async function loadRoute(env: Record<string, string> = {}) {
  vi.resetModules()
  for (const [key, value] of Object.entries({ ...ENV, ...env })) vi.stubEnv(key, value)
  vi.spyOn(console, 'log').mockImplementation(() => undefined)
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
  return import('@/app/api/auth/hooks/send-sms/route')
}

function signedRequest(body: unknown, secret = SECRET) {
  const payload = JSON.stringify(body)
  const timestamp = Math.floor(Date.now() / 1000)
  return new Request('http://localhost/api/auth/hooks/send-sms', {
    method: 'POST',
    body: payload,
    headers: {
      'content-type': 'application/json',
      'webhook-id': 'msg_test',
      'webhook-timestamp': String(timestamp),
      'webhook-signature': signWebhook(secret, 'msg_test', timestamp, payload),
    },
  })
}

const validBody = { user: { id: 'u1', phone: '2348031234567' }, sms: { otp: '482913' } }

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('Send SMS hook route', () => {
  it('delivers the code through the configured adapter', async () => {
    const { POST } = await loadRoute({ SMS_PROVIDER: 'console', NODE_ENV: 'development' })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    const response = await POST(signedRequest(validBody))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({})
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('482913'))
  })

  it('rejects requests not signed with our secret', async () => {
    const { POST } = await loadRoute({ SMS_PROVIDER: 'console' })
    const other = `v1,whsec_${Buffer.from('attacker').toString('base64')}`

    const response = await POST(signedRequest(validBody, other))

    expect(response.status).toBe(401)
  })

  it('rejects malformed payloads', async () => {
    const { POST } = await loadRoute({ SMS_PROVIDER: 'console' })
    const response = await POST(
      signedRequest({ user: { phone: 'not a phone' }, sms: { otp: 'x' } }),
    )
    expect(response.status).toBe(400)
  })

  it('tells Supabase SMS is unavailable when no vendor is configured', async () => {
    const { POST } = await loadRoute({ SMS_PROVIDER: 'disabled' })
    const response = await POST(signedRequest(validBody))
    expect(response.status).toBe(503)
    expect(await response.json()).toMatchObject({ error: { http_code: 503 } })
  })

  it('fails closed when the hook secret is missing', async () => {
    const { POST } = await loadRoute({ SEND_SMS_HOOK_SECRET: '' })
    const response = await POST(signedRequest(validBody))
    expect(response.status).toBe(500)
  })
})
