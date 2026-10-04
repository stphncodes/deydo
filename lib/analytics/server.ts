import 'server-only'

import { after } from 'next/server'
import { PostHog } from 'posthog-node'

import { publicEnv } from '@/config/env'
import { logger } from '@/lib/logger'

import { type FunnelEvent, type FunnelEventProps, parseFunnelEvent } from './events'

let client: PostHog | null | undefined

function getClient(): PostHog | null {
  if (client !== undefined) return client
  client = publicEnv.NEXT_PUBLIC_POSTHOG_KEY
    ? new PostHog(publicEnv.NEXT_PUBLIC_POSTHOG_KEY, {
        host: publicEnv.NEXT_PUBLIC_POSTHOG_HOST,
        flushAt: 1,
        flushInterval: 0,
      })
    : null
  return client
}

/**
 * Records a funnel event after the response is sent, so analytics can never
 * slow down or break the user's request. `userId` is the profile UUID.
 */
export function trackFunnelEvent<E extends FunnelEvent>(
  userId: string,
  event: E,
  props: FunnelEventProps<E>,
): void {
  const properties = parseFunnelEvent(event, props)
  after(async () => {
    const posthog = getClient()
    if (!posthog) return
    try {
      posthog.capture({
        distinctId: userId,
        event,
        properties: {
          ...properties,
          app_env: publicEnv.NEXT_PUBLIC_APP_ENV,
          $process_person_profile: false,
        },
      })
      await posthog.flush()
    } catch (err) {
      logger.warn('analytics.capture_failed', { event, err })
    }
  })
}
