'use client'

import { useActionState } from 'react'

import { subscribeAction, type FormState } from '@/app/actions/subscribe'

const initialState: FormState = { ok: false, message: '' }

type Props = {
  /** Where this signup came from, e.g. "homepage-hero", "recipe-footer". */
  source: string
  /** "light" for cream/soft backgrounds, "dark" for the ink footer. */
  variant?: 'light' | 'dark'
  className?: string
  buttonLabel?: string
}

export function SubscribeForm({
  source,
  variant = 'light',
  className,
  buttonLabel = 'Get the free guide',
}: Props) {
  const [state, formAction, pending] = useActionState(subscribeAction, initialState)

  const inputClasses =
    variant === 'dark'
      ? 'w-full rounded-full border border-cream/25 bg-cream/10 px-5 py-3 text-sm text-cream placeholder:text-cream/50'
      : 'w-full rounded-full border border-primary/25 bg-white px-5 py-3 text-sm text-ink placeholder:text-ink/45'

  const buttonClasses =
    variant === 'dark'
      ? 'shrink-0 rounded-full bg-amber px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-amber/90 disabled:opacity-60'
      : 'shrink-0 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-60'

  return (
    <div className={className}>
      <form action={formAction} className="flex flex-col gap-2.5 sm:flex-row">
        <label className="sr-only" htmlFor={`subscribe-email-${source}`}>
          Email address
        </label>
        <input
          id={`subscribe-email-${source}`}
          type="email"
          name="email"
          required
          placeholder="you@example.com"
          autoComplete="email"
          className={inputClasses}
        />
        <input type="hidden" name="source" value={source} />
        {/* Honeypot — humans never see or fill this. */}
        <div className="honeypot-field" aria-hidden="true">
          <label htmlFor={`subscribe-website-${source}`}>Website</label>
          <input
            id={`subscribe-website-${source}`}
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>
        <button type="submit" disabled={pending} className={buttonClasses}>
          {pending ? 'Sending…' : buttonLabel}
        </button>
      </form>
      {state.message ? (
        <p
          role="status"
          className={`mt-2.5 text-sm ${
            state.ok
              ? variant === 'dark'
                ? 'text-amber'
                : 'text-primary'
              : variant === 'dark'
                ? 'text-orange-300'
                : 'text-accent'
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </div>
  )
}
