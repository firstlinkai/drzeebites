import { sendEmail } from '@/lib/email'
import type { Order, Product } from '@/payload-types'

import { MAX_DOWNLOADS, TOKEN_TTL_DAYS } from './token'

/**
 * Transactional commerce emails. Simple inline-styled HTML (email clients
 * ignore stylesheets) using the DrZeeBites brand palette.
 */

const BRAND = {
  cream: '#faf6ec',
  ink: '#1f2921',
  primary: '#4a5d2e',
  accent: '#d97742',
  softGreen: '#edf0e2',
}

const SUPPORT_EMAIL = 'hello@drzeebites.com'

function serverUrl(): string {
  return (process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(/\/$/, '')
}

export function downloadUrl(token: string): string {
  return `${serverUrl()}/download/${token}`
}

function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function emailShell(inner: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background-color:${BRAND.cream};font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:${BRAND.ink};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.cream};padding:24px 12px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background-color:${BRAND.primary};padding:20px 32px;">
              <span style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">DrZeeBites</span>
            </td>
          </tr>
          <tr><td style="padding:32px;">${inner}</td></tr>
          <tr>
            <td style="padding:20px 32px;background-color:${BRAND.softGreen};font-size:12px;color:${BRAND.ink};">
              Questions or trouble downloading? Just reply to this email or write to
              <a href="mailto:${SUPPORT_EMAIL}" style="color:${BRAND.primary};">${SUPPORT_EMAIL}</a>.<br/>
              DrZeeBites — 15-minute diabetic-friendly air fryer recipes.
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`
}

function downloadButton(url: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr>
    <td style="border-radius:8px;background-color:${BRAND.accent};">
      <a href="${url}" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;">${label}</a>
    </td>
  </tr></table>`
}

function limitsNote(): string {
  return `<p style="font-size:13px;color:#5b6357;margin:16px 0 0;">
    This link is valid for <strong>${TOKEN_TTL_DAYS} days</strong> and up to
    <strong>${MAX_DOWNLOADS} downloads</strong>. Save the PDF to your device once it opens.
    If the link expires, you can request a fresh one any time at
    <a href="${serverUrl()}/download-help" style="color:${BRAND.primary};">${serverUrl()}/download-help</a>.
  </p>`
}

/** Post-purchase receipt + download email. Returns sendEmail's result. */
export async function sendReceiptEmail(order: Order, product: Product): Promise<{ ok: boolean; error?: string }> {
  const url = downloadUrl(order.downloadToken ?? '')
  const inner = `
    <h1 style="margin:0 0 8px;font-size:22px;color:${BRAND.primary};">Thank you for your order!</h1>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;">
      Your copy of <strong>${escapeHtml(product.name)}</strong> is ready. Tap the button below to
      download your PDF and start cooking tonight.
    </p>
    ${downloadButton(url, 'Download your cookbook')}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BRAND.softGreen};border-radius:8px;margin:8px 0;">
      <tr>
        <td style="padding:14px 16px;font-size:14px;">
          <strong>Order summary</strong><br/>
          ${escapeHtml(product.name)} — ${formatUsd(order.amountCents)} ${(order.currency ?? 'usd').toUpperCase()}<br/>
          <span style="color:#5b6357;">Sent to ${escapeHtml(order.email)}</span>
        </td>
      </tr>
    </table>
    ${limitsNote()}
  `
  return sendEmail({
    to: order.email,
    subject: `Your ${product.name} is ready to download`,
    html: emailShell(inner),
  })
}

/** Fresh-link email sent from the /download-help re-request flow. */
export async function sendFreshLinkEmail(order: Order, product: Product): Promise<{ ok: boolean; error?: string }> {
  const url = downloadUrl(order.downloadToken ?? '')
  const inner = `
    <h1 style="margin:0 0 8px;font-size:22px;color:${BRAND.primary};">Here's your new download link</h1>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;">
      You asked for a fresh download link for <strong>${escapeHtml(product.name)}</strong> — here it is.
      Your previous link no longer works.
    </p>
    ${downloadButton(url, 'Download your cookbook')}
    ${limitsNote()}
  `
  return sendEmail({
    to: order.email,
    subject: `Your new download link — ${product.name}`,
    html: emailShell(inner),
  })
}
