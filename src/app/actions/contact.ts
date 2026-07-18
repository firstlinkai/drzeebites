'use server'

import type { FormState } from './subscribe'

/**
 * Contact form submission. Signature matches React useActionState.
 * Expects fields: name, email, subject, message, website (honeypot — must be empty).
 * Implemented in the growth phase.
 */
export async function contactAction(_prev: FormState, formData: FormData): Promise<FormState> {
  void formData
  return { ok: false, message: 'The contact form is not available yet. Please email us instead.' }
}
