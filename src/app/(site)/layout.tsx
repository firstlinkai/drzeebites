import type { Metadata } from 'next'
import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google'
import React from 'react'

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

export const metadata: Metadata = {
  title: 'DrZeeBites — 15-Minute Diabetic-Friendly Air Fryer Recipes',
  description:
    'Low-carb, high-protein, diabetic-friendly air fryer recipes ready in 15 minutes. Home of The Diabetic Air Fryer Cookbook.',
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${jakarta.variable}`}>
      <body className="bg-cream text-ink font-sans antialiased">{children}</body>
    </html>
  )
}
