'use client'

import React, { useActionState } from 'react'

import { requestNewDownloadLink, type ReRequestState } from './actions'

const initialState: ReRequestState = { done: false, message: '' }

export function ReRequestForm({ initialToken }: { initialToken?: string }) {
  const [state, formAction, pending] = useActionState(requestNewDownloadLink, initialState)

  if (state.done) {
    return (
      <div role="status" className="rounded-lg bg-primary-soft p-5 text-sm leading-relaxed">
        {state.message}
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="text-sm font-semibold">Your download link (or just the token part)</span>
        <input
          type="text"
          name="token"
          defaultValue={initialToken ?? ''}
          required
          placeholder="Paste your download link here"
          autoComplete="off"
          spellCheck={false}
          className="mt-2 w-full rounded-lg border border-primary-soft bg-white px-4 py-3 text-sm focus:border-primary focus:outline-none"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-accent px-6 py-3 font-bold text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {pending ? 'Sending…' : 'Email me a fresh link'}
      </button>
    </form>
  )
}
