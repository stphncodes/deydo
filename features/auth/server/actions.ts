'use server'

import type { Route } from 'next'
import { redirect } from 'next/navigation'

import { safeNextPath } from '@/lib/auth/session'
import { type ActionError, toActionError } from '@/lib/errors'
import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'

import { maskEmail, maskPhone } from '../phone'
import { RequestOtpSchema, VerifyOtpSchema } from '../schemas'

export type SignInState = {
  step: 'request' | 'verify'
  channel: 'phone' | 'email'
  destination?: string
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
  const channel = formData.get('channel') === 'email' ? 'email' : 'phone'
  if (!parsed.success) {
    return { ...prev, step: 'request', channel, error: toActionError(parsed.error).error }
  }

  const supabase = await createClient()
  const input = parsed.data
  const { error } =
    input.channel === 'phone'
      ? await supabase.auth.signInWithOtp({
          phone: input.phone,
          options: { shouldCreateUser: true },
        })
      : await supabase.auth.signInWithOtp({
          email: input.email,
          options: { shouldCreateUser: true },
        })

  if (error) {
    logger.warn('auth.request_otp_failed', {
      channel: input.channel,
      status: error.status,
      code: error.code,
    })
    const message =
      error.status === 429 ||
      error.code === 'over_sms_send_rate_limit' ||
      error.code === 'over_email_send_rate_limit'
        ? 'Too many codes requested. Please wait a minute and try again.'
        : input.channel === 'phone'
          ? 'We could not send a text right now. Please try again, or use your email instead.'
          : 'We could not send the email right now. Please try again in a moment.'
    return { ...prev, step: 'request', channel: input.channel, error: authError(message) }
  }

  const destination = input.channel === 'phone' ? input.phone : input.email
  return {
    ...prev,
    step: 'verify',
    channel: input.channel,
    destination,
    masked: input.channel === 'phone' ? maskPhone(destination) : maskEmail(destination),
    error: undefined,
  }
}

export async function verifyOtpAction(prev: SignInState, formData: FormData): Promise<SignInState> {
  const parsed = VerifyOtpSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { ...prev, error: toActionError(parsed.error).error }

  const supabase = await createClient()
  const input = parsed.data
  const { data, error } =
    input.channel === 'phone'
      ? await supabase.auth.verifyOtp({ phone: input.phone, token: input.code, type: 'sms' })
      : await supabase.auth.verifyOtp({ email: input.email, token: input.code, type: 'email' })

  if (error || !data.user) {
    logger.info('auth.verify_otp_failed', { channel: input.channel, code: error?.code })
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
