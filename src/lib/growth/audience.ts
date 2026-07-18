import { Resend } from 'resend'

export const NEWSLETTER_AUDIENCE_NAME = 'DrZeeBites Newsletter'

const getResend = (): Resend => new Resend(process.env.RESEND_API_KEY)

/**
 * Find-or-create the "DrZeeBites Newsletter" audience in Resend and return
 * its id. Used by the one-off setup script; the app itself reads the id from
 * RESEND_AUDIENCE_ID.
 */
export async function ensureNewsletterAudience(): Promise<string> {
  const resend = getResend()

  const list = await resend.audiences.list()
  if (list.error) {
    throw new Error(`[growth] failed to list Resend audiences: ${list.error.message}`)
  }
  const existing = list.data?.data?.find((a) => a.name === NEWSLETTER_AUDIENCE_NAME)
  if (existing) return existing.id

  const created = await resend.audiences.create({ name: NEWSLETTER_AUDIENCE_NAME })
  if (created.error || !created.data) {
    throw new Error(`[growth] failed to create Resend audience: ${created.error?.message}`)
  }
  return created.data.id
}

/**
 * Add a subscriber to the newsletter audience. Best-effort and idempotent:
 * any failure (duplicate contact, missing audience id, network, unverified
 * domain restrictions) is logged and swallowed — the Payload subscriber row
 * is the source of truth.
 */
export async function addContactToNewsletterAudience(email: string): Promise<void> {
  const audienceId = process.env.RESEND_AUDIENCE_ID
  if (!audienceId) {
    console.warn('[growth] RESEND_AUDIENCE_ID not set — skipping Resend audience sync')
    return
  }
  try {
    const res = await getResend().contacts.create({
      audienceId,
      email,
      unsubscribed: false,
    })
    if (res.error) {
      console.warn(`[growth] Resend audience sync failed for ${email}:`, res.error.message)
    }
  } catch (err) {
    console.warn(`[growth] Resend audience sync threw for ${email}:`, err)
  }
}
