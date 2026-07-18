'use server'

export type CheckoutResult = { url: string } | { error: string }

/**
 * Creates a Stripe hosted Checkout Session for the given product and
 * returns the redirect URL. Implemented in the commerce phase.
 */
export async function createCheckoutSession(productId: string): Promise<CheckoutResult> {
  void productId
  return { error: 'Checkout is not available yet. Please try again soon.' }
}
