import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'

import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

import { BuyButton } from '@/components/commerce/BuyButton'
import { formatPrice } from '@/components/CookbookCta'
import { mediaAlt, mediaUrl } from '@/components/media'
import { RichContent } from '@/components/richtext/RichContent'
import { TestimonialGrid } from '@/components/Testimonials'
import { getPayload } from '@/lib/payload'
import type { Product } from '@/payload-types'

export const revalidate = 300

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const payload = await getPayload()
  const products = await payload.find({
    collection: 'products',
    where: { and: [{ active: { equals: true } }, { _status: { equals: 'published' } }] },
    limit: 100,
    depth: 0,
    select: { slug: true },
  })
  return products.docs.map((p) => ({ slug: p.slug }))
}

async function getProduct(slug: string): Promise<Product | null> {
  const payload = await getPayload()
  const res = await payload.find({
    collection: 'products',
    where: {
      and: [
        { slug: { equals: slug } },
        { active: { equals: true } },
        { _status: { equals: 'published' } },
      ],
    },
    limit: 1,
    depth: 2,
  })
  return res.docs[0] ?? null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) return { title: 'Product not found' }
  const og = mediaUrl(product.gallery?.[0]?.image, 'og')
  return {
    title: product.name,
    description: product.shortPitch ?? undefined,
    openGraph: og ? { images: [{ url: og, width: 1200, height: 630 }] } : undefined,
  }
}

const BENEFITS = [
  'Every recipe is diabetic-friendly: low net carbs, high protein, honest portions',
  '90% of recipes ready in under 25 minutes — most in 15',
  'Complete nutrition facts (calories, protein, net carbs, fat, fiber) on every recipe',
  'Up to 80% less oil than traditional frying, zero bland "diet food"',
  'Bonus: 7-Day Strategic Meal Plan + Professional Grocery Guide + Blood Sugar Lifestyle Tips',
]

const FAQS = [
  {
    q: 'How do I get the cookbook after paying?',
    a: 'Delivery is instant. As soon as your payment goes through you land on a download page, and we also email you a download link. You can start cooking tonight.',
  },
  {
    q: 'What format is it — do I need a special app?',
    a: 'It is a standard PDF (37 pages) that opens on any phone, tablet, computer, or e-reader. You can also print it and keep it in the kitchen.',
  },
  {
    q: 'What if it is not for me?',
    a: 'If the cookbook is not what you expected, reply to your receipt email within 30 days and we will make it right — including a full refund if that is what you want.',
  },
  {
    q: 'Who is this cookbook for?',
    a: 'Anyone cooking for type 2 diabetes, prediabetes, or general low-carb living — and for the whole family, because the food just tastes good. Every recipe uses an air fryer and lists net carbs so there is no guesswork.',
  },
]

const TRUST_ITEMS = [
  {
    label: 'Secure Stripe checkout',
    detail: 'Cards, Apple Pay & Google Pay',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="4" y="10" width="16" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </svg>
    ),
  },
  {
    label: 'Instant PDF download',
    detail: 'Delivered the second you pay',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
        <path d="M12 4v11m0 0l-4-4m4 4l4-4" />
        <path d="M5 19h14" />
      </svg>
    ),
  },
  {
    label: 'Yours forever',
    detail: 'One payment, no subscription',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M12 21s-7-4.6-9.2-9A5.3 5.3 0 0 1 12 6.6 5.3 5.3 0 0 1 21.2 12c-2.2 4.4-9.2 9-9.2 9z" />
      </svg>
    ),
  },
]

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) notFound()

  const payload = await getPayload()
  const testimonials = await payload.find({ collection: 'testimonials', limit: 3, depth: 1 })

  const gallery = (product.gallery ?? []).filter((g) => typeof g.image === 'object')
  const mainImage = gallery[0]?.image
  const mainImageUrl = mediaUrl(mainImage, 'hero')
  const price = formatPrice(product.priceCents)

  return (
    <article className="mx-auto max-w-6xl px-5 py-12 sm:px-8 md:py-16">
      {/* ------------------------------------------------------- Top section */}
      <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
        {/* Gallery */}
        <div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-primary/10 bg-primary-soft shadow-sm">
            {mainImageUrl ? (
              <Image
                src={mainImageUrl}
                alt={mediaAlt(mainImage, `${product.name} cover`)}
                fill
                priority
                sizes="(min-width: 1024px) 34rem, 100vw"
                className="object-cover"
              />
            ) : null}
          </div>
          {gallery.length > 1 ? (
            <ul className="mt-4 grid grid-cols-4 gap-3">
              {gallery.slice(1, 5).map((g, i) => {
                const url = mediaUrl(g.image, 'card')
                if (!url) return null
                return (
                  <li key={g.id ?? i} className="relative aspect-square overflow-hidden rounded-xl border border-primary/10 bg-primary-soft">
                    <Image
                      src={url}
                      alt={mediaAlt(g.image, `${product.name} preview ${i + 2}`)}
                      fill
                      sizes="8rem"
                      className="object-cover"
                    />
                  </li>
                )
              })}
            </ul>
          ) : null}
        </div>

        {/* Buy column */}
        <div>
          <p className="text-xs font-semibold tracking-[0.25em] text-accent uppercase">
            Digital cookbook · Instant download
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight font-semibold text-ink sm:text-5xl">
            {product.name}
          </h1>
          {product.shortPitch ? (
            <p className="mt-4 text-lg leading-relaxed text-ink/75">{product.shortPitch}</p>
          ) : null}

          <ul className="mt-6 space-y-3">
            {BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3 text-[0.95rem] leading-snug text-ink/85">
                <svg
                  viewBox="0 0 24 24"
                  className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" strokeWidth="1.6" />
                  <path d="M8 12.5l2.7 2.7L16 9.5" />
                </svg>
                {benefit}
              </li>
            ))}
          </ul>

          <div className="mt-8 rounded-2xl border border-primary/15 bg-white p-6 shadow-sm">
            <div className="flex items-baseline gap-3">
              <span className="font-display text-4xl font-semibold text-primary">{price}</span>
              <span className="text-sm text-ink/60">one-time payment</span>
            </div>
            <div className="mt-4">
              <BuyButton
                productId={String(product.id)}
                label={`Get Instant Access — ${price}`}
                className="w-full rounded-full bg-accent px-8 py-4 text-center text-lg font-semibold text-white shadow-md transition-colors hover:bg-accent/90 disabled:opacity-60"
              />
            </div>
            <ul className="mt-5 space-y-2.5 border-t border-primary/10 pt-4">
              {TRUST_ITEMS.map((item) => (
                <li key={item.label} className="flex items-center gap-3 text-sm">
                  <span className="text-primary">{item.icon}</span>
                  <span className="font-semibold text-ink">{item.label}</span>
                  <span className="text-ink/55">· {item.detail}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------ Sales content */}
      {product.salesContent ? (
        <section aria-label="About this cookbook" className="mx-auto mt-16 max-w-2xl">
          <RichContent data={product.salesContent as SerializedEditorState | null} />
        </section>
      ) : null}

      {/* ------------------------------------------------------ Testimonials */}
      {testimonials.docs.length > 0 ? (
        <section aria-labelledby="product-testimonials-heading" className="mt-16 border-t border-primary/10 pt-12">
          <h2 id="product-testimonials-heading" className="text-center font-display text-3xl font-semibold text-ink">
            What readers say
          </h2>
          <div className="mt-8">
            <TestimonialGrid testimonials={testimonials.docs} />
          </div>
        </section>
      ) : null}

      {/* --------------------------------------------------------------- FAQ */}
      <section aria-labelledby="faq-heading" className="mx-auto mt-16 max-w-2xl">
        <h2 id="faq-heading" className="text-center font-display text-3xl font-semibold text-ink">
          Frequently asked questions
        </h2>
        <div className="mt-8 space-y-3">
          {FAQS.map((faq) => (
            <details
              key={faq.q}
              className="group rounded-2xl border border-primary/15 bg-white px-6 py-4 open:shadow-sm"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink [&::-webkit-details-marker]:hidden">
                {faq.q}
                <span
                  aria-hidden="true"
                  className="text-xl text-primary transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-ink/75">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------------- Final buy */}
      <section aria-label="Buy the cookbook" className="mx-auto mt-16 max-w-xl rounded-3xl bg-primary px-6 py-10 text-center text-cream sm:px-10">
        <h2 className="font-display text-2xl font-semibold sm:text-3xl">
          Start cooking tonight
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-cream/80">
          {product.name} — {price}, instant PDF download, yours forever.
        </p>
        <div className="mx-auto mt-6 max-w-xs">
          <BuyButton
            productId={String(product.id)}
            label={`Get Instant Access — ${price}`}
            className="w-full rounded-full bg-accent px-8 py-4 text-center text-base font-semibold text-white shadow-md transition-colors hover:bg-accent/90 disabled:opacity-60"
          />
        </div>
      </section>
    </article>
  )
}
