import Stripe from 'stripe'

let client: Stripe | null = null

/**
 * Lazily-constructed Stripe client (server-only). Lazy so that importing this
 * module never throws at build time when the env var is absent.
 */
export function getStripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
    client = new Stripe(key, {
      appInfo: { name: 'DrZeeBites', url: process.env.NEXT_PUBLIC_SERVER_URL },
    })
  }
  return client
}
