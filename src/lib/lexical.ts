import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical'

import { AffiliateLinkInline } from '@/blocks/AffiliateLinkInline'
import { AffiliateProductBox } from '@/blocks/AffiliateProductBox'
import { CtaButton } from '@/blocks/CtaButton'

/**
 * Shared Lexical editor for long-form content (recipes.instructions,
 * posts.content, products.salesContent): default features (headings, lists,
 * links, media/upload embeds, …) plus the three affiliate blocks.
 */
export const contentEditor = lexicalEditor({
  features: ({ defaultFeatures }) => [
    ...defaultFeatures,
    BlocksFeature({
      blocks: [AffiliateLinkInline, CtaButton, AffiliateProductBox],
    }),
  ],
})
