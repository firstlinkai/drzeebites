import type { CollectionConfig } from 'payload'

import { slugField } from '@/fields/slug'
import { activePublishedOrAdmin, adminsOnly } from '@/lib/access'
import { contentEditor } from '@/lib/lexical'
import { revalidateAfterChange, revalidateAfterDelete } from '@/lib/revalidate'

const productPaths = (doc: Record<string, unknown>): string[] => {
  const paths = ['/', '/shop']
  if (typeof doc.slug === 'string' && doc.slug) paths.push(`/shop/${doc.slug}`)
  return paths
}

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'priceCents', 'active', '_status'],
    group: 'Shop',
  },
  versions: {
    drafts: true,
    maxPerDoc: 25,
  },
  access: {
    read: activePublishedOrAdmin,
    create: adminsOnly,
    update: adminsOnly,
    delete: adminsOnly,
  },
  hooks: {
    afterChange: [revalidateAfterChange(productPaths)],
    afterDelete: [revalidateAfterDelete(productPaths)],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    slugField('name'),
    {
      name: 'priceCents',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Price in USD cents (e.g. 2700 = $27.00).',
      },
    },
    {
      name: 'stripePriceId',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'Stripe Price ID (price_…), set in Phase 3.',
      },
    },
    {
      name: 'shortPitch',
      type: 'textarea',
      admin: {
        description: 'One-liner used on cards and the homepage CTA.',
      },
    },
    {
      name: 'salesContent',
      type: 'richText',
      editor: contentEditor,
    },
    {
      name: 'gallery',
      type: 'array',
      labels: {
        singular: 'Image',
        plural: 'Gallery',
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
      ],
    },
    {
      name: 'pdf',
      type: 'relationship',
      relationTo: 'product-files',
      admin: {
        position: 'sidebar',
        description: 'The private PDF delivered after purchase.',
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Inactive products are hidden from the public shop.',
      },
    },
  ],
}
