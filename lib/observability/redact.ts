// Personal data must never reach Sentry, analytics or logs: phone numbers,
// emails, addresses and message contents. These helpers strip it.

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
// Nigerian mobile numbers (0803..., +234803..., 234803...) and any other long
// run of digits that could be a phone or account number.
const PHONE = /(?:\+?234|0)[789][01]\d[\s-]?\d{3}[\s-]?\d{4}|\+?\d(?:[\s-]?\d){9,}/g

// Keys are compared after lowercasing and removing separators, so
// `addressDetail`, `address_detail` and `ADDRESS-DETAIL` all match.
const SENSITIVE_EXACT = new Set(['nin', 'bvn', 'otp', 'body', 'content', 'text', 'name'])
const SENSITIVE_PARTS = [
  'phone',
  'email',
  'address',
  'street',
  'landmark',
  'password',
  'passcode',
  'secret',
  'token',
  'cookie',
  'authorization',
  'accountnumber',
  'fullname',
  'messagebody',
]

export function isSensitiveKey(key: string): boolean {
  const normalised = key.toLowerCase().replace(/[^a-z0-9]/g, '')
  return (
    SENSITIVE_EXACT.has(normalised) || SENSITIVE_PARTS.some((part) => normalised.includes(part))
  )
}

export function redactText(text: string): string {
  return text.replace(EMAIL, '[email]').replace(PHONE, '[phone]')
}

/** Deeply redacts sensitive keys and scrubs personal data out of strings. */
export function redactValue(value: unknown, depth = 0): unknown {
  if (depth > 8) return '[truncated]'
  if (typeof value === 'string') return redactText(value)
  if (Array.isArray(value)) return value.map((item) => redactValue(item, depth + 1))
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, inner] of Object.entries(value)) {
      out[key] = isSensitiveKey(key) ? '[redacted]' : redactValue(inner, depth + 1)
    }
    return out
  }
  return value
}

/** Drops the query string, which can carry personal data. */
export function stripQuery(url: string): string {
  const index = url.search(/[?#]/)
  return index === -1 ? url : url.slice(0, index)
}
