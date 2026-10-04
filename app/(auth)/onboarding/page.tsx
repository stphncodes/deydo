import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { listActiveAreas } from '@/features/locations/server/areas'
import { OnboardingForm } from '@/features/profiles/components/onboarding-form'
import { requireUser } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'Welcome' }

export default async function OnboardingPage() {
  const { profile } = await requireUser({ allowUnonboarded: true })
  if (profile.onboarded_at) redirect('/dashboard')
  const areas = await listActiveAreas()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome to DeyDo</h1>
        <p className="mt-1 text-ink-muted">Two quick questions and you are in.</p>
      </div>
      <OnboardingForm areas={areas} defaultName={profile.full_name ?? ''} />
    </div>
  )
}
