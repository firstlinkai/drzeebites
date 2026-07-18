import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

import { PostCard } from '@/components/cards/PostCard'
import { SubscribeForm } from '@/components/forms/SubscribeForm'
import { mediaAlt, mediaUrl } from '@/components/media'
import { RichContent } from '@/components/richtext/RichContent'
import { getPayload } from '@/lib/payload'
import { articleJsonLd, breadcrumbJsonLd } from '@/lib/seo/jsonld'
import { JsonLd } from '@/lib/seo/json-ld'
import { pageMetadata } from '@/lib/seo/meta'
import type { Category, Post } from '@/payload-types'

export const revalidate = 300

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const payload = await getPayload()
  const posts = await payload.find({
    collection: 'posts',
    where: { _status: { equals: 'published' } },
    limit: 200,
    depth: 0,
    select: { slug: true },
  })
  return posts.docs.map((p) => ({ slug: p.slug }))
}

async function getPost(slug: string): Promise<Post | null> {
  const payload = await getPayload()
  const res = await payload.find({
    collection: 'posts',
    where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
    limit: 1,
    depth: 2,
  })
  return res.docs[0] ?? null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return { title: 'Article not found' }
  return pageMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
    image: mediaUrl(post.heroImage, 'og'),
    ogType: 'article',
  })
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()

  const categories = (post.categories ?? []).filter(
    (c): c is Category => typeof c === 'object' && c !== null,
  )

  const payload = await getPayload()
  const relatedRes =
    categories.length > 0
      ? await payload.find({
          collection: 'posts',
          where: {
            and: [
              { _status: { equals: 'published' } },
              { categories: { in: categories.map((c) => c.id) } },
              { id: { not_equals: post.id } },
            ],
          },
          sort: '-publishedAt',
          limit: 2,
          depth: 1,
        })
      : { docs: [] as Post[] }

  const heroUrl = mediaUrl(post.heroImage, 'hero')
  const published = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  return (
    <article className="mx-auto max-w-6xl px-5 py-10 sm:px-8 md:py-14">
      <JsonLd data={articleJsonLd(post)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Blog', path: '/blog' },
          { name: post.title, path: `/blog/${post.slug}` },
        ])}
      />

      <header className="mx-auto max-w-3xl text-center">
        {categories.length > 0 ? (
          <ul className="flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <li key={cat.id}>
                <span className="inline-flex rounded-full bg-primary-soft px-3.5 py-1.5 text-xs font-semibold text-primary">
                  {cat.name}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        <h1 className="mt-4 font-display text-4xl leading-tight font-semibold text-ink sm:text-5xl">
          {post.title}
        </h1>
        {published ? (
          <p className="mt-3 text-sm text-ink/55">
            <time dateTime={post.publishedAt ?? undefined}>{published}</time> · DrZeeBites
          </p>
        ) : null}
      </header>

      {heroUrl ? (
        <div className="relative mx-auto mt-10 aspect-[16/9] max-w-4xl overflow-hidden rounded-3xl bg-primary-soft shadow-sm">
          <Image
            src={heroUrl}
            alt={mediaAlt(post.heroImage, post.title)}
            fill
            priority
            sizes="(min-width: 1024px) 56rem, 100vw"
            className="object-cover"
          />
        </div>
      ) : null}

      <div className="mx-auto mt-10 max-w-2xl">
        {post.excerpt ? (
          <p className="mb-8 border-l-4 border-amber pl-5 text-lg leading-relaxed text-ink/80 italic">
            {post.excerpt}
          </p>
        ) : null}
        <RichContent data={post.content as SerializedEditorState | null} />
      </div>

      {/* Related posts */}
      {relatedRes.docs.length > 0 ? (
        <section aria-labelledby="related-posts-heading" className="mx-auto mt-16 max-w-4xl border-t border-primary/10 pt-12">
          <h2 id="related-posts-heading" className="font-display text-2xl font-semibold text-ink">
            Keep reading
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {relatedRes.docs.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Lead magnet */}
      <section
        aria-labelledby="post-subscribe-heading"
        className="mx-auto mt-16 max-w-3xl rounded-3xl bg-primary-soft px-6 py-10 text-center sm:px-10"
      >
        <h2 id="post-subscribe-heading" className="font-display text-2xl font-semibold text-ink">
          Enjoyed this? Get one practical guide per week
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink/70">
          Join the list and start with the Free 7-Day Diabetic Snack Guide.
        </p>
        <SubscribeForm source="blog-footer" className="mx-auto mt-6 max-w-md" buttonLabel="Send me the guide" />
      </section>

      <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-ink/50">
        <Link href="/blog" className="font-semibold text-primary underline-offset-4 hover:underline">
          ← Back to all articles
        </Link>
      </p>
    </article>
  )
}
