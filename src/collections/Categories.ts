import type { CollectionConfig } from 'payload'

import { slugField } from '@/fields/slug'
import { adminsOnly, anyone } from '@/lib/access'
import { revalidateAfterChange, revalidateAfterDelete } from '@/lib/revalidate'

const categoryPaths = (): string[] => ['/', '/recipes', '/blog']

/** Shared taxonomy for recipes and posts. */
export const Categories: CollectionConfig = {
  slug: 'categories',
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
    afterChange: [revalidateAfterChange(categoryPaths)],
    afterDelete: [revalidateAfterDelete(categoryPaths)],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    slugField('name'),
  ],
}
