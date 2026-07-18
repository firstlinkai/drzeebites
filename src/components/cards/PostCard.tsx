import Image from 'next/image'
import Link from 'next/link'

import { mediaAlt, mediaUrl } from '@/components/media'
import type { Category, Post } from '@/payload-types'

type Props = {
  post: Post
  priority?: boolean
}

export function PostCard({ post, priority = false }: Props) {
  const imgUrl = mediaUrl(post.heroImage, 'card')
  const categories = (post.categories ?? []).filter(
    (c): c is Category => typeof c === 'object' && c !== null,
  )

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-[16/9] overflow-hidden bg-primary-soft">
        {imgUrl ? (
          <Image
            src={imgUrl}
            alt={mediaAlt(post.heroImage, post.title)}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 32rem, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-6">
        {categories.length > 0 ? (
          <p className="mb-2 text-xs font-semibold tracking-widest text-accent uppercase">
            {categories.map((c) => c.name).join(' · ')}
          </p>
        ) : null}
        <h3 className="font-display text-xl font-semibold text-ink">
          <Link
            href={`/blog/${post.slug}`}
            className="after:absolute after:inset-0 after:content-[''] hover:text-primary"
          >
            {post.title}
          </Link>
        </h3>
        {post.excerpt ? (
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ink/70">{post.excerpt}</p>
        ) : null}
        <p className="mt-4 text-sm font-semibold text-primary">
          Read article <span aria-hidden="true">→</span>
        </p>
      </div>
    </article>
  )
}
