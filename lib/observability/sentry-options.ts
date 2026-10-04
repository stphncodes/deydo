import type * as Sentry from '@sentry/nextjs'

type DataCollection = NonNullable<NonNullable<Parameters<typeof Sentry.init>[0]>['dataCollection']>

/**
 * Collect nothing personal. Sentry's defaults include cookies, headers,
 * bodies, query strings and local variables; all of those can carry phone
 * numbers, addresses or message text. The pseudonymous user id is set
 * explicitly with Sentry.setUser({ id }) once auth exists.
 */
export const sentryDataCollection: DataCollection = {
  userInfo: false,
  cookies: false,
  httpHeaders: {
    request: { allow: ['user-agent', 'content-type', 'x-request-id', 'x-vercel-id'] },
    response: false,
  },
  httpBodies: [],
  urlQueryParams: false,
  graphQL: { document: false, variables: false },
  genAI: { inputs: false, outputs: false },
  databaseQueryData: false,
  queues: false,
  stackFrameVariables: false,
}
