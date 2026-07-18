/**
 * Idempotent Stripe (TEST mode) setup for the seeded flagship product.
 *
 * Run with: pnpm exec tsx --env-file=.env src/scripts/stripe-setup.ts
 *
 * For every active Payload product it ensures a Stripe Product (tagged with
 * metadata.payloadProductId) and an active USD Price matching `priceCents`
 * exist, then writes the price id back to the Payload doc's `stripePriceId`
 * (published version). Safe to run repeatedly.
 */
import { getPayload } from 'payload'
import type Stripe from 'stripe'

import config from '@payload-config'

import { getStripe } from '@/lib/commerce/stripe'

const log = (msg: string) => console.log(`[stripe-setup] ${msg}`)

async function findStripeProduct(stripe: Stripe, payloadProductId: string, name: string) {
  try {
    const res = await stripe.products.search({
      query: `metadata['payloadProductId']:'${payloadProductId}'`,
      limit: 1,
    })
    if (res.data[0]) return res.data[0]
  } catch {
    // products.search unavailable on some accounts — fall through to list.
  }
  const listed = await stripe.products.list({ limit: 100, active: true })
  return (
    listed.data.find((p) => p.metadata.payloadProductId === payloadProductId) ??
    listed.data.find((p) => p.name === name) ??
    null
  )
}

async function main() {
  const stripe = getStripe()
  if (!process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')) {
    throw new Error('Refusing to run: STRIPE_SECRET_KEY is not a test-mode key (sk_test_...)')
  }

  const payload = await getPayload({ config })
  const { docs: products } = await payload.find({
    collection: 'products',
    where: { active: { equals: true } },
    draft: false,
    limit: 50,
    overrideAccess: true,
  })
  if (products.length === 0) {
    log('no active products found — run pnpm seed first')
    process.exit(1)
  }

  for (const product of products) {
    const pid = String(product.id)
    log(`product "${product.name}" (payload id ${pid}, ${product.priceCents} cents)`)

    let stripeProduct = await findStripeProduct(stripe, pid, product.name)
    if (stripeProduct) {
      log(`  stripe product exists: ${stripeProduct.id}`)
      if (stripeProduct.metadata.payloadProductId !== pid) {
        stripeProduct = await stripe.products.update(stripeProduct.id, {
          metadata: { ...stripeProduct.metadata, payloadProductId: pid },
        })
        log('  tagged with payloadProductId metadata')
      }
    } else {
      stripeProduct = await stripe.products.create({
        name: product.name,
        description: product.shortPitch ?? undefined,
        metadata: { payloadProductId: pid },
      })
      log(`  stripe product created: ${stripeProduct.id}`)
    }

    const prices = await stripe.prices.list({ product: stripeProduct.id, active: true, limit: 100 })
    let price = prices.data.find((p) => p.currency === 'usd' && p.unit_amount === product.priceCents)
    if (price) {
      log(`  stripe price exists: ${price.id}`)
    } else {
      price = await stripe.prices.create({
        product: stripeProduct.id,
        currency: 'usd',
        unit_amount: product.priceCents,
        metadata: { payloadProductId: pid },
      })
      log(`  stripe price created: ${price.id}`)
    }

    if (product.stripePriceId === price.id) {
      log('  payload doc already up to date')
    } else {
      await payload.update({
        collection: 'products',
        id: product.id,
        data: { stripePriceId: price.id },
        draft: false,
        overrideAccess: true,
      })
      log(`  saved stripePriceId=${price.id} on payload product ${pid}`)
    }
  }

  log('done')
  process.exit(0)
}

main().catch((err) => {
  console.error('[stripe-setup] failed:', err)
  process.exit(1)
})
