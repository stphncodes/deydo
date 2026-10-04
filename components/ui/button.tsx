import Link, { type LinkProps } from 'next/link'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors select-none disabled:pointer-events-none disabled:opacity-50'

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-strong active:bg-brand-strong',
  secondary: 'border border-line bg-surface text-ink hover:bg-canvas active:bg-canvas',
  ghost: 'text-ink hover:bg-ink/5 active:bg-ink/10',
  danger: 'bg-danger text-white hover:opacity-90 active:opacity-90',
}

// Every size keeps the tap target at 48px or more.
const sizes: Record<Size, string> = {
  md: 'min-h-12 px-4 text-base',
  lg: 'min-h-14 px-6 text-lg',
}

type StyleProps = { variant?: Variant; size?: Size; fullWidth?: boolean; className?: string }

export function buttonClasses({
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
}: StyleProps) {
  return cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)
}

export function Button({
  variant,
  size,
  fullWidth,
  className,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & StyleProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...props}
    />
  )
}

export function ButtonLink<Href extends string>({
  variant,
  size,
  fullWidth,
  className,
  children,
  ...props
}: LinkProps<Href> & StyleProps & { children: ReactNode }) {
  return (
    <Link className={buttonClasses({ variant, size, fullWidth, className })} {...props}>
      {children}
    </Link>
  )
}
