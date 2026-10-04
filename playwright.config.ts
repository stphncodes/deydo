import { readFileSync } from 'node:fs'

import { defineConfig, devices } from '@playwright/test'

// Journeys tagged @writes create users and need the fixed test OTPs, so they
// run only against the local Supabase stack. Without Docker (.env.local
// pointing at the hosted project) or against preview deploys they are skipped.
function usesLocalSupabase(): boolean {
  if (process.env.PLAYWRIGHT_BASE_URL) return false
  try {
    return /^NEXT_PUBLIC_SUPABASE_URL=http:\/\/(127\.0\.0\.1|localhost):54321$/m.test(
      readFileSync('.env.local', 'utf8'),
    )
  } catch {
    return false
  }
}

// E2E runs on a mid-range Android profile with a slow network (see
// tests/e2e/support/network.ts). Against a deployed URL when
// PLAYWRIGHT_BASE_URL is set (preview deploys in CI), otherwise against a
// local production build.
// Port 3100 so a running `next dev` on 3000 is never measured by mistake.
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3100'
const useLocalServer = !process.env.PLAYWRIGHT_BASE_URL

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/support/global-setup.ts',
  // Never create data in the shared hosted database (ADR-014).
  grepInvert: usesLocalSupabase() ? undefined : /@writes/,
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  timeout: 60_000,
  use: {
    baseURL,
    trace: 'retain-on-failure',
    extraHTTPHeaders: process.env.VERCEL_AUTOMATION_BYPASS_SECRET
      ? { 'x-vercel-protection-bypass': process.env.VERCEL_AUTOMATION_BYPASS_SECRET }
      : undefined,
  },
  projects: [
    {
      name: 'mobile-android',
      // Pixel 7 is Chromium-based, so CDP network throttling works.
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: useLocalServer
    ? {
        command: 'npm run build && npm run start -- -p 3100',
        url: `${baseURL}/api/health`,
        reuseExistingServer: !process.env.CI,
        timeout: 300_000,
      }
    : undefined,
})
