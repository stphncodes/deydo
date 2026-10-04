import { ButtonLink } from '@/components/ui/button'
import { Container } from '@/components/ui/container'

export default function NotFound() {
  return (
    <Container className="py-16 text-center">
      <h1 className="text-2xl font-bold">We could not find that page</h1>
      <p className="mt-2 text-ink-muted">The link may be old, or the page may have moved.</p>
      <ButtonLink href="/" className="mt-6">
        Go to the home page
      </ButtonLink>
    </Container>
  )
}
