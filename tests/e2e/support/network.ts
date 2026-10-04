import type { Page } from '@playwright/test'

/**
 * Slow mobile connection, roughly "Slow 4G": 400 ms latency, 1.6 Mbps down,
 * 750 Kbps up. Chromium only (CDP).
 */
export async function throttleToSlow4G(page: Page) {
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 400,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  })
  // A mid-range phone CPU is around 4x slower than a dev laptop.
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
}
