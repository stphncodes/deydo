import { describe, expect, it } from 'vitest'

import { parseFunnelEvent } from '@/lib/analytics/events'

const requestId = '0b8f1c1e-6f2a-4c55-9b0e-3d2f8f1a2b3c'

describe('funnel events', () => {
  it('accepts a valid event', () => {
    expect(
      parseFunnelEvent('request_posted', {
        request_id: requestId,
        category: 'ac-refrigeration-repair',
        urgency: 'today',
        has_photos: true,
        has_budget: false,
      }),
    ).toMatchObject({ category: 'ac-refrigeration-repair' })
  })

  it('rejects extra properties so personal data cannot ride along', () => {
    expect(() =>
      parseFunnelEvent('request_posted', {
        request_id: requestId,
        category: 'plumbing',
        urgency: 'asap',
        has_photos: false,
        has_budget: false,
        phone: '08031234567',
      }),
    ).toThrow()
  })

  it('rejects non-UUID ids', () => {
    expect(() =>
      parseFunnelEvent('review_submitted', {
        job_id: 'chidi@example.com',
        role: 'customer_to_provider',
        rating: 5,
      }),
    ).toThrow()
  })
})
