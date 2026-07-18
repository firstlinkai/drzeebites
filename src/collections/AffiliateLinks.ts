import type { CollectionConfig } from 'payload'

import { adminsOnly } from '@/lib/access'

/**
 * Affiliate destinations. No public read needed: the /go/[id] redirect
 * handler (Phase 4) resolves and increments clickCount via the local API.
 */
export const AffiliateLinks: CollectionConfig = {
  slug: 'affiliate-links',
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'url', 'clickCount'],
    group: 'Audience',
  },
  access: {
    read: adminsOnly,
    create: adminsOnly,
    update: adminsOnly,
    delete: adminsOnly,
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      required: true,
    },
    {
      name: 'url',
      type: 'text',
      required: true,
      admin: {
        description: 'Full destination URL (e.g. Amazon affiliate link with tag).',
      },
    },
    {
      name: 'clickCount',
      type: 'number',
      defaultValue: 0,
      min: 0,
      admin: {
        description: 'Incremented by the /go/[id] redirect handler.',
      },
    },
  ],
}
