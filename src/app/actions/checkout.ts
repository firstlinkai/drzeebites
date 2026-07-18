'use server'

import { getStripe } from '@/lib/commerce/stripe'
import { getPayload } from '@/lib/payload'
import type { Product } from '@/payload-types'

export type CheckoutResult = { url: string } | { error: string }

const GENERIC_ERROR = 'Sorry, we could not start checkout. Please try again in a moment.'

/**
 * Creates a Stripe hosted Checkout Session for the given product and returns
 * the redirect URL. The product must be published, active, and wired to a
 * Stripe price.
 */
export async function createCheckoutSession(productId: string): Promise<CheckoutResult> {
  const id = Number(productId)
  if (!Number.isInteger(id) || id <= 0) {
    return { error: 'This product is not available.' }
  }

  let product: Product | null = null
  try {
    const payload = await getPayload()
    // overrideAccess: false → anonymous access rules apply (published + active only).
    product = await payload.findByID({
      collection: 'products',
      id,
      draft: false,
      depth: 0,
      overrideAccess: false,
    })
  } catch {
    product = null
  }

  if (!product || !product.active) {
    return { error: 'This product is not available.' }
  }
  if (!product.stripePriceId) {
    console.error(`[checkout] product ${id} has no stripePriceId`)
    return { error: 'This product is not available for purchase yet.' }
  }

  const serverUrl = (process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(/\/$/, '')

  try {
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: product.stripePriceId, quantity: 1 }],
      success_url: `${serverUrl}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${serverUrl}/shop/${product.slug}?cancelled=1`,
      metadata: { productId: String(product.id) },
      invoice_creation: { enabled: true },
      billing_address_collection: 'auto',
    })
    if (!session.url) {
      console.error('[checkout] session created without url', session.id)
      return { error: GENERIC_ERROR }
    }
    return { url: session.url }
  } catch (err) {
    console.error('[checkout] failed to create session:', err)
    return { error: GENERIC_ERROR }
  }
}
