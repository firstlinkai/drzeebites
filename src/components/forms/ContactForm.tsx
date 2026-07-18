'use client'

import { useActionState } from 'react'

import { contactAction } from '@/app/actions/contact'
import type { FormState } from '@/app/actions/subscribe'

const initialState: FormState = { ok: false, message: '' }

const fieldClasses =
  'w-full rounded-xl border border-primary/25 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink/40'

export function ContactForm() {
  const [state, formAction, pending] = useActionState(contactAction, initialState)

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="mb-1.5 block text-sm font-medium text-ink">
            Name
          </label>
          <input
            id="contact-name"
            type="text"
            name="name"
            required
            autoComplete="name"
            placeholder="Your name"
            className={fieldClasses}
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="mb-1.5 block text-sm font-medium text-ink">
            Email
          </label>
          <input
            id="contact-email"
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className={fieldClasses}
          />
        </div>
      </div>
      <div>
        <label htmlFor="contact-subject" className="mb-1.5 block text-sm font-medium text-ink">
          Subject
        </label>
        <input
          id="contact-subject"
          type="text"
          name="subject"
          placeholder="What is this about?"
          className={fieldClasses}
        />
      </div>
      <div>
        <label htmlFor="contact-message" className="mb-1.5 block text-sm font-medium text-ink">
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={6}
          placeholder="How can we help?"
          className={`${fieldClasses} resize-y rounded-2xl`}
        />
      </div>

      {/* Honeypot — humans never see or fill this. */}
      <div className="honeypot-field" aria-hidden="true">
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" type="text" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-primary px-7 py-3 text-sm font-semibold text-cream transition-colors hover:bg-primary-hover disabled:opacity-60"
      >
        {pending ? 'Sending…' : 'Send message'}
      </button>

      {state.message ? (
        <p role="status" className={`text-sm ${state.ok ? 'text-primary' : 'text-accent'}`}>
          {state.message}
        </p>
      ) : null}
    </form>
  )
}
