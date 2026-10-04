'use client'

import { useActionState } from 'react'

import { Field, Input } from '@/components/ui/field'
import { fieldErrors, FormMessage } from '@/components/ui/form-message'
import { Select } from '@/components/ui/select'
import { SubmitButton } from '@/components/ui/submit-button'
import { Textarea } from '@/components/ui/textarea'
import type { AreaOption } from '@/features/locations/server/areas'
import type { FormState } from '@/lib/errors'

import { submitProviderApplicationAction } from '../server/actions'

type Props = {
  areas: AreaOption[]
  initial?: { headline: string; bio: string; baseLocationId: string }
  submitLabel: string
}

export function ProviderApplicationForm({ areas, initial, submitLabel }: Props) {
  const [state, action] = useActionState(submitProviderApplicationAction, {} as FormState)

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage state={state} />
      <Field
        label="What do you do?"
        hint='One line customers will see first. For example: "AC and fridge repair, 8 years experience".'
        errors={fieldErrors(state, 'headline')}
      >
        {(props) => (
          <Input
            {...props}
            name="headline"
            maxLength={120}
            defaultValue={initial?.headline}
            required
          />
        )}
      </Field>
      <Field
        label="About your work (optional)"
        hint="What you are good at, how long you have done it, and anything that helps customers trust you."
        errors={fieldErrors(state, 'bio')}
      >
        {(props) => <Textarea {...props} name="bio" maxLength={2000} defaultValue={initial?.bio} />}
      </Field>
      <Field label="The area you work from" errors={fieldErrors(state, 'baseLocationId')}>
        {(props) => (
          <Select
            {...props}
            name="baseLocationId"
            defaultValue={initial?.baseLocationId ?? ''}
            required
          >
            <option value="" disabled>
              Choose an area
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
      <SubmitButton pendingLabel="Sending...">{submitLabel}</SubmitButton>
    </form>
  )
}
