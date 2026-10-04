import 'server-only'

import * as Sentry from '@sentry/nextjs'
import { unstable_rethrow } from 'next/navigation'

import { type FormState, toActionError } from '@/lib/errors'
import { logger } from '@/lib/logger'

/**
 * Runs a form action body and turns thrown errors into FormState. Unexpected
 * errors go to Sentry; users see a plain message. Redirects and notFound()
 * pass through.
 */
export async function runFormAction(
  name: string,
  body: () => Promise<FormState | void>,
): Promise<FormState> {
  try {
    return (await body()) ?? { ok: true }
  } catch (err) {
    unstable_rethrow(err)
    const { error, unexpected } = toActionError(err)
    if (unexpected) {
      logger.error(`action.${name}.failed`, { err })
      Sentry.captureException(err, { tags: { action: name } })
    }
    return { error }
  }
}
