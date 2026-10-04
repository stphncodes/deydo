import './globals.css'

import type { Metadata, Viewport } from 'next'

import { publicEnv } from '@/config/env'
import { AnalyticsPageViews } from '@/lib/analytics/client'

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.NEXT_PUBLIC_APP_URL),
  title: { default: 'DeyDo: get it done by someone nearby', template: '%s | DeyDo' },
  description:
    'Tell us what you need done. We will find someone nearby who has done it well before.',
  applicationName: 'DeyDo',
  appleWebApp: { capable: true, title: 'DeyDo', statusBarStyle: 'default' },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: '#0b1320',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en-NG">
      <body className="min-h-dvh antialiased">
        {children}
        <AnalyticsPageViews />
      </body>
    </html>
  )
}
