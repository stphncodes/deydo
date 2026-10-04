import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

// Refreshes the Supabase session cookie on navigation. It does NOT authorize:
// pages use requireUser/requireAdmin and the database enforces RLS.
export async function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', request.nextUrl.pathname + request.nextUrl.search)

  let response = NextResponse.next({ request: { headers: requestHeaders } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, cacheHeaders) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value)
          response = NextResponse.next({ request: { headers: requestHeaders } })
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
          for (const [key, value] of Object.entries(cacheHeaders ?? {})) {
            response.headers.set(key, value)
          }
        },
      },
    },
  )

  // Triggers a refresh when the access token has expired.
  await supabase.auth.getClaims()

  return response
}

export const config = {
  matcher: [
    {
      source:
        '/((?!_next/static|_next/image|favicon.ico|apple-icon.png|icons/|manifest.webmanifest|api/health|api/auth/hooks).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
