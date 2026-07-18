import { notFound } from 'next/navigation'

/**
 * Catch-all for unmatched public URLs. The root layout lives inside the
 * (site) route group, so without this Next would fall back to its unstyled
 * default 404. Explicit routes (admin, api, go, download, …) always take
 * precedence over this catch-all.
 */
export default function CatchAllNotFound() {
  notFound()
}
