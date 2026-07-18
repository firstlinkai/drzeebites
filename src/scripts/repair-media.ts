/**
 * Re-uploads every media/product-files placeholder through the Payload API.
 *
 * Why: the first production seed ran with the Blob adapter's addRandomSuffix
 * enabled, which suffixed the stored blob names but recorded unsuffixed
 * variant filenames on the docs — so all resized-image URLs 404'd. With the
 * suffix now disabled, replacing each file regenerates blobs and doc metadata
 * consistently. Relations point at doc IDs, so content is unaffected.
 *
 * Run: DATABASE_URI=... BLOB_READ_WRITE_TOKEN=... pnpm exec tsx --env-file=.env src/scripts/repair-media.ts
 */
import { getPayload } from '@/lib/payload'
import { makePlaceholderJpeg, makePlaceholderPdf } from '@/seed/placeholders'

const BRAND_COLORS = [
  { r: 74, g: 93, b: 46 }, // primary olive
  { r: 217, g: 119, b: 66 }, // accent terracotta
  { r: 224, g: 164, b: 88 }, // amber
  { r: 237, g: 240, b: 226 }, // primary soft
  { r: 31, g: 41, b: 33 }, // ink
]

/** "seed-post-airfryer-1-aT5mJx73aCJRL1i2F5RaZQffwgUJmb.jpg" -> "seed-post-airfryer.jpg" */
const cleanName = (filename: string): string => {
  const ext = filename.slice(filename.lastIndexOf('.'))
  let base = filename.slice(0, filename.lastIndexOf('.'))
  base = base.replace(/-[A-Za-z0-9]{20,}$/, '') // blob random suffix
  base = base.replace(/-\d+$/, '') // payload dedupe counter
  return `${base}${ext}`
}

const run = async () => {
  const payload = await getPayload()

  const media = await payload.find({ collection: 'media', limit: 100, overrideAccess: true })
  let i = 0
  for (const doc of media.docs) {
    const target = cleanName(doc.filename ?? `media-${doc.id}.jpg`)
    const filePath = await makePlaceholderJpeg(target, BRAND_COLORS[i % BRAND_COLORS.length])
    await payload.update({
      collection: 'media',
      id: doc.id,
      data: {},
      filePath,
      overrideAccess: true,
    })
    console.log(`[repair] media ${doc.id}: ${doc.filename} -> re-uploaded as ${target}`)
    i += 1
  }

  const files = await payload.find({ collection: 'product-files', limit: 100, overrideAccess: true })
  for (const doc of files.docs) {
    const target = cleanName(doc.filename ?? `file-${doc.id}.pdf`)
    const filePath = makePlaceholderPdf(target, 'The Diabetic Air Fryer Cookbook - placeholder')
    await payload.update({
      collection: 'product-files',
      id: doc.id,
      data: {},
      filePath,
      overrideAccess: true,
    })
    console.log(`[repair] product-file ${doc.id}: ${doc.filename} -> re-uploaded as ${target}`)
  }

  console.log('[repair] done')
  process.exit(0)
}

void run()
