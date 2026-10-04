import { describe, expect, it } from 'vitest'

import { maskEmail, maskPhone, normalizeNigerianPhone } from '@/features/auth/phone'
import { PhoneSchema } from '@/features/auth/schemas'

describe('normalizeNigerianPhone', () => {
  it.each([
    ['08031234567', '2348031234567'],
    ['0803 123 4567', '2348031234567'],
    ['0803-123-4567', '2348031234567'],
    ['(0803) 123 4567', '2348031234567'],
    ['+2348031234567', '2348031234567'],
    ['+234 803 123 4567', '2348031234567'],
    ['2348031234567', '2348031234567'],
    ['002348031234567', '2348031234567'],
    ['8031234567', '2348031234567'],
    ['07061234567', '2347061234567'],
    ['09121234567', '2349121234567'],
    ['08101234567', '2348101234567'],
  ])('%s becomes %s', (input, expected) => {
    expect(normalizeNigerianPhone(input)).toBe(expected)
  })

  it.each([
    '0803123456', // too short
    '080312345678', // too long
    '06031234567', // not a mobile prefix
    '08231234567', // second digit must be 0 or 1
    '+447911123456', // UK number
    'chidi',
    '',
  ])('rejects %s', (input) => {
    expect(normalizeNigerianPhone(input)).toBeNull()
  })
})

describe('PhoneSchema', () => {
  it('normalises valid numbers', () => {
    expect(PhoneSchema.parse(' 0803 123 4567 ')).toBe('2348031234567')
  })

  it('explains what a valid number looks like', () => {
    const result = PhoneSchema.safeParse('12345')
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toMatch(/Nigerian mobile number/)
  })
})

describe('masking', () => {
  it('masks phones for display', () => {
    expect(maskPhone('2348031234567')).toBe('0803 *** 4567')
  })

  it('masks emails for display', () => {
    expect(maskEmail('chidi@example.com')).toBe('ch***@example.com')
  })
})
