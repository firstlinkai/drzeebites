/**
 * Launch-preview switch: while FREE_DOWNLOADS_MODE=true the shop hides Stripe
 * buy buttons and offers direct free downloads of the product PDFs instead
 * (the site owner is testing before Stripe goes live).
 *
 * IMPORTANT when turning this OFF for the paid launch: the free route
 * redirects to the underlying Blob URLs in production, so anyone who saved a
 * URL keeps access to that exact file. Re-upload the paid PDFs under new
 * filenames (any admin re-upload does this) to invalidate shared links.
 */
export const isFreeDownloadsMode = (): boolean => process.env.FREE_DOWNLOADS_MODE === 'true'
