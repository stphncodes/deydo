import type { Metadata } from 'next'

import { Button } from '@/components/ui/button'
import { signOutAction } from '@/features/auth/server/actions'

export const metadata: Metadata = { title: 'Account on hold' }

export default function AccountSuspendedPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Your account is on hold</h1>
      <p className="text-ink-muted">
        Our team has paused this account, usually while we look into a report. If you think this is
        a mistake, reply to the message we sent you or contact support.
      </p>
      <form action={signOutAction}>
        <Button type="submit" variant="secondary" fullWidth>
          Sign out
        </Button>
      </form>
    </div>
  )
}
