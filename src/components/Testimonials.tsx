import Image from 'next/image'

import { mediaAlt, mediaUrl } from '@/components/media'
import type { Testimonial } from '@/payload-types'

function Stars() {
  return (
    <div className="flex gap-0.5 text-amber" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
          <path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.9l-5.3 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
        </svg>
      ))}
    </div>
  )
}

export function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const photoUrl = mediaUrl(testimonial.photo, 'card')
  return (
    <figure className="flex h-full flex-col rounded-2xl border border-primary/10 bg-white p-6 shadow-sm">
      <Stars />
      <span className="sr-only">Rated 5 out of 5</span>
      <blockquote className="mt-4 flex-1 text-[0.95rem] leading-relaxed text-ink/85">
        “{testimonial.quote}”
      </blockquote>
      <figcaption className="mt-5 flex items-center gap-3 border-t border-primary/10 pt-4">
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={mediaAlt(testimonial.photo, testimonial.name)}
            width={40}
            height={40}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft font-display text-sm font-semibold text-primary"
          >
            {testimonial.name.charAt(0)}
          </span>
        )}
        <div>
          <p className="text-sm font-semibold text-ink">{testimonial.name}</p>
          {testimonial.context ? (
            <p className="text-xs text-ink/60">{testimonial.context}</p>
          ) : null}
        </div>
      </figcaption>
    </figure>
  )
}

export function TestimonialGrid({ testimonials }: { testimonials: Testimonial[] }) {
  if (testimonials.length === 0) return null
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {testimonials.map((t) => (
        <li key={t.id}>
          <TestimonialCard testimonial={t} />
        </li>
      ))}
    </ul>
  )
}
