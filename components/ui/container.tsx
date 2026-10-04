import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

/** Centred column. Mobile first: full width with a 16px gutter, capped on large screens. */
export function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mx-auto w-full max-w-2xl px-4', className)} {...props} />
}
