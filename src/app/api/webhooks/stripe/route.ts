import { NextResponse } from 'next/server'
import type Stripe from 'stripe'

import { sendReceiptEmail } from '@/lib/commerce/emails'
import {
  createPaidOrder,
  findExistingOrder,
  findOrderBySessionId,
  resolveOrderProduct,
  setOrderStatus,
} from '@/lib/commerce/orders'
import { getStripe } from '@/lib/commerce/stripe'
import { getPayload } from '@/lib/payload'

// Signature verification needs the exact raw body — Node runtime, no caching.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ok = (received = true) => NextResponse.json({ received }, { status: 200 })

export async function POST(req: Request): Promise<NextResponse> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'webhook not configured' }, { status: 500 })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'missing signature' }, { status: 400 })
  }

  const rawBody = await req.text()

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, secret)
  } catch (err) {
    console.error('[stripe-webhook] signature verification failed:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        return await handleCheckoutCompleted(event)
      case 'charge.refunded':
        return await handleChargeRefunded(event)
      default:
        return ok()
    }
  } catch (err) {
    // Unexpected failure — let Stripe retry.
    console.error(`[stripe-webhook] handler error for ${event.type}:`, err)
    return NextResponse.json({ error: 'handler error' }, { status: 500 })
  }
}

async function handleCheckoutCompleted(event: Stripe.Event): Promise<NextResponse> {
  const session = event.data.object as Stripe.Checkout.Session

  if (session.payment_status !== 'paid') {
    // Async payment methods complete later via checkout.session.async_payment_succeeded
    // (not enabled for this shop — cards/wallets only). Acknowledge and move on.
    console.warn(`[stripe-webhook] session ${session.id} completed with payment_status=${session.payment_status}`)
    return ok()
  }

  const payload = await getPayload()

  // Idempotency: same event redelivered OR same session seen under another event.
  const existing = await findExistingOrder(payload, { eventId: event.id, sessionId: session.id })
  if (existing) {
    console.log(`[stripe-webhook] duplicate for session ${session.id} — order ${existing.id} exists, no-op`)
    return ok()
  }

  const email = session.customer_details?.email ?? session.customer_email
  const productId = Number(session.metadata?.productId)
  if (!email || !Number.isInteger(productId) || productId <= 0) {
    console.error(`[stripe-webhook] session ${session.id} missing email or productId metadata — cannot create order`)
    return ok() // malformed but ours; retrying will not fix it
  }

  let order
  try {
    order = await createPaidOrder(payload, {
      email,
      productId,
      amountCents: session.amount_total ?? 0,
      currency: session.currency ?? 'usd',
      stripeSessionId: session.id,
      stripeEventId: event.id,
    })
  } catch (err) {
    // Unique-constraint race (concurrent delivery of the same session) → no-op.
    const raced = await findExistingOrder(payload, { eventId: event.id, sessionId: session.id })
    if (raced) {
      console.log(`[stripe-webhook] race on session ${session.id} — order ${raced.id} already created`)
      return ok()
    }
    throw err
  }
  console.log(`[stripe-webhook] order ${order.id} created for session ${session.id}`)

  // Email delivery is best-effort: failures mark the order but never fail the
  // webhook — the thank-you page provides the download independently.
  try {
    const product = await resolveOrderProduct(payload, order)
    if (!product) throw new Error(`product ${String(order.product)} not found`)
    const sent = await sendReceiptEmail(order, product)
    if (!sent.ok) throw new Error(sent.error ?? 'unknown email error')
    console.log(`[stripe-webhook] receipt emailed to ${email} for order ${order.id}`)
  } catch (err) {
    console.error(`[stripe-webhook] receipt email failed for order ${order.id}:`, err)
    try {
      await setOrderStatus(payload, order.id, 'emailFailed')
    } catch (statusErr) {
      console.error(`[stripe-webhook] failed to mark order ${order.id} emailFailed:`, statusErr)
    }
  }

  return ok()
}

async function handleChargeRefunded(event: Stripe.Event): Promise<NextResponse> {
  const charge = event.data.object as Stripe.Charge
  const paymentIntent = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id
  if (!paymentIntent) {
    console.warn(`[stripe-webhook] charge ${charge.id} refunded but has no payment_intent`)
    return ok()
  }

  // Map charge → checkout session → order.
  const sessions = await getStripe().checkout.sessions.list({ payment_intent: paymentIntent, limit: 1 })
  const sessionId = sessions.data[0]?.id
  if (!sessionId) {
    console.warn(`[stripe-webhook] no checkout session for payment_intent ${paymentIntent}`)
    return ok()
  }

  const payload = await getPayload()
  const order = await findOrderBySessionId(payload, sessionId)
  if (!order) {
    console.warn(`[stripe-webhook] refund for unknown session ${sessionId}`)
    return ok()
  }
  if (order.status !== 'refunded') {
    await setOrderStatus(payload, order.id, 'refunded')
    console.log(`[stripe-webhook] order ${order.id} marked refunded (downloads disabled)`)
  }
  return ok()
}
