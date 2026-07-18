import type { Block } from 'payload'

/** Inline affiliate text link inside rich text. Rendered as /go/[id] with rel="sponsored nofollow". */
export const AffiliateLinkInline: Block = {
  slug: 'affiliateLinkInline',
  interfaceName: 'AffiliateLinkInlineBlock',
  labels: {
    singular: 'Affiliate Link (inline)',
    plural: 'Affiliate Links (inline)',
  },
  fields: [
    {
      name: 'link',
      type: 'relationship',
      relationTo: 'affiliate-links',
      required: true,
    },
    {
      name: 'label',
      type: 'text',
      admin: {
        description: 'Optional — overrides the affiliate link label as the visible text.',
      },
    },
  ],
}
