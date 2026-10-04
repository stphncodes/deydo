import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Card } from '@/components/ui/card'
import { ReviewProviderForm } from '@/features/admin/components/review-provider-form'
import { getProviderForReview } from '@/features/admin/server/providers'
import { formatNigerianPhone } from '@/features/auth/phone'
import { requireAdmin } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'Review provider' }

export default async function AdminProviderPage({ params }: PageProps<'/admin/providers/[id]'>) {
  await requireAdmin()
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound()

  const result = await getProviderForReview(id)
  if (!result) notFound()
  const { provider, records } = result
  // Readable by staff only (profile_contacts RLS). Used to call the applicant.
  const phone = provider.profile?.contact?.phone ?? null

  return (
    <div className="space-y-6">
      <Link href="/admin/providers" className="text-sm font-medium text-brand">
        Back to providers
      </Link>
      <div>
        <h1 className="text-2xl font-bold">{provider.profile?.full_name ?? 'No name yet'}</h1>
        <p className="text-ink-muted">{provider.headline}</p>
      </div>

      <Card className="space-y-2 text-sm">
        <p>
          <span className="font-medium">Status:</span>{' '}
          <span className="capitalize">{provider.status}</span>, level {provider.verification_level}
        </p>
        <p>
          <span className="font-medium">Area:</span> {provider.area?.name ?? 'None'}
        </p>
        <p>
          <span className="font-medium">Phone:</span>{' '}
          {phone ? (
            <a href={`tel:+${phone}`} className="text-brand">
              {formatNigerianPhone(phone)}
            </a>
          ) : (
            'None'
          )}
        </p>
        {provider.status_reason ? (
          <p>
            <span className="font-medium">Reason shown to provider:</span> {provider.status_reason}
          </p>
        ) : null}
        {provider.bio ? <p className="whitespace-pre-line text-ink-muted">{provider.bio}</p> : null}
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Checks on record</h2>
        {records.length === 0 ? (
          <p className="text-ink-muted">No checks yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {records.map((record) => (
              <li key={record.id} className="rounded-xl border border-line bg-surface p-3">
                <span className="font-medium">{record.check_type.replace('_', ' ')}</span>:{' '}
                {record.result} on {new Date(record.created_at).toLocaleDateString('en-NG')}
                {record.notes ? <p className="text-ink-muted">{record.notes}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">Decision</h2>
        <ReviewProviderForm providerId={provider.id} currentLevel={provider.verification_level} />
      </Card>
    </div>
  )
}
