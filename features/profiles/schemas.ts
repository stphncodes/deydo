import { z } from 'zod'

// Mirrors the CHECK constraints on public.profiles. Keep them in step.

const emptyToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value

export const FullNameSchema = z
  .string()
  .trim()
  .min(2, 'Enter your name')
  .max(100, 'Keep your name under 100 characters')

export const HandleSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_]{3,30}$/, 'Use 3 to 30 letters, numbers or underscores')

export const OnboardingSchema = z.object({
  fullName: FullNameSchema,
  locationId: z.uuid('Choose your area'),
  intent: z.enum(['customer', 'provider']),
})

export const ProfileUpdateSchema = z.object({
  fullName: FullNameSchema,
  handle: z.preprocess(emptyToUndefined, HandleSchema.optional()),
  locationId: z.uuid('Choose your area'),
})

export const AvatarPathSchema = z
  .string()
  .regex(/^[0-9a-f-]{36}\/avatar-\d+\.(webp|jpg)$/, 'Invalid file')
