import type { Metadata } from 'next'
import React from 'react'

import { ReRequestForm } from './ReRequestForm'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Download help — DrZeeBites',
  robots: { index: false },
}

const SUPPORT_EMAIL = 'hello@drzeebites.com'

const REASON_COPY: Record<string, { heading: string; body: string }> = {
  expired: {
    heading: 'That download link has expired',
    body: 'Download links stay active for 7 days after purchase. No problem though — pop your old link in below and we’ll email you a fresh one.',
  },
  used: {
    heading: 'That link has reached its download limit',
    body: 'Each link allows up to 5 downloads. If you need your cookbook again, request a fresh link below and we’ll email it to the address you used at checkout.',
  },
  invalid: {
    heading: 'That download link doesn’t look right',
    body: 'The link may have been cut off by your email app, or mistyped. Try copying the full link from your receipt email and pasting it below — we’ll email you a fresh one.',
  },
}

const DEFAULT_COPY = {
  heading: 'Trouble downloading your cookbook?',
  body: 'Paste the download link from your receipt email below and we’ll send a fresh one to the address you used at checkout.',
}

export default async function DownloadHelpPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; token?: string }>
}) {
  const { reason, token } = await searchParams
  const copy = (reason && REASON_COPY[reason]) || DEFAULT_COPY

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-16 sm:py-24">
      <div className="rounded-2xl bg-white p-8 shadow-sm sm:p-12">
        <p className="text-sm font-semibold tracking-wide text-accent uppercase">Download help</p>
        <h1 className="font-display mt-2 text-3xl font-bold text-primary">{copy.heading}</h1>
        <p className="mt-4 leading-relaxed">{copy.body}</p>

        <div className="mt-8">
          <ReRequestForm initialToken={token} />
        </div>

        <div className="mt-10 border-t border-primary-soft pt-6 text-sm leading-relaxed text-ink/80">
          <h2 className="text-sm font-semibold tracking-wide text-ink/60 uppercase">Good to know</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Download links are valid for <strong>7 days</strong> and up to <strong>5 downloads</strong>.</li>
            <li>A fresh link is always emailed to the address used at checkout — never shown here.</li>
            <li>
              Lost your receipt email entirely? Write to{' '}
              <a className="font-semibold text-primary underline" href={`mailto:${SUPPORT_EMAIL}`}>
                {SUPPORT_EMAIL}
              </a>{' '}
              from your checkout email address and we’ll get you sorted.
            </li>
          </ul>
        </div>
      </div>
    </main>
  )
}
