import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export type SendEmailArgs = {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailArgs): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? 'DrZeeBites <onboarding@resend.dev>',
      to,
      subject,
      html,
    })
    if (error) {
      console.error('[email] send failed:', error)
      return { ok: false, error: error.message }
    }
    return { ok: true }
  } catch (err) {
    console.error('[email] send threw:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'unknown error' }
  }
}
