import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest'

// Module-boundary mocks: no Payload config, no Resend.
vi.mock('@/lib/payload', () => ({ getPayload: vi.fn() }))
vi.mock('@/lib/commerce/emails', () => ({
  sendFreshLinkEmail: vi.fn(),
  sendReceiptEmail: vi.fn(),
  downloadUrl: (token: string) => `http://localhost:3000/download/${token}`,
}))

import { requestNewDownloadLink } from '@/app/(site)/download-help/actions'
import { sendFreshLinkEmail } from '@/lib/commerce/emails'
import { generateDownloadToken } from '@/lib/commerce/token'
import { getPayload } from '@/lib/payload'

const TOKEN_RE = /^[0-9a-f]{48}\.[0-9a-f]{64}$/
const GENERIC_SNIPPET = 'If that link belongs to a valid order'
const TEN_MIN = 10 * 60 * 1000

function formDataWith(token: string | null): FormData {
  const fd = new FormData()
  if (token !== null) fd.set('token', token)
  return fd
}

function makeOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: 42,
    email: 'buyer@example.com',
    product: 7,
    status: 'paid',
    downloadToken: generateDownloadToken(),
    updatedAt: new Date(Date.now() - TEN_MIN - 60_000).toISOString(), // eligible by default
    ...overrides,
  }
}

let find: Mock
let update: Mock
let findByID: Mock

beforeEach(() => {
  vi.clearAllMocks()
  find = vi.fn().mockResolvedValue({ docs: [] })
  update = vi.fn().mockImplementation(async ({ id, data }: { id: number; data: Record<string, unknown> }) => ({
    ...makeOrder(),
    id,
    ...data,
  }))
  findByID = vi.fn().mockResolvedValue({ id: 7, name: 'Test Cookbook', slug: 'test-cookbook' })
  ;(getPayload as Mock).mockResolvedValue({ find, update, findByID })
  ;(sendFreshLinkEmail as Mock).mockResolvedValue({ ok: true })
})

const PREV = { done: false, message: '' }

describe('requestNewDownloadLink (reissue with 10-minute rate limit)', () => {
  it('returns the generic message for garbage input without touching the DB', async () => {
    const res = await requestNewDownloadLink(PREV, formDataWith('not-a-token'))
    expect(res.done).toBe(true)
    expect(res.message).toContain(GENERIC_SNIPPET)
    expect(getPayload).not.toHaveBeenCalled()
  })

  it('returns the generic message for a forged (well-shaped but unsigned) token, DB untouched', async () => {
    const forged = `${'a'.repeat(48)}.${'b'.repeat(64)}`
    const res = await requestNewDownloadLink(PREV, formDataWith(forged))
    expect(res.message).toContain(GENERIC_SNIPPET)
    expect(getPayload).not.toHaveBeenCalled()
  })

  it('returns the same generic message when no order matches the token (anti-enumeration)', async () => {
    const res = await requestNewDownloadLink(PREV, formDataWith(generateDownloadToken()))
    expect(res.message).toContain(GENERIC_SNIPPET)
    expect(update).not.toHaveBeenCalled()
    expect(sendFreshLinkEmail).not.toHaveBeenCalled()
  })

  it('rate limit: order touched < 10 minutes ago → no reissue, no email, same message', async () => {
    const order = makeOrder({ updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString() })
    find.mockResolvedValue({ docs: [order] })

    const res = await requestNewDownloadLink(PREV, formDataWith(order.downloadToken as string))
    expect(res.message).toContain(GENERIC_SNIPPET)
    expect(update).not.toHaveBeenCalled()
    expect(sendFreshLinkEmail).not.toHaveBeenCalled()
  })

  it('rate limit boundary: just under 10 minutes is still blocked', async () => {
    const order = makeOrder({ updatedAt: new Date(Date.now() - TEN_MIN + 5_000).toISOString() })
    find.mockResolvedValue({ docs: [order] })

    await requestNewDownloadLink(PREV, formDataWith(order.downloadToken as string))
    expect(update).not.toHaveBeenCalled()
  })

  it('order last touched > 10 minutes ago → reissues a fresh token + expiry and emails it', async () => {
    const order = makeOrder({ updatedAt: new Date(Date.now() - TEN_MIN - 60_000).toISOString() })
    find.mockResolvedValue({ docs: [order] })

    const res = await requestNewDownloadLink(PREV, formDataWith(order.downloadToken as string))

    expect(res.message).toContain(GENERIC_SNIPPET) // response is indistinguishable
    expect(update).toHaveBeenCalledTimes(1)
    const args = update.mock.calls[0][0]
    expect(args.collection).toBe('orders')
    expect(args.id).toBe(42)
    expect(args.data.downloadToken).toMatch(TOKEN_RE)
    expect(args.data.downloadToken).not.toBe(order.downloadToken) // fresh token
    const expiry = new Date(args.data.tokenExpiresAt).getTime()
    expect(Math.abs(expiry - (Date.now() + 7 * 24 * 60 * 60 * 1000))).toBeLessThan(60_000)
    // download count is NOT reset by a reissue
    expect(args.data.downloadCount).toBeUndefined()

    expect(sendFreshLinkEmail).toHaveBeenCalledTimes(1)
  })

  it('accepts a full pasted download URL and extracts the token from it', async () => {
    const order = makeOrder()
    find.mockResolvedValue({ docs: [order] })

    await requestNewDownloadLink(
      PREV,
      formDataWith(`  http://localhost:3000/download/${order.downloadToken} `),
    )
    expect(update).toHaveBeenCalledTimes(1)
  })

  it('refunded orders never get a fresh link (but the response stays generic)', async () => {
    const order = makeOrder({ status: 'refunded' })
    find.mockResolvedValue({ docs: [order] })

    const res = await requestNewDownloadLink(PREV, formDataWith(order.downloadToken as string))
    expect(res.message).toContain(GENERIC_SNIPPET)
    expect(update).not.toHaveBeenCalled()
    expect(sendFreshLinkEmail).not.toHaveBeenCalled()
  })

  it('swallows unexpected DB errors and still returns the generic message', async () => {
    find.mockRejectedValue(new Error('db down'))
    const res = await requestNewDownloadLink(PREV, formDataWith(generateDownloadToken()))
    expect(res.done).toBe(true)
    expect(res.message).toContain(GENERIC_SNIPPET)
  })
})
