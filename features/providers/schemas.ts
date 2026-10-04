import { z } from 'zod'

// Mirrors the CHECK constraints on public.provider_profiles.

export const ProviderApplicationSchema = z.object({
  headline: z
    .string()
    .trim()
    .min(5, 'Tell customers what you do in a few words')
    .max(120, 'Keep it under 120 characters'),
  bio: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().trim().max(2000, 'Keep it under 2,000 characters').optional(),
  ),
  baseLocationId: z.uuid('Choose the area you work from'),
})

export const REVIEW_DECISIONS = ['approved', 'rejected', 'suspended'] as const
export const CHECK_TYPES = ['phone', 'id_document', 'in_person', 'reference'] as const

export const ReviewProviderSchema = z
  .object({
    providerId: z.uuid(),
    decision: z.enum(REVIEW_DECISIONS),
    verificationLevel: z.coerce.number().int().min(0).max(3),
    reason: z.preprocess(
      (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
      z.string().trim().max(500).optional(),
    ),
    passedChecks: z.array(z.enum(CHECK_TYPES)).default([]),
    notes: z.preprocess(
      (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
      z.string().trim().max(1000).optional(),
    ),
  })
  .refine((v) => v.decision === 'approved' || Boolean(v.reason), {
    path: ['reason'],
    message: 'Give a reason the provider will see',
  })
