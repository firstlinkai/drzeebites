import crypto from 'node:crypto'
import { afterEach, describe, expect, it } from 'vitest'

import {
  MAX_DOWNLOADS,
  TOKEN_TTL_DAYS,
  generateDownloadToken,
  isValidTokenFormat,
  tokenExpiry,
} from '@/lib/commerce/token'

const SECRET = process.env.DOWNLOAD_TOKEN_SECRET as string

/** Independent re-implementation of the signature so tests don't trust the module. */
function signIndependently(id: string): string {
  return crypto.createHmac('sha256', SECRET).update(id).digest('hex')
}

describe('generateDownloadToken', () => {
  it('produces <48 hex>.<64 hex> and validates via roundtrip', () => {
    const token = generateDownloadToken()
    expect(token).toMatch(/^[0-9a-f]{48}\.[0-9a-f]{64}$/)
    expect(isValidTokenFormat(token)).toBe(true)
  })

  it('signature matches an independent HMAC-SHA256 over the id', () => {
    const token = generateDownloadToken()
    const [id, sig] = token.split('.')
    expect(sig).toBe(signIndependently(id))
  })

  it('generates unique tokens', () => {
    const a = generateDownloadToken()
    const b = generateDownloadToken()
    expect(a).not.toBe(b)
  })

  it('throws when DOWNLOAD_TOKEN_SECRET is unset', () => {
    const saved = process.env.DOWNLOAD_TOKEN_SECRET
    delete process.env.DOWNLOAD_TOKEN_SECRET
    try {
      expect(() => generateDownloadToken()).toThrow('DOWNLOAD_TOKEN_SECRET')
    } finally {
      process.env.DOWNLOAD_TOKEN_SECRET = saved
    }
  })
})

describe('isValidTokenFormat', () => {
  afterEach(() => {
    process.env.DOWNLOAD_TOKEN_SECRET = SECRET
  })

  it('rejects a token with a tampered signature (one hex char flipped)', () => {
    const token = generateDownloadToken()
    const flipped = token.slice(0, -1) + (token.endsWith('0') ? '1' : '0')
    expect(isValidTokenFormat(flipped)).toBe(false)
  })

  it('rejects a token whose id was tampered (sig no longer matches)', () => {
    const token = generateDownloadToken()
    const tamperedId = (token[0] === '0' ? '1' : '0') + token.slice(1)
    expect(isValidTokenFormat(tamperedId)).toBe(false)
  })

  it('rejects a well-formed token signed with a different secret', () => {
    const id = crypto.randomBytes(24).toString('hex')
    const forgedSig = crypto.createHmac('sha256', 'attacker-secret').update(id).digest('hex')
    expect(isValidTokenFormat(`${id}.${forgedSig}`)).toBe(false)
  })

  it('rejects malformed shapes without throwing', () => {
    const id48 = 'a'.repeat(48)
    const sig64 = 'b'.repeat(64)
    const malformed: unknown[] = [
      '', // empty
      'no-dot-at-all',
      `${id48}${sig64}`, // missing dot
      `${'a'.repeat(47)}.${sig64}`, // id too short
      `${'a'.repeat(49)}.${sig64}`, // id too long
      `${id48}.${'b'.repeat(63)}`, // sig too short (length mismatch path)
      `${id48}.${'b'.repeat(65)}`, // sig too long (length mismatch path)
      `${id48}.${sig64}.extra`, // trailing junk
      `${'g'.repeat(48)}.${sig64}`, // non-hex id
      `${id48}.${'Z'.repeat(64)}`, // non-hex sig
      `${id48.toUpperCase()}.${sig64}`, // uppercase hex not accepted
      42, // not a string
      null,
      undefined,
    ]
    for (const bad of malformed) {
      expect(() => isValidTokenFormat(bad as string)).not.toThrow()
      expect(isValidTokenFormat(bad as string)).toBe(false)
    }
  })

  it('does not throw even if a buffer-length mismatch reaches timingSafeEqual', () => {
    // The regex gate keeps lengths fixed, but the try/catch is the safety
    // net — exercise the nearest reachable paths and assert no throw.
    const token = generateDownloadToken()
    const [id] = token.split('.')
    expect(() => isValidTokenFormat(`${id}.${'0'.repeat(64)}`)).not.toThrow()
    expect(isValidTokenFormat(`${id}.${'0'.repeat(64)}`)).toBe(false)
  })
})

describe('token constants and expiry', () => {
  it('exposes the documented business limits', () => {
    expect(TOKEN_TTL_DAYS).toBe(7)
    expect(MAX_DOWNLOADS).toBe(5)
  })

  it('tokenExpiry is exactly 7 days after the given date', () => {
    const from = new Date('2026-07-18T12:00:00.000Z')
    expect(tokenExpiry(from)).toBe('2026-07-25T12:00:00.000Z')
  })

  it('tokenExpiry defaults to ~7 days from now', () => {
    const before = Date.now()
    const expiry = new Date(tokenExpiry()).getTime()
    const after = Date.now()
    const week = TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000
    expect(expiry).toBeGreaterThanOrEqual(before + week)
    expect(expiry).toBeLessThanOrEqual(after + week)
  })
})
