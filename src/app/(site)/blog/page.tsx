import type { Metadata } from 'next'

import { PostCard } from '@/components/cards/PostCard'
import { getPayload } from '@/lib/payload'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Guides and articles on diabetic-friendly cooking, air fryer technique, and eating well with steady blood sugar.',
}

export default async function BlogPage() {
  const payload = await getPayload()
  const posts = await payload.find({
    collection: 'posts',
    where: { _status: { equals: 'published' } },
    sort: '-publishedAt',
    limit: 24,
    depth: 1,
  })

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 md:py-16">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold tracking-[0.25em] text-accent uppercase">The blog</p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-ink sm:text-5xl">
          Guides for the diabetic kitchen
        </h1>
        <p className="mt-4 leading-relaxed text-ink/75">
          Air fryer technique, ingredient swaps, and practical strategies for eating food you
          love while keeping glucose curves flat.
        </p>
      </header>

      {posts.docs.length > 0 ? (
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {posts.docs.map((post, i) => (
            <PostCard key={post.id} post={post} priority={i < 2} />
          ))}
        </div>
      ) : (
        <p className="mt-16 rounded-2xl border border-primary/15 bg-white p-10 text-center text-ink/70">
          No articles published yet — check back soon.
        </p>
      )}
    </div>
  )
}
