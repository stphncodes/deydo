import { NextResponse } from 'next/server'
import { z } from 'zod'

import { serverEnv } from '@/config/env.server'
import { logger } from '@/lib/logger'
import { verifyWebhook, WebhookVerificationError } from '@/lib/webhooks/standard-webhooks'
import { getSmsAdapter, SmsUnavailableError } from '@/services/sms'

export const dynamic = 'force-dynamic'

// Supabase Auth calls this to deliver phone OTPs (Send SMS hook, ADR-008).
// It must answer quickly: Supabase waits for it before replying to the user.

const HookPayloadSchema = z.object({
  user: z.object({ phone: z.string().regex(/^\d{10,15}$/) }),
  sms: z.object({ otp: z.string().regex(/^\d{4,10}$/) }),
})

function hookError(status: number, message: string) {
  return NextResponse.json({ error: { http_code: status, message } }, { status })
}

export async function POST(request: Request) {
  const secret = serverEnv.SEND_SMS_HOOK_SECRET
  if (!secret) {
    logger.error('auth.send_sms.not_configured')
    return hookError(500, 'SMS hook is not configured')
  }

  const payload = await request.text()
  try {
    verifyWebhook(secret, payload, request.headers)
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      logger.warn('auth.send_sms.bad_signature', { reason: err.message })
      return hookError(401, 'Invalid signature')
    }
    throw err
  }

  const parsed = HookPayloadSchema.safeParse(JSON.parse(payload))
  if (!parsed.success) {
    logger.warn('auth.send_sms.bad_payload')
    return hookError(400, 'Invalid payload')
  }

  const { user, sms } = parsed.data
  const adapter = getSmsAdapter()
  try {
    await adapter.send(
      user.phone,
      `Your DeyDo code is ${sms.otp}. It expires in 10 minutes. Never share it with anyone.`,
    )
  } catch (err) {
    const unavailable = err instanceof SmsUnavailableError
    logger.error('auth.send_sms.failed', { adapter: adapter.name, unavailable, err })
    return hookError(503, unavailable ? 'SMS is not available' : 'SMS delivery failed')
  }

  return NextResponse.json({})
}
