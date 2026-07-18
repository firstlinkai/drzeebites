'use server'

export type FormState = { ok: boolean; message: string }

/**
 * Lead-magnet newsletter signup. Signature matches React useActionState.
 * Expects fields: email, source, website (honeypot — must be empty).
 * Implemented in the growth phase.
 */
export async function subscribeAction(_prev: FormState, formData: FormData): Promise<FormState> {
  void formData
  return { ok: false, message: 'Signups are not open yet. Please try again soon.' }
}
