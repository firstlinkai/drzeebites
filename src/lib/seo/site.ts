/**
 * Canonical site origin + tiny URL helpers shared by metadata, JSON-LD,
 * sitemap.ts and robots.ts. NEXT_PUBLIC_SERVER_URL is the single source of
 * truth for the public origin (falls back to localhost in dev).
 */

export const SITE_URL = (process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(
  /\/$/,
  '',
)

export const SITE_NAME = 'DrZeeBites'

export const DEFAULT_TITLE = 'DrZeeBites — 15-Minute Diabetic-Friendly Air Fryer Recipes'

export const DEFAULT_DESCRIPTION =
  'Low-carb, high-protein, diabetic-friendly air fryer recipes ready in 15 minutes. Home of The Diabetic Air Fryer Cookbook.'

export const DEFAULT_OG_IMAGE = '/brand/og-default.png'

/** Resolve a path (or already-absolute URL) against the canonical origin. */
export function absUrl(path: string): string {
  return new URL(path, `${SITE_URL}/`).toString()
}
