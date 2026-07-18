import crypto from 'crypto'

/**
 * Download-token design
 * ---------------------
 * A public token is `<id>.<sig>` where:
 *   - `id`  = 48 hex chars of CSPRNG randomness (crypto.randomBytes(24))
 *   - `sig` = full HMAC-SHA256 of `id`, keyed with DOWNLOAD_TOKEN_SECRET,
 *             hex-encoded (64 chars)
 *
 * The FULL string (`id.sig`) is stored on the order's indexed `downloadToken`
 * field and embedded in emailed links. Validation is two layers:
 *   1. Stateless: format check + constant-time HMAC verification. Any
 *      tampered/forged token is rejected before we touch the database, so the
 *      DB is never probed with attacker-controlled garbage.
 *   2. Stateful: exact-match lookup of the full token on the order, then
 *      status / expiry / download-count checks.
 *
 * The 192 bits of randomness alone make guessing infeasible; the HMAC makes
 * tokens tamper-evident and lets us drop junk requests cheaply.
 */

const TOKEN_RE = /^[0-9a-f]{48}\.[0-9a-f]{64}$/

function secret(): string {
  const s = process.env.DOWNLOAD_TOKEN_SECRET
  if (!s) throw new Error('DOWNLOAD_TOKEN_SECRET is not set')
  return s
}

function sign(id: string): string {
  return crypto.createHmac('sha256', secret()).update(id).digest('hex')
}

/** Generate a fresh signed download token (the full public `id.sig` string). */
export function generateDownloadToken(): string {
  const id = crypto.randomBytes(24).toString('hex') // 48 hex chars
  return `${id}.${sign(id)}`
}

/**
 * Stateless validity check: correct shape AND signature matches. Returns true
 * only for tokens we could have issued.
 */
export function isValidTokenFormat(token: string): boolean {
  if (typeof token !== 'string' || !TOKEN_RE.test(token)) return false
  const [id, sig] = token.split('.')
  const expected = sign(id)
  try {
    return crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}

export const TOKEN_TTL_DAYS = 7
export const MAX_DOWNLOADS = 5

/** ISO timestamp `TOKEN_TTL_DAYS` from now. */
export function tokenExpiry(from: Date = new Date()): string {
  return new Date(from.getTime() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString()
}
