import { ButtonLink } from '@/components/ui/button'
import { Container } from '@/components/ui/container'
import { Wordmark } from '@/components/ui/wordmark'

export default function MarketingLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <header className="border-b border-line">
        <Container className="flex items-center justify-between">
          <Wordmark />
          <ButtonLink href="/dashboard" variant="ghost">
            Sign in
          </ButtonLink>
        </Container>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-line bg-canvas py-8 text-sm text-ink-muted">
        <Container>
          <p>DeyDo is a working title. Built in Nigeria.</p>
        </Container>
      </footer>
    </div>
  )
}
