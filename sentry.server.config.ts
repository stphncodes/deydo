import * as Sentry from '@sentry/nextjs'

import { publicEnv } from '@/config/env'
import { sentryDataCollection } from '@/lib/observability/sentry-options'
import { scrubSentryEvent } from '@/lib/observability/sentry-scrub'

Sentry.init({
  dsn: publicEnv.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(publicEnv.NEXT_PUBLIC_SENTRY_DSN),
  environment: publicEnv.NEXT_PUBLIC_APP_ENV,
  dataCollection: sentryDataCollection,
  tracesSampleRate: publicEnv.NEXT_PUBLIC_APP_ENV === 'production' ? 0.1 : 0,
  beforeSend: scrubSentryEvent,
})
