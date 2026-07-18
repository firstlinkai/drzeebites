import Image from 'next/image'
import Link from 'next/link'

import { SubscribeForm } from '@/components/forms/SubscribeForm'
import type { SiteSetting } from '@/payload-types'

import { SocialLinks } from './SocialIcons'

const EXPLORE_LINKS = [
  { href: '/recipes', label: 'Recipes' },
  { href: '/blog', label: 'Blog' },
  { href: '/shop', label: 'Shop' },
  { href: '/contact', label: 'Contact' },
]

const LEGAL_LINKS = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
  { href: '/affiliate-disclosure', label: 'Affiliate Disclosure' },
]

type Props = {
  socialLinks: SiteSetting['socialLinks']
}

export function Footer({ socialLinks }: Props) {
  return (
    <footer className="bg-ink text-cream/80">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 md:py-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1.6fr] md:gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5 rounded-full">
              <Image
                src="/brand/logo-badge.jpg"
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 rounded-full border-2 border-cream/20"
              />
              <span className="font-display text-xl font-semibold text-cream">DrZeeBites</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed">
              15-minute diabetic-friendly air fryer recipes — low carb, high protein, and never
              bland.
            </p>
            <SocialLinks
              socialLinks={socialLinks}
              className="mt-5 flex items-center gap-2 text-cream/70"
            />
          </div>

          {/* Explore */}
          <nav aria-label="Footer">
            <h2 className="text-sm font-semibold tracking-wide text-cream uppercase">Explore</h2>
            <ul className="mt-4 space-y-2.5">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors hover:text-amber"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Legal */}
          <nav aria-label="Legal">
            <h2 className="text-sm font-semibold tracking-wide text-cream uppercase">Legal</h2>
            <ul className="mt-4 space-y-2.5">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors hover:text-amber"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Newsletter */}
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-cream uppercase">
              Free 7-Day Diabetic Snack Guide
            </h2>
            <p className="mt-4 text-sm leading-relaxed">
              Join the list and get the free snack guide, plus one new 15-minute recipe every week.
            </p>
            <SubscribeForm source="footer" variant="dark" className="mt-4" />
          </div>
        </div>

        <div className="mt-12 border-t border-cream/15 pt-6 text-xs leading-relaxed text-cream/50">
          <p>
            Some links on this site are affiliate links — if you buy through them we may earn a
            small commission at no extra cost to you. See our{' '}
            <Link href="/affiliate-disclosure" className="underline hover:text-amber">
              affiliate disclosure
            </Link>
            . Recipes and nutrition information are for general guidance and are not medical
            advice.
          </p>
          <p className="mt-3">© {new Date().getFullYear()} DrZeeBites. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
