import React from 'react'

import type { SiteSetting } from '@/payload-types'

/* Hand-drawn inline SVG icons — no icon library, no extra JS. */

export function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function PinterestIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 15.5c.6-2.4 1.2-4.9 1.2-4.9s-.3-.6-.3-1.5c0-1.4.8-2.4 1.9-2.4.9 0 1.3.6 1.3 1.5 0 .9-.6 2.2-.9 3.4-.2 1 .5 1.9 1.6 1.9 1.9 0 3.2-2 3.2-4.4 0-2.3-1.7-4-4.4-4-3.1 0-5 2.3-5 4.7 0 .9.3 1.6.8 2.1" />
      <path d="M10.7 10.6 8.8 18.5" />
    </svg>
  )
}

export function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M14.5 3v9.8a3.9 3.9 0 1 1-3.9-3.9" />
      <path d="M14.5 3c.4 2.8 2.2 4.6 5 5" />
    </svg>
  )
}

type SocialLinksProps = {
  socialLinks: SiteSetting['socialLinks']
  className?: string
  iconClassName?: string
}

/** Row of social icon links. Renders nothing if no links are configured. */
export function SocialLinks({ socialLinks, className, iconClassName = 'h-5 w-5' }: SocialLinksProps) {
  const items = [
    { href: socialLinks?.instagram, label: 'DrZeeBites on Instagram', Icon: InstagramIcon },
    { href: socialLinks?.pinterest, label: 'DrZeeBites on Pinterest', Icon: PinterestIcon },
    { href: socialLinks?.tiktok, label: 'DrZeeBites on TikTok', Icon: TikTokIcon },
  ].filter((item): item is { href: string; label: string; Icon: typeof InstagramIcon } =>
    Boolean(item.href),
  )

  if (items.length === 0) return null

  return (
    <ul className={className ?? 'flex items-center gap-3'}>
      {items.map(({ href, label, Icon }) => (
        <li key={label}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="inline-flex rounded-full p-1.5 transition-colors hover:text-accent"
          >
            <Icon className={iconClassName} />
          </a>
        </li>
      ))}
    </ul>
  )
}
