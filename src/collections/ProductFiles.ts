import path from 'path'
import { fileURLToPath } from 'url'

import type { CollectionConfig } from 'payload'

import { adminsOnly } from '@/lib/access'

const dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Paid product PDFs. NEVER publicly readable — read access is admin-only, so
 * Payload's file-serving endpoint 403s for anonymous requests. Customers get
 * files exclusively through the token-validated /download/[token] route
 * (Phase 3), which streams server-side with overrideAccess.
 */
export const ProductFiles: CollectionConfig = {
  slug: 'product-files',
  admin: {
    group: 'Shop',
    description: 'Private PDFs delivered only via tokenized download links.',
  },
  access: {
    read: adminsOnly,
    create: adminsOnly,
    update: adminsOnly,
    delete: adminsOnly,
  },
  upload: {
    staticDir: path.resolve(dirname, '../../private'),
    mimeTypes: ['application/pdf'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
}
