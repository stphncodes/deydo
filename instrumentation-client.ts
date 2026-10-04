import { clientEnv } from '@/config/env.client'

// Sentry's browser SDK is about 30 KB compressed. To keep it out of the
// initial JS budget on slow connections, it loads once the page is idle.
// Errors thrown before then are buffered and sent when it arrives.
// Client side is errors only: no tracing, no replay.

const dsn = clientEnv.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  const early: unknown[] = []
  const onError = (event: ErrorEvent) => early.push(event.error ?? event.message)
  const onRejection = (event: PromiseRejectionEvent) => early.push(event.reason)
  window.addEventListener('error', onError)
  window.addEventListener('unhandledrejection', onRejection)

  const load = async () => {
    const [Sentry, { sentryDataCollection }, { scrubSentryEvent }] = await Promise.all([
      import('@sentry/nextjs'),
      import('@/lib/observability/sentry-options'),
      import('@/lib/observability/sentry-scrub'),
    ])
    Sentry.init({
      dsn,
      environment: clientEnv.NEXT_PUBLIC_APP_ENV,
      dataCollection: sentryDataCollection,
      tracesSampleRate: 0,
      beforeSend: scrubSentryEvent,
    })
    window.removeEventListener('error', onError)
    window.removeEventListener('unhandledrejection', onRejection)
    for (const error of early) Sentry.captureException(error)
  }

  const start = () => void load().catch(() => undefined)
  if ('requestIdleCallback' in window) window.requestIdleCallback(start, { timeout: 4000 })
  else setTimeout(start, 2000)
}
