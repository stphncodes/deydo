import { readFileSync } from 'node:fs'

import { createClient } from '@supabase/supabase-js'

// Phones reserved for E2E sign-ups (fixed OTPs in supabase/config.toml).
export const E2E_PHONES = ['2348000000900', '2348000000901', '2348000000902', '2348000000903']

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
 * Deletes the E2E users so sign-up journeys start fresh. Local stack only:
 * it refuses to touch any hosted project (ADR-014).
 */
export default async function globalSetup() {
  if (process.env.PLAYWRIGHT_BASE_URL) return

  const env = { ...readLocalEnv(), ...process.env }
  const url = env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = env.SUPABASE_SECRET_KEY ?? ''
  if (!/^http:\/\/(127\.0\.0\.1|localhost):54321$/.test(url) || !key) {
    throw new Error('E2E global setup only runs against the local Supabase stack.')
  }

  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (error) throw error

  for (const user of data.users) {
    if (user.phone && E2E_PHONES.includes(user.phone)) {
      const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)
      if (deleteError) throw deleteError
    }
  }
}
