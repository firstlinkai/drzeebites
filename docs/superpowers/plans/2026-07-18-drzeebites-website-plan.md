# DrZeeBites Web Platform — Implementation Plan

**Date:** 2026-07-18
**Spec:** [../specs/2026-07-18-drzeebites-website-design.md](../specs/2026-07-18-drzeebites-website-design.md)
**Status:** Draft — pending user approval

Each phase ends with a verification step. A phase is done only when its verification passes. Commit at the end of each phase (small, reviewable commits within phases where natural).

## Tooling & versions

- Node 22 LTS, pnpm
- Next.js 15 (App Router, TypeScript, standalone output)
- Payload 3 (embedded), `@payloadcms/db-postgres`, `@payloadcms/richtext-lexical`
- Tailwind CSS v4
- Stripe SDK (`stripe`), Resend SDK (`resend`)
- Vitest (unit), Playwright (smoke)
- Local dev DB: Postgres 16 via `docker-compose.dev.yml`

## Environment variables (`.env.example`)

```
DATABASE_URI=postgres://drzee:***@localhost:5432/drzee
PAYLOAD_SECRET=            # payload auth secret
NEXT_PUBLIC_SERVER_URL=http://localhost:3000   # https://drzeebites.com in prod
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
RESEND_AUDIENCE_ID=        # newsletter audience
ADMIN_NOTIFY_EMAIL=        # contact-form notifications
EMAIL_FROM="DrZeeBites <hello@drzeebites.com>"
DOWNLOAD_TOKEN_SECRET=     # HMAC secret for download tokens
PRIVATE_FILES_DIR=./private
```

Real values live only in local `.env` and in the compose env on the VPS. Never committed.

---

## Phase 0 — Scaffold & dev environment

1. Scaffold Next.js 15 + Payload 3 app (Payload's website template as reference, but hand-rolled minimal: `create-next-app` + Payload packages) with TypeScript strict, `output: 'standalone'`.
2. Tailwind v4 with the brand theme tokens (colors, fonts via `next/font`: friendly serif for display + clean sans for body).
3. `docker-compose.dev.yml` (Postgres 16 only) + `.env.example` + README with run instructions.
4. Base repo hygiene: `.gitignore` (env, private/, media/, node_modules, .next), `.editorconfig`.
5. Payload mounted at `/admin` + `/api` route handlers; first admin user creatable via Payload's onboarding screen.

**Verify:** `pnpm dev` boots; `/admin` loads and creates an admin user against local Postgres; a styled placeholder homepage renders with brand fonts/colors.

## Phase 1 — Content model

1. Collections: `recipes`, `posts`, `products`, `categories`, `testimonials`, `orders`, `subscribers`, `contact-submissions`, `affiliate-links`, `users` (auth), `media` (upload, image presets: card, hero, og).
2. Global: `site-settings` (social links, default SEO, announcement bar).
3. Lexical blocks for rich text: `AffiliateLink` (inline), `CtaButton`, `AffiliateProductBox` — each referencing an `affiliate-links` doc.
4. Recipes: structured fields per spec (ingredients array {qty, unit, item, note}, instructions, times, servings, difficulty, nutrition group {calories, protein, netCarbs, fat, fiber}). Drafts + versions enabled on recipes/posts/products.
5. Products: private PDF stored via a `product-files` upload collection whose `staticDir` is `PRIVATE_FILES_DIR` and whose read access is admin-only (never publicly served).
6. Access control: public read for published content only; orders/subscribers/contact-submissions admin-only; anonymous create for subscribers + contact-submissions (server-side only).
7. ISR revalidation: `afterChange`/`afterDelete` hooks call `revalidatePath`/`revalidateTag` for affected routes.
8. Seed script (`pnpm seed`): categories, 3 sample recipes, 1 sample post, testimonials, the flagship product (Gumroad copy adapted, placeholder PDF), site settings.

**Verify:** create/edit/publish a recipe with an affiliate product box in `/admin`; seed script runs idempotently; unpublished drafts invisible to anonymous API reads.

## Phase 2 — Public site (pages & design)

1. Layout: header (logo wordmark, nav, CTA button), footer (social icons from site-settings, legal links, mini opt-in), announcement bar.
2. Homepage: hero (value prop + ebook CTA + food imagery), featured recipes (latest 3–6), testimonials, lead-magnet section, final CTA band.
3. `/recipes` index with category filter (server-rendered filter via search params) + recipe cards (image, time, net carbs badge).
4. `/recipes/[slug]`: hero, meta row (times/servings/difficulty), ingredients checklist, numbered steps, nutrition table, lead-magnet footer form, related recipes.
5. `/blog` + `/blog/[slug]` with Lexical rich-text renderer (shared with recipes) incl. the three affiliate blocks.
6. `/shop` + `/shop/[slug]` sales page (gallery, benefit copy from Payload, price, buy button — button wired in Phase 3).
7. `/contact` form UI; `/privacy`, `/terms`, `/affiliate-disclosure` static pages.
8. All pages static/ISR; mobile-first passes at 375 px; Lighthouse mobile perf ≥ 90 on home + one recipe.

**Verify:** run `/run` skill flow — browse every route with seeded content at 375 px and desktop; Lighthouse check on home + recipe detail.

## Phase 3 — Commerce (Stripe + delivery + email)

1. Stripe products/prices created in test mode; store price ID on the seeded product.
2. `createCheckoutSession` server action: validates product, creates hosted Checkout Session (success → `/thank-you?session_id={CHECKOUT_SESSION_ID}`, cancel → product page), collects email.
3. `/api/webhooks/stripe`: signature verification, idempotency by event ID (unique field on orders), on `checkout.session.completed` → create order + HMAC-signed download token (7-day expiry, 5-download limit tracked on order) → send receipt email (Resend, React Email template) with download link. Email failure: log + mark order `emailFailed`; do not fail the webhook.
4. `/thank-you`: server-side session retrieval from Stripe (no trust in query params beyond ID), shows order summary + instant download button.
5. `/download/[token]`: validate signature/expiry/count → stream PDF from private dir with correct headers; expired/exhausted → re-request page that emails a fresh link to the order's email (rate-limited).
6. Order list view usable in Payload admin (columns: email, product, amount, status, downloads).

**Verify:** full test-mode purchase with Stripe CLI webhook forwarding: pay with `4242…` card → order appears in admin → email received (Resend test) → download works, 6th attempt blocked, expired token shows re-request page.

## Phase 4 — Lead magnet, contact, affiliate redirects

1. Subscribe server action: zod-validated email + honeypot → upsert `subscribers` doc → add to Resend Audience → send autoresponder delivering the snack-guide PDF (tokenized link, same delivery mechanism as products; placeholder PDF until real one supplied).
2. Contact server action: honeypot + validation → save `contact-submissions` → Resend notification to `ADMIN_NOTIFY_EMAIL`.
3. `/go/[id]`: look up affiliate link, atomic click-count increment, 302 redirect; links render `rel="sponsored nofollow"`.

**Verify:** subscribe → doc created + audience member + guide email; contact → doc + notification; `/go/x` increments and redirects; honeypot submissions silently dropped.

## Phase 5 — SEO

1. Metadata API per route (titles, descriptions, canonical, OG/Twitter cards); OG images (static brand template; dynamic per-recipe via `next/og` if cheap).
2. JSON-LD: Recipe (with nutrition), Article, Product, WebSite + Organization.
3. `sitemap.xml` (dynamic from Payload), `robots.txt`.
4. Validate structured data with Google Rich Results test on one recipe + one product.

**Verify:** rich-results test passes for Recipe; sitemap lists all published content; every page has unique title/description.

## Phase 6 — Tests

1. Vitest: download-token generate/validate (expiry, count, tamper), webhook handler (bad signature, duplicate event, happy path — Stripe mocked), checkout action (inactive product rejected).
2. Playwright smoke: home → shop → checkout (Stripe test mode) → thank-you → download. Runs against local dev + Stripe CLI.
3. `pnpm test` + `pnpm test:e2e` scripts; GitHub Actions optional (skip if repo stays local — note in README).

**Verify:** all tests green from a clean checkout following README steps.

## Phase 7 — Production deployment (~~VPS~~ → **Vercel**; revised 2026-07-18)

> **Revision:** User switched hosting to Vercel (token provided). Consequences:
> - **Database:** dedicated `drzee-postgres` container (Postgres 16, TLS self-signed) runs on the user's VPS, published on port 5433; `drzee_dev` for local dev, `drzee_prod` for production. Vercel connects over TLS (`sslmode=no-verify` for node-pg with self-signed cert). Backups stay on the VPS (nightly `pg_dump`).
> - **File storage:** Vercel's filesystem is ephemeral → media and product PDFs stored in **Vercel Blob** via `@payloadcms/storage-vercel-blob`, enabled only when `BLOB_READ_WRITE_TOKEN` is set; local dev uses disk storage. Paid PDFs use unguessable blob URLs that are never exposed — the `/download/[token]` route fetches and streams server-side.
> - **Docker/Traefik/standalone output:** no longer needed for the app. Original VPS steps below are superseded.
> - **DNS:** point drzeebites.com to Vercel (records provided by Vercel when the domain is added), not to the VPS.

**Revised steps:**
1. Create Vercel project via API/CLI (token in `.env`), link repo or deploy via `vercel deploy`.
2. Create Vercel Blob store; set `BLOB_READ_WRITE_TOKEN` + all prod env vars (prod `DATABASE_URI` → `drzee_prod`, live Stripe keys, live webhook secret, `NEXT_PUBLIC_SERVER_URL=https://drzeebites.com`).
3. Add drzeebites.com domain to the project; user adds the DNS records Vercel specifies at their registrar.
4. Stripe live webhook endpoint → `https://drzeebites.com/api/webhooks/stripe`.
5. Resend domain verification (SPF/DKIM) for drzeebites.com before launch emails; switch `EMAIL_FROM` to hello@drzeebites.com.
6. Nightly `pg_dump` cron on VPS (14-day retention).
7. Production smoke test: browse, live purchase + refund, download, subscribe, contact.

<details><summary>Original VPS deployment steps (superseded)</summary>

### Phase 7 (original) — Production deployment (VPS)

1. Multi-stage `Dockerfile` (standalone build, non-root user, sharp included).
2. `docker-compose.yml` (prod): `drzee-web` + `drzee-postgres`, named volumes (`db`, `media`, `private`), Traefik labels for `drzeebites.com` + `www` redirect on the existing `myresolver` certresolver, healthcheck.
3. Deploy runbook in README: DNS A record → copy compose + env to `/root/drzee/` → `docker compose up -d` → create admin user → run seed → swap Stripe to live keys + live webhook endpoint → verify live purchase with a real card + refund.
4. Nightly `pg_dump` cron on VPS (14-day retention) + media/private volume backup note.
5. Post-launch checklist: Gumroad → add site link; socials/link-in-bio point to drzeebites.com; Resend domain verification (SPF/DKIM) for `drzeebites.com` **before** launch emails.

**Verify:** production smoke test on https://drzeebites.com — browse, test purchase (live mode, refunded), download, subscribe, contact. TLS valid, `www` redirects.

</details>

---

## Order & dependencies

Phases are sequential; 4 and 5 can interleave after 3. Nothing deploys before Phase 6 is green.

## Deferred (per spec §12)

Analytics (Umami), remaining Gumroad products, customer accounts, comments, Instagram embed.

## Open items needed from user (not blocking start)

- drzeebites.com registrar access / DNS (needed Phase 7)
- Stripe account keys (test keys needed Phase 3)
- Resend API key + domain verification (Phase 3/4; can use Resend sandbox until then)
- Real cookbook PDF + snack-guide PDF (placeholders until provided)
- Logo files if/when available (wordmark placeholder otherwise)
