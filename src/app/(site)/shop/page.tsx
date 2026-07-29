import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { formatPrice } from '@/components/CookbookCta'
import { mediaAlt, mediaUrl } from '@/components/media'
import { getPayload } from '@/lib/payload'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Shop',
  alternates: { canonical: '/shop' },
  description:
    'Digital cookbooks and guides from DrZeeBites — diabetic-friendly air fryer recipes with complete nutrition facts. Instant PDF downloads.',
}

export default async function ShopPage() {
  const payload = await getPayload()
  const products = await payload.find({
    collection: 'products',
    where: { and: [{ active: { equals: true } }, { _status: { equals: 'published' } }] },
    sort: 'createdAt',
    limit: 24,
    depth: 1,
  })

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 md:py-16">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold tracking-[0.25em] text-accent uppercase">The shop</p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-ink sm:text-5xl">
          Cookbooks &amp; guides
        </h1>
        <p className="mt-4 leading-relaxed text-ink/75">
          Instant digital downloads — pay once, cook forever. Every recipe is diabetic-friendly
          with complete nutrition facts.
        </p>
      </header>

      <div className="relative mt-8 overflow-hidden rounded-3xl border border-primary/10 shadow-sm">
        <Image
          src="/brand/bundle-promo.jpg"
          alt="The Ultimate Diabetic Air Fryer Bundle — both DrZeeBites cookbooks together for $35.99"
          width={1280}
          height={720}
          className="h-auto w-full"
          priority
        />
      </div>

      {products.docs.length > 0 ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.docs.map((product, i) => {
            const cover = product.gallery?.[0]?.image
            const coverUrl = mediaUrl(cover, 'card')
            return (
              <article
                key={product.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-primary-soft">
                  {coverUrl ? (
                    <Image
                      src={coverUrl}
                      alt={mediaAlt(cover, `${product.name} cover`)}
                      fill
                      priority={i === 0}
                      sizes="(min-width: 1024px) 24rem, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  ) : null}
                  <span className="absolute top-3 left-3 rounded-full bg-cream/95 px-3 py-1 text-xs font-semibold text-ink shadow-sm">
                    Instant PDF
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h2 className="font-display text-xl font-semibold text-ink">
                    <Link
                      href={`/shop/${product.slug}`}
                      className="after:absolute after:inset-0 after:content-[''] hover:text-primary"
                    >
                      {product.name}
                    </Link>
                  </h2>
                  {product.shortPitch ? (
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink/70">
                      {product.shortPitch}
                    </p>
                  ) : null}
                  <div className="mt-4 flex items-center justify-between border-t border-primary/10 pt-4">
                    <span className="font-display text-2xl font-semibold text-primary">
                      {formatPrice(product.priceCents)}
                    </span>
                    <span className="text-sm font-semibold text-accent">
                      View details <span aria-hidden="true">→</span>
                    </span>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <p className="mt-16 rounded-2xl border border-primary/15 bg-white p-10 text-center text-ink/70">
          The shop is being restocked — check back soon.
        </p>
      )}
    </div>
  )
}
