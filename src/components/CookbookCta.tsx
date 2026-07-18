import Image from 'next/image'
import Link from 'next/link'

import { mediaAlt, mediaUrl } from '@/components/media'
import type { Product } from '@/payload-types'

export const formatPrice = (cents: number): string => {
  const dollars = cents / 100
  return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`
}

type Props = {
  product: Product
  /** "card" — compact inline card (recipe pages). "band" — full-width closing section. */
  variant?: 'card' | 'band'
}

/** Reusable CTA for the flagship cookbook. */
export function CookbookCta({ product, variant = 'card' }: Props) {
  const cover = product.gallery?.[0]?.image
  const coverUrl = mediaUrl(cover, 'card')
  const href = `/shop/${product.slug}`

  if (variant === 'band') {
    return (
      <section aria-labelledby="cookbook-band-heading" className="bg-primary text-cream">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-5 py-16 text-center sm:px-8 md:py-20">
          <p className="text-xs font-semibold tracking-[0.25em] text-amber uppercase">
            The flagship cookbook
          </p>
          <h2
            id="cookbook-band-heading"
            className="max-w-2xl font-display text-3xl font-semibold sm:text-4xl"
          >
            {product.name}
          </h2>
          {product.shortPitch ? (
            <p className="max-w-2xl text-base leading-relaxed text-cream/85">
              {product.shortPitch}
            </p>
          ) : null}
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href={href}
              className="rounded-full bg-accent px-8 py-3.5 text-base font-semibold text-white shadow-md transition-colors hover:bg-accent/90"
            >
              Get the Cookbook — {formatPrice(product.priceCents)}
            </Link>
            <span className="text-sm text-cream/70">Instant PDF download · Secure checkout</span>
          </div>
        </div>
      </section>
    )
  }

  return (
    <aside
      aria-label={`${product.name} — get the cookbook`}
      className="overflow-hidden rounded-2xl border border-primary/15 bg-primary-soft sm:flex sm:items-stretch"
    >
      {coverUrl ? (
        <div className="relative aspect-[4/3] sm:aspect-auto sm:w-44 sm:shrink-0">
          <Image
            src={coverUrl}
            alt={mediaAlt(cover, `${product.name} cover`)}
            fill
            sizes="(min-width: 640px) 11rem, 100vw"
            className="object-cover"
          />
        </div>
      ) : null}
      <div className="flex flex-col gap-2.5 p-6">
        <p className="text-xs font-semibold tracking-widest text-accent uppercase">
          Love this recipe?
        </p>
        <p className="font-display text-xl font-semibold text-ink">{product.name}</p>
        {product.shortPitch ? (
          <p className="text-sm leading-relaxed text-ink/70">{product.shortPitch}</p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Link
            href={href}
            className="inline-flex rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
          >
            Get the Cookbook — {formatPrice(product.priceCents)}
          </Link>
          <span className="text-xs text-ink/60">Instant PDF download</span>
        </div>
      </div>
    </aside>
  )
}
