import { describe, expect, it } from 'vitest'

import {
  AvatarPathSchema,
  OnboardingSchema,
  ProfileUpdateSchema,
} from '@/features/profiles/schemas'
import { ProviderApplicationSchema, ReviewProviderSchema } from '@/features/providers/schemas'
import { safeNextPath } from '@/lib/auth/next-path'

const uuid = '0b8f1c1e-6f2a-4c55-9b0e-3d2f8f1a2b3c'

describe('profile schemas (match the database constraints)', () => {
  it('trims names and enforces 2 to 100 characters', () => {
    expect(
      OnboardingSchema.parse({ fullName: '  Ada  ', locationId: uuid, intent: 'customer' })
        .fullName,
    ).toBe('Ada')
    expect(
      OnboardingSchema.safeParse({ fullName: 'A', locationId: uuid, intent: 'customer' }).success,
    ).toBe(false)
    expect(
      OnboardingSchema.safeParse({
        fullName: 'x'.repeat(101),
        locationId: uuid,
        intent: 'customer',
      }).success,
    ).toBe(false)
  })

  it('lowercases handles and treats an empty handle as none', () => {
    expect(
      ProfileUpdateSchema.parse({ fullName: 'Ada', handle: 'Ada_Fix', locationId: uuid }).handle,
    ).toBe('ada_fix')
    expect(
      ProfileUpdateSchema.parse({ fullName: 'Ada', handle: '  ', locationId: uuid }).handle,
    ).toBeUndefined()
    expect(
      ProfileUpdateSchema.safeParse({ fullName: 'Ada', handle: 'ab', locationId: uuid }).success,
    ).toBe(false)
    expect(
      ProfileUpdateSchema.safeParse({ fullName: 'Ada', handle: 'ada fix', locationId: uuid })
        .success,
    ).toBe(false)
  })

  it('only accepts avatar paths in the expected shape', () => {
    expect(AvatarPathSchema.safeParse(`${uuid}/avatar-1790000000000.webp`).success).toBe(true)
    expect(AvatarPathSchema.safeParse(`${uuid}/../other/avatar-1.webp`).success).toBe(false)
    expect(AvatarPathSchema.safeParse(`${uuid}/avatar-1.svg`).success).toBe(false)
  })
})

describe('provider schemas', () => {
  it('requires a headline of 5 to 120 characters', () => {
    const phone = '0803 123 4567'
    expect(
      ProviderApplicationSchema.safeParse({ headline: 'AC', baseLocationId: uuid, phone }).success,
    ).toBe(false)
    const parsed = ProviderApplicationSchema.parse({
      headline: 'AC repair',
      bio: '',
      baseLocationId: uuid,
      phone,
    })
    expect(parsed.bio).toBeUndefined()
    expect(parsed.phone).toBe('2348031234567')
  })

  it('requires a valid contact phone', () => {
    const base = { headline: 'AC repair', baseLocationId: uuid }
    expect(ProviderApplicationSchema.safeParse(base).success).toBe(false)
    expect(ProviderApplicationSchema.safeParse({ ...base, phone: '12345' }).success).toBe(false)
  })

  it('needs a reason to reject or suspend', () => {
    const base = { providerId: uuid, verificationLevel: '1', passedChecks: [] }
    expect(ReviewProviderSchema.safeParse({ ...base, decision: 'approved' }).success).toBe(true)
    expect(ReviewProviderSchema.safeParse({ ...base, decision: 'rejected' }).success).toBe(false)
    expect(
      ReviewProviderSchema.safeParse({ ...base, decision: 'rejected', reason: 'Blurry photo' })
        .success,
    ).toBe(true)
  })
})

describe('safeNextPath', () => {
  it.each(['/dashboard', '/provider/apply', '/requests?tab=open'])('allows %s', (path) => {
    expect(safeNextPath(path)).toBe(path)
  })

  it.each([
    'https://evil.example',
    '//evil.example',
    'javascript:alert(1)',
    '/\\evil',
    undefined,
    42,
  ])('falls back for %s', (path) => {
    expect(safeNextPath(path)).toBe('/dashboard')
  })
})
