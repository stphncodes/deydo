import type { Metadata } from 'next'

import { Container } from '@/components/ui/container'
import { Wordmark } from '@/components/ui/wordmark'

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default function AuthLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="min-h-dvh bg-surface">
      <header className="border-b border-line">
        <Container>
          <Wordmark />
        </Container>
      </header>
      <main>
        <Container className="max-w-md py-8">{children}</Container>
      </main>
    </div>
  )
}
