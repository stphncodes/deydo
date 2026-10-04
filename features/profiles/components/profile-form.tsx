'use client'

import { useActionState } from 'react'

import { Field, Input } from '@/components/ui/field'
import { fieldErrors, FormMessage } from '@/components/ui/form-message'
import { Select } from '@/components/ui/select'
import { SubmitButton } from '@/components/ui/submit-button'
import type { AreaOption } from '@/features/locations/server/areas'
import type { FormState } from '@/lib/errors'

import { updateProfileAction } from '../server/actions'

type Props = {
  areas: AreaOption[]
  profile: { fullName: string; handle: string; locationId: string }
}

export function ProfileForm({ areas, profile }: Props) {
  const [state, action] = useActionState(updateProfileAction, {} as FormState)

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage state={state} />
      <Field label="Your name" errors={fieldErrors(state, 'fullName')}>
        {(props) => (
          <Input
            {...props}
            name="fullName"
            autoComplete="name"
            defaultValue={profile.fullName}
            required
          />
        )}
      </Field>
      <Field
        label="Profile link name"
        hint="Used in your shareable link. Letters, numbers and underscores."
        errors={fieldErrors(state, 'handle')}
      >
        {(props) => (
          <Input
            {...props}
            name="handle"
            autoCapitalize="none"
            autoCorrect="off"
            defaultValue={profile.handle}
          />
        )}
      </Field>
      <Field label="Your area" errors={fieldErrors(state, 'locationId')}>
        {(props) => (
          <Select {...props} name="locationId" defaultValue={profile.locationId} required>
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
      <SubmitButton pendingLabel="Saving...">Save changes</SubmitButton>
    </form>
  )
}
