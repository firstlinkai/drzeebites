import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

import type { SerializedBlockNode, SerializedEditorState } from '@payloadcms/richtext-lexical'
import { RichText, type JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'

import { mediaAlt, mediaUrl } from '@/components/media'
import type {
  AffiliateLink,
  AffiliateLinkInlineBlock,
  AffiliateProductBoxBlock,
  CtaButtonBlock,
} from '@/payload-types'

/**
 * Affiliate links must never expose the raw destination URL — they route
 * through /go/[id] (click counting) with rel="sponsored nofollow".
 */
const goHref = (link: number | AffiliateLink | null | undefined): string | null => {
  if (link == null) return null
  const id = typeof link === 'object' ? link.id : link
  return `/go/${id}`
}

const linkLabel = (link: number | AffiliateLink | null | undefined, override?: string | null) => {
  if (override) return override
  return typeof link === 'object' && link !== null ? link.label : 'View product'
}

const CTA_STYLES: Record<string, string> = {
  primary:
    'inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-primary-hover',
  accent:
    'inline-flex rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent/90',
  outline:
    'inline-flex rounded-full border-2 border-primary px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary-soft',
}

const converters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  blocks: {
    affiliateLinkInline: ({ node }: { node: SerializedBlockNode<AffiliateLinkInlineBlock> }) => {
      const href = goHref(node.fields.link)
      if (!href) return null
      return (
        <a
          href={href}
          rel="sponsored nofollow"
          className="font-medium text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent"
        >
          {linkLabel(node.fields.link, node.fields.label)}
        </a>
      )
    },

    ctaButton: ({ node }: { node: SerializedBlockNode<CtaButtonBlock> }) => {
      const { linkType, link, href, label, style } = node.fields
      const classes = CTA_STYLES[style ?? 'primary'] ?? CTA_STYLES.primary
      if (linkType === 'affiliate') {
        const affiliateHref = goHref(link)
        if (!affiliateHref) return null
        return (
          <p className="my-6">
            <a href={affiliateHref} rel="sponsored nofollow" className={classes}>
              {label}
            </a>
          </p>
        )
      }
      if (!href) return null
      return (
        <p className="my-6">
          <Link href={href} className={classes}>
            {label}
          </Link>
        </p>
      )
    },

    affiliateProductBox: ({ node }: { node: SerializedBlockNode<AffiliateProductBoxBlock> }) => {
      const { link, image, title, blurb, priceNote } = node.fields
      const href = goHref(link)
      if (!href) return null
      const imgUrl = mediaUrl(image, 'card')
      return (
        <aside className="not-prose my-8 overflow-hidden rounded-2xl border border-primary/15 bg-white shadow-sm sm:flex">
          {imgUrl ? (
            <div className="relative aspect-[4/3] sm:aspect-auto sm:w-48 sm:shrink-0">
              <Image
                src={imgUrl}
                alt={mediaAlt(image, title)}
                fill
                sizes="(min-width: 640px) 12rem, 100vw"
                className="object-cover"
              />
            </div>
          ) : null}
          <div className="flex flex-col gap-2 p-5 sm:p-6">
            <p className="text-xs font-semibold tracking-widest text-accent uppercase">
              We recommend
            </p>
            <p className="font-display text-lg font-semibold text-ink">{title}</p>
            {blurb ? <p className="text-sm leading-relaxed text-ink/70">{blurb}</p> : null}
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <a
                href={href}
                rel="sponsored nofollow"
                className="inline-flex rounded-full bg-amber px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-amber/90"
              >
                View on Amazon
              </a>
              {priceNote ? <span className="text-sm text-ink/60">{priceNote}</span> : null}
            </div>
          </div>
        </aside>
      )
    },
  },
})

type Props = {
  data: SerializedEditorState | null | undefined
  className?: string
}

/**
 * Renders Payload Lexical content (recipes.instructions, posts.content,
 * products.salesContent) including the three affiliate blocks.
 */
export function RichContent({ data, className }: Props) {
  if (!data) return null
  return (
    <RichText
      data={data}
      converters={converters}
      className={
        className ??
        'prose-content space-y-4 leading-relaxed text-ink/85 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_h2]:font-display [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-ink [&_h3]:font-display [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-ink [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6 [&_img]:rounded-2xl'
      }
    />
  )
}
