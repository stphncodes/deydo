import type { Metadata } from 'next'

import { BottomNav } from '@/components/layout/bottom-nav'
import { Container } from '@/components/ui/container'
import { Wordmark } from '@/components/ui/wordmark'
import { requireUser } from '@/lib/auth/session'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function AppLayout({ children }: LayoutProps<'/'>) {
  await requireUser()
  return (
    <div className="min-h-dvh pb-24">
      <header className="sticky top-0 z-10 border-b border-line bg-surface">
        <Container>
          <Wordmark href="/dashboard" />
        </Container>
      </header>
      <main>
        <Container className="py-6">{children}</Container>
      </main>
      <BottomNav />
    </div>
  )
}
