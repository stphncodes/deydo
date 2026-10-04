import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { DomainError, mapDbError, NotFoundError, toActionError } from '@/lib/errors'

describe('mapDbError', () => {
  it.each([
    ['42501', 'FORBIDDEN'],
    ['23505', 'CONFLICT'],
    ['23514', 'VALIDATION'],
    ['22P02', 'VALIDATION'],
    ['PGRST116', 'NOT_FOUND'],
    ['XX000', 'INTERNAL'],
    [undefined, 'INTERNAL'],
  ])('maps %s to %s', (code, expected) => {
    expect(mapDbError({ code, message: 'raw postgres message' }).code).toBe(expected)
  })

  it('never leaks the database message to users', () => {
    const error = mapDbError({
      code: '23514',
      message: 'new row violates check constraint "profiles_handle_check"',
    })
    expect(error.message).not.toMatch(/profiles|constraint/)
  })
})

describe('toActionError', () => {
  it('passes domain errors through and does not report them', () => {
    expect(toActionError(new NotFoundError())).toEqual({
      error: { code: 'NOT_FOUND', message: expect.any(String), fieldErrors: undefined },
      unexpected: false,
    })
  })

  it('reports internal domain errors', () => {
    expect(toActionError(new DomainError('INTERNAL', 'x')).unexpected).toBe(true)
  })

  it('turns Zod errors into field errors', () => {
    const result = z.object({ name: z.string().min(2) }).safeParse({ name: 'a' })
    if (result.success) throw new Error('expected failure')
    const { error, unexpected } = toActionError(result.error)
    expect(unexpected).toBe(false)
    expect(error.code).toBe('VALIDATION')
    expect(error.fieldErrors?.name?.length).toBe(1)
  })

  it('hides unknown errors behind a generic message and flags them', () => {
    const { error, unexpected } = toActionError(new Error('db password is hunter2'))
    expect(unexpected).toBe(true)
    expect(error.message).not.toContain('hunter2')
  })
})
