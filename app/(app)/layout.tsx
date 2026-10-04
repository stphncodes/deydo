import type { Metadata } from 'next'

import { BottomNav } from '@/components/layout/bottom-nav'
import { Container } from '@/components/ui/container'
import { Wordmark } from '@/components/ui/wordmark'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

// Authentication guards arrive in Phase 2 (requireUser in lib/auth).
export default function AppLayout({ children }: LayoutProps<'/'>) {
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
