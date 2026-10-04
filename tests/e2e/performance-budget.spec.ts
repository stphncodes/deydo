import { brotliCompressSync, constants } from 'node:zlib'

import { expect, test } from '@playwright/test'

// Technical document, Section 20: initial JS around 150 KB compressed on core
// pages. Measured as Brotli (what Vercel serves) so the number is the same on
// every machine. Next.js 16 and React 19 alone are about 150 KB Brotli, so
// the ceiling leaves about 10 KB for our own client code. Scripts loaded
// after the load event (Sentry and analytics on idle) are excluded.
const BUDGET_KB = 160
// Signed-in pages are measured after sign-in in auth.spec.ts.
const CORE_PAGES = ['/', '/sign-in'] as const

for (const path of CORE_PAGES) {
  test(`initial JS on ${path} stays within ${BUDGET_KB} KB Brotli`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'load' })

    const urls = await page.evaluate(() => {
      const [navigation] = performance.getEntriesByType(
        'navigation',
      ) as PerformanceNavigationTiming[]
      const loadEnd = navigation?.loadEventEnd || Number.POSITIVE_INFINITY
      return (performance.getEntriesByType('resource') as PerformanceResourceTiming[])
        .filter(
          (entry) =>
            entry.initiatorType === 'script' &&
            entry.startTime <= loadEnd &&
            // Our own scripts only: Vercel injects its toolbar into previews.
            new URL(entry.name).origin === window.location.origin,
        )
        .map((entry) => entry.name)
    })

    let bytes = 0
    for (const url of new Set(urls)) {
      const body = await (await page.request.get(url)).body()
      bytes += brotliCompressSync(body, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length
    }

    const kb = bytes / 1024
    test.info().annotations.push({
      type: 'initial-js',
      description: `${path}: ${kb.toFixed(1)} KB Brotli across ${urls.length} scripts`,
    })
    expect(urls.length).toBeGreaterThan(0)
    expect(kb).toBeLessThanOrEqual(BUDGET_KB)
  })
}
