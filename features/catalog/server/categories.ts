import 'server-only'

import { logger } from '@/lib/logger'
import { createPublicClient } from '@/lib/supabase/public'

export type CategorySummary = { slug: string; name: string; description: string | null }

/** Active leaf categories, in display order. Empty on failure so public pages still render. */
export async function listActiveLeafCategories(): Promise<CategorySummary[]> {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('categories')
    .select('id, slug, name, description, parent_id')
    .eq('is_active', true)
    .order('sort_order')

  if (error) {
    logger.error('catalog.list_categories_failed', { code: error.code, err: error.message })
    return []
  }

  const parentIds = new Set(data.map((c) => c.parent_id))
  return data
    .filter((c) => !parentIds.has(c.id))
    .map(({ slug, name, description }) => ({ slug, name, description }))
}
