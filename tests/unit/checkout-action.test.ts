import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest'

// Module-boundary mocks: no Payload config, no Stripe network.
vi.mock('@/lib/payload', () => ({ getPayload: vi.fn() }))
vi.mock('@/lib/commerce/stripe', () => ({ getStripe: vi.fn() }))

import { createCheckoutSession } from '@/app/actions/checkout'
import { getStripe } from '@/lib/commerce/stripe'
import { getPayload } from '@/lib/payload'

const ACTIVE_PRODUCT = {
  id: 7,
  name: 'Test Cookbook',
  slug: 'test-cookbook',
  active: true,
  stripePriceId: 'price_test_123',
  priceCents: 1999,
}

let findByID: Mock
let sessionsCreate: Mock

beforeEach(() => {
  vi.clearAllMocks()
  findByID = vi.fn().mockResolvedValue(ACTIVE_PRODUCT)
  sessionsCreate = vi.fn().mockResolvedValue({
    id: 'cs_test_new',
    url: 'https://checkout.stripe.com/c/pay/cs_test_new',
  })
  ;(getPayload as Mock).mockResolvedValue({ findByID })
  ;(getStripe as Mock).mockReturnValue({ checkout: { sessions: { create: sessionsCreate } } })
})

describe('createCheckoutSession', () => {
  it('rejects non-numeric / non-positive product ids without touching Payload', async () => {
    for (const bad of ['abc', '-1', '0', '1.5', '']) {
      const result = await createCheckoutSession(bad)
      expect(result).toEqual({ error: 'This product is not available.' })
    }
    expect(getPayload).not.toHaveBeenCalled()
    expect(sessionsCreate).not.toHaveBeenCalled()
  })

  it('returns {error} when the product lookup throws (unpublished/missing under anonymous access)', async () => {
    findByID.mockRejectedValue(new Error('Not Found'))
    const result = await createCheckoutSession('7')
    expect(result).toEqual({ error: 'This product is not available.' })
    expect(sessionsCreate).not.toHaveBeenCalled()
  })

  it('returns {error} when the product is inactive', async () => {
    findByID.mockResolvedValue({ ...ACTIVE_PRODUCT, active: false })
    const result = await createCheckoutSession('7')
    expect(result).toEqual({ error: 'This product is not available.' })
    expect(sessionsCreate).not.toHaveBeenCalled()
  })

  it('returns {error} when the product has no stripePriceId', async () => {
    findByID.mockResolvedValue({ ...ACTIVE_PRODUCT, stripePriceId: null })
    const result = await createCheckoutSession('7')
    expect(result).toEqual({ error: 'This product is not available for purchase yet.' })
    expect(sessionsCreate).not.toHaveBeenCalled()
  })

  it('looks the product up with anonymous access rules (overrideAccess: false, published only)', async () => {
    await createCheckoutSession('7')
    expect(findByID).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'products',
        id: 7,
        draft: false,
        overrideAccess: false,
      }),
    )
  })

  it('happy path: creates a session with the right urls/metadata and returns {url}', async () => {
    const result = await createCheckoutSession('7')

    expect(result).toEqual({ url: 'https://checkout.stripe.com/c/pay/cs_test_new' })
    expect(sessionsCreate).toHaveBeenCalledTimes(1)
    const args = sessionsCreate.mock.calls[0][0]
    expect(args.mode).toBe('payment')
    expect(args.line_items).toEqual([{ price: 'price_test_123', quantity: 1 }])
    expect(args.success_url).toContain('/thank-you?session_id=')
    expect(args.success_url).toBe('http://localhost:3000/thank-you?session_id={CHECKOUT_SESSION_ID}')
    expect(args.cancel_url).toBe('http://localhost:3000/shop/test-cookbook?cancelled=1')
    expect(args.metadata).toEqual({ productId: '7' })
  })

  it('returns a generic {error} when Stripe returns a session without a url', async () => {
    sessionsCreate.mockResolvedValue({ id: 'cs_test_nourl', url: null })
    const result = await createCheckoutSession('7')
    expect('error' in result).toBe(true)
  })

  it('returns a generic {error} when Stripe throws', async () => {
    sessionsCreate.mockRejectedValue(new Error('stripe down'))
    const result = await createCheckoutSession('7')
    expect(result).toEqual({
      error: 'Sorry, we could not start checkout. Please try again in a moment.',
    })
  })
})
