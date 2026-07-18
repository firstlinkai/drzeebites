import type { Block } from 'payload'

/** Call-to-action button: either an affiliate link (via /go/[id]) or an internal href. */
export const CtaButton: Block = {
  slug: 'ctaButton',
  interfaceName: 'CtaButtonBlock',
  labels: {
    singular: 'CTA Button',
    plural: 'CTA Buttons',
  },
  fields: [
    {
      name: 'linkType',
      type: 'select',
      required: true,
      defaultValue: 'affiliate',
      options: [
        { label: 'Affiliate link', value: 'affiliate' },
        { label: 'Internal link', value: 'internal' },
      ],
    },
    {
      name: 'link',
      type: 'relationship',
      relationTo: 'affiliate-links',
      admin: {
        condition: (_data, siblingData) => siblingData?.linkType === 'affiliate',
      },
    },
    {
      name: 'href',
      type: 'text',
      admin: {
        description: 'Internal path, e.g. /shop/diabetic-air-fryer-cookbook',
        condition: (_data, siblingData) => siblingData?.linkType === 'internal',
      },
    },
    {
      name: 'label',
      type: 'text',
      required: true,
    },
    {
      name: 'style',
      type: 'select',
      defaultValue: 'primary',
      options: [
        { label: 'Primary (olive)', value: 'primary' },
        { label: 'Accent (terracotta)', value: 'accent' },
        { label: 'Outline', value: 'outline' },
      ],
    },
  ],
}
