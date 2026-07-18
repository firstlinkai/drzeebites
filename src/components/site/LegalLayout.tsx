import React from 'react'

type Props = {
  title: string
  lastUpdated: string
  children: React.ReactNode
}

/**
 * Shared shell for legal pages. Content is a reasonable template for a
 * digital-cookbook business but is clearly flagged for legal review.
 */
export function LegalLayout({ title, lastUpdated, children }: Props) {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8 md:py-16">
      <header>
        <p className="text-xs font-semibold tracking-[0.25em] text-accent uppercase">Legal</p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-ink">{title}</h1>
        <p className="mt-3 text-sm text-ink/55">Last updated: {lastUpdated}</p>
      </header>

      <p className="mt-6 rounded-xl border border-amber/60 bg-amber/15 px-4 py-3 text-sm leading-relaxed text-ink/80">
        <strong>Template notice:</strong> this document is a working template written for
        DrZeeBites and has not yet been reviewed by a lawyer. Have it reviewed by qualified legal
        counsel before relying on it.
      </p>

      <div className="legal-prose mt-8 space-y-4 leading-relaxed text-ink/85 [&_h2]:font-display [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-ink [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-ink [&_li]:my-1 [&_ul]:list-disc [&_ul]:pl-6 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2">
        {children}
      </div>
    </div>
  )
}
