import 'server-only'

import { logger } from '@/lib/logger'
import { createPublicClient } from '@/lib/supabase/public'

export type AreaOption = { id: string; name: string; city: string }

/** Active areas customers and providers pick from, grouped by city name. */
export async function listActiveAreas(): Promise<AreaOption[]> {
  const { data, error } = await createPublicClient()
    .from('locations')
    .select('id, name, parent:locations!locations_parent_id_fkey(name)')
    .eq('type', 'area')
    .eq('is_active', true)
    .order('name')

  if (error) {
    logger.error('locations.list_areas_failed', { code: error.code, err: error.message })
    return []
  }
  return data.map((area) => {
    // A self-referencing join is typed as a list; it holds at most one parent.
    const parent = Array.isArray(area.parent) ? area.parent[0] : area.parent
    return { id: area.id, name: area.name, city: parent?.name ?? '' }
  })
}
