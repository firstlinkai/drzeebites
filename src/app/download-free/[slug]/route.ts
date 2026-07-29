import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { NextResponse } from 'next/server'

import { isFreeDownloadsMode } from '@/lib/commerce/free-mode'
import { getPayload } from '@/lib/payload'
import type { ProductFile } from '@/payload-types'

export const dynamic = 'force-dynamic'

const dirname = path.dirname(fileURLToPath(import.meta.url))
// src/app/download-free/[slug]/ -> project root /private (ProductFiles staticDir)
const PRIVATE_DIR = path.resolve(dirname, '../../../../private')

/**
 * Launch-preview download route: serves a product's PDF with no purchase
 * while FREE_DOWNLOADS_MODE=true. Returns 404 otherwise, so flipping the env
 * flag fully closes it. Production redirects to the Blob URL (?download=1
 * forces attachment) to keep large files off the function; dev streams from
 * disk.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!isFreeDownloadsMode()) {
    return new NextResponse('Not found', { status: 404 })
  }

  const { slug } = await params
  const payload = await getPayload()

  // Anonymous access rules first: only published + active products qualify.
  const products = await payload.find({
    collection: 'products',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
    overrideAccess: false,
  })
  const product = products.docs[0]
  if (!product || !product.active || !product.pdf) {
    return NextResponse.redirect(new URL('/shop', process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'), 303)
  }

  const pdfId = typeof product.pdf === 'object' ? product.pdf.id : product.pdf
  const pdf = (await payload.findByID({
    collection: 'product-files',
    id: pdfId,
    overrideAccess: true,
  })) as ProductFile
  const filename = path.posix.basename(pdf.filename ?? '')
  if (!filename) return new NextResponse('File unavailable', { status: 404 })

  const headers: Record<string, string> = {
    'Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex, nofollow',
  }

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN
  if (blobToken) {
    const storeId = blobToken.match(/^vercel_blob_rw_([a-z\d]+)_[a-z\d]+$/i)?.[1]?.toLowerCase()
    if (!storeId) return new NextResponse('File unavailable', { status: 500 })
    const blobUrl = `https://${storeId}.public.blob.vercel-storage.com/${encodeURIComponent(filename)}?download=1`
    return NextResponse.redirect(blobUrl, { status: 307, headers })
  }

  const buf = await fs.readFile(path.join(PRIVATE_DIR, filename))
  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      ...headers,
      'Content-Type': 'application/pdf',
      'Content-Length': String(buf.byteLength),
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
