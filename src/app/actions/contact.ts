'use server'

import { z } from 'zod'

import { sendEmail } from '@/lib/email'
import { contactNotificationHtml } from '@/lib/growth/emails'
import { getPayload } from '@/lib/payload'

import type { FormState } from './subscribe'

const contactSchema = z.object({
  name: z
    .string({ error: 'Please enter your name.' })
    .trim()
    .min(2, 'Please enter your name (at least 2 characters).')
    .max(200, 'That name looks a little long — 200 characters max.'),
  email: z
    .string({ error: 'Please enter your email address.' })
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: 'Please enter a valid email address.' })),
  subject: z
    .string({ error: 'Please enter a subject.' })
    .trim()
    .min(2, 'Please enter a subject (at least 2 characters).')
    .max(300, 'Please keep the subject under 300 characters.'),
  message: z
    .string({ error: 'Please enter a message.' })
    .trim()
    .min(10, 'Please tell us a little more — messages need at least 10 characters.')
    .max(5000, 'Please keep your message under 5000 characters.'),
})

/**
 * Contact form submission. Signature matches React useActionState.
 * Expects fields: name, email, subject, message, website (honeypot — must be empty).
 */
export async function contactAction(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    // Honeypot: bots fill the hidden "website" field. Pretend success, save nothing.
    const honeypot = formData.get('website')
    if (typeof honeypot === 'string' && honeypot.trim() !== '') {
      return { ok: true, message: "Thanks — we'll get back to you within 1-2 business days." }
    }

    const parsed = contactSchema.safeParse({
      name: formData.get('name'),
      email: formData.get('email'),
      subject: formData.get('subject'),
      message: formData.get('message'),
    })
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Please check the form and try again.'
      return { ok: false, message }
    }
    const { name, email, subject, message } = parsed.data

    const payload = await getPayload()
    await payload.create({
      collection: 'contact-submissions',
      data: { name, email, subject, message, isRead: false },
      overrideAccess: true,
    })

    // Notify the admin — best-effort; the submission is already saved and
    // visible in the admin panel even if the email fails.
    const adminEmail = process.env.ADMIN_NOTIFY_EMAIL
    if (adminEmail) {
      const emailResult = await sendEmail({
        to: adminEmail,
        subject: `New contact form message: ${subject}`,
        html: contactNotificationHtml({ name, email, subject, message }),
      })
      if (!emailResult.ok) {
        console.warn(`[contact] admin notification not delivered: ${emailResult.error}`)
      }
    } else {
      console.warn('[contact] ADMIN_NOTIFY_EMAIL not set — skipping admin notification')
    }

    return { ok: true, message: "Thanks — we'll get back to you within 1-2 business days." }
  } catch (err) {
    console.error('[contact] action failed:', err)
    return { ok: false, message: 'Something went wrong on our end — please try again in a moment.' }
  }
}
