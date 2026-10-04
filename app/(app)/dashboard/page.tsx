import type { Metadata } from 'next'

import { EmptyState } from '@/components/ui/empty-state'

export const metadata: Metadata = { title: 'Home' }

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Welcome</h1>
      <EmptyState
        title="Nothing here yet"
        description="Soon you will post requests and follow your jobs from this page."
      />
    </div>
  )
}
