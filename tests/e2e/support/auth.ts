import { expect, type Page } from '@playwright/test'

// Local Supabase delivers auth emails to Mailpit; read the code from there.
const MAILPIT = 'http://127.0.0.1:54324'

function searchUrl(email: string, limit?: number) {
  const query = encodeURIComponent(`to:"${email}"`)
  return `${MAILPIT}/api/v1/search?query=${query}${limit ? `&limit=${limit}` : ''}`
}

async function clearInbox(email: string) {
  await fetch(searchUrl(email), { method: 'DELETE' })
}

async function readCode(email: string): Promise<string> {
  const deadline = Date.now() + 20_000
  while (Date.now() < deadline) {
    const search = (await (await fetch(searchUrl(email, 1))).json()) as {
      messages?: { ID: string }[]
    }
    const id = search.messages?.[0]?.ID
    if (id) {
      const message = (await (await fetch(`${MAILPIT}/api/v1/message/${id}`)).json()) as {
        Text?: string
      }
      const code = message.Text?.match(/\b(\d{6})\b/)?.[1]
      if (code) return code
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`No sign-in code arrived for ${email}`)
}

/** Signs in with an email code, the only sign-in method (ADR-015). */
export async function signInWithEmail(page: Page, email: string) {
  await clearInbox(email)
  await page.goto('/sign-in')
  await page.getByLabel('Your email address').fill(email)
  await page.getByRole('button', { name: 'Send code' }).click()
  await expect(page.getByText('We sent a code to')).toBeVisible()

  await page.getByLabel('Enter the 6-digit code').fill(await readCode(email))
  await page.getByRole('button', { name: 'Continue' }).click()
  // Wait for the post-sign-in redirect so the session cookie is in place.
  await page.waitForURL((url) => !url.pathname.startsWith('/sign-in'))
}
