import { z } from 'zod'

import { normalizeNigerianPhone } from './phone'

export const PhoneSchema = z
  .string()
  .trim()
  .transform((value, ctx) => {
    const phone = normalizeNigerianPhone(value)
    if (!phone) {
      ctx.addIssue({
        code: 'custom',
        message: 'Enter a Nigerian mobile number, like 0803 123 4567',
      })
      return z.NEVER
    }
    return phone
  })

export const EmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Enter a valid email address'))

export const RequestOtpSchema = z.object({ email: EmailSchema })

export const VerifyOtpSchema = z.object({
  email: EmailSchema,
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Enter the 6-digit code'),
})
