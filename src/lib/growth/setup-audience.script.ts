/**
 * One-off setup script: find-or-create the "DrZeeBites Newsletter" Resend
 * audience and print its id (for RESEND_AUDIENCE_ID in .env).
 *
 * Run: pnpm exec tsx --env-file=.env src/lib/growth/setup-audience.script.ts
 */
import { ensureNewsletterAudience, NEWSLETTER_AUDIENCE_NAME } from './audience'

ensureNewsletterAudience()
  .then((id) => {
    console.log(`[growth] audience "${NEWSLETTER_AUDIENCE_NAME}" id: ${id}`)
    process.exit(0)
  })
  .catch((err) => {
    console.error('[growth] audience setup failed:', err)
    process.exit(1)
  })
