import type { Metadata } from 'next'

import { EmptyState } from '@/components/ui/empty-state'

export const metadata: Metadata = { title: 'Requests' }

export default function RequestsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Requests</h1>
      <EmptyState
        title="No requests yet"
        description="When you post a request, you will see it here with every response."
      />
    </div>
  )
}
