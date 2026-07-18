'use server'

import { sendFreshLinkEmail } from '@/lib/commerce/emails'
import { findOrderByToken, reissueDownloadToken, resolveOrderProduct } from '@/lib/commerce/orders'
import { isValidTokenFormat } from '@/lib/commerce/token'
import { getPayload } from '@/lib/payload'

export type ReRequestState = { done: boolean; message: string }

// Anti-enumeration: the response is identical whether or not the token maps to
// a real order, whether the order is refunded, or whether we rate-limited.
const GENERIC_MESSAGE =
  'If that link belongs to a valid order, we’ve emailed a fresh download link to the address used at checkout. It can take a couple of minutes to arrive — check your spam folder too.'

const RATE_LIMIT_MS = 10 * 60 * 1000 // don't reissue more than once per 10 minutes

/** Accepts a raw token or a full pasted download URL and extracts the token. */
function extractToken(input: string): string | null {
  const match = input.trim().match(/[0-9a-f]{48}\.[0-9a-f]{64}/)
  return match ? match[0] : null
}

export async function requestNewDownloadLink(
  _prev: ReRequestState,
  formData: FormData,
): Promise<ReRequestState> {
  const raw = formData.get('token')
  const token = typeof raw === 'string' ? extractToken(raw) : null

  if (!token || !isValidTokenFormat(token)) {
    // Same message as success — never reveal whether a token exists.
    return { done: true, message: GENERIC_MESSAGE }
  }

  try {
    const payload = await getPayload()
    const order = await findOrderByToken(payload, token)

    if (order && order.status !== 'refunded') {
      // Naive rate limit: the order's updatedAt moves on every write (reissue,
      // download count). If it changed in the last 10 minutes, silently skip.
      const lastTouched = new Date(order.updatedAt).getTime()
      if (Date.now() - lastTouched >= RATE_LIMIT_MS) {
        const fresh = await reissueDownloadToken(payload, order.id)
        const product = await resolveOrderProduct(payload, fresh)
        if (product) {
          const sent = await sendFreshLinkEmail(fresh, product)
          if (!sent.ok) {
            console.error(`[download-help] fresh-link email failed for order ${order.id}: ${sent.error}`)
          } else {
            console.log(`[download-help] fresh link emailed for order ${order.id}`)
          }
        }
      } else {
        console.log(`[download-help] rate-limited reissue for order ${order.id}`)
      }
    }
  } catch (err) {
    console.error('[download-help] re-request failed:', err)
  }

  return { done: true, message: GENERIC_MESSAGE }
}
