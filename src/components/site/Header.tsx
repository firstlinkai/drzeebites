import Image from 'next/image'
import Link from 'next/link'

import { MobileMenu } from './MobileMenu'

const NAV_LINKS = [
  { href: '/recipes', label: 'Recipes' },
  { href: '/blog', label: 'Blog' },
  { href: '/shop', label: 'Shop' },
  { href: '/contact', label: 'Contact' },
]

type Props = {
  /** Route to the flagship cookbook sales page, e.g. /shop/diabetic-air-fryer-cookbook */
  cookbookHref: string
}

export function Header({ cookbookHref }: Props) {
  return (
    <header className="relative z-40 border-b border-primary/10 bg-cream/95 backdrop-blur supports-[backdrop-filter]:bg-cream/85">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8 md:h-20">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 rounded-full"
          aria-label="DrZeeBites home"
        >
          <Image
            src="/brand/logo-badge.jpg"
            alt=""
            width={44}
            height={44}
            priority
            className="h-10 w-10 rounded-full border-2 border-primary-soft md:h-11 md:w-11"
          />
          <span className="font-display text-xl font-semibold tracking-tight text-primary md:text-2xl">
            DrZeeBites
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="rounded-full px-4 py-2 text-sm font-medium text-ink/80 transition-colors hover:bg-primary-soft hover:text-primary"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href={cookbookHref}
            className="hidden rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent/90 sm:inline-flex"
          >
            Get the Cookbook
          </Link>
          <MobileMenu links={NAV_LINKS} ctaHref={cookbookHref} ctaLabel="Get the Cookbook" />
        </div>
      </div>
    </header>
  )
}
