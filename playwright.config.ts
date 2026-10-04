import { defineConfig, devices } from '@playwright/test'

// E2E runs on a mid-range Android profile with a slow network (see
// tests/e2e/support/network.ts). Against a deployed URL when
// PLAYWRIGHT_BASE_URL is set (preview deploys in CI), otherwise against a
// local production build.
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'
const useLocalServer = !process.env.PLAYWRIGHT_BASE_URL

export default defineConfig({
  testDir: './tests/e2e',
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
        command: 'npm run build && npm run start',
        url: `${baseURL}/api/health`,
        reuseExistingServer: !process.env.CI,
        timeout: 300_000,
      }
    : undefined,
})
