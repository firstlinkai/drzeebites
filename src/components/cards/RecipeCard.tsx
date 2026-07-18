import Image from 'next/image'
import Link from 'next/link'

import { mediaAlt, mediaUrl } from '@/components/media'
import type { Recipe } from '@/payload-types'

type Props = {
  recipe: Recipe
  /** Set on above-the-fold cards. */
  priority?: boolean
}

export function RecipeCard({ recipe, priority = false }: Props) {
  const imgUrl = mediaUrl(recipe.heroImage, 'card')
  const totalMinutes = (recipe.prepMinutes ?? 0) + (recipe.cookMinutes ?? 0)
  const netCarbs = recipe.nutrition?.netCarbs

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-[4/3] overflow-hidden bg-primary-soft">
        {imgUrl ? (
          <Image
            src={imgUrl}
            alt={mediaAlt(recipe.heroImage, recipe.title)}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 24rem, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : null}
        {/* Badges */}
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
          {totalMinutes > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-cream/95 px-3 py-1 text-xs font-semibold text-ink shadow-sm">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-primary" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" strokeLinecap="round" />
              </svg>
              {totalMinutes} min
            </span>
          ) : null}
          {netCarbs != null ? (
            <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-semibold text-cream shadow-sm">
              {netCarbs}g net carbs
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg font-semibold text-ink">
          <Link
            href={`/recipes/${recipe.slug}`}
            className="after:absolute after:inset-0 after:content-[''] hover:text-primary"
          >
            {recipe.title}
          </Link>
        </h3>
        {recipe.description ? (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink/70">
            {recipe.description}
          </p>
        ) : null}
      </div>
    </article>
  )
}
