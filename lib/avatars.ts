import { clientEnv } from '@/config/env.client'

/** Public URL for an avatar stored in the avatars bucket. */
export function avatarUrl(path: string | null | undefined): string | null {
  if (!path) return null
  return `${clientEnv.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${path}`
}
