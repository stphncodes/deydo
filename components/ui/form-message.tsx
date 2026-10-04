import type { FormState } from '@/lib/errors'

/** Top-of-form success or error message, announced to screen readers. */
export function FormMessage({ state }: { state: FormState }) {
  if (state.error) {
    return (
      <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
        {state.error.message}
      </p>
    )
  }
  if (state.ok && state.message) {
    return (
      <p role="status" className="rounded-xl bg-brand-soft px-4 py-3 text-sm text-brand-strong">
        {state.message}
      </p>
    )
  }
  return null
}

export function fieldErrors(state: FormState, name: string): string[] | undefined {
  return state.error?.fieldErrors?.[name]
}
