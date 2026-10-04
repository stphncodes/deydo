'use client'

import { createBrowserClient } from '@supabase/ssr'

import { clientEnv } from '@/config/env.client'
import type { Database } from '@/types/database'

let client: ReturnType<typeof createBrowserClient<Database>> | undefined

/**
 * Browser client for Realtime subscriptions and signed uploads only.
 * General writes go through Server Actions so validation and rate limits run.
 */
export function getBrowserClient() {
  client ??= createBrowserClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  )
  return client
}
