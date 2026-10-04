import type { Metadata } from 'next'

import { EmptyState } from '@/components/ui/empty-state'

export const metadata: Metadata = { title: 'Messages' }

export default function MessagesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Messages</h1>
      <EmptyState
        title="No messages yet"
        description="Chats with providers about your requests will show up here."
      />
    </div>
  )
}
