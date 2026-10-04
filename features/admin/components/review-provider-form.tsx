'use client'

import { useActionState } from 'react'

import { Field } from '@/components/ui/field'
import { fieldErrors, FormMessage } from '@/components/ui/form-message'
import { Select } from '@/components/ui/select'
import { SubmitButton } from '@/components/ui/submit-button'
import { Textarea } from '@/components/ui/textarea'
import type { FormState } from '@/lib/errors'

import { reviewProviderAction } from '../server/actions'

const CHECKS = [
  { value: 'phone', label: 'Phone call: confirmed it is them' },
  { value: 'id_document', label: 'Government ID seen and matches' },
  { value: 'in_person', label: 'Met in person, saw tools or work' },
  { value: 'reference', label: 'Reference from a past customer' },
] as const

export function ReviewProviderForm({
  providerId,
  currentLevel,
}: {
  providerId: string
  currentLevel: number
}) {
  const [state, action] = useActionState(reviewProviderAction, {} as FormState)

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="providerId" value={providerId} />
      <FormMessage state={state} />

      <fieldset className="space-y-2">
        <legend className="font-medium">Checks you did now (passed)</legend>
        {CHECKS.map((check) => (
          <label key={check.value} className="flex min-h-12 items-center gap-3">
            <input
              type="checkbox"
              name="passedChecks"
              value={check.value}
              className="size-5 accent-brand"
            />
            <span>{check.label}</span>
          </label>
        ))}
      </fieldset>

      <Field label="Verification level" errors={fieldErrors(state, 'verificationLevel')}>
        {(props) => (
          <Select
            {...props}
            name="verificationLevel"
            defaultValue={String(Math.max(currentLevel, 1))}
          >
            <option value="0">0: none</option>
            <option value="1">1: phone confirmed</option>
            <option value="2">2: ID checked</option>
            <option value="3">3: met in person</option>
          </Select>
        )}
      </Field>

      <Field
        label="Internal notes (optional)"
        hint="Saved with the checks. Not shown to the provider."
      >
        {(props) => <Textarea {...props} name="notes" maxLength={1000} />}
      </Field>

      <Field
        label="Reason the provider will see"
        hint="Required to reject or suspend. Be specific and kind."
        errors={fieldErrors(state, 'reason')}
      >
        {(props) => <Textarea {...props} name="reason" maxLength={500} />}
      </Field>

      <div className="grid gap-3 sm:grid-cols-3">
        <SubmitButton name="decision" value="approved" pendingLabel="Saving...">
          Approve
        </SubmitButton>
        <SubmitButton name="decision" value="rejected" pendingLabel="Saving..." variant="secondary">
          Reject
        </SubmitButton>
        <SubmitButton name="decision" value="suspended" pendingLabel="Saving..." variant="danger">
          Suspend
        </SubmitButton>
      </div>
    </form>
  )
}
