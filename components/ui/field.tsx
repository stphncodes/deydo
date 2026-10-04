import type { InputHTMLAttributes, ReactNode } from 'react'
import { useId } from 'react'

import { cn } from '@/lib/utils'

export const inputClasses =
  'block min-h-12 w-full rounded-xl border border-line bg-surface px-4 text-base text-ink placeholder:text-ink-subtle aria-invalid:border-danger'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputClasses, className)} {...props} />
}

type FieldProps = {
  label: string
  hint?: string
  errors?: string[]
  children: (props: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: true }) => ReactNode
}

/** Label, hint and error text wired to one control for screen readers. */
export function Field({ label, hint, errors, children }: FieldProps) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = errors?.length ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block font-medium text-ink">
        {label}
      </label>
      {hint ? (
        <p id={hintId} className="text-sm text-ink-muted">
          {hint}
        </p>
      ) : null}
      {children({
        id,
        'aria-describedby': describedBy,
        'aria-invalid': errorId ? true : undefined,
      })}
      {errorId ? (
        <p id={errorId} className="text-sm text-danger" role="alert">
          {errors?.[0]}
        </p>
      ) : null}
    </div>
  )
}
