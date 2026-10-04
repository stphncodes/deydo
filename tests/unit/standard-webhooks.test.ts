import { describe, expect, it } from 'vitest'

import {
  signWebhook,
  verifyWebhook,
  WebhookVerificationError,
} from '@/lib/webhooks/standard-webhooks'

const secret = `v1,whsec_${Buffer.from('test-secret-for-unit-tests').toString('base64')}`
const payload = JSON.stringify({ user: { phone: '2348031234567' }, sms: { otp: '123456' } })
const now = 1_790_000_000

function headersFor(signature: string, timestamp = now, id = 'msg_1') {
  return new Headers({
    'webhook-id': id,
    'webhook-timestamp': String(timestamp),
    'webhook-signature': signature,
  })
}

describe('verifyWebhook', () => {
  it('accepts a valid signature', () => {
    const signature = signWebhook(secret, 'msg_1', now, payload)
    expect(() => verifyWebhook(secret, payload, headersFor(signature), now)).not.toThrow()
  })

  it('accepts when one of several signatures matches (key rotation)', () => {
    const signature = signWebhook(secret, 'msg_1', now, payload)
    expect(() =>
      verifyWebhook(secret, payload, headersFor(`v1,AAAA ${signature}`), now),
    ).not.toThrow()
  })

  it('rejects a tampered payload', () => {
    const signature = signWebhook(secret, 'msg_1', now, payload)
    expect(() =>
      verifyWebhook(secret, payload.replace('123456', '000000'), headersFor(signature), now),
    ).toThrow(WebhookVerificationError)
  })

  it('rejects a signature made with another secret', () => {
    const other = `v1,whsec_${Buffer.from('another-secret').toString('base64')}`
    const signature = signWebhook(other, 'msg_1', now, payload)
    expect(() => verifyWebhook(secret, payload, headersFor(signature), now)).toThrow(/mismatch/)
  })

  it('rejects old or future timestamps (replay protection)', () => {
    const old = now - 10 * 60
    const signature = signWebhook(secret, 'msg_1', old, payload)
    expect(() => verifyWebhook(secret, payload, headersFor(signature, old), now)).toThrow(
      /tolerance/,
    )
  })

  it('rejects missing headers', () => {
    expect(() => verifyWebhook(secret, payload, new Headers(), now)).toThrow(/Missing/)
  })
})
