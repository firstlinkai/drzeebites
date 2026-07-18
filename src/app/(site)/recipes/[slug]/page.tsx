import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

import { RecipeCard } from '@/components/cards/RecipeCard'
import { CookbookCta } from '@/components/CookbookCta'
import { SubscribeForm } from '@/components/forms/SubscribeForm'
import { mediaAlt, mediaUrl } from '@/components/media'
import { IngredientsChecklist } from '@/components/recipes/IngredientsChecklist'
import { RichContent } from '@/components/richtext/RichContent'
import { getPayload } from '@/lib/payload'
import type { Category, Recipe } from '@/payload-types'

export const revalidate = 300

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const payload = await getPayload()
  const recipes = await payload.find({
    collection: 'recipes',
    where: { _status: { equals: 'published' } },
    limit: 200,
    depth: 0,
    select: { slug: true },
  })
  return recipes.docs.map((r) => ({ slug: r.slug }))
}

async function getRecipe(slug: string): Promise<Recipe | null> {
  const payload = await getPayload()
  const res = await payload.find({
    collection: 'recipes',
    where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
    limit: 1,
    depth: 2,
  })
  return res.docs[0] ?? null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const recipe = await getRecipe(slug)
  if (!recipe) return { title: 'Recipe not found' }
  const og = mediaUrl(recipe.heroImage, 'og')
  return {
    title: recipe.title,
    description: recipe.description ?? undefined,
    openGraph: og ? { images: [{ url: og, width: 1200, height: 630 }] } : undefined,
  }
}

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

const NUTRITION_ROWS = [
  { key: 'calories', label: 'Calories', unit: 'kcal' },
  { key: 'protein', label: 'Protein', unit: 'g' },
  { key: 'netCarbs', label: 'Net carbs', unit: 'g' },
  { key: 'fat', label: 'Fat', unit: 'g' },
  { key: 'fiber', label: 'Fiber', unit: 'g' },
] as const

export default async function RecipePage({ params }: Props) {
  const { slug } = await params
  const recipe = await getRecipe(slug)
  if (!recipe) notFound()

  const payload = await getPayload()

  const categories = (recipe.categories ?? []).filter(
    (c): c is Category => typeof c === 'object' && c !== null,
  )

  const [relatedRes, productRes] = await Promise.all([
    categories.length > 0
      ? payload.find({
          collection: 'recipes',
          where: {
            and: [
              { _status: { equals: 'published' } },
              { categories: { in: categories.map((c) => c.id) } },
              { id: { not_equals: recipe.id } },
            ],
          },
          sort: '-publishedAt',
          limit: 3,
          depth: 1,
        })
      : Promise.resolve({ docs: [] as Recipe[] }),
    payload.find({
      collection: 'products',
      where: { and: [{ active: { equals: true } }, { _status: { equals: 'published' } }] },
      sort: 'createdAt',
      limit: 1,
      depth: 1,
    }),
  ])
  const related = relatedRes.docs
  const product = productRes.docs[0] ?? null

  const heroUrl = mediaUrl(recipe.heroImage, 'hero')
  const prep = recipe.prepMinutes ?? 0
  const cook = recipe.cookMinutes ?? 0
  const total = prep + cook
  const nutrition = recipe.nutrition

  // schema.org Recipe JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.title,
    description: recipe.description ?? undefined,
    image: heroUrl ?? undefined,
    prepTime: prep ? `PT${prep}M` : undefined,
    cookTime: cook ? `PT${cook}M` : undefined,
    totalTime: total ? `PT${total}M` : undefined,
    recipeYield: recipe.servings ? `${recipe.servings} servings` : undefined,
    recipeCategory: categories.map((c) => c.name),
    recipeIngredient: (recipe.ingredients ?? []).map((ing) =>
      [ing.quantity, ing.unit, ing.item].filter(Boolean).join(' '),
    ),
    nutrition: nutrition
      ? {
          '@type': 'NutritionInformation',
          calories: nutrition.calories != null ? `${nutrition.calories} calories` : undefined,
          proteinContent: nutrition.protein != null ? `${nutrition.protein} g` : undefined,
          carbohydrateContent: nutrition.netCarbs != null ? `${nutrition.netCarbs} g` : undefined,
          fatContent: nutrition.fat != null ? `${nutrition.fat} g` : undefined,
          fiberContent: nutrition.fiber != null ? `${nutrition.fiber} g` : undefined,
        }
      : undefined,
    author: { '@type': 'Organization', name: 'DrZeeBites' },
  }

  return (
    <article className="mx-auto max-w-6xl px-5 py-10 sm:px-8 md:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ------------------------------------------------------------- Header */}
      <header className="mx-auto max-w-3xl text-center">
        {categories.length > 0 ? (
          <ul className="flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <li key={cat.id}>
                <Link
                  href={`/recipes?category=${encodeURIComponent(cat.slug)}`}
                  className="inline-flex rounded-full bg-primary-soft px-3.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-cream"
                >
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
        <h1 className="mt-4 font-display text-4xl leading-tight font-semibold text-ink sm:text-5xl">
          {recipe.title}
        </h1>
        {recipe.description ? (
          <p className="mt-4 text-lg leading-relaxed text-ink/75">{recipe.description}</p>
        ) : null}
      </header>

      {/* --------------------------------------------------------------- Hero */}
      {heroUrl ? (
        <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-3xl bg-primary-soft shadow-sm">
          <Image
            src={heroUrl}
            alt={mediaAlt(recipe.heroImage, recipe.title)}
            fill
            priority
            sizes="(min-width: 1152px) 72rem, 100vw"
            className="object-cover"
          />
        </div>
      ) : null}

      {/* ------------------------------------------------------------ Meta row */}
      <dl className="mx-auto mt-8 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Prep', value: prep ? `${prep} min` : '—' },
          { label: 'Cook', value: cook ? `${cook} min` : '—' },
          { label: 'Total', value: total ? `${total} min` : '—' },
          {
            label: 'Serves',
            value: recipe.servings
              ? `${recipe.servings}${recipe.difficulty ? ` · ${DIFFICULTY_LABEL[recipe.difficulty]}` : ''}`
              : (recipe.difficulty ? DIFFICULTY_LABEL[recipe.difficulty] : '—'),
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-primary/10 bg-white px-4 py-3 text-center"
          >
            <dt className="text-xs font-semibold tracking-widest text-ink/55 uppercase">
              {item.label}
            </dt>
            <dd className="mt-1 font-display text-lg font-semibold text-primary">{item.value}</dd>
          </div>
        ))}
      </dl>

      {/* ------------------------------------------- Ingredients + instructions */}
      <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,20rem)_1fr] lg:gap-14">
        <aside aria-labelledby="ingredients-heading" className="lg:sticky lg:top-8 lg:self-start">
          <div className="rounded-2xl border border-primary/15 bg-white p-6 shadow-sm">
            <h2 id="ingredients-heading" className="font-display text-2xl font-semibold text-ink">
              Ingredients
            </h2>
            <p className="mt-1 text-xs text-ink/55">Tap to tick off as you cook</p>
            <div className="mt-4">
              <IngredientsChecklist ingredients={recipe.ingredients ?? []} />
            </div>
          </div>

          {/* Nutrition facts — clean label style */}
          {nutrition ? (
            <div className="mt-6 rounded-2xl border-2 border-ink bg-white p-5">
              <h2 className="font-display text-xl font-semibold text-ink">Nutrition Facts</h2>
              <p className="border-b-8 border-ink pb-2 text-xs text-ink/60">Per serving</p>
              <table className="w-full text-sm">
                <tbody>
                  {NUTRITION_ROWS.map(({ key, label, unit }) => {
                    const value = nutrition[key]
                    if (value == null) return null
                    return (
                      <tr key={key} className="border-b border-ink/15 last:border-b-0">
                        <th scope="row" className="py-2 text-left font-semibold text-ink">
                          {label}
                        </th>
                        <td className="py-2 text-right font-medium text-ink/80">
                          {value}
                          {unit === 'kcal' ? '' : unit}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </aside>

        <div className="min-w-0">
          <section aria-labelledby="instructions-heading">
            <h2 id="instructions-heading" className="font-display text-2xl font-semibold text-ink">
              Instructions
            </h2>
            {/* Direct paragraphs get cook-along step numbers via CSS counters. */}
            <div className="mt-4">
              <RichContent
                data={recipe.instructions as SerializedEditorState | null}
                className="space-y-5 leading-relaxed text-ink/85 [counter-reset:step] [&_h2]:font-display [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-ink [&_h3]:font-display [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-ink [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6 [&_img]:rounded-2xl [&>p]:relative [&>p]:min-h-9 [&>p]:pl-13 [&>p]:[counter-increment:step] [&>p]:before:absolute [&>p]:before:top-0 [&>p]:before:left-0 [&>p]:before:flex [&>p]:before:h-9 [&>p]:before:w-9 [&>p]:before:items-center [&>p]:before:justify-center [&>p]:before:rounded-full [&>p]:before:bg-primary-soft [&>p]:before:font-display [&>p]:before:text-sm [&>p]:before:font-semibold [&>p]:before:text-primary [&>p]:before:content-[counter(step)]"
              />
            </div>
          </section>

          {/* Mid-page cookbook CTA */}
          {product ? (
            <div className="mt-12">
              <CookbookCta product={product} />
            </div>
          ) : null}
        </div>
      </div>

      {/* ---------------------------------------------------------- Related */}
      {related.length > 0 ? (
        <section aria-labelledby="related-heading" className="mt-16 border-t border-primary/10 pt-12">
          <h2 id="related-heading" className="font-display text-2xl font-semibold text-ink sm:text-3xl">
            You might also like
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <RecipeCard key={r.id} recipe={r} />
            ))}
          </div>
        </section>
      ) : null}

      {/* ------------------------------------------------------- Lead magnet */}
      <section
        aria-labelledby="recipe-subscribe-heading"
        className="mt-16 rounded-3xl bg-primary-soft px-6 py-10 sm:px-10"
      >
        <div className="mx-auto max-w-xl text-center">
          <h2 id="recipe-subscribe-heading" className="font-display text-2xl font-semibold text-ink sm:text-3xl">
            Get the Free 7-Day Diabetic Snack Guide
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink/70">
            Plus one new 15-minute diabetic-friendly recipe in your inbox every week. No spam,
            unsubscribe anytime.
          </p>
          <SubscribeForm source="recipe-footer" className="mt-6" buttonLabel="Send me the guide" />
        </div>
      </section>
    </article>
  )
}
