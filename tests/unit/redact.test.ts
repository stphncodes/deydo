import type { ErrorEvent } from '@sentry/nextjs'
import { describe, expect, it } from 'vitest'

import { isSensitiveKey, redactText, redactValue, stripQuery } from '@/lib/observability/redact'
import { scrubSentryEvent } from '@/lib/observability/sentry-scrub'

describe('redactText', () => {
  it.each([
    'Call me on 08031234567',
    'Call me on 0803 123 4567',
    'Call me on +2348031234567',
    'Call me on 234-803-123-4567',
    'Account 0123456789 at GTB',
  ])('removes phone and account numbers: %s', (text) => {
    expect(redactText(text)).not.toMatch(/\d{7,}/)
    expect(redactText(text)).toContain('[phone]')
  })

  it('removes emails', () => {
    expect(redactText('mail chidi.okeke@example.com now')).toBe('mail [email] now')
  })

  it('keeps ordinary numbers like prices and ids', () => {
    expect(redactText('Quote of 15000 for job 42')).toBe('Quote of 15000 for job 42')
  })
})

describe('isSensitiveKey', () => {
  it.each([
    'phone',
    'phoneNumber',
    'address_detail',
    'Email',
    'body',
    'full_name',
    'nin',
    'access_token',
  ])('flags %s', (key) => expect(isSensitiveKey(key)).toBe(true))

  it.each(['warning', 'running', 'requestId', 'category', 'status', 'urgency'])(
    'allows %s',
    (key) => expect(isSensitiveKey(key)).toBe(false),
  )
})

describe('redactValue', () => {
  it('redacts nested sensitive keys and scrubs strings', () => {
    expect(
      redactValue({
        requestId: 'r1',
        user: { phone: '0803', note: 'ring 08031234567' },
        tags: ['a'],
      }),
    ).toEqual({ requestId: 'r1', user: { phone: '[redacted]', note: 'ring [phone]' }, tags: ['a'] })
  })
})

describe('stripQuery', () => {
  it('drops query strings and fragments', () => {
    expect(stripQuery('https://x.test/p?phone=0803#top')).toBe('https://x.test/p')
    expect(stripQuery('/dashboard')).toBe('/dashboard')
  })
})

describe('scrubSentryEvent', () => {
  it('keeps the stack and user id but strips personal data', () => {
    const event = scrubSentryEvent({
      type: undefined,
      message: 'Failed for 08031234567',
      user: { id: 'u1', email: 'a@b.co', ip_address: '1.2.3.4' },
      request: {
        url: 'https://deydo.test/requests?address=12+Allen',
        method: 'POST',
        data: { address_detail: '12 Allen Avenue' },
        cookies: { session: 'secret' },
        headers: { authorization: 'Bearer x' },
      },
      exception: {
        values: [{ type: 'Error', value: 'bad phone +2348031234567', stacktrace: { frames: [] } }],
      },
      breadcrumbs: [{ message: 'sent to a@b.co', data: { url: '/api?x=1', body: 'hello' } }],
      extra: { message_body: 'my house is at 5 Ade Street' },
    } as ErrorEvent)

    expect(event.user).toEqual({ id: 'u1' })
    expect(event.request).toEqual({ method: 'POST', url: 'https://deydo.test/requests' })
    expect(event.message).toBe('Failed for [phone]')
    expect(event.exception?.values?.[0]?.value).toBe('bad phone [phone]')
    expect(event.exception?.values?.[0]?.stacktrace).toEqual({ frames: [] })
    expect(event.breadcrumbs?.[0]).toMatchObject({
      message: 'sent to [email]',
      data: { url: '/api', body: '[redacted]' },
    })
    expect(event.extra).toEqual({ message_body: '[redacted]' })
  })
})
