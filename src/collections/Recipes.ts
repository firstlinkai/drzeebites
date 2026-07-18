import type { CollectionConfig } from 'payload'

import { slugField } from '@/fields/slug'
import { adminsOnly, publishedOrAdmin } from '@/lib/access'
import { contentEditor } from '@/lib/lexical'
import { revalidateAfterChange, revalidateAfterDelete } from '@/lib/revalidate'

const recipePaths = (doc: Record<string, unknown>): string[] => {
  const paths = ['/', '/recipes']
  if (typeof doc.slug === 'string' && doc.slug) paths.push(`/recipes/${doc.slug}`)
  return paths
}

export const Recipes: CollectionConfig = {
  slug: 'recipes',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'categories', 'difficulty', '_status', 'publishedAt'],
    group: 'Content',
  },
  versions: {
    drafts: true,
    maxPerDoc: 25,
  },
  access: {
    read: publishedOrAdmin,
    create: adminsOnly,
    update: adminsOnly,
    delete: adminsOnly,
  },
  hooks: {
    afterChange: [revalidateAfterChange(recipePaths)],
    afterDelete: [revalidateAfterDelete(recipePaths)],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    slugField('title'),
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'prepMinutes',
          type: 'number',
          min: 0,
        },
        {
          name: 'cookMinutes',
          type: 'number',
          min: 0,
        },
        {
          name: 'servings',
          type: 'number',
          min: 1,
        },
        {
          name: 'difficulty',
          type: 'select',
          defaultValue: 'easy',
          options: [
            { label: 'Easy', value: 'easy' },
            { label: 'Medium', value: 'medium' },
            { label: 'Hard', value: 'hard' },
          ],
        },
      ],
    },
    {
      name: 'ingredients',
      type: 'array',
      labels: {
        singular: 'Ingredient',
        plural: 'Ingredients',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'quantity',
              type: 'text',
            },
            {
              name: 'unit',
              type: 'text',
            },
            {
              name: 'item',
              type: 'text',
              required: true,
            },
            {
              name: 'note',
              type: 'text',
            },
          ],
        },
      ],
    },
    {
      name: 'instructions',
      type: 'richText',
      editor: contentEditor,
    },
    {
      name: 'nutrition',
      type: 'group',
      admin: {
        description: 'Per serving.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'calories', type: 'number', min: 0 },
            { name: 'protein', type: 'number', min: 0, admin: { description: 'grams' } },
            { name: 'netCarbs', type: 'number', min: 0, admin: { description: 'grams' } },
            { name: 'fat', type: 'number', min: 0, admin: { description: 'grams' } },
            { name: 'fiber', type: 'number', min: 0, admin: { description: 'grams' } },
          ],
        },
      ],
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
  ],
}
