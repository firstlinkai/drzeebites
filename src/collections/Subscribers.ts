import type { CollectionConfig } from 'payload'

import { adminsOnly } from '@/lib/access'

/**
 * Newsletter subscribers. Created by the subscribe server action (Phase 4)
 * via the local API with overrideAccess; synced to a Resend Audience.
 */
export const Subscribers: CollectionConfig = {
  slug: 'subscribers',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'source', 'createdAt'],
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
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'source',
      type: 'text',
      admin: {
        description: 'Where the signup came from (homepage, recipe-footer, …).',
      },
    },
  ],
}
