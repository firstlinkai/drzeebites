import type { Payload } from 'payload'

import type { Order, Product } from '@/payload-types'

import { generateDownloadToken, tokenExpiry } from './token'

/**
 * Order data access for commerce flows. Orders are admin-only, so every call
 * here uses the local API with `overrideAccess: true` — these functions must
 * only ever run on the server in trusted code paths (webhook, download route,
 * thank-you page, re-request action).
 */

/** Idempotency lookup: any order already recorded for this event OR session. */
export async function findExistingOrder(
  payload: Payload,
  { eventId, sessionId }: { eventId?: string; sessionId?: string },
): Promise<Order | null> {
  const ors = []
  if (eventId) ors.push({ stripeEventId: { equals: eventId } })
  if (sessionId) ors.push({ stripeSessionId: { equals: sessionId } })
  if (ors.length === 0) return null
  const res = await payload.find({
    collection: 'orders',
    where: { or: ors },
    limit: 1,
    overrideAccess: true,
  })
  return res.docs[0] ?? null
}

export async function findOrderBySessionId(payload: Payload, sessionId: string): Promise<Order | null> {
  const res = await payload.find({
    collection: 'orders',
    where: { stripeSessionId: { equals: sessionId } },
    limit: 1,
    overrideAccess: true,
  })
  return res.docs[0] ?? null
}

export async function findOrderByToken(payload: Payload, token: string): Promise<Order | null> {
  const res = await payload.find({
    collection: 'orders',
    where: { downloadToken: { equals: token } },
    limit: 1,
    overrideAccess: true,
  })
  return res.docs[0] ?? null
}

export type CreatePaidOrderArgs = {
  email: string
  productId: number
  amountCents: number
  currency: string
  stripeSessionId: string
  stripeEventId: string
}

/** Create a paid order with a fresh signed download token. */
export async function createPaidOrder(payload: Payload, args: CreatePaidOrderArgs): Promise<Order> {
  return payload.create({
    collection: 'orders',
    data: {
      email: args.email,
      product: args.productId,
      amountCents: args.amountCents,
      currency: args.currency,
      stripeSessionId: args.stripeSessionId,
      stripeEventId: args.stripeEventId,
      downloadToken: generateDownloadToken(),
      tokenExpiresAt: tokenExpiry(),
      downloadCount: 0,
      status: 'paid',
    },
    overrideAccess: true,
  })
}

export async function setOrderStatus(
  payload: Payload,
  orderId: number,
  status: NonNullable<Order['status']>,
): Promise<void> {
  await payload.update({
    collection: 'orders',
    id: orderId,
    data: { status },
    overrideAccess: true,
  })
}

/** Record one successful download. */
export async function incrementDownloadCount(payload: Payload, order: Order): Promise<void> {
  await payload.update({
    collection: 'orders',
    id: order.id,
    data: { downloadCount: (order.downloadCount ?? 0) + 1 },
    overrideAccess: true,
  })
}

/**
 * Issue a fresh token + expiry on an existing paid order. The download count
 * is intentionally kept — re-requesting a link does not reset the 5-download
 * budget.
 */
export async function reissueDownloadToken(payload: Payload, orderId: number): Promise<Order> {
  return payload.update({
    collection: 'orders',
    id: orderId,
    data: {
      downloadToken: generateDownloadToken(),
      tokenExpiresAt: tokenExpiry(),
    },
    overrideAccess: true,
  })
}

/** Resolve the order's product doc (published version, depth 1 for the pdf rel). */
export async function resolveOrderProduct(payload: Payload, order: Order): Promise<Product | null> {
  const productId = typeof order.product === 'number' ? order.product : order.product?.id
  if (!productId) return null
  try {
    return await payload.findByID({
      collection: 'products',
      id: productId,
      depth: 1,
      overrideAccess: true,
    })
  } catch {
    return null
  }
}
