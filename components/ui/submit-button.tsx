'use client'

import type { ButtonHTMLAttributes } from 'react'
import { useFormStatus } from 'react-dom'

import { buttonClasses } from './button'

/** Submit button that shows progress, important on slow connections. */
export function SubmitButton({
  children,
  pendingLabel = 'Please wait...',
  variant,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  pendingLabel?: string
  variant?: Parameters<typeof buttonClasses>[0]['variant']
}) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending || props.disabled}
      aria-busy={pending}
      className={buttonClasses({ variant, fullWidth: true, className })}
      {...props}
    >
      {pending ? pendingLabel : children}
    </button>
  )
}
