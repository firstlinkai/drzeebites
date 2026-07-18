'use server'

import { z } from 'zod'

import { sendEmail } from '@/lib/email'
import { addContactToNewsletterAudience } from '@/lib/growth/audience'
import { welcomeEmailHtml } from '@/lib/growth/emails'
import { getPayload } from '@/lib/payload'

export type FormState = { ok: boolean; message: string }

const GUIDE_PATH = '/downloads/drzee-7-day-snack-guide.pdf'

const subscribeSchema = z.object({
  email: z
    .string({ error: 'Please enter your email address.' })
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: 'Please enter a valid email address.' })),
  source: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v ? v : 'site')),
})

/**
 * Lead-magnet newsletter signup. Signature matches React useActionState.
 * Expects fields: email, source, website (honeypot — must be empty).
 */
export async function subscribeAction(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    // Honeypot: bots fill the hidden "website" field. Pretend success, save nothing.
    const honeypot = formData.get('website')
    if (typeof honeypot === 'string' && honeypot.trim() !== '') {
      return { ok: true, message: 'Thanks!' }
    }

    const parsed = subscribeSchema.safeParse({
      email: formData.get('email'),
      source: formData.get('source') ?? undefined,
    })
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Please enter a valid email address.'
      return { ok: false, message }
    }
    const { email, source } = parsed.data

    const payload = await getPayload()

    // Upsert by email (the field is unique).
    const existing = await payload.find({
      collection: 'subscribers',
      where: { email: { equals: email } },
      limit: 1,
      overrideAccess: true,
    })
    if (existing.docs[0]) {
      return { ok: true, message: "You're already on the list — check your inbox!" }
    }

    try {
      await payload.create({
        collection: 'subscribers',
        data: { email, source },
        overrideAccess: true,
      })
    } catch (err) {
      // Unique-constraint race: someone subscribed with this email between
      // our find and create. Treat as the duplicate case.
      const msg = err instanceof Error ? err.message : String(err)
      if (/unique|duplicate/i.test(msg)) {
        return { ok: true, message: "You're already on the list — check your inbox!" }
      }
      throw err
    }

    // Best-effort side effects — the subscriber row is already saved.
    await addContactToNewsletterAudience(email)

    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'
    const emailResult = await sendEmail({
      to: email,
      subject: 'Your Free 7-Day Diabetic Snack Guide 🎁',
      html: welcomeEmailHtml(`${serverUrl}${GUIDE_PATH}`),
    })
    if (!emailResult.ok) {
      // Logged inside sendEmail; still a success for the visitor (e.g. the
      // Resend sandbox domain can only deliver to the account owner).
      console.warn(`[subscribe] welcome email not delivered to ${email}: ${emailResult.error}`)
    }

    return {
      ok: true,
      message: "You're in! Your free 7-Day Diabetic Snack Guide is on its way to your inbox.",
    }
  } catch (err) {
    console.error('[subscribe] action failed:', err)
    return { ok: false, message: 'Something went wrong on our end — please try again in a moment.' }
  }
}
