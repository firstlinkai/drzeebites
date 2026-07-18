import type { CollectionConfig } from 'payload'

import { slugField } from '@/fields/slug'
import { adminsOnly, publishedOrAdmin } from '@/lib/access'
import { contentEditor } from '@/lib/lexical'
import { revalidateAfterChange, revalidateAfterDelete } from '@/lib/revalidate'

const postPaths = (doc: Record<string, unknown>): string[] => {
  const paths = ['/', '/blog']
  if (typeof doc.slug === 'string' && doc.slug) paths.push(`/blog/${doc.slug}`)
  return paths
}

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'categories', '_status', 'publishedAt'],
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
    afterChange: [revalidateAfterChange(postPaths)],
    afterDelete: [revalidateAfterDelete(postPaths)],
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
      name: 'excerpt',
      type: 'textarea',
    },
    {
      name: 'content',
      type: 'richText',
      editor: contentEditor,
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
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
