import type { Metadata } from 'next'
import Link from 'next/link'

import { RecipeCard } from '@/components/cards/RecipeCard'
import { getPayload } from '@/lib/payload'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Recipes',
  description:
    'Free diabetic-friendly air fryer recipes — low carb, high protein, most ready in 15 minutes. Net carbs counted on every recipe.',
}

type Props = {
  searchParams: Promise<{ category?: string }>
}

export default async function RecipesPage({ searchParams }: Props) {
  const { category } = await searchParams
  const payload = await getPayload()

  const categoriesRes = await payload.find({
    collection: 'categories',
    sort: 'name',
    limit: 50,
    depth: 0,
  })
  const categories = categoriesRes.docs
  const activeCategory = categories.find((c) => c.slug === category) ?? null

  const recipesRes = await payload.find({
    collection: 'recipes',
    where: {
      and: [
        { _status: { equals: 'published' } },
        ...(activeCategory ? [{ categories: { in: [activeCategory.id] } }] : []),
      ],
    },
    sort: '-publishedAt',
    limit: 48,
    depth: 1,
  })
  const recipes = recipesRes.docs

  const chipBase =
    'inline-flex rounded-full px-4 py-2 text-sm font-semibold transition-colors'

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 md:py-16">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold tracking-[0.25em] text-accent uppercase">
          Free recipes
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-ink sm:text-5xl">
          Diabetic-friendly air fryer recipes
        </h1>
        <p className="mt-4 leading-relaxed text-ink/75">
          Every recipe lists net carbs, protein and total time — so you know exactly what&apos;s
          on your plate before you start cooking.
        </p>
      </header>

      {/* Category filter chips (server-rendered links) */}
      <nav aria-label="Filter recipes by category" className="mt-8">
        <ul className="flex flex-wrap gap-2">
          <li>
            <Link
              href="/recipes"
              aria-current={!activeCategory ? 'page' : undefined}
              className={`${chipBase} ${
                !activeCategory
                  ? 'bg-primary text-cream'
                  : 'border border-primary/25 bg-white text-primary hover:bg-primary-soft'
              }`}
            >
              All
            </Link>
          </li>
          {categories.map((cat) => {
            const isActive = activeCategory?.id === cat.id
            return (
              <li key={cat.id}>
                <Link
                  href={`/recipes?category=${encodeURIComponent(cat.slug)}`}
                  aria-current={isActive ? 'page' : undefined}
                  className={`${chipBase} ${
                    isActive
                      ? 'bg-primary text-cream'
                      : 'border border-primary/25 bg-white text-primary hover:bg-primary-soft'
                  }`}
                >
                  {cat.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {recipes.length > 0 ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe, i) => (
            <RecipeCard key={recipe.id} recipe={recipe} priority={i < 3} />
          ))}
        </div>
      ) : (
        <div className="mt-16 rounded-2xl border border-primary/15 bg-white p-10 text-center">
          <p className="font-display text-xl font-semibold text-ink">
            No recipes in this category yet
          </p>
          <p className="mt-2 text-sm text-ink/65">
            We add new recipes every week —{' '}
            <Link href="/recipes" className="font-semibold text-primary underline underline-offset-2">
              browse all recipes
            </Link>{' '}
            in the meantime.
          </p>
        </div>
      )}
    </div>
  )
}
