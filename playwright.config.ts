import { defineConfig, devices } from '@playwright/test'

// Load .env so the purchase spec can check whether STRIPE_SECRET_KEY is a test
// key (values are never printed). Node 24 has loadEnvFile built in; existing
// shell env vars take precedence.
try {
  process.loadEnvFile?.('.env')
} catch {
  // no .env present — fine, specs skip what they can't run
}

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: [['list']],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  // webServer intentionally commented out — the orchestrator starts the Next
  // server (pnpm dev or pnpm build && pnpm start) before running `pnpm test:e2e`.
  // webServer: {
  //   command: 'pnpm start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: true,
  //   timeout: 120_000,
  // },
})
