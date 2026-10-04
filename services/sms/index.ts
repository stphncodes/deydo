import 'server-only'

import { serverEnv } from '@/config/env.server'
import { logger } from '@/lib/logger'
import { redactText } from '@/lib/observability/redact'

/**
 * SMS behind a small interface so the vendor can be chosen later (ADR-008)
 * and mocked in tests. No vendor is hardcoded.
 */
export type SmsAdapter = {
  readonly name: string
  send(to: string, message: string): Promise<void>
}

export class SmsUnavailableError extends Error {
  constructor() {
    super('SMS delivery is not configured')
    this.name = 'SmsUnavailableError'
  }
}

/** Local development: prints the message so you can read the code. */
export const consoleSmsAdapter: SmsAdapter = {
  name: 'console',
  async send(to, message) {
    if (process.env.NODE_ENV === 'production') {
      // Never print codes in a production build, even if misconfigured.
      logger.warn('sms.console_adapter_in_production', { to: redactText(to) })
      throw new SmsUnavailableError()
    }
    logger.info('sms.console', { to: redactText(to) })
    console.warn(`\n[sms] to ${to}: ${message}\n`)
  },
}

/** No vendor configured: fail clearly so the user is offered email instead. */
export const disabledSmsAdapter: SmsAdapter = {
  name: 'disabled',
  async send() {
    throw new SmsUnavailableError()
  },
}

export function getSmsAdapter(): SmsAdapter {
  return serverEnv.SMS_PROVIDER === 'console' ? consoleSmsAdapter : disabledSmsAdapter
}
