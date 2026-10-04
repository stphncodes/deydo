import type { ErrorEvent } from '@sentry/nextjs'

import { redactText, redactValue, stripQuery } from './redact'

/**
 * Sentry `beforeSend` hook shared by client, server and edge. Keeps the
 * stack trace and a pseudonymous user id; removes everything personal.
 */
export function scrubSentryEvent(event: ErrorEvent): ErrorEvent {
  if (event.user) {
    event.user = event.user.id ? { id: String(event.user.id) } : undefined
  }

  if (event.request) {
    const { url, method } = event.request
    event.request = { method, url: url ? stripQuery(url) : undefined }
  }

  if (event.message) event.message = redactText(event.message)

  for (const exception of event.exception?.values ?? []) {
    if (exception.value) exception.value = redactText(exception.value)
  }

  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((crumb) => {
      const data = crumb.data ? (redactValue(crumb.data) as Record<string, unknown>) : undefined
      if (data && typeof data.url === 'string') data.url = stripQuery(data.url)
      return {
        ...crumb,
        message: crumb.message ? redactText(crumb.message) : crumb.message,
        data,
      }
    })
  }

  if (event.extra) event.extra = redactValue(event.extra) as Record<string, unknown>
  if (event.contexts) event.contexts = redactValue(event.contexts) as typeof event.contexts
  if (event.tags) event.tags = redactValue(event.tags) as typeof event.tags

  return event
}
