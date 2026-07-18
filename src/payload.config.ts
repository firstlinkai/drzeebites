import path from 'path'
import { fileURLToPath } from 'url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { buildConfig, type Plugin } from 'payload'
import sharp from 'sharp'

import { AffiliateLinks } from '@/collections/AffiliateLinks'
import { Categories } from '@/collections/Categories'
import { ContactSubmissions } from '@/collections/ContactSubmissions'
import { Media } from '@/collections/Media'
import { Orders } from '@/collections/Orders'
import { Posts } from '@/collections/Posts'
import { ProductFiles } from '@/collections/ProductFiles'
import { Products } from '@/collections/Products'
import { Recipes } from '@/collections/Recipes'
import { Subscribers } from '@/collections/Subscribers'
import { Testimonials } from '@/collections/Testimonials'
import { Users } from '@/collections/Users'
import { SiteSettings } from '@/globals/SiteSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const plugins: Plugin[] = []

// On Vercel the filesystem is ephemeral — store uploads in Vercel Blob.
// Locally (no BLOB_READ_WRITE_TOKEN) uploads go to ./media and ./private on disk.
if (process.env.BLOB_READ_WRITE_TOKEN) {
  plugins.push(
    vercelBlobStorage({
      collections: {
        media: true,
        'product-files': true,
      },
      // Random suffix -> unguessable blob URLs; product-files access control
      // still applies because reads go through Payload's file endpoint.
      addRandomSuffix: true,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    }),
  )
}

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: '— DrZeeBites',
    },
  },
  collections: [
    // Content
    Recipes,
    Posts,
    Categories,
    Testimonials,
    Media,
    // Shop
    Products,
    ProductFiles,
    Orders,
    // Audience
    Subscribers,
    ContactSubmissions,
    AffiliateLinks,
    // Admin
    Users,
  ],
  globals: [SiteSettings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),
  sharp,
  plugins,
})
