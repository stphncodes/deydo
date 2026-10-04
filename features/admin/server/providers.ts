import 'server-only'

import { mapDbError } from '@/lib/errors'
import { createClient } from '@/lib/supabase/server'

export type ProviderQueueItem = {
  id: string
  fullName: string | null
  headline: string
  area: string | null
  status: string
  hasPhone: boolean
  createdAt: string
}

const SELECT = `id, headline, status, created_at, verification_level, bio, status_reason,
  profile:profiles!provider_profiles_id_fkey(full_name, handle, contact:profile_contacts(phone)),
  area:locations!provider_profiles_base_location_id_fkey(name)`

/** Providers by status, oldest first. Runs as the admin (staff RLS policies). */
export async function listProvidersByStatus(status: string): Promise<ProviderQueueItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('provider_profiles')
    .select(SELECT)
    .eq('status', status)
    .order('created_at', { ascending: true })
    .limit(100)
  if (error) throw mapDbError(error)

  return data.map((row) => ({
    id: row.id,
    fullName: row.profile?.full_name ?? null,
    headline: row.headline,
    area: row.area?.name ?? null,
    status: row.status,
    hasPhone: Boolean(row.profile?.contact?.phone),
    createdAt: row.created_at,
  }))
}

export async function getProviderForReview(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('provider_profiles')
    .select(SELECT)
    .eq('id', id)
    .maybeSingle()
  if (error) throw mapDbError(error)
  if (!data) return null

  const { data: records } = await supabase
    .from('verification_records')
    .select('id, check_type, result, notes, created_at')
    .eq('provider_id', id)
    .order('created_at', { ascending: false })

  return { provider: data, records: records ?? [] }
}
