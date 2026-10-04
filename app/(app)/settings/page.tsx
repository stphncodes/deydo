import type { Metadata } from 'next'

import { EmptyState } from '@/components/ui/empty-state'

export const metadata: Metadata = { title: 'Account' }

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Account</h1>
      <EmptyState
        title="Your account"
        description="You will manage your profile and sign-in details here."
      />
    </div>
  )
}
