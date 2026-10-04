'use server'

import { revalidatePath } from 'next/cache'

import { runFormAction } from '@/lib/actions/run'
import { requireUser } from '@/lib/auth/session'
import { ConflictError, type FormState, mapDbError } from '@/lib/errors'
import { createClient } from '@/lib/supabase/server'

import { ProviderApplicationSchema } from '../schemas'
import { ensureHandle, getOwnProviderProfile } from './providers'

export async function submitProviderApplicationAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return runFormAction('submit_provider_application', async () => {
    const { user, profile } = await requireUser()
    const input = ProviderApplicationSchema.parse(Object.fromEntries(formData))
    const supabase = await createClient()
    const existing = await getOwnProviderProfile(user.id)

    const fields = {
      headline: input.headline,
      bio: input.bio ?? null,
      base_location_id: input.baseLocationId,
    }

    if (!existing) {
      const { error } = await supabase.from('provider_profiles').insert({ id: user.id, ...fields })
      if (error) throw mapDbError(error)
    } else if (existing.status === 'rejected') {
      const { error } = await supabase
        .from('provider_profiles')
        .update({ ...fields, status: 'pending', status_reason: null })
        .eq('id', user.id)
      if (error) throw mapDbError(error)
    } else if (existing.status === 'pending' || existing.status === 'approved') {
      const { error } = await supabase.from('provider_profiles').update(fields).eq('id', user.id)
      if (error) throw mapDbError(error)
    } else {
      throw new ConflictError('Your provider account is suspended. Please contact support.')
    }

    const { error: contactError } = await supabase
      .from('profile_contacts')
      .upsert({ profile_id: user.id, phone: input.phone })
    if (contactError) throw mapDbError(contactError)

    await ensureHandle(user.id, profile.full_name ?? '', profile.handle)
    revalidatePath('/provider/apply')
    revalidatePath('/dashboard')
    return {
      ok: true,
      message:
        existing?.status === 'approved'
          ? 'Your details are saved.'
          : 'Thanks. Our team will review your application.',
    }
  })
}
