import { expect, test, type Page } from '@playwright/test'

/**
 * Full purchase flow against Stripe TEST mode:
 *   home → shop → product page → Stripe hosted checkout (4242 test card)
 *   → /thank-you → download button → PDF response.
 *
 * Requirements (orchestrator):
 *   - Next server running on baseURL (webServer in playwright.config.ts is
 *     intentionally commented out).
 *   - STRIPE_SECRET_KEY must be a sk_test_ key, otherwise the test skips.
 *   - Stripe webhooks must reach the local server (e.g. `stripe listen
 *     --forward-to localhost:3000/api/webhooks/stripe`) so the order/token
 *     exist by the time /thank-you renders. Without webhook forwarding the
 *     thank-you page shows the "link is being prepared" fallback and the
 *     download-button assertion will fail.
 */

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY ?? ''
const IS_TEST_KEY = STRIPE_KEY.startsWith('sk_test_')

const TEST_EMAIL = 'aifirstlink@gmail.com'

async function fillIfVisible(page: Page, selector: string, value: string): Promise<void> {
  const field = page.locator(selector).first()
  if (await field.isVisible().catch(() => false)) {
    await field.fill(value)
  }
}

test.describe('purchase flow (Stripe test mode)', () => {
  test.skip(!IS_TEST_KEY, 'STRIPE_SECRET_KEY is not an sk_test_ key — refusing to run a live checkout')

  test('buys the cookbook with the 4242 test card and downloads the PDF', async ({ page, request }) => {
    // Real payment redirect + webhook round-trip — be generous.
    test.setTimeout(300_000)

    // 1. Home → shop product page.
    await page.goto('/')
    await expect(page.locator('h1')).toBeVisible()

    await page.goto('/shop')
    const productLink = page.locator('a[href^="/shop/"]').first()
    await expect(productLink, 'shop page should list at least one product').toBeVisible()
    await productLink.click()
    await page.waitForURL(/\/shop\/[^/?]+/)

    // 2. Buy button → Stripe hosted checkout.
    const buyButton = page.getByRole('button', { name: /get instant access/i }).first()
    await expect(buyButton).toBeVisible()
    await buyButton.click()
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 90_000 })

    // 3. Fill the hosted checkout form (field names are Stripe's own).
    await page.locator('input[type="email"], input[name="email"]').first().fill(TEST_EMAIL)
    await page.locator('input[name="cardNumber"]').fill('4242 4242 4242 4242')
    await page.locator('input[name="cardExpiry"]').fill('12 / 34')
    await page.locator('input[name="cardCvc"]').fill('123')
    await fillIfVisible(page, 'input[name="billingName"]', 'AI Firstlink')

    const country = page.locator('select[name="billingCountry"]')
    if (await country.isVisible().catch(() => false)) {
      await country.selectOption('US')
    }
    await fillIfVisible(page, 'input[name="billingPostalCode"]', '10001')

    // Some checkout variants show a phone / "save my info" (Link) prompt — decline if present.
    const linkOptOut = page.locator('input[name="enableStripePass"]')
    if (await linkOptOut.isChecked().catch(() => false)) {
      await linkOptOut.uncheck().catch(() => {})
    }

    // 4. Submit and wait for the thank-you redirect (webhook must land too).
    await page.locator('button[data-testid="hosted-payment-submit-button"], button.SubmitButton').first().click()
    await page.waitForURL(/\/thank-you\?session_id=cs_/, { timeout: 120_000 })

    // 5. Download button present (order + token created by the webhook).
    const download = page.getByRole('link', { name: /download your cookbook now/i })
    await expect(download, 'webhook must have created the order + token').toBeVisible({ timeout: 30_000 })

    const href = await download.getAttribute('href')
    expect(href).toMatch(/^\/download\/[0-9a-f]{48}\.[0-9a-f]{64}$/)

    // 6. The download link serves a PDF.
    const res = await request.get(href as string)
    expect(res.status()).toBe(200)
    expect(res.headers()['content-type']).toContain('application/pdf')
    expect((await res.body()).length).toBeGreaterThan(1000)
  })
})
