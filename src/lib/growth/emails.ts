/**
 * Branded HTML email templates for the growth features (Phase 4).
 * Simple table-based markup, DrZeeBites palette: cream base, deep green
 * primary, warm amber CTA.
 */

const CREAM = '#faf6ec'
const GREEN = '#3d5227'
const GREEN_DARK = '#2c3b1d'
const AMBER = '#d97742'
const INK = '#33301f'

const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

/** Shared outer shell: cream background, white card, green header band. */
const shell = (heading: string, bodyHtml: string): string => `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:${CREAM};font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${CREAM};padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e8e0cc;">
        <tr>
          <td style="background-color:${GREEN};padding:28px 32px;">
            <p style="margin:0;font-size:22px;line-height:1.2;color:${CREAM};font-weight:bold;letter-spacing:0.5px;">DrZeeBites</p>
            <p style="margin:6px 0 0;font-size:13px;color:#cdd6b8;font-family:Arial,Helvetica,sans-serif;">15-minute diabetic-friendly air fryer recipes</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:${GREEN_DARK};">${heading}</h1>
            ${bodyHtml}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;background-color:${CREAM};border-top:1px solid #e8e0cc;">
            <p style="margin:0;font-size:12px;color:#8a8468;font-family:Arial,Helvetica,sans-serif;">DrZeeBites &middot; drzeebites.com &middot; Crispy food that loves your blood sugar back.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

/** Welcome email delivering the free 7-Day Diabetic Snack Guide. */
export const welcomeEmailHtml = (guideUrl: string): string =>
  shell(
    'Your free 7-Day Diabetic Snack Guide is here 🎁',
    `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${INK};">Welcome to DrZeeBites! You're on the list — and as promised, here is your free guide: seven days of quick, low-carb, high-protein snacks, most of them straight from the air fryer.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto;">
      <tr>
        <td style="border-radius:8px;background-color:${AMBER};">
          <a href="${guideUrl}" style="display:inline-block;padding:14px 28px;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;border-radius:8px;">Download the Snack Guide (PDF)</a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${INK};">If the button doesn't work, copy this link into your browser:<br/><a href="${guideUrl}" style="color:${GREEN};word-break:break-all;">${guideUrl}</a></p>
    <p style="margin:0;font-size:14px;line-height:1.6;color:${INK};">Keep an eye on your inbox — new 15-minute diabetic-friendly recipes are on the way.</p>
    <p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:${INK};">— Dr&nbsp;Zee</p>
    `,
  )

/** Admin notification for a new contact-form submission. */
export const contactNotificationHtml = (args: {
  name: string
  email: string
  subject: string
  message: string
}): string => {
  const name = escapeHtml(args.name)
  const email = escapeHtml(args.email)
  const subject = escapeHtml(args.subject)
  const message = escapeHtml(args.message).replace(/\r?\n/g, '<br/>')
  return shell(
    'New contact form message',
    `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${INK};">
      <tr><td style="padding:4px 12px 4px 0;color:#8a8468;">From</td><td style="padding:4px 0;">${name}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#8a8468;">Reply to</td><td style="padding:4px 0;"><a href="mailto:${email}" style="color:${GREEN};">${email}</a></td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#8a8468;">Subject</td><td style="padding:4px 0;">${subject}</td></tr>
    </table>
    <div style="padding:16px;background-color:${CREAM};border-radius:8px;border:1px solid #e8e0cc;">
      <p style="margin:0;font-size:14px;line-height:1.7;color:${INK};font-family:Arial,Helvetica,sans-serif;">${message}</p>
    </div>
    <p style="margin:20px 0 0;font-size:13px;color:#8a8468;font-family:Arial,Helvetica,sans-serif;">Reply directly to <a href="mailto:${email}" style="color:${GREEN};">${email}</a> to answer. This message is also saved in the admin panel under Contact Submissions.</p>
    `,
  )
}
