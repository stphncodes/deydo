import 'server-only'

import { mapDbError } from '@/lib/errors'
import { createClient } from '@/lib/supabase/server'
import type { Tables } from '@/types/database'

export type ProviderProfile = Tables<'provider_profiles'>

export async function getOwnProviderProfile(userId: string): Promise<ProviderProfile | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('provider_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw mapDbError(error)
  return data
}

/** A unique handle like "musa_ade" or "musa_ade_42" for the shareable profile link. */
export async function ensureHandle(
  userId: string,
  fullName: string,
  current: string | null,
): Promise<void> {
  if (current) return
  const supabase = await createClient()
  const base =
    fullName
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 24) || 'provider'
  const padded = base.length >= 3 ? base : `${base}_pro`

  for (let attempt = 0; attempt < 6; attempt++) {
    const handle = attempt === 0 ? padded : `${padded}_${Math.floor(100 + Math.random() * 900)}`
    const { error } = await supabase.from('profiles').update({ handle }).eq('id', userId)
    if (!error) return
    if (error.code !== '23505') throw mapDbError(error)
  }
  // Leave it empty; the provider can pick one in settings.
}
