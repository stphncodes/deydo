import type { TextareaHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

import { inputClasses } from './field'

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputClasses, 'min-h-28 py-3', className)} {...props} />
}
