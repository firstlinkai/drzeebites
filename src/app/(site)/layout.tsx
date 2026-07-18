import type { Metadata } from 'next'
import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google'
import React from 'react'

import { Footer } from '@/components/site/Footer'
import { Header } from '@/components/site/Header'
import { getPayload } from '@/lib/payload'

import './globals.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
})

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
})

const FALLBACK_COOKBOOK_SLUG = 'diabetic-air-fryer-cookbook'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'),
  title: {
    default: 'DrZeeBites — 15-Minute Diabetic-Friendly Air Fryer Recipes',
    template: '%s — DrZeeBites',
  },
  description:
    'Low-carb, high-protein, diabetic-friendly air fryer recipes ready in 15 minutes. Home of The Diabetic Air Fryer Cookbook.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/brand/icon.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: '/brand/apple-icon.png',
  },
  openGraph: {
    siteName: 'DrZeeBites',
    type: 'website',
    images: [{ url: '/brand/og-default.png', width: 1200, height: 630, alt: 'DrZeeBites' }],
  },
}

async function getChromeData() {
  try {
    const payload = await getPayload()
    const [settings, products] = await Promise.all([
      payload.findGlobal({ slug: 'site-settings' }),
      payload.find({
        collection: 'products',
        where: {
          and: [{ active: { equals: true } }, { _status: { equals: 'published' } }],
        },
        sort: 'createdAt',
        limit: 1,
        depth: 0,
      }),
    ])
    return {
      settings,
      cookbookSlug: products.docs[0]?.slug ?? FALLBACK_COOKBOOK_SLUG,
    }
  } catch {
    // Never let chrome data take the whole site down.
    return { settings: null, cookbookSlug: FALLBACK_COOKBOOK_SLUG }
  }
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { settings, cookbookSlug } = await getChromeData()
  const announcement = settings?.announcement

  return (
    <html lang="en" className={`${fraunces.variable} ${jakarta.variable}`}>
      <body className="bg-cream text-ink font-sans antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-cream"
        >
          Skip to content
        </a>

        {announcement?.enabled && announcement.text ? (
          <p className="bg-primary px-4 py-2 text-center text-sm font-medium text-cream">
            {announcement.text}
          </p>
        ) : null}

        <Header cookbookHref={`/shop/${cookbookSlug}`} />

        <main id="main-content">{children}</main>

        <Footer socialLinks={settings?.socialLinks} />
      </body>
    </html>
  )
}
