'use server'

import type { Route } from 'next'
import { redirect } from 'next/navigation'

import { safeNextPath } from '@/lib/auth/session'
import { type ActionError, toActionError } from '@/lib/errors'
import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'

import { maskEmail } from '../phone'
import { RequestOtpSchema, VerifyOtpSchema } from '../schemas'

// Email-only sign-in with a 6-digit code (ADR-015).

export type SignInState = {
  step: 'request' | 'verify'
  email?: string
  masked?: string
  next: string
  error?: ActionError
}

function authError(message: string): ActionError {
  return { code: 'VALIDATION', message }
}

export async function requestOtpAction(
  prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const parsed = RequestOtpSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { ...prev, step: 'request', error: toActionError(parsed.error).error }
  }

  const supabase = await createClient()
  const { email } = parsed.data
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  })

  if (error) {
    logger.warn('auth.request_otp_failed', { status: error.status, code: error.code })
    const message =
      error.status === 429 || error.code === 'over_email_send_rate_limit'
        ? 'Too many codes requested. Please wait a minute and try again.'
        : 'We could not send the email right now. Please try again in a moment.'
    return { ...prev, step: 'request', error: authError(message) }
  }

  return { ...prev, step: 'verify', email, masked: maskEmail(email), error: undefined }
}

export async function verifyOtpAction(prev: SignInState, formData: FormData): Promise<SignInState> {
  const parsed = VerifyOtpSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { ...prev, error: toActionError(parsed.error).error }

  const supabase = await createClient()
  const { email, code } = parsed.data
  const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' })

  if (error || !data.user) {
    logger.info('auth.verify_otp_failed', { code: error?.code })
    return {
      ...prev,
      error: authError('That code is wrong or has expired. Check it, or ask for a new one.'),
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarded_at')
    .eq('id', data.user.id)
    .maybeSingle()

  redirect((profile?.onboarded_at ? safeNextPath(prev.next) : '/onboarding') as Route)
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
