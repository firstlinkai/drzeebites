/**
 * Idempotent affiliate-link seed — safe to run repeatedly. Upserts by label.
 *
 * Run: pnpm exec tsx --env-file=.env src/scripts/seed-affiliates.ts
 */
import { getPayload } from 'payload'

import config from '@payload-config'

const LINKS: { label: string; url: string }[] = [
  { label: 'COSORI 5.8QT Air Fryer', url: 'https://www.amazon.com/dp/B07GJBBGHG' },
  { label: 'Kitchen Digital Food Scale', url: 'https://www.amazon.com/dp/B01N1UX8RW' },
  { label: 'Instant-Read Meat Thermometer', url: 'https://www.amazon.com/dp/B01IHHLB3W' },
]

const run = async (): Promise<void> => {
  const payload = await getPayload({ config })

  for (const { label, url } of LINKS) {
    const existing = await payload.find({
      collection: 'affiliate-links',
      where: { label: { equals: label } },
      limit: 1,
      overrideAccess: true,
    })
    if (existing.docs[0]) {
      console.log(`[seed-affiliates] exists: ${label} (id ${existing.docs[0].id})`)
      continue
    }
    const doc = await payload.create({
      collection: 'affiliate-links',
      data: { label, url, clickCount: 0 },
      overrideAccess: true,
    })
    console.log(`[seed-affiliates] created: ${label} (id ${doc.id})`)
  }

  console.log('[seed-affiliates] done')
  process.exit(0)
}

run().catch((err) => {
  console.error('[seed-affiliates] failed:', err)
  process.exit(1)
})
