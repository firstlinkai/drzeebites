/**
 * schema.org JSON-LD builders for the public site. Every builder returns a
 * plain serializable object; render it with the <JsonLd /> component.
 * Undefined fields are dropped automatically by JSON.stringify.
 */

import { mediaUrl } from '@/components/media'
import type { Category, Post, Product, Recipe, SiteSetting } from '@/payload-types'

import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL, absUrl } from './site'

const ORGANIZATION_ID = `${SITE_URL}/#organization`
const WEBSITE_ID = `${SITE_URL}/#website`

/** Inline publisher/author entity reused across content types. */
function organizationRef() {
  return {
    '@type': 'Organization' as const,
    '@id': ORGANIZATION_ID,
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject' as const,
      url: absUrl('/brand/icon.png'),
      width: 512,
      height: 512,
    },
  }
}

/** Absolute image URL for a Payload media ref, with brand OG fallback. */
function absImage(media: Parameters<typeof mediaUrl>[0], size?: 'card' | 'hero' | 'og'): string {
  const url = mediaUrl(media, size)
  return absUrl(url ?? DEFAULT_OG_IMAGE)
}

// ---------------------------------------------------------------- Site-wide

export function organizationJsonLd(settings?: SiteSetting | null) {
  const sameAs = [
    settings?.socialLinks?.instagram,
    settings?.socialLinks?.pinterest,
    settings?.socialLinks?.tiktok,
  ].filter((url): url is string => Boolean(url))

  return {
    '@context': 'https://schema.org',
    ...organizationRef(),
    sameAs: sameAs.length > 0 ? sameAs : undefined,
  }
}

export function webSiteJsonLd(settings?: SiteSetting | null) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: SITE_NAME,
    description: settings?.defaultSeo?.description ?? undefined,
    url: SITE_URL,
    publisher: { '@id': ORGANIZATION_ID },
  }
}

// -------------------------------------------------------------- Breadcrumbs

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absUrl(item.path),
    })),
  }
}

// ------------------------------------------------------------------ Recipes

type LexicalNode = {
  type?: string
  text?: string
  children?: LexicalNode[]
  [k: string]: unknown
}

/** Concatenate the text content of a Lexical node tree. */
function nodeText(node: LexicalNode): string {
  if (typeof node.text === 'string') return node.text
  if (Array.isArray(node.children)) return node.children.map(nodeText).join('')
  return ''
}

/**
 * Extract cook-along steps from a Lexical instructions field: each top-level
 * paragraph is one step (matching the numbered rendering on the recipe page);
 * list items also count as steps. Anything odd is skipped gracefully.
 */
export function extractInstructionSteps(instructions: Recipe['instructions']): string[] {
  const children = instructions?.root?.children
  if (!Array.isArray(children)) return []

  const steps: string[] = []
  for (const child of children as LexicalNode[]) {
    if (!child || typeof child !== 'object') continue
    if (child.type === 'paragraph') {
      const text = nodeText(child).trim()
      if (text) steps.push(text)
    } else if (child.type === 'list' && Array.isArray(child.children)) {
      for (const item of child.children) {
        const text = nodeText(item).trim()
        if (text) steps.push(text)
      }
    }
  }
  return steps
}

export function recipeJsonLd(recipe: Recipe) {
  const prep = recipe.prepMinutes ?? 0
  const cook = recipe.cookMinutes ?? 0
  const total = prep + cook
  const nutrition = recipe.nutrition
  const categories = (recipe.categories ?? []).filter(
    (c): c is Category => typeof c === 'object' && c !== null,
  )
  const steps = extractInstructionSteps(recipe.instructions)
  const url = absUrl(`/recipes/${recipe.slug}`)

  return {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.title,
    description: recipe.description ?? undefined,
    image: absImage(recipe.heroImage, 'hero'),
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    author: organizationRef(),
    datePublished: recipe.publishedAt ?? undefined,
    dateModified: recipe.updatedAt,
    prepTime: prep ? `PT${prep}M` : undefined,
    cookTime: cook ? `PT${cook}M` : undefined,
    totalTime: total ? `PT${total}M` : undefined,
    recipeYield: recipe.servings ? `${recipe.servings} servings` : undefined,
    recipeCategory: categories.length > 0 ? categories.map((c) => c.name) : undefined,
    keywords:
      categories.length > 0
        ? ['diabetic-friendly', 'air fryer', ...categories.map((c) => c.name)].join(', ')
        : 'diabetic-friendly, air fryer',
    recipeIngredient: (recipe.ingredients ?? [])
      .map((ing) => [ing.quantity, ing.unit, ing.item].filter(Boolean).join(' ').trim())
      .filter(Boolean),
    recipeInstructions:
      steps.length > 0
        ? steps.map((text, i) => ({ '@type': 'HowToStep', position: i + 1, text }))
        : undefined,
    nutrition:
      nutrition != null && Object.values(nutrition).some((value) => value != null)
        ? {
          '@type': 'NutritionInformation',
          servingSize: '1 serving',
          calories: nutrition.calories != null ? `${nutrition.calories} calories` : undefined,
          proteinContent: nutrition.protein != null ? `${nutrition.protein} g` : undefined,
          carbohydrateContent: nutrition.netCarbs != null ? `${nutrition.netCarbs} g` : undefined,
          fatContent: nutrition.fat != null ? `${nutrition.fat} g` : undefined,
          fiberContent: nutrition.fiber != null ? `${nutrition.fiber} g` : undefined,
        }
      : undefined,
  }
}

// ----------------------------------------------------------------- Articles

export function articleJsonLd(post: Post) {
  const url = absUrl(`/blog/${post.slug}`)
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt ?? undefined,
    image: absImage(post.heroImage, 'hero'),
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    datePublished: post.publishedAt ?? undefined,
    dateModified: post.updatedAt,
    author: organizationRef(),
    publisher: organizationRef(),
  }
}

// ----------------------------------------------------------------- Products

export function productJsonLd(product: Product) {
  const url = absUrl(`/shop/${product.slug}`)
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortPitch ?? undefined,
    image: absImage(product.gallery?.[0]?.image, 'og'),
    url,
    brand: { '@type': 'Brand', name: SITE_NAME },
    offers: {
      '@type': 'Offer',
      price: (product.priceCents / 100).toFixed(2),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url,
      seller: organizationRef(),
    },
  }
}
