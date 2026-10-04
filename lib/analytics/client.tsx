'use client'

import type { PostHog } from 'posthog-js'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

import { clientEnv } from '@/config/env.client'

type PostHogClient = PostHog

let posthogPromise: Promise<PostHogClient | null> | undefined

// posthog-js is loaded only after the page is idle, so it never counts
// toward the initial JS budget on slow connections.
function loadPostHog(): Promise<PostHogClient | null> {
  const key = clientEnv.NEXT_PUBLIC_POSTHOG_KEY
  if (!key) return Promise.resolve(null)
  posthogPromise ??= import('posthog-js').then(({ default: posthog }) => {
    posthog.init(key, {
      api_host: clientEnv.NEXT_PUBLIC_POSTHOG_HOST,
      // No autocapture or recordings: they would pick up names, phone
      // numbers and message text from the page.
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      disable_session_recording: true,
      disable_surveys: true,
      person_profiles: 'identified_only',
      property_denylist: ['$ip'],
      mask_all_text: true,
      mask_all_element_attributes: true,
    })
    return posthog
  })
  return posthogPromise
}

function whenIdle(callback: () => void) {
  if ('requestIdleCallback' in window) {
    const handle = window.requestIdleCallback(callback, { timeout: 5000 })
    return () => window.cancelIdleCallback(handle)
  }
  const handle = setTimeout(callback, 2000)
  return () => clearTimeout(handle)
}

/** Sends anonymous page views (path only, never query strings). */
export function AnalyticsPageViews() {
  const pathname = usePathname()

  useEffect(() => {
    return whenIdle(() => {
      void loadPostHog().then((posthog) => {
        posthog?.capture('$pageview', { $current_url: window.location.origin + pathname })
      })
    })
  }, [pathname])

  return null
}
