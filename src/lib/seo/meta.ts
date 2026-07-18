import type { Metadata } from 'next'

import { DEFAULT_OG_IMAGE, SITE_NAME } from './site'

type PageMetadataArgs = {
  title: string
  description?: string | null
  /** Site-relative canonical path, e.g. `/recipes/crispy-tofu` */
  path: string
  /** Site-relative or absolute OG image URL; falls back to the brand OG image. */
  image?: string | null
  ogType?: 'website' | 'article'
}

/**
 * Standard per-page metadata: unique title/description, canonical URL and a
 * complete OpenGraph block. Next.js replaces (not deep-merges) the parent
 * layout's `openGraph` when a page defines one, so this builds the full
 * object — including siteName — every time. Relative URLs resolve against
 * the layout's `metadataBase`.
 */
export function pageMetadata({
  title,
  description,
  path,
  image,
  ogType = 'website',
}: PageMetadataArgs): Metadata {
  return {
    title,
    description: description ?? undefined,
    alternates: { canonical: path },
    openGraph: {
      siteName: SITE_NAME,
      type: ogType,
      title,
      description: description ?? undefined,
      url: path,
      images: [{ url: image || DEFAULT_OG_IMAGE, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image' },
  }
}
