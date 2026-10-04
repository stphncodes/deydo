'use client'

import { reportClientError } from '@/lib/observability/report-client-error'
import { useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { Container } from '@/components/ui/container'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    reportClientError(error)
  }, [error])

  return (
    <Container className="py-16 text-center">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="mt-2 text-ink-muted">
        This is on our side, not yours. Please try again. If it keeps happening, check your
        connection and come back in a few minutes.
      </p>
      <Button onClick={reset} className="mt-6">
        Try again
      </Button>
    </Container>
  )
}
