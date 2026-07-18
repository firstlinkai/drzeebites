/**
 * Replaces seed placeholder media with real images (generated brand
 * photography + the actual Gumroad cookbook cover). Matches media docs by
 * filename prefix, re-uploads via payload.update so blobs/variants regenerate,
 * and refreshes alt text. Relations are untouched (they point at doc IDs).
 *
 * Run: IMAGES_DIR=<dir> pnpm exec tsx --env-file=.env src/scripts/set-real-images.ts
 * (add DATABASE_URI/PAYLOAD_SECRET/BLOB_READ_WRITE_TOKEN env overrides for prod)
 */
import fs from 'fs'
import os from 'os'
import path from 'path'

import sharp from 'sharp'

import { getPayload } from '@/lib/payload'

const IMAGES_DIR = process.env.IMAGES_DIR
if (!IMAGES_DIR) throw new Error('IMAGES_DIR env var required')

type Job = {
  /** media doc filename prefix to match */
  prefix: string
  /** source file in IMAGES_DIR */
  source: string
  /** uploaded filename */
  uploadAs: string
  alt: string
  /** landscape 16:9 crop (default) or keep portrait */
  portrait?: boolean
}

const JOBS: Job[] = [
  {
    prefix: 'seed-recipe-salmon',
    source: 'recipe-salmon.png',
    uploadAs: 'crispy-parmesan-crusted-salmon.jpg',
    alt: 'Golden crispy parmesan-crusted salmon fillet with lemon wedges and fresh dill, fresh from the air fryer',
  },
  {
    prefix: 'seed-recipe-zucchini',
    source: 'recipe-zucchini.png',
    uploadAs: 'crunchy-zucchini-chips.jpg',
    alt: 'Bowl of crispy golden air-fried zucchini chips with sea salt and a light dipping sauce',
  },
  {
    prefix: 'seed-recipe-frittata',
    source: 'recipe-frittata.png',
    uploadAs: 'chorizo-frittata-cups.jpg',
    alt: 'Mini chorizo frittata egg cups in a muffin tin, golden tops with melted cheese and red pepper',
  },
  {
    prefix: 'seed-post-airfryer',
    source: 'post-airfryer.png',
    uploadAs: 'air-fryer-healthy-cooking.jpg',
    alt: 'Modern air fryer with basket open showing crispy chicken and roasted vegetables',
  },
  {
    prefix: 'seed-product-cookbook',
    source: 'gumroad-230vu8nl5t5tw2i9825wo1fef9kw.img',
    uploadAs: 'diabetic-air-fryer-cookbook-cover.jpg',
    alt: 'The Diabetic Air Fryer Cookbook cover — 30 low-carb, low-sugar recipes that actually taste amazing',
    portrait: true,
  },
]

const prepare = async (job: Job): Promise<string> => {
  const src = path.join(IMAGES_DIR, job.source)
  const outDir = path.join(os.tmpdir(), 'drzee-real-images')
  fs.mkdirSync(outDir, { recursive: true })
  const out = path.join(outDir, job.uploadAs)
  const pipeline = sharp(src)
  if (job.portrait) {
    await pipeline.resize({ width: 1005 }).jpeg({ quality: 85 }).toFile(out)
  } else {
    await pipeline.resize(1600, 900, { fit: 'cover' }).jpeg({ quality: 82 }).toFile(out)
  }
  return out
}

const run = async () => {
  const payload = await getPayload()
  const media = await payload.find({ collection: 'media', limit: 100, overrideAccess: true })

  for (const job of JOBS) {
    const doc = media.docs.find((d) => (d.filename ?? '').startsWith(job.prefix))
    if (!doc) {
      console.warn(`[images] no media doc matching prefix "${job.prefix}" — skipped`)
      continue
    }
    const filePath = await prepare(job)
    await payload.update({
      collection: 'media',
      id: doc.id,
      data: { alt: job.alt },
      filePath,
      overrideAccess: true,
    })
    console.log(`[images] ${doc.filename} -> ${job.uploadAs}`)
  }

  console.log('[images] done')
  process.exit(0)
}

void run()
