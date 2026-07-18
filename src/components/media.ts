import type { Media } from '@/payload-types'

type MediaRef = number | Media | null | undefined

/**
 * Payload returns absolute URLs (serverURL + /api/media/file/…). Media is
 * always served through the app's own /api endpoint, so we normalize to a
 * same-origin relative path — this keeps next/image happy without host
 * config and is environment-independent.
 */
const toRelative = (url: string): string => {
  try {
    const parsed = new URL(url)
    return `${parsed.pathname}${parsed.search}`
  } catch {
    return url // already relative
  }
}

/**
 * Resolve a Payload media reference to a usable URL, preferring a named
 * resize when available. Returns null for unpopulated (numeric) refs.
 */
export function mediaUrl(media: MediaRef, size?: 'card' | 'hero' | 'og'): string | null {
  if (!media || typeof media === 'number') return null
  if (size) {
    const sized = media.sizes?.[size]?.url
    if (sized) return toRelative(sized)
  }
  return media.url ? toRelative(media.url) : null
}

/** Alt text for a media reference, with a sensible fallback. */
export function mediaAlt(media: MediaRef, fallback = ''): string {
  if (!media || typeof media === 'number') return fallback
  return media.alt || fallback
}
