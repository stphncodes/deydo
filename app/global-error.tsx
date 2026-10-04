'use client'

import './globals.css'

import { reportClientError } from '@/lib/observability/report-client-error'
import { useEffect } from 'react'

export default function GlobalError({
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
    <html lang="en-NG">
      <body className="grid min-h-dvh place-items-center p-4 text-center">
        <div>
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="mt-2 text-ink-muted">Please try again in a moment.</p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 min-h-12 rounded-xl bg-brand px-4 font-semibold text-white"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
