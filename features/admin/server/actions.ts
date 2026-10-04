'use server'

import { revalidatePath } from 'next/cache'

import { ReviewProviderSchema } from '@/features/providers/schemas'
import { runFormAction } from '@/lib/actions/run'
import { requireAdmin } from '@/lib/auth/session'
import { type FormState, mapDbError, ValidationError } from '@/lib/errors'
import { createClient } from '@/lib/supabase/server'

export async function reviewProviderAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return runFormAction('review_provider', async () => {
    await requireAdmin()
    const input = ReviewProviderSchema.parse({
      ...Object.fromEntries(formData),
      passedChecks: formData.getAll('passedChecks'),
    })
    const supabase = await createClient()

    const { error } = await supabase.rpc('review_provider', {
      p_provider_id: input.providerId,
      p_decision: input.decision,
      p_verification_level: input.verificationLevel,
      p_reason: input.reason,
      p_checks: input.passedChecks.map((checkType) => ({
        check_type: checkType,
        result: 'passed',
        notes: input.notes ?? null,
      })),
    })

    if (error?.code === '23514' || error?.code === '22023') {
      // The function's own message explains which rule failed; it has no personal data.
      throw new ValidationError(error.message)
    }
    if (error) throw mapDbError(error)

    revalidatePath('/admin/providers')
    revalidatePath(`/admin/providers/${input.providerId}`)
    const verb = { approved: 'approved', rejected: 'rejected', suspended: 'suspended' }[
      input.decision
    ]
    return { ok: true, message: `Provider ${verb}.` }
  })
}
