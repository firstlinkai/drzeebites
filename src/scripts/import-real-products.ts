/**
 * Imports the real DrZeeBites products from the owner's asset drop:
 *  - replaces the placeholder cookbook PDF with the real book
 *  - uploads the marketing/interior screenshots as gallery media
 *  - updates product 1 (The Diabetic Air Fryer Cookbook, $27)
 *  - creates product 2 (15-Minute Air Fryer Recipes for Diabetes, $19)
 *
 * Idempotent: media/files are matched by filename, products by slug.
 *
 * Run: ASSETS_DIR=<staged dir> pnpm exec tsx --env-file=.env src/scripts/import-real-products.ts
 * (add DATABASE_URI/PAYLOAD_SECRET/BLOB_READ_WRITE_TOKEN overrides for prod)
 */
import path from 'path'

import type { Payload } from 'payload'

import { getPayload } from '@/lib/payload'
import { richText } from '@/seed/richText'

const ASSETS_DIR = process.env.ASSETS_DIR
if (!ASSETS_DIR) throw new Error('ASSETS_DIR env var required')

const asset = (name: string) => path.join(ASSETS_DIR, name)

const ensureMedia = async (payload: Payload, filename: string, alt: string): Promise<number> => {
  const existing = await payload.find({
    collection: 'media',
    where: { filename: { equals: filename } },
    limit: 1,
    overrideAccess: true,
  })
  if (existing.docs[0]) {
    console.log(`[import] media exists: ${filename}`)
    return existing.docs[0].id
  }
  const doc = await payload.create({
    collection: 'media',
    data: { alt },
    filePath: asset(filename),
    overrideAccess: true,
  })
  console.log(`[import] media uploaded: ${filename}`)
  return doc.id
}

const ensurePdf = async (payload: Payload, filename: string, title: string): Promise<number> => {
  const existing = await payload.find({
    collection: 'product-files',
    where: { filename: { equals: filename } },
    limit: 1,
    overrideAccess: true,
  })
  if (existing.docs[0]) {
    console.log(`[import] pdf exists: ${filename}`)
    return existing.docs[0].id
  }
  const doc = await payload.create({
    collection: 'product-files',
    data: { title },
    filePath: asset(filename),
    overrideAccess: true,
  })
  console.log(`[import] pdf uploaded: ${filename}`)
  return doc.id
}

const run = async () => {
  const payload = await getPayload()

  // ---- files ----
  const cookbookPdf = await ensurePdf(
    payload,
    'diabetic-air-fryer-cookbook.pdf',
    'The Diabetic Air Fryer Cookbook (full book)',
  )
  const fifteenMinPdf = await ensurePdf(
    payload,
    '15-minute-air-fryer-recipes.pdf',
    '15-Minute Air Fryer Recipes for Diabetes (full book)',
  )

  // ---- gallery media ----
  const coverMarketing = await ensureMedia(
    payload,
    'cookbook-cover-marketing.jpg',
    'The Diabetic Air Fryer Cookbook — 30+ easy, healthy recipes for balanced blood sugar, meal plan included',
  )
  const sampleSalmon = await ensureMedia(
    payload,
    'cookbook-sample-salmon.jpg',
    'Inside the cookbook: Parmesan Crusted Salmon recipe spread with full nutrition facts',
  )
  const sampleMealPlan = await ensureMedia(
    payload,
    'sample-7day-meal-plan.jpg',
    'Inside the cookbook: 7-Day Diabetic Meal Plan spread with daily nutrition targets',
  )
  const bonusMealPlanning = await ensureMedia(
    payload,
    'cookbook-bonus-meal-planning.jpg',
    'Bonus section: Diabetic Meal Planning — 7-day plan, portion and carb guidance, grocery lists',
  )
  const fifteenCover = await ensureMedia(
    payload,
    '15-minute-cover-panel.jpg',
    '15-Minute Air Fryer Recipes — weight-loss and blood sugar management, quick healthy meals',
  )
  const sampleCheesecake = await ensureMedia(
    payload,
    'sample-cheesecake.jpg',
    'Inside the book: Strawberry Cheesecake Cups dessert recipe spread with nutrition information',
  )
  const bundleHero = await ensureMedia(
    payload,
    'bundle-hero.jpg',
    'The Ultimate Diabetic Air Fryer Bundle — both DrZeeBites cookbooks together',
  )

  // ---- product 1: update ----
  const p1 = await payload.find({
    collection: 'products',
    where: { slug: { equals: 'diabetic-air-fryer-cookbook' } },
    limit: 1,
    overrideAccess: true,
  })
  if (p1.docs[0]) {
    await payload.update({
      collection: 'products',
      id: p1.docs[0].id,
      data: {
        pdf: cookbookPdf,
        gallery: [
          { image: coverMarketing },
          { image: sampleSalmon },
          { image: sampleMealPlan },
          { image: bonusMealPlanning },
        ],
        shortPitch:
          '30+ easy, healthy and delicious air fryer recipes for balanced blood sugar — low carb, kidney friendly, gluten free, with the full Diabetic Meal Planning bonus section and 7-day meal plan included.',
      },
      overrideAccess: true,
    })
    console.log('[import] product 1 updated (real PDF + gallery)')
  } else {
    console.warn('[import] product diabetic-air-fryer-cookbook not found!')
  }

  // ---- product 2: create/update ----
  const SLUG2 = '15-minute-air-fryer-recipes'
  const p2 = await payload.find({
    collection: 'products',
    where: { slug: { equals: SLUG2 } },
    limit: 1,
    overrideAccess: true,
  })
  const p2data = {
    name: '15-Minute Air Fryer Recipes for Diabetes',
    slug: SLUG2,
    priceCents: 1900,
    shortPitch:
      'Quick, easy and healthy air fryer meals in 15 minutes or less — built for weight loss and stable blood sugar. Beginner friendly, affordable ingredients, every recipe tested and loved.',
    salesContent: richText([
      { kind: 'h2', text: 'Delicious. Nutritious. Done in minutes.' },
      'No time to cook shouldn’t mean unstable blood sugar. This premium cookbook is built around one promise: real, comforting meals on your plate in 15 minutes or less — every one of them supporting weight loss and blood sugar management.',
      { kind: 'h2', text: 'What’s inside' },
      'Quick, healthy and delicious recipes across breakfasts, mains, sides and desserts — from crispy salmon fillets to mini frittata cups and guilt-free sweet treats. Every recipe is nutrient-packed, beginner friendly, uses affordable supermarket ingredients, and is tested and loved.',
      { kind: 'h2', text: 'Made for real life' },
      '15 minutes or less per recipe. Simple steps. No obscure ingredients. Whether you’re managing diabetes, prediabetes, or just want faster healthy dinners — this book makes the healthy choice the easy choice.',
      'Instant PDF download — read it on any phone, tablet or computer, yours forever.',
    ]),
    pdf: fifteenMinPdf,
    gallery: [{ image: fifteenCover }, { image: sampleCheesecake }, { image: bundleHero }],
    active: true,
    _status: 'published' as const,
  }
  if (p2.docs[0]) {
    await payload.update({ collection: 'products', id: p2.docs[0].id, data: p2data, overrideAccess: true })
    console.log('[import] product 2 updated')
  } else {
    await payload.create({ collection: 'products', data: p2data, overrideAccess: true })
    console.log('[import] product 2 created')
  }

  console.log('[import] done')
  process.exit(0)
}

void run()
