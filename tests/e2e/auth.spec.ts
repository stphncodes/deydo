import { expect, test } from '@playwright/test'

import { signInWithEmail } from './support/auth'
import { throttleToSlow4G } from './support/network'

// @writes: creates users, so it runs against the local stack only.
test.describe('@writes sign up, onboarding and provider approval', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeEach(async ({ page }) => {
    await throttleToSlow4G(page)
  })

  test('a customer signs up by email and onboards in under 2 minutes', async ({ page }) => {
    const started = Date.now()
    await signInWithEmail(page, 'e2e-customer@deydo.test')

    await expect(page.getByRole('heading', { name: 'Welcome to DeyDo' })).toBeVisible()
    await page.getByLabel('Your name').fill('Bisi Adewale')
    await page.getByLabel('Your area').selectOption({ label: 'Riverside, Sample City' })
    await page.getByRole('button', { name: 'Continue' }).click()

    await expect(page.getByRole('heading', { name: 'Hello, Bisi' })).toBeVisible()
    expect(Date.now() - started).toBeLessThan(120_000)

    // Thumb-reachable navigation in the signed-in shell
    const nav = page.getByRole('navigation', { name: 'Main' })
    await nav.getByRole('link', { name: 'Account' }).click()
    await expect(page.getByLabel('Your name')).toHaveValue('Bisi Adewale')
  })

  test('a provider applies and sees the application is pending', async ({ page }) => {
    await signInWithEmail(page, 'e2e-provider@deydo.test')
    await page.getByLabel('Your name').fill('Kunle Ojo')
    await page.getByLabel('Your area').selectOption({ label: 'Hilltop, Sample City' })
    await page.getByText('I offer a service and want jobs').click()
    await page.getByRole('button', { name: 'Continue' }).click()

    await expect(page.getByRole('heading', { name: 'Offer your services' })).toBeVisible()
    await page.getByLabel('What do you do?').fill('Electrician for wiring and faults')
    await page.getByLabel('The area you work from').selectOption({ label: 'Hilltop, Sample City' })
    await page.getByLabel('Your phone number').fill('0803 555 0101')
    await page.getByRole('button', { name: 'Send application' }).click()

    await expect(page.getByText('Thanks. Our team will review your application.')).toBeVisible()
    await page.reload()
    await expect(page.getByTestId('application-status')).toContainText('Application received')
  })

  test('a provider cannot open the admin console', async ({ page }) => {
    await signInWithEmail(page, 'e2e-provider@deydo.test')
    const response = await page.goto('/admin/providers')
    expect(response?.status()).toBe(404)
  })

  test('an admin approves the provider after a phone check', async ({ page }) => {
    await signInWithEmail(page, 'admin@deydo.test')
    await page.goto('/admin/providers')
    await page.getByRole('link', { name: /Kunle Ojo/ }).click()

    await page.getByLabel('Phone call: confirmed it is them').check()
    await page.getByRole('button', { name: 'Approve' }).click()
    await expect(page.getByText('Provider approved.')).toBeVisible()
  })

  test('the approved provider sees their new status', async ({ page }) => {
    await signInWithEmail(page, 'e2e-provider@deydo.test')
    await expect(page.getByTestId('provider-status')).toContainText('You are an approved provider')
  })
})

test('signed-out visitors are sent to sign in', async ({ page }) => {
  await page.goto('/settings')
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fsettings/)
  await expect(page.getByRole('heading', { name: 'Sign in or create an account' })).toBeVisible()
})
