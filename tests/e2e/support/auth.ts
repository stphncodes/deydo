import { expect, type Page } from '@playwright/test'

/** Signs in with a test phone number (fixed OTP 123456 on the local stack). */
export async function signInWithPhone(page: Page, nationalPhone: string) {
  await page.goto('/sign-in')
  await page.getByLabel('Your phone number').fill(nationalPhone)
  await page.getByRole('button', { name: 'Send code' }).click()
  await expect(page.getByText('We sent a code to')).toBeVisible()
  await page.getByLabel('Enter the 6-digit code').fill('123456')
  await page.getByRole('button', { name: 'Continue' }).click()
  // Wait for the post-sign-in redirect so the session cookie is in place.
  await page.waitForURL((url) => !url.pathname.startsWith('/sign-in'))
}
