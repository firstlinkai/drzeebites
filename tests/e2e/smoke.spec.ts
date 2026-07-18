import { expect, test } from '@playwright/test'

/**
 * Light availability smoke: key public pages respond 200 and render their
 * primary content. Needs the Next server running on baseURL (orchestrator
 * starts it — webServer in playwright.config.ts is intentionally commented out).
 */

const PAGES: Array<{ path: string; heading: RegExp }> = [
  { path: '/', heading: /air fryer recipes/i },
  { path: '/recipes', heading: /diabetic-friendly air fryer recipes/i },
  { path: '/blog', heading: /guides for the diabetic kitchen/i },
  { path: '/contact', heading: /get in touch/i },
]

for (const { path, heading } of PAGES) {
  test(`${path} responds 200 and shows its heading`, async ({ page }) => {
    const response = await page.goto(path)
    expect(response?.status()).toBe(200)
    await expect(page.locator('h1').first()).toBeVisible()
    await expect(page.locator('h1').first()).toHaveText(heading)
  })
}

test('a recipe detail page responds 200 and renders', async ({ page }) => {
  await page.goto('/recipes')
  const recipeLink = page.locator('a[href^="/recipes/"]').first()
  const count = await recipeLink.count()
  test.skip(count === 0, 'no published recipes to click through to')

  const href = await recipeLink.getAttribute('href')
  const response = await page.goto(href as string)
  expect(response?.status()).toBe(200)
  await expect(page.locator('h1').first()).toBeVisible()
})

test('the shop lists a product and the product page shows a buy button', async ({ page }) => {
  const response = await page.goto('/shop')
  expect(response?.status()).toBe(200)

  const productLink = page.locator('a[href^="/shop/"]').first()
  test.skip((await productLink.count()) === 0, 'no active products in the shop')

  await productLink.click()
  await page.waitForURL(/\/shop\/[^/?]+/)
  await expect(page.getByRole('button', { name: /get instant access/i }).first()).toBeVisible()
})
