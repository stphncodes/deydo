import 'server-only'

import { createClient } from '@supabase/supabase-js'

import { publicEnv } from '@/config/env'
import type { Database } from '@/types/database'

/**
 * Anonymous client with no session and no cookies. RLS treats it as `anon`.
 * For public, cacheable reads (landing page, health check, public profiles)
 * that must not make a page dynamic.
 */
export function createPublicClient() {
  return createClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
  )
}
