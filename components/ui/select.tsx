import type { SelectHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

import { inputClasses } from './field'

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(inputClasses, 'appearance-auto', className)} {...props}>
      {children}
    </select>
  )
}
