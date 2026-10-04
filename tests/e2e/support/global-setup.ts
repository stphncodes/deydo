import { readFileSync } from 'node:fs'

import { createClient } from '@supabase/supabase-js'

// Accounts created by the E2E journeys: e2e-<role>@deydo.test
const E2E_EMAIL = /^e2e-[a-z0-9-]+@deydo\.test$/

function readLocalEnv(): Record<string, string> {
  try {
    return Object.fromEntries(
      readFileSync('.env.local', 'utf8')
        .split('\n')
        .map((line) => line.match(/^([A-Z0-9_]+)=(.*)$/))
        .filter((match): match is RegExpMatchArray => Boolean(match))
        .map((match) => [match[1], match[2]]),
    )
  } catch {
    return {}
  }
}

/**
 * Removes the E2E accounts so sign-up journeys start fresh. Local stack only:
 * it never touches a hosted project (ADR-014).
 */
export default async function globalSetup() {
  if (process.env.PLAYWRIGHT_BASE_URL) return

  const env = { ...readLocalEnv(), ...process.env }
  const url = env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = env.SUPABASE_SECRET_KEY ?? ''
  // Hosted project (no Docker): @writes journeys are skipped, nothing to reset.
  if (!/^http:\/\/(127\.0\.0\.1|localhost):54321$/.test(url) || !key) return

  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (error) throw error

  for (const user of data.users) {
    if (!user.email || !E2E_EMAIL.test(user.email)) continue

    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)
    if (!deleteError) continue

    // Approved providers have append-only verification history, so they
    // cannot be deleted. Retire them instead: move them to another address so
    // the E2E address is free for a fresh sign-up.
    const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
      email: `retired-${crypto.randomUUID()}@deydo.test`,
    })
    if (updateError) throw updateError
  }
}
