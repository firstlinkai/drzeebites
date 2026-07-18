'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useId, useState } from 'react'

type NavLink = { href: string; label: string }

type Props = {
  links: NavLink[]
  ctaHref: string
  ctaLabel: string
}

/**
 * Minimal accessible mobile menu: a toggle button with aria-expanded and a
 * plain collapsible list. Closes automatically on navigation.
 */
export function MobileMenu({ links, ctaHref, ctaLabel }: Props) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const pathname = usePathname()

  // Close the menu whenever the route changes.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary-soft"
      >
        <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
        {open ? (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h10" />
          </svg>
        )}
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="absolute inset-x-0 top-full z-40 border-b border-primary/10 bg-cream shadow-lg"
      >
        <nav aria-label="Mobile" className="mx-auto max-w-6xl px-5 py-4 sm:px-8">
          <ul className="flex flex-col">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block rounded-lg px-3 py-3 text-lg font-medium text-ink transition-colors hover:bg-primary-soft hover:text-primary"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href={ctaHref}
            className="mt-3 block rounded-full bg-accent px-6 py-3 text-center text-base font-semibold text-white transition-colors hover:bg-accent/90"
          >
            {ctaLabel}
          </Link>
        </nav>
      </div>
    </div>
  )
}
