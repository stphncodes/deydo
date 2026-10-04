import type { Metadata } from 'next'
import Link from 'next/link'

import { EmptyState } from '@/components/ui/empty-state'
import { listProvidersByStatus } from '@/features/admin/server/providers'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Providers' }

const TABS = ['pending', 'approved', 'rejected', 'suspended'] as const
type Tab = (typeof TABS)[number]

export default async function AdminProvidersPage({ searchParams }: PageProps<'/admin/providers'>) {
  const { status } = await searchParams
  const tab: Tab = TABS.includes(status as Tab) ? (status as Tab) : 'pending'
  const providers = await listProvidersByStatus(tab)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Providers</h1>
      <nav aria-label="Provider status" className="flex gap-2 overflow-x-auto">
        {TABS.map((name) => (
          <Link
            key={name}
            href={`/admin/providers?status=${name}`}
            aria-current={tab === name ? 'page' : undefined}
            className={cn(
              'min-h-11 rounded-full border px-4 py-2 text-sm font-medium capitalize',
              tab === name ? 'border-ink bg-ink text-white' : 'border-line bg-surface',
            )}
          >
            {name}
          </Link>
        ))}
      </nav>

      {providers.length === 0 ? (
        <EmptyState title={`No ${tab} providers`} description="Nothing to do here right now." />
      ) : (
        <ul className="divide-y divide-line rounded-[var(--radius-card)] border border-line bg-surface">
          {providers.map((provider) => (
            <li key={provider.id}>
              <Link href={`/admin/providers/${provider.id}`} className="block p-4 hover:bg-canvas">
                <p className="font-semibold">{provider.fullName ?? 'No name yet'}</p>
                <p className="text-sm text-ink-muted">{provider.headline}</p>
                <p className="mt-1 text-xs text-ink-subtle">
                  {provider.area ?? 'No area'} · Applied{' '}
                  {new Date(provider.createdAt).toLocaleDateString('en-NG')} ·{' '}
                  {provider.phoneVerified ? 'Phone verified' : 'Phone not verified'}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
