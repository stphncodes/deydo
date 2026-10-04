import 'server-only'

import { createClient } from '@supabase/supabase-js'

import { publicEnv } from '@/config/env'
import { serverEnv } from '@/config/env.server'
import type { Database } from '@/types/database'

/**
 * Client with the Supabase SECRET key. It bypasses RLS.
 *
 * Allowed only in: webhook and cron Route Handlers, the Supabase Auth hooks,
 * and clearly isolated admin operations that cannot run as the user.
 * Never use it on an ordinary user request path. Every mutation made with
 * it on behalf of a person must call public.log_audit.
 */
export function createAdminClient() {
  return createClient<Database>(publicEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}
