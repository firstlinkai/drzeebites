import { isFreeDownloadsMode } from '@/lib/commerce/free-mode'

import { BuyButton } from './BuyButton'

type Props = {
  productId: string
  slug: string
  label: string
  className?: string
}

/**
 * The product page's primary CTA. Normally the Stripe BuyButton; while
 * FREE_DOWNLOADS_MODE is on it becomes a direct free download link
 * (launch preview — no paywall until Stripe is configured).
 */
export function ProductCta({ productId, slug, label, className }: Props) {
  if (isFreeDownloadsMode()) {
    return (
      <div>
        <a href={`/download-free/${slug}`} className={className} download>
          Download Free — Launch Preview
        </a>
        <p className="mt-2 text-center text-xs text-ink/50">
          Free while we finish setting up checkout — enjoy!
        </p>
      </div>
    )
  }
  return <BuyButton productId={productId} label={label} className={className} />
}
