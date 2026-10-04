import { expect, test } from '@playwright/test'

import { throttleToSlow4G } from './support/network'

test.describe('smoke', () => {
  test.beforeEach(async ({ page }) => {
    await throttleToSlow4G(page)
  })

  test('landing page renders the core message and categories', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tell us what you need done.')
    await expect(page.getByRole('heading', { name: 'What we help with' })).toBeVisible()
    await expect(page.getByText('AC and refrigeration repair')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Get started' })).toBeVisible()
  })

  test('health check reports the database as reachable', async ({ request }) => {
    const response = await request.get('/api/health')
    expect(response.status()).toBe(200)
    expect(await response.json()).toMatchObject({ status: 'ok', db: 'ok' })
  })

  test('PWA manifest is valid', async ({ request }) => {
    const response = await request.get('/manifest.webmanifest')
    expect(response.ok()).toBe(true)
    const manifest = await response.json()
    expect(manifest).toMatchObject({
      name: 'DeyDo',
      display: 'standalone',
      start_url: '/dashboard',
    })
    const sizes = manifest.icons.map((icon: { sizes: string }) => icon.sizes)
    expect(sizes).toEqual(expect.arrayContaining(['192x192', '512x512']))
  })

  test('unknown pages show a friendly not found page', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist')
    expect(response?.status()).toBe(404)
    await expect(page.getByRole('heading', { name: 'We could not find that page' })).toBeVisible()
  })
})
