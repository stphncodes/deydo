'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { runFormAction } from '@/lib/actions/run'
import { requireUser } from '@/lib/auth/session'
import { ConflictError, type FormState, mapDbError, ValidationError } from '@/lib/errors'
import { createClient } from '@/lib/supabase/server'

import { AvatarPathSchema, OnboardingSchema, ProfileUpdateSchema } from '../schemas'

export async function completeOnboardingAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return runFormAction('complete_onboarding', async () => {
    const { user } = await requireUser({ allowUnonboarded: true })
    const input = OnboardingSchema.parse(Object.fromEntries(formData))
    const supabase = await createClient()

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: input.fullName,
        default_location_id: input.locationId,
        onboarded_at: new Date().toISOString(),
      })
      .eq('id', user.id)
    if (error) throw mapDbError(error)

    redirect(input.intent === 'provider' ? '/provider/apply' : '/dashboard')
  })
}

export async function updateProfileAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return runFormAction('update_profile', async () => {
    const { user } = await requireUser()
    const input = ProfileUpdateSchema.parse(Object.fromEntries(formData))
    const supabase = await createClient()

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: input.fullName,
        handle: input.handle ?? null,
        default_location_id: input.locationId,
      })
      .eq('id', user.id)
    if (error?.code === '23505') {
      throw new ValidationError('Please check the highlighted fields.', {
        handle: ['That handle is taken. Try another one.'],
      })
    }
    if (error) throw mapDbError(error)

    revalidatePath('/settings')
    return { ok: true, message: 'Your profile is saved.' }
  })
}

/** Signed upload URL for a new avatar in the user's own folder. */
export async function createAvatarUploadAction(
  extension: 'webp' | 'jpg',
): Promise<{ ok: true; path: string; signedUrl: string } | { ok: false }> {
  const { user } = await requireUser()
  const path = `${user.id}/avatar-${Date.now()}.${extension}`
  const supabase = await createClient()
  const { data, error } = await supabase.storage.from('avatars').createSignedUploadUrl(path)
  if (error || !data) return { ok: false }
  return { ok: true, path, signedUrl: data.signedUrl }
}

export async function saveAvatarAction(path: string): Promise<FormState> {
  return runFormAction('save_avatar', async () => {
    const { user, profile } = await requireUser()
    const avatarPath = AvatarPathSchema.parse(path)
    if (!avatarPath.startsWith(`${user.id}/`)) throw new ConflictError()

    const supabase = await createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_path: avatarPath })
      .eq('id', user.id)
    if (error) throw mapDbError(error)

    if (profile.avatar_path && profile.avatar_path !== avatarPath) {
      // Best effort: an orphaned old file is harmless.
      await supabase.storage.from('avatars').remove([profile.avatar_path])
    }
    revalidatePath('/settings')
    return { ok: true, message: 'Your photo is updated.' }
  })
}
