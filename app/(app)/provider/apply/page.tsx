import type { Metadata } from 'next'

import { Card } from '@/components/ui/card'
import { formatNigerianPhone } from '@/features/auth/phone'
import { listActiveAreas } from '@/features/locations/server/areas'
import { ProviderApplicationForm } from '@/features/providers/components/provider-application-form'
import { getOwnContactPhone, getOwnProviderProfile } from '@/features/providers/server/providers'
import { requireUser } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'Offer your services' }

export default async function ProviderApplyPage() {
  const { user } = await requireUser()
  const [provider, areas, phone] = await Promise.all([
    getOwnProviderProfile(user.id),
    listActiveAreas(),
    getOwnContactPhone(user.id),
  ])

  const initial = provider
    ? {
        headline: provider.headline,
        bio: provider.bio ?? '',
        baseLocationId: provider.base_location_id,
        phone: phone ? formatNigerianPhone(phone) : '',
      }
    : undefined

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {provider ? 'Your provider details' : 'Offer your services'}
        </h1>
        {!provider ? (
          <p className="mt-1 text-ink-muted">
            Tell us about your work. Our team checks every provider before they can respond to
            requests.
          </p>
        ) : null}
      </div>

      {provider?.status === 'pending' ? (
        <Card className="border-accent bg-accent-soft" data-testid="application-status">
          <p className="font-semibold">Application received</p>
          <p className="text-ink-muted">
            Our team will review it and may call you to confirm a few details.
          </p>
        </Card>
      ) : null}
      {provider?.status === 'approved' ? (
        <Card className="border-brand bg-brand-soft" data-testid="application-status">
          <p className="font-semibold">You are approved</p>
          <p className="text-ink-muted">You can update your details below at any time.</p>
        </Card>
      ) : null}
      {provider?.status === 'rejected' ? (
        <Card className="border-danger bg-danger-soft" data-testid="application-status">
          <p className="font-semibold">Your application needs changes</p>
          {provider.status_reason ? <p className="text-ink">{provider.status_reason}</p> : null}
          <p className="text-ink-muted">Update your details and send it again.</p>
        </Card>
      ) : null}

      {provider?.status === 'suspended' ? (
        <Card data-testid="application-status">
          <p className="font-semibold">Your provider account is paused</p>
          {provider.status_reason ? (
            <p className="text-ink-muted">{provider.status_reason}</p>
          ) : null}
        </Card>
      ) : (
        <ProviderApplicationForm
          areas={areas}
          initial={initial}
          submitLabel={
            !provider
              ? 'Send application'
              : provider.status === 'rejected'
                ? 'Send again'
                : 'Save changes'
          }
        />
      )}
    </div>
  )
}
