'use client'

import { useActionState, useState } from 'react'

import { Field, Input } from '@/components/ui/field'
import { SubmitButton } from '@/components/ui/submit-button'

import { requestOtpAction, type SignInState, verifyOtpAction } from '../server/actions'

export function SignInForm({ next }: { next: string }) {
  const [channel, setChannel] = useState<'phone' | 'email'>('phone')
  const [requestState, requestAction] = useActionState(requestOtpAction, {
    step: 'request',
    channel: 'phone',
    next,
  } satisfies SignInState)

  if (requestState.step === 'verify' && requestState.destination) {
    return <VerifyStep state={requestState} />
  }

  const fieldError = requestState.error?.fieldErrors?.[channel]

  return (
    <form action={requestAction} className="space-y-5" noValidate>
      <input type="hidden" name="channel" value={channel} />
      {requestState.error && !fieldError ? (
        <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
          {requestState.error.message}
        </p>
      ) : null}

      {channel === 'phone' ? (
        <Field
          label="Your phone number"
          hint="We will text you a 6-digit code."
          errors={fieldError}
        >
          {(props) => (
            <Input
              {...props}
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="0803 123 4567"
              required
              autoFocus
            />
          )}
        </Field>
      ) : (
        <Field
          label="Your email address"
          hint="We will email you a 6-digit code."
          errors={fieldError}
        >
          {(props) => (
            <Input
              {...props}
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              autoFocus
            />
          )}
        </Field>
      )}

      <SubmitButton pendingLabel="Sending code...">Send code</SubmitButton>

      <button
        type="button"
        onClick={() => setChannel(channel === 'phone' ? 'email' : 'phone')}
        className="min-h-12 w-full text-center font-medium text-brand"
      >
        {channel === 'phone' ? 'Use email instead' : 'Use your phone number instead'}
      </button>
    </form>
  )
}

function VerifyStep({ state: initial }: { state: SignInState }) {
  const [state, action] = useActionState(verifyOtpAction, initial)

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="channel" value={initial.channel} />
      <input type="hidden" name={initial.channel} value={initial.destination} />
      <p className="text-ink-muted">
        We sent a code to <span className="font-semibold text-ink">{initial.masked}</span>.
      </p>
      <Field
        label="Enter the 6-digit code"
        errors={state.error?.fieldErrors?.code ?? (state.error ? [state.error.message] : undefined)}
      >
        {(props) => (
          <Input
            {...props}
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="123456"
            className="text-center text-2xl tracking-[0.4em]"
            required
            autoFocus
          />
        )}
      </Field>
      <SubmitButton pendingLabel="Checking...">Continue</SubmitButton>
      <a
        href={`/sign-in?next=${encodeURIComponent(initial.next)}`}
        className="block min-h-12 text-center font-medium text-brand"
      >
        Did not get it? Start again
      </a>
    </form>
  )
}
