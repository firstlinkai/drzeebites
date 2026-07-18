import type { Field } from 'payload'

export const formatSlug = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/**
 * Reusable slug field: unique + indexed, auto-generated from `source` when
 * left empty, always normalized to url-safe form.
 */
export const slugField = (source: string = 'title'): Field => ({
  name: 'slug',
  type: 'text',
  required: true,
  unique: true,
  index: true,
  admin: {
    position: 'sidebar',
    description: `Auto-generated from ${source} when left empty.`,
  },
  hooks: {
    beforeValidate: [
      ({ value, data }) => {
        if (typeof value === 'string' && value.length > 0) return formatSlug(value)
        const sourceValue = data?.[source]
        if (typeof sourceValue === 'string' && sourceValue.length > 0) {
          return formatSlug(sourceValue)
        }
        return value
      },
    ],
  },
})
