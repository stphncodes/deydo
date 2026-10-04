/** Sends a client error to Sentry, loading the SDK on demand. */
export function reportClientError(error: unknown) {
  void import('@sentry/nextjs')
    .then((Sentry) => Sentry.captureException(error))
    .catch(() => undefined)
}
