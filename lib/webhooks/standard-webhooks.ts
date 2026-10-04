import { createHmac, timingSafeEqual } from 'node:crypto'

// Verifies Standard Webhooks signatures (https://www.standardwebhooks.com),
// the scheme Supabase Auth hooks use. Implemented here to avoid a dependency.

const TOLERANCE_SECONDS = 5 * 60

export class WebhookVerificationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WebhookVerificationError'
  }
}

function secretKey(secret: string): Buffer {
  const encoded = secret.replace(/^v1,/, '').replace(/^whsec_/, '')
  const key = Buffer.from(encoded, 'base64')
  if (key.length === 0) throw new WebhookVerificationError('Invalid webhook secret')
  return key
}

export function signWebhook(
  secret: string,
  id: string,
  timestamp: number,
  payload: string,
): string {
  const digest = createHmac('sha256', secretKey(secret))
    .update(`${id}.${timestamp}.${payload}`)
    .digest('base64')
  return `v1,${digest}`
}

/** Throws WebhookVerificationError unless the payload is authentic and fresh. */
export function verifyWebhook(
  secret: string,
  payload: string,
  headers: Headers,
  now: number = Math.floor(Date.now() / 1000),
): void {
  const id = headers.get('webhook-id')
  const timestampHeader = headers.get('webhook-timestamp')
  const signatures = headers.get('webhook-signature')
  if (!id || !timestampHeader || !signatures) {
    throw new WebhookVerificationError('Missing webhook headers')
  }

  const timestamp = Number(timestampHeader)
  if (!Number.isInteger(timestamp) || Math.abs(now - timestamp) > TOLERANCE_SECONDS) {
    throw new WebhookVerificationError('Webhook timestamp outside tolerance')
  }

  const expected = Buffer.from(signWebhook(secret, id, timestamp, payload).slice(3), 'base64')
  const match = signatures.split(' ').some((entry) => {
    const [version, value] = entry.split(',')
    if (version !== 'v1' || !value) return false
    const given = Buffer.from(value, 'base64')
    return given.length === expected.length && timingSafeEqual(given, expected)
  })
  if (!match) throw new WebhookVerificationError('Webhook signature mismatch')
}
