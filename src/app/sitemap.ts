import type { MetadataRoute } from 'next'

import { getPayload } from '@/lib/payload'
import { absUrl } from '@/lib/seo/site'

export const revalidate = 3600

type StaticRoute = {
  path: string
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>
  priority: number
}

const STATIC_ROUTES: StaticRoute[] = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/recipes', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/blog', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/shop', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/contact', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.1 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.1 },
  { path: '/affiliate-disclosure', changeFrequency: 'yearly', priority: 0.1 },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: absUrl(route.path),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))

  try {
    const payload = await getPayload()
    const [recipes, posts, products] = await Promise.all([
      payload.find({
        collection: 'recipes',
        where: { _status: { equals: 'published' } },
        limit: 1000,
        depth: 0,
        select: { slug: true, updatedAt: true },
      }),
      payload.find({
        collection: 'posts',
        where: { _status: { equals: 'published' } },
        limit: 1000,
        depth: 0,
        select: { slug: true, updatedAt: true },
      }),
      payload.find({
        collection: 'products',
        where: { and: [{ active: { equals: true } }, { _status: { equals: 'published' } }] },
        limit: 1000,
        depth: 0,
        select: { slug: true, updatedAt: true },
      }),
    ])

    for (const recipe of recipes.docs) {
      entries.push({
        url: absUrl(`/recipes/${recipe.slug}`),
        lastModified: recipe.updatedAt ? new Date(recipe.updatedAt) : undefined,
        changeFrequency: 'monthly',
        priority: 0.8,
      })
    }
    for (const post of posts.docs) {
      entries.push({
        url: absUrl(`/blog/${post.slug}`),
        lastModified: post.updatedAt ? new Date(post.updatedAt) : undefined,
        changeFrequency: 'monthly',
        priority: 0.6,
      })
    }
    for (const product of products.docs) {
      entries.push({
        url: absUrl(`/shop/${product.slug}`),
        lastModified: product.updatedAt ? new Date(product.updatedAt) : undefined,
        changeFrequency: 'monthly',
        priority: 0.9,
      })
    }
  } catch {
    // CMS unavailable — still serve the static routes rather than a 500.
  }

  return entries
}
