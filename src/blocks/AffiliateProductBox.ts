import type { Block } from 'payload'

/** Featured affiliate product box: image, title, blurb, price note + "View on Amazon" style button. */
export const AffiliateProductBox: Block = {
  slug: 'affiliateProductBox',
  interfaceName: 'AffiliateProductBoxBlock',
  labels: {
    singular: 'Affiliate Product Box',
    plural: 'Affiliate Product Boxes',
  },
  fields: [
    {
      name: 'link',
      type: 'relationship',
      relationTo: 'affiliate-links',
      required: true,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'blurb',
      type: 'textarea',
    },
    {
      name: 'priceNote',
      type: 'text',
      admin: {
        description: 'e.g. "Around $89 on Amazon" — never a live price.',
      },
    },
  ],
}
