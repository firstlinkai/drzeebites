import type { GlobalConfig } from 'payload'

import { adminsOnly, anyone } from '@/lib/access'
import { revalidateGlobalAfterChange } from '@/lib/revalidate'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings',
  admin: {
    group: 'Admin',
  },
  access: {
    read: anyone,
    update: adminsOnly,
  },
  hooks: {
    // Site settings (announcement bar, footer socials, default SEO) affect
    // every page — revalidate the whole layout tree.
    afterChange: [revalidateGlobalAfterChange(['/'], 'layout')],
  },
  fields: [
    {
      name: 'socialLinks',
      type: 'group',
      fields: [
        { name: 'instagram', type: 'text' },
        { name: 'pinterest', type: 'text' },
        { name: 'tiktok', type: 'text' },
      ],
    },
    {
      name: 'defaultSeo',
      type: 'group',
      fields: [
        { name: 'title', type: 'text' },
        { name: 'description', type: 'textarea' },
      ],
    },
    {
      name: 'announcement',
      type: 'group',
      fields: [
        { name: 'text', type: 'text' },
        { name: 'enabled', type: 'checkbox', defaultValue: false },
      ],
    },
  ],
}
