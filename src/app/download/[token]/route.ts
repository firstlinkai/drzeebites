import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { NextResponse } from 'next/server'

import { findOrderByToken, incrementDownloadCount, resolveOrderProduct } from '@/lib/commerce/orders'
import { isValidTokenFormat, MAX_DOWNLOADS } from '@/lib/commerce/token'
import { getPayload } from '@/lib/payload'
import type { ProductFile } from '@/payload-types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DOWNLOAD_FILENAME = 'diabetic-air-fryer-cookbook.pdf'

const dirname = path.dirname(fileURLToPath(import.meta.url))
// src/app/download/[token]/ -> project root /private (matches ProductFiles staticDir)
const PRIVATE_DIR = path.resolve(dirname, '../../../../private')

type FailReason = 'invalid' | 'expired' | 'used'

function fail(req: Request, reason: FailReason, token?: string): NextResponse {
  const url = new URL('/download-help', process.env.NEXT_PUBLIC_SERVER_URL || req.url)
  url.searchParams.set('reason', reason)
  // Pass the token back (except for invalid ones) so the re-request form can prefill.
  if (token && reason !== 'invalid') url.searchParams.set('token', token)
  return NextResponse.redirect(url, 303)
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
): Promise<NextResponse> {
  const { token } = await params

  // Layer 1: stateless — shape + HMAC signature (tamper-evident, no DB touch).
  if (!isValidTokenFormat(token)) {
    return fail(req, 'invalid')
  }

  const payload = await getPayload()

  // Layer 2: stateful — the token must belong to a real order.
  const order = await findOrderByToken(payload, token)
  if (!order) return fail(req, 'invalid')

  // Refunded orders lose download access. 'emailFailed' is still a PAID order
  // (only the receipt email failed), so it may download.
  if (order.status === 'refunded') return fail(req, 'invalid')
  if (order.tokenExpiresAt && new Date(order.tokenExpiresAt).getTime() < Date.now()) {
    return fail(req, 'expired', token)
  }
  if ((order.downloadCount ?? 0) >= MAX_DOWNLOADS) {
    return fail(req, 'used', token)
  }

  const product = await resolveOrderProduct(payload, order)
  const pdf = product?.pdf
  if (!pdf || typeof pdf === 'number' || !pdf.filename) {
    console.error(`[download] order ${order.id}: product pdf not resolvable`)
    return fail(req, 'invalid')
  }

  let body: BodyInit
  let size: number | undefined
  try {
    const file = await loadPdf(pdf)
    body = file.body
    size = file.size
  } catch (err) {
    console.error(`[download] order ${order.id}: failed to load pdf "${pdf.filename}":`, err)
    return fail(req, 'invalid')
  }

  await incrementDownloadCount(payload, order)

  const headers = new Headers({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${DOWNLOAD_FILENAME}"`,
    'Cache-Control': 'no-store',
  })
  if (size !== undefined) headers.set('Content-Length', String(size))
  return new NextResponse(body, { status: 200, headers })
}

/**
 * Load the private PDF, streaming it server-side so no storage URL is ever
 * exposed to the client.
 *
 * - Production (BLOB_READ_WRITE_TOKEN set): files live in Vercel Blob. The
 *   plugin stores the random-suffixed blob basename as the doc's `filename`,
 *   so the blob URL is `https://<storeId>.public.blob.vercel-storage.com/
 *   <filename>` (same construction as the plugin's own generateURL, no
 *   prefixes configured). Note the doc's `url` field is NOT usable here — it
 *   points at Payload's admin-only file endpoint.
 * - Local dev: read from the private/ dir on disk (ProductFiles staticDir).
 */
async function loadPdf(pdf: ProductFile): Promise<{ body: BodyInit; size?: number }> {
  const filename = path.posix.basename(pdf.filename ?? '') // strip any path components
  if (!filename) throw new Error('empty filename')

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN
  if (blobToken) {
    const storeId = blobToken.match(/^vercel_blob_rw_([a-z\d]+)_[a-z\d]+$/i)?.[1]?.toLowerCase()
    if (!storeId) throw new Error('cannot derive store id from BLOB_READ_WRITE_TOKEN')
    const blobUrl = `https://${storeId}.public.blob.vercel-storage.com/${encodeURIComponent(filename)}`
    const res = await fetch(blobUrl)
    if (!res.ok || !res.body) throw new Error(`blob fetch failed with status ${res.status}`)
    const len = res.headers.get('content-length')
    return { body: res.body, size: len ? Number(len) : (pdf.filesize ?? undefined) }
  }

  const filePath = path.join(PRIVATE_DIR, filename)
  const buf = await fs.readFile(filePath)
  return { body: new Uint8Array(buf), size: buf.byteLength }
}
