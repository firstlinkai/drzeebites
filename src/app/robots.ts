import type { MetadataRoute } from 'next'

import { absUrl } from '@/lib/seo/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api', '/thank-you', '/download', '/download-help', '/go'],
      },
    ],
    sitemap: absUrl('/sitemap.xml'),
  }
}
