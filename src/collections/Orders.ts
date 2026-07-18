import type { CollectionConfig } from 'payload'

import { adminsOnly } from '@/lib/access'

/**
 * Orders are created exclusively by the Stripe webhook handler (Phase 3) via
 * the local API with overrideAccess — never through public REST/GraphQL.
 */
export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'product', 'amountCents', 'status', 'downloadCount', 'createdAt'],
    group: 'Shop',
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
      index: true,
    },
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      required: true,
    },
    {
      name: 'amountCents',
      type: 'number',
      required: true,
      min: 0,
    },
    {
      name: 'currency',
      type: 'text',
      defaultValue: 'usd',
    },
    {
      name: 'stripeSessionId',
      type: 'text',
      unique: true,
      index: true,
    },
    {
      name: 'stripeEventId',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        description: 'Webhook idempotency key.',
      },
    },
    {
      name: 'downloadToken',
      type: 'text',
      index: true,
    },
    {
      name: 'tokenExpiresAt',
      type: 'date',
    },
    {
      name: 'downloadCount',
      type: 'number',
      defaultValue: 0,
      min: 0,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'paid',
      options: [
        { label: 'Paid', value: 'paid' },
        { label: 'Refunded', value: 'refunded' },
        { label: 'Email failed', value: 'emailFailed' },
      ],
    },
  ],
}
