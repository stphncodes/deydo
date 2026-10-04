import 'server-only'

import type { Route } from 'next'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { cache } from 'react'

import { createClient } from '@/lib/supabase/server'

export { safeNextPath } from './next-path'
import type { Tables } from '@/types/database'

export type StaffRole = 'admin' | 'support'

export type CurrentUser = {
  id: string
  staffRole: StaffRole | null
}

export type Profile = Tables<'profiles'>

/**
 * The signed-in user from verified JWT claims (getClaims checks the token
 * signature), or null. Cached per request.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (error || !claims?.sub) return null
  const role = claims.staff_role
  return {
    id: claims.sub,
    staffRole: role === 'admin' || role === 'support' ? role : null,
  }
})

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const user = await getCurrentUser()
  if (!user) return null
  const supabase = await createClient()
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  return data
})

async function currentPath(): Promise<string> {
  return (await headers()).get('x-pathname') ?? '/dashboard'
}

/**
 * Guard for signed-in pages. Sends visitors to sign in, suspended accounts to
 * the suspended page, and people who have not finished onboarding to it.
 */
export async function requireUser(
  options: { allowUnonboarded?: boolean } = {},
): Promise<{ user: CurrentUser; profile: Profile }> {
  const user = await getCurrentUser()
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(await currentPath())}` as Route)

  const profile = await getCurrentProfile()
  if (!profile) redirect('/sign-in')
  if (profile.status !== 'active') redirect('/account-suspended')
  if (!options.allowUnonboarded && !profile.onboarded_at) redirect('/onboarding')

  return { user, profile }
}

/** Guard for the admin console. Non-admins get a plain 404. */
export async function requireAdmin(): Promise<{ user: CurrentUser; profile: Profile }> {
  const session = await requireUser()
  if (session.user.staffRole !== 'admin') notFound()
  return session
}
