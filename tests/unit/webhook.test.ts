import crypto from 'node:crypto'
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest'

// Module-boundary mocks — no DB, no network, no real Payload config.
vi.mock('@/lib/payload', () => ({ getPayload: vi.fn() }))
vi.mock('@/lib/email', () => ({ sendEmail: vi.fn() }))

import { POST } from '@/app/api/webhooks/stripe/route'
import { getStripe } from '@/lib/commerce/stripe'
import { sendEmail } from '@/lib/email'
import { getPayload } from '@/lib/payload'

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET as string
const TOKEN_RE = /^[0-9a-f]{48}\.[0-9a-f]{64}$/

/** Compute a real `stripe-signature` header value (t=..,v1=HMAC) ourselves. */
function stripeSignature(body: string, secret: string, timestamp = Math.floor(Date.now() / 1000)): string {
  const v1 = crypto.createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')
  return `t=${timestamp},v1=${v1}`
}

function webhookRequest(body: string, signature?: string): Request {
  const headers = new Headers({ 'content-type': 'application/json' })
  if (signature) headers.set('stripe-signature', signature)
  return new Request('http://localhost:3000/api/webhooks/stripe', { method: 'POST', headers, body })
}

function checkoutCompletedEvent(overrides: Record<string, unknown> = {}, eventId = 'evt_test_1') {
  return {
    id: eventId,
    object: 'event',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_abc123',
        object: 'checkout.session',
        payment_status: 'paid',
        customer_details: { email: 'buyer@example.com' },
        customer_email: null,
        metadata: { productId: '7' },
        amount_total: 1999,
        currency: 'usd',
        ...overrides,
      },
    },
  }
}

type FakePayload = {
  find: Mock
  create: Mock
  update: Mock
  findByID: Mock
}

function makeFakePayload(): FakePayload {
  return {
    find: vi.fn().mockResolvedValue({ docs: [] }),
    create: vi.fn().mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: 101,
      ...data,
    })),
    update: vi.fn().mockImplementation(async ({ id, data }: { id: number; data: Record<string, unknown> }) => ({
      id,
      ...data,
    })),
    findByID: vi.fn().mockResolvedValue({ id: 7, name: 'Test Cookbook', slug: 'test-cookbook' }),
  }
}

let payload: FakePayload

beforeEach(() => {
  vi.clearAllMocks()
  payload = makeFakePayload()
  ;(getPayload as Mock).mockResolvedValue(payload)
  ;(sendEmail as Mock).mockResolvedValue({ ok: true })
})

describe('POST /api/webhooks/stripe — signature verification', () => {
  it('returns 400 when the stripe-signature header is missing', async () => {
    const res = await POST(webhookRequest(JSON.stringify(checkoutCompletedEvent())))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'missing signature' })
    expect(payload.create).not.toHaveBeenCalled()
  })

  it('returns 400 when the signature is computed with the wrong secret', async () => {
    const body = JSON.stringify(checkoutCompletedEvent())
    const res = await POST(webhookRequest(body, stripeSignature(body, 'whsec_wrong_secret')))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'invalid signature' })
    expect(payload.create).not.toHaveBeenCalled()
  })

  it('returns 400 when the signed body was tampered with after signing', async () => {
    const body = JSON.stringify(checkoutCompletedEvent())
    const signature = stripeSignature(body, WEBHOOK_SECRET)
    const tampered = body.replace('1999', '1')
    const res = await POST(webhookRequest(tampered, signature))
    expect(res.status).toBe(400)
    expect(payload.create).not.toHaveBeenCalled()
  })
})

describe('POST /api/webhooks/stripe — checkout.session.completed', () => {
  it('creates an order with a signed token and sends the receipt email', async () => {
    const body = JSON.stringify(checkoutCompletedEvent())
    const res = await POST(webhookRequest(body, stripeSignature(body, WEBHOOK_SECRET)))

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ received: true })

    expect(payload.create).toHaveBeenCalledTimes(1)
    const createArgs = payload.create.mock.calls[0][0]
    expect(createArgs.collection).toBe('orders')
    expect(createArgs.data).toMatchObject({
      email: 'buyer@example.com',
      product: 7,
      amountCents: 1999,
      currency: 'usd',
      stripeSessionId: 'cs_test_abc123',
      stripeEventId: 'evt_test_1',
      downloadCount: 0,
      status: 'paid',
    })
    expect(createArgs.data.downloadToken).toMatch(TOKEN_RE)
    // 7-day expiry (within a minute of tolerance)
    const expiry = new Date(createArgs.data.tokenExpiresAt).getTime()
    expect(Math.abs(expiry - (Date.now() + 7 * 24 * 60 * 60 * 1000))).toBeLessThan(60_000)

    expect(sendEmail).toHaveBeenCalledTimes(1)
    const emailArgs = (sendEmail as Mock).mock.calls[0][0]
    expect(emailArgs.to).toBe('buyer@example.com')
    expect(emailArgs.html).toContain(createArgs.data.downloadToken)

    // No failure-status write on the happy path.
    expect(payload.update).not.toHaveBeenCalled()
  })

  it('is idempotent: duplicate eventId/sessionId → 200 with no second create and no email', async () => {
    payload.find.mockResolvedValue({
      docs: [{ id: 55, stripeEventId: 'evt_test_1', stripeSessionId: 'cs_test_abc123' }],
    })
    const body = JSON.stringify(checkoutCompletedEvent())
    const res = await POST(webhookRequest(body, stripeSignature(body, WEBHOOK_SECRET)))

    expect(res.status).toBe(200)
    expect(payload.create).not.toHaveBeenCalled()
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('email failure → order still created, status set to emailFailed, response still 200', async () => {
    ;(sendEmail as Mock).mockResolvedValue({ ok: false, error: 'smtp down' })
    const body = JSON.stringify(checkoutCompletedEvent())
    const res = await POST(webhookRequest(body, stripeSignature(body, WEBHOOK_SECRET)))

    expect(res.status).toBe(200)
    expect(payload.create).toHaveBeenCalledTimes(1)
    expect(payload.update).toHaveBeenCalledTimes(1)
    expect(payload.update.mock.calls[0][0]).toMatchObject({
      collection: 'orders',
      id: 101,
      data: { status: 'emailFailed' },
    })
  })

  it('email THROW (not just {ok:false}) → same emailFailed handling, still 200', async () => {
    ;(sendEmail as Mock).mockRejectedValue(new Error('network exploded'))
    const body = JSON.stringify(checkoutCompletedEvent())
    const res = await POST(webhookRequest(body, stripeSignature(body, WEBHOOK_SECRET)))

    expect(res.status).toBe(200)
    expect(payload.create).toHaveBeenCalledTimes(1)
    expect(payload.update.mock.calls[0][0].data).toEqual({ status: 'emailFailed' })
  })

  it('acknowledges (200, no order) when payment_status is not paid', async () => {
    const body = JSON.stringify(checkoutCompletedEvent({ payment_status: 'unpaid' }))
    const res = await POST(webhookRequest(body, stripeSignature(body, WEBHOOK_SECRET)))

    expect(res.status).toBe(200)
    expect(getPayload).not.toHaveBeenCalled()
    expect(payload.create).not.toHaveBeenCalled()
  })

  it('acknowledges (200, no order) when email or productId metadata is missing', async () => {
    const body = JSON.stringify(
      checkoutCompletedEvent({ customer_details: null, customer_email: null }),
    )
    const res = await POST(webhookRequest(body, stripeSignature(body, WEBHOOK_SECRET)))
    expect(res.status).toBe(200)
    expect(payload.create).not.toHaveBeenCalled()

    const body2 = JSON.stringify(checkoutCompletedEvent({ metadata: {} }, 'evt_test_2'))
    const res2 = await POST(webhookRequest(body2, stripeSignature(body2, WEBHOOK_SECRET)))
    expect(res2.status).toBe(200)
    expect(payload.create).not.toHaveBeenCalled()
  })

  it('create race (unique-constraint style throw with existing order) → 200 no-op', async () => {
    payload.create.mockRejectedValue(new Error('duplicate key value violates unique constraint'))
    // First idempotency lookup: empty. Post-race lookup: order exists.
    payload.find
      .mockResolvedValueOnce({ docs: [] })
      .mockResolvedValueOnce({ docs: [{ id: 77, stripeSessionId: 'cs_test_abc123' }] })

    const body = JSON.stringify(checkoutCompletedEvent())
    const res = await POST(webhookRequest(body, stripeSignature(body, WEBHOOK_SECRET)))
    expect(res.status).toBe(200)
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('unexpected persistence failure (no raced order) → 500 so Stripe retries', async () => {
    payload.create.mockRejectedValue(new Error('db down'))
    payload.find.mockResolvedValue({ docs: [] })

    const body = JSON.stringify(checkoutCompletedEvent())
    const res = await POST(webhookRequest(body, stripeSignature(body, WEBHOOK_SECRET)))
    expect(res.status).toBe(500)
  })
})

describe('POST /api/webhooks/stripe — charge.refunded', () => {
  function refundEvent(paymentIntent: string | null = 'pi_test_1') {
    return {
      id: 'evt_refund_1',
      object: 'event',
      type: 'charge.refunded',
      data: {
        object: {
          id: 'ch_test_1',
          object: 'charge',
          payment_intent: paymentIntent,
        },
      },
    }
  }

  it('marks the matching order refunded', async () => {
    const listSpy = vi
      .spyOn(getStripe().checkout.sessions, 'list')
      .mockResolvedValue({ data: [{ id: 'cs_test_abc123' }] } as never)
    try {
      payload.find.mockResolvedValue({ docs: [{ id: 42, status: 'paid' }] })

      const body = JSON.stringify(refundEvent())
      const res = await POST(webhookRequest(body, stripeSignature(body, WEBHOOK_SECRET)))

      expect(res.status).toBe(200)
      expect(listSpy).toHaveBeenCalledWith({ payment_intent: 'pi_test_1', limit: 1 })
      expect(payload.update).toHaveBeenCalledTimes(1)
      expect(payload.update.mock.calls[0][0]).toMatchObject({
        collection: 'orders',
        id: 42,
        data: { status: 'refunded' },
      })
    } finally {
      listSpy.mockRestore()
    }
  })

  it('is a no-op (200) when the order is already refunded', async () => {
    const listSpy = vi
      .spyOn(getStripe().checkout.sessions, 'list')
      .mockResolvedValue({ data: [{ id: 'cs_test_abc123' }] } as never)
    try {
      payload.find.mockResolvedValue({ docs: [{ id: 42, status: 'refunded' }] })

      const body = JSON.stringify(refundEvent())
      const res = await POST(webhookRequest(body, stripeSignature(body, WEBHOOK_SECRET)))

      expect(res.status).toBe(200)
      expect(payload.update).not.toHaveBeenCalled()
    } finally {
      listSpy.mockRestore()
    }
  })

  it('acknowledges (200) when the charge has no payment_intent', async () => {
    const body = JSON.stringify(refundEvent(null))
    const res = await POST(webhookRequest(body, stripeSignature(body, WEBHOOK_SECRET)))
    expect(res.status).toBe(200)
    expect(payload.update).not.toHaveBeenCalled()
  })
})

describe('POST /api/webhooks/stripe — other events', () => {
  it('acknowledges unhandled event types with 200', async () => {
    const body = JSON.stringify({
      id: 'evt_other_1',
      object: 'event',
      type: 'invoice.paid',
      data: { object: { id: 'in_test_1' } },
    })
    const res = await POST(webhookRequest(body, stripeSignature(body, WEBHOOK_SECRET)))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ received: true })
  })
})
