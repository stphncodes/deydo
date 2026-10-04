import { NextResponse } from 'next/server'

import { logger } from '@/lib/logger'
import { createPublicClient } from '@/lib/supabase/public'

export const dynamic = 'force-dynamic'

/** Liveness and database reachability, for uptime checks and the smoke test. */
export async function GET() {
  const started = Date.now()
  const { error } = await createPublicClient().from('categories').select('id').limit(1)
  const ok = !error

  if (error) logger.error('health.db_unreachable', { code: error.code, err: error.message })

  return NextResponse.json(
    {
      status: ok ? 'ok' : 'degraded',
      db: ok ? 'ok' : 'unreachable',
      latencyMs: Date.now() - started,
      release: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local',
    },
    { status: ok ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
  )
}
