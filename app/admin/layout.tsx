import type { Metadata } from 'next'
import Link from 'next/link'

import { Container } from '@/components/ui/container'
import { requireAdmin } from '@/lib/auth/session'

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s | DeyDo admin' },
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: LayoutProps<'/admin'>) {
  await requireAdmin()
  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-ink text-white">
        <Container className="flex min-h-14 items-center justify-between">
          <Link href="/admin/providers" className="font-bold">
            DeyDo admin
          </Link>
          <Link href="/dashboard" className="text-sm text-white/80">
            Back to app
          </Link>
        </Container>
      </header>
      <main>
        <Container className="py-6">{children}</Container>
      </main>
    </div>
  )
}
