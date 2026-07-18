import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { RecipeCard } from '@/components/cards/RecipeCard'
import { CookbookCta, formatPrice } from '@/components/CookbookCta'
import { SubscribeForm } from '@/components/forms/SubscribeForm'
import { InstagramIcon, PinterestIcon, TikTokIcon } from '@/components/site/SocialIcons'
import { TestimonialGrid } from '@/components/Testimonials'
import { getPayload } from '@/lib/payload'
import { organizationJsonLd, webSiteJsonLd } from '@/lib/seo/jsonld'
import { JsonLd } from '@/lib/seo/json-ld'

export const revalidate = 300

export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

async function getHomeData() {
  const payload = await getPayload()
  const [recipes, testimonials, products, settings] = await Promise.all([
    payload.find({
      collection: 'recipes',
      where: { _status: { equals: 'published' } },
      sort: '-publishedAt',
      limit: 3,
      depth: 1,
    }),
    payload.find({ collection: 'testimonials', limit: 3, depth: 1 }),
    payload.find({
      collection: 'products',
      where: { and: [{ active: { equals: true } }, { _status: { equals: 'published' } }] },
      sort: 'createdAt',
      limit: 1,
      depth: 1,
    }),
    payload.findGlobal({ slug: 'site-settings' }),
  ])
  return {
    recipes: recipes.docs,
    testimonials: testimonials.docs,
    product: products.docs[0] ?? null,
    settings,
  }
}

const HERO_STATS = [
  { value: '15', unit: 'min', label: 'from fridge to plate' },
  { value: '≤5g', unit: '', label: 'net carbs per serving' },
  { value: '80%', unit: '', label: 'less oil than frying' },
]

export default async function HomePage() {
  const { recipes, testimonials, product, settings } = await getHomeData()
  const cookbookHref = product ? `/shop/${product.slug}` : '/shop'

  const socials = [
    { href: settings?.socialLinks?.instagram, label: 'Instagram', handle: '@drzeebites.official', Icon: InstagramIcon },
    { href: settings?.socialLinks?.pinterest, label: 'Pinterest', handle: 'DrZeeBites', Icon: PinterestIcon },
    { href: settings?.socialLinks?.tiktok, label: 'TikTok', handle: '@drzeebites', Icon: TikTokIcon },
  ].filter((s) => Boolean(s.href))

  return (
    <>
      <JsonLd data={webSiteJsonLd(settings)} />
      <JsonLd data={organizationJsonLd(settings)} />

      {/* ------------------------------------------------------------- Hero */}
      <section className="relative overflow-hidden">
        {/* Soft brand wash behind the hero visual */}
        <div
          aria-hidden="true"
          className="absolute -top-32 -right-40 h-[34rem] w-[34rem] rounded-full bg-primary-soft"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pt-14 pb-16 sm:px-8 md:grid-cols-[1.15fr_1fr] md:pt-20 md:pb-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/70 px-4 py-1.5 text-xs font-semibold tracking-widest text-primary uppercase">
              Diabetic-friendly · Low carb · High protein
            </p>
            <h1 className="mt-6 font-display text-4xl leading-[1.08] font-semibold text-ink sm:text-5xl lg:text-6xl">
              15-minute{' '}
              <span className="text-primary">diabetic-friendly</span> air fryer recipes
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink/75">
              Crispy, deeply savory food that keeps blood sugar steady — without a single bland
              “diet meal”. Net carbs counted on every recipe, dinner done before the oven would
              even preheat.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={cookbookHref}
                className="inline-flex items-center justify-center rounded-full bg-accent px-7 py-3.5 text-base font-semibold text-white shadow-md transition-colors hover:bg-accent/90"
              >
                Get the Cookbook{product ? ` — ${formatPrice(product.priceCents)}` : ''}
              </Link>
              <Link
                href="/recipes"
                className="inline-flex items-center justify-center rounded-full border-2 border-primary px-7 py-3 text-base font-semibold text-primary transition-colors hover:bg-primary-soft"
              >
                Browse Free Recipes
              </Link>
            </div>
            <p className="mt-4 text-sm text-ink/55">
              Instant PDF download · Nutrition facts on every recipe
            </p>
          </div>

          {/* Hero visual — brand badge composition with floating stat chips */}
          <div className="relative mx-auto w-full max-w-sm md:max-w-none">
            <div className="relative mx-auto aspect-square w-64 sm:w-80">
              <div
                aria-hidden="true"
                className="absolute inset-0 rotate-6 rounded-[38%] bg-amber/30"
              />
              <div
                aria-hidden="true"
                className="absolute inset-3 -rotate-3 rounded-[42%] bg-accent/15"
              />
              <Image
                src="/brand/logo-badge.jpg"
                alt="DrZeeBites — diabetic-friendly air fryer recipes"
                fill
                priority
                sizes="(min-width: 640px) 20rem, 16rem"
                className="rounded-full border-8 border-white object-cover shadow-xl"
              />
            </div>
            <dl className="mt-8 grid grid-cols-3 gap-3 md:mt-10">
              {HERO_STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-primary/10 bg-white/80 px-3 py-4 text-center shadow-sm"
                >
                  <dt className="sr-only">{stat.label}</dt>
                  <dd>
                    <span className="font-display text-2xl font-semibold text-primary">
                      {stat.value}
                    </span>
                    {stat.unit ? (
                      <span className="ml-1 text-sm font-medium text-primary">{stat.unit}</span>
                    ) : null}
                    <span className="mt-1 block text-xs leading-snug text-ink/60">
                      {stat.label}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------- Featured recipes */}
      <section aria-labelledby="featured-heading" className="mx-auto max-w-6xl px-5 py-14 sm:px-8 md:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] text-accent uppercase">
              Fresh from the air fryer
            </p>
            <h2 id="featured-heading" className="mt-2 font-display text-3xl font-semibold text-ink sm:text-4xl">
              Latest recipes
            </h2>
          </div>
          <Link
            href="/recipes"
            className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            View all recipes <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe, i) => (
            <RecipeCard key={recipe.id} recipe={recipe} priority={i === 0} />
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------ Social strip */}
      {socials.length > 0 ? (
        <section aria-label="DrZeeBites on social media" className="border-y border-primary/10 bg-white">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-5 py-10 sm:px-8 md:flex-row md:justify-between">
            <p className="text-sm font-semibold tracking-widest text-ink/60 uppercase">
              Cooking daily with the community on
            </p>
            <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
              {socials.map(({ href, label, handle, Icon }) => (
                <li key={label}>
                  <a
                    href={href as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-ink/75 transition-colors hover:text-accent"
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-semibold">{label}</span>
                    <span className="hidden text-sm text-ink/50 sm:inline">{handle}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* ------------------------------------------------------ Testimonials */}
      <section aria-labelledby="testimonials-heading" className="mx-auto max-w-6xl px-5 py-14 sm:px-8 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold tracking-[0.25em] text-accent uppercase">
            From real kitchens
          </p>
          <h2 id="testimonials-heading" className="mt-2 font-display text-3xl font-semibold text-ink sm:text-4xl">
            Steady blood sugar, happy dinner table
          </h2>
        </div>
        <div className="mt-10">
          <TestimonialGrid testimonials={testimonials} />
        </div>
      </section>

      {/* ------------------------------------------------------- Lead magnet */}
      <section aria-labelledby="lead-magnet-heading" className="bg-primary-soft">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-14 sm:px-8 md:grid-cols-[1.2fr_1fr] md:py-16">
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] text-accent uppercase">
              Free download
            </p>
            <h2 id="lead-magnet-heading" className="mt-2 font-display text-3xl font-semibold text-ink sm:text-4xl">
              Get the Free 7-Day Diabetic Snack Guide
            </h2>
            <p className="mt-4 max-w-xl leading-relaxed text-ink/75">
              A week of grab-and-go snacks that won&apos;t spike your glucose — with net carbs and
              protein listed for every single one. Delivered straight to your inbox.
            </p>
          </div>
          <SubscribeForm source="homepage" buttonLabel="Send me the guide" />
        </div>
      </section>

      {/* --------------------------------------------------------- Final CTA */}
      {product ? <CookbookCta product={product} variant="band" /> : null}
    </>
  )
}
