'use client'

import { useActionState } from 'react'

import { Field, Input } from '@/components/ui/field'
import { fieldErrors, FormMessage } from '@/components/ui/form-message'
import { Select } from '@/components/ui/select'
import { SubmitButton } from '@/components/ui/submit-button'
import type { AreaOption } from '@/features/locations/server/areas'
import type { FormState } from '@/lib/errors'

import { completeOnboardingAction } from '../server/actions'

export function OnboardingForm({
  areas,
  defaultName,
}: {
  areas: AreaOption[]
  defaultName: string
}) {
  const [state, action] = useActionState(completeOnboardingAction, {} as FormState)

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage state={state.error?.fieldErrors ? {} : state} />
      <Field
        label="Your name"
        hint="This is how customers and providers will see you."
        errors={fieldErrors(state, 'fullName')}
      >
        {(props) => (
          <Input
            {...props}
            name="fullName"
            autoComplete="name"
            defaultValue={defaultName}
            required
          />
        )}
      </Field>

      <Field label="Your area" errors={fieldErrors(state, 'locationId')}>
        {(props) => (
          <Select {...props} name="locationId" defaultValue="" required>
            <option value="" disabled>
              Choose your area
            </option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
                {area.city ? `, ${area.city}` : ''}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <fieldset className="space-y-3">
        <legend className="font-medium">What brings you to DeyDo?</legend>
        <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-line p-4 has-[:checked]:border-brand has-[:checked]:bg-brand-soft">
          <input
            type="radio"
            name="intent"
            value="customer"
            defaultChecked
            className="size-5 accent-brand"
          />
          <span>I need something done</span>
        </label>
        <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-line p-4 has-[:checked]:border-brand has-[:checked]:bg-brand-soft">
          <input type="radio" name="intent" value="provider" className="size-5 accent-brand" />
          <span>I offer a service and want jobs</span>
        </label>
      </fieldset>

      <SubmitButton pendingLabel="Saving...">Continue</SubmitButton>
    </form>
  )
}
