'use client'

import { useActionState } from 'react'

import { Field, Input } from '@/components/ui/field'
import { SubmitButton } from '@/components/ui/submit-button'

import { requestOtpAction, type SignInState, verifyOtpAction } from '../server/actions'

export function SignInForm({ next }: { next: string }) {
  const [requestState, requestAction] = useActionState(requestOtpAction, {
    step: 'request',
    next,
  } satisfies SignInState)

  if (requestState.step === 'verify' && requestState.email) {
    return <VerifyStep state={requestState} />
  }

  const fieldError = requestState.error?.fieldErrors?.email

  return (
    <form action={requestAction} className="space-y-5" noValidate>
      {requestState.error && !fieldError ? (
        <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
          {requestState.error.message}
        </p>
      ) : null}

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
            autoCapitalize="none"
            placeholder="you@example.com"
            required
            autoFocus
          />
        )}
      </Field>

      <SubmitButton pendingLabel="Sending code...">Send code</SubmitButton>
    </form>
  )
}

function VerifyStep({ state: initial }: { state: SignInState }) {
  const [state, action] = useActionState(verifyOtpAction, initial)

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="email" value={initial.email} />
      <p className="text-ink-muted">
        We sent a code to <span className="font-semibold text-ink">{initial.masked}</span>. It can
        take a minute to arrive. Check your spam folder too.
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
