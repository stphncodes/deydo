import type { Metadata } from 'next'

import { ButtonLink } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { getOwnProviderProfile } from '@/features/providers/server/providers'
import { requireUser } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'Home' }

const providerStatusCopy = {
  pending: {
    title: 'Your provider application is with our team',
    body: 'We will check your details and may call you. You will hear from us soon.',
  },
  approved: {
    title: 'You are an approved provider',
    body: 'Next, add the services you offer and the areas you cover, so we can send you jobs.',
  },
  rejected: {
    title: 'Your provider application needs changes',
    body: 'See what to fix, then send it again.',
  },
  suspended: {
    title: 'Your provider account is paused',
    body: 'Please contact support to find out more.',
  },
} as const

export default async function DashboardPage() {
  const { user, profile } = await requireUser()
  const provider = await getOwnProviderProfile(user.id)
  const firstName = profile.full_name?.split(' ')[0] ?? 'there'

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Hello, {firstName}</h1>

      {provider ? (
        <Card className="space-y-2" data-testid="provider-status">
          <h2 className="font-semibold">
            {providerStatusCopy[provider.status as keyof typeof providerStatusCopy].title}
          </h2>
          <p className="text-ink-muted">
            {providerStatusCopy[provider.status as keyof typeof providerStatusCopy].body}
          </p>
          <ButtonLink href="/provider/apply" variant="secondary" className="mt-2">
            View your provider details
          </ButtonLink>
        </Card>
      ) : null}

      <EmptyState
        title="No requests yet"
        description="Soon you will describe what you need done here and get responses from checked providers nearby."
        action={
          provider ? null : (
            <ButtonLink href="/provider/apply" variant="secondary">
              I offer a service
            </ButtonLink>
          )
        }
      />
    </div>
  )
}
