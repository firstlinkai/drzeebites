import { NextResponse, type NextRequest } from 'next/server'

import { getPayload } from '@/lib/payload'

/**
 * Affiliate redirect handler: /go/[id] → 302 to the affiliate destination,
 * incrementing the link's clickCount on the way through. Unknown or invalid
 * ids fall back to the homepage. Never cached — every hit must count.
 */
export const dynamic = 'force-dynamic'
export const revalidate = 0

const NO_STORE = { 'Cache-Control': 'no-store, max-age=0' }

const redirectHome = (req: NextRequest): NextResponse =>
  NextResponse.redirect(new URL('/', req.url), { status: 302, headers: NO_STORE })

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params

  // Postgres adapter → numeric ids. Anything else can't match a link.
  const numericId = Number(id)
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return redirectHome(req)
  }

  try {
    const payload = await getPayload()

    let link
    try {
      link = await payload.findByID({
        collection: 'affiliate-links',
        id: numericId,
        overrideAccess: true,
      })
    } catch {
      // NotFound (or bad id) — send the visitor home.
      return redirectHome(req)
    }
    if (!link?.url) return redirectHome(req)

    // Count the click before redirecting. A failed increment must never
    // block the redirect itself.
    try {
      await payload.update({
        collection: 'affiliate-links',
        id: numericId,
        data: { clickCount: (link.clickCount ?? 0) + 1 },
        overrideAccess: true,
      })
    } catch (err) {
      console.error(`[go] failed to increment clickCount for link ${numericId}:`, err)
    }

    return NextResponse.redirect(link.url, { status: 302, headers: NO_STORE })
  } catch (err) {
    console.error('[go] redirect handler failed:', err)
    return redirectHome(req)
  }
}
