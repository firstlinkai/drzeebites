import type { CollectionConfig } from 'payload'

import { adminsOnly, anyone } from '@/lib/access'
import { revalidateAfterChange, revalidateAfterDelete } from '@/lib/revalidate'

const testimonialPaths = (): string[] => ['/']

export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  admin: {
    useAsTitle: 'name',
    group: 'Content',
  },
  access: {
    read: anyone,
    create: adminsOnly,
    update: adminsOnly,
    delete: adminsOnly,
  },
  hooks: {
    afterChange: [revalidateAfterChange(testimonialPaths)],
    afterDelete: [revalidateAfterDelete(testimonialPaths)],
  },
  fields: [
    {
      name: 'quote',
      type: 'textarea',
      required: true,
    },
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'context',
      type: 'text',
      admin: {
        description: 'e.g. "Lost 8kg with air fryer meals"',
      },
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
    },
  ],
}
