import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { SignInForm } from '@/features/auth/components/sign-in-form'
import { getCurrentUser, safeNextPath } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'Sign in' }

export default async function SignInPage({ searchParams }: PageProps<'/sign-in'>) {
  const { next } = await searchParams
  const nextPath = safeNextPath(Array.isArray(next) ? next[0] : next)
  if (await getCurrentUser()) redirect('/dashboard')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sign in or create an account</h1>
        <p className="mt-1 text-ink-muted">It takes less than a minute. No password needed.</p>
      </div>
      <SignInForm next={nextPath} />
    </div>
  )
}
