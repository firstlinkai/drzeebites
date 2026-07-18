/**
 * Vitest setup — runs before each test file, before any module under test is
 * imported.
 *
 * Deliberately assigns TEST-ONLY values (overwriting anything inherited from
 * the shell) so unit tests never depend on, or leak, the real `.env` secrets.
 * Webhook tests sign payloads with the same STRIPE_WEBHOOK_SECRET value set
 * here; token tests HMAC with the same DOWNLOAD_TOKEN_SECRET.
 */
process.env.DOWNLOAD_TOKEN_SECRET = 'test-download-token-secret'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_webhook_secret'
process.env.STRIPE_SECRET_KEY = 'sk_test_dummy_key_never_used_for_network'
process.env.NEXT_PUBLIC_SERVER_URL = 'http://localhost:3000'
process.env.RESEND_API_KEY = 're_test_dummy'
process.env.EMAIL_FROM = 'DrZeeBites Test <test@example.com>'
