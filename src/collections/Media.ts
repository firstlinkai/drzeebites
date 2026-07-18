import path from 'path'
import { fileURLToPath } from 'url'

import type { CollectionConfig } from 'payload'

import { adminsOnly, anyone } from '@/lib/access'

const dirname = path.dirname(fileURLToPath(import.meta.url))

/** Public images (recipe photos, product gallery, testimonial photos, …). */
export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Content',
  },
  access: {
    read: anyone,
    create: adminsOnly,
    update: adminsOnly,
    delete: adminsOnly,
  },
  upload: {
    // Local disk in dev; Vercel Blob takes over in production via the
    // storage-vercel-blob plugin (see payload.config.ts).
    staticDir: path.resolve(dirname, '../../media'),
    mimeTypes: ['image/*'],
    imageSizes: [
      {
        name: 'card',
        width: 600,
      },
      {
        name: 'hero',
        width: 1600,
      },
      {
        name: 'og',
        width: 1200,
        height: 630,
        position: 'centre',
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
}
