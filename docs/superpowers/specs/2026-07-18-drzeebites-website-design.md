# DrZeeBites Web Platform — Design Spec

**Date:** 2026-07-18
**Status:** Approved by user (brainstorming session)
**Source:** PRD v1.0 "Dr Zee Bites Web Platform" + interview decisions

## 1. Summary

A custom website for DrZeeBites — a diabetic-friendly air fryer recipe brand — that centralizes content, sells digital products directly via Stripe (replacing Gumroad), grows an email list, and monetizes blog traffic with affiliate links.

**Business context:** DrZeeBites currently sells a $27 "Diabetic Air Fryer Cookbook" PDF on Gumroad, with audiences on Instagram, Pinterest, and TikTok. Positioning: 15-minute, low-carb, high-protein, diabetic-friendly air fryer recipes. The site becomes the brand's permanent home at **drzeebites.com**.

## 2. Decisions (from interview)

| Decision | Choice |
|---|---|
| Stack | Custom Next.js 15 (App Router, TypeScript) |
| CMS | Payload 3, embedded in the Next.js app (`/admin`) |
| Database | Postgres 16 |
| Hosting | Docker on user's VPS (173.212.239.64) behind existing Traefik v3, Let's Encrypt TLS |
| Domain | drzeebites.com |
| Launch products | Flagship cookbook only ($27 Diabetic Air Fryer Cookbook); catalog supports adding more via admin with no code changes |
| Email | Resend for both transactional (receipts, download links, contact notifications) and marketing (Audiences + Broadcasts for newsletter) |
| Content model | Two types: structured Recipes + general Posts |
| Branding | Created in this project, derived from existing social identity; real logo swappable later |
| Checkout | Stripe hosted Checkout (cards, Apple Pay, Google Pay). Guest checkout only — no customer accounts |
| Styling | Tailwind CSS v4 |

## 3. Architecture

One Next.js application with Payload 3 mounted inside it. Single deployable unit.

**Containers (docker-compose):**
- `drzee-web` — Next.js standalone build (includes Payload admin)
- `drzee-postgres` — Postgres 16 with named volume

**Traefik:** labels on `drzee-web` for `Host(drzeebites.com)` (+ `www` redirect), `certresolver=myresolver`. Same pattern as other apps on the VPS.

**Volumes:**
- `media/` — public uploaded images (served via Next/Payload)
- `private/` — product PDFs and lead-magnet PDF, outside the public web root, served only through token-validating route handlers

**Rendering:** all public pages statically generated with ISR; Payload `afterChange` hooks trigger revalidation. Target: < 2.5 s load on mobile. Images optimized via Next/Image + sharp.

## 4. Content model (Payload collections)

- **Recipes** — title, slug, hero image, description, categories, prep time, cook time, servings, difficulty, structured ingredients (quantity / unit / item), instructions (rich text with images and affiliate blocks), nutrition per serving (calories, protein, net carbs, fat, fiber), draft/published with drafts + versions. Emits **schema.org Recipe JSON-LD**.
- **Posts** — general articles/guides; rich text with affiliate blocks; Article JSON-LD.
- **Products** — name, slug, price (USD), Stripe Price ID, sales-page rich text, image gallery, private PDF upload, active flag. Seeded with the flagship cookbook using adapted Gumroad copy.
- **Categories** — shared taxonomy for Recipes and Posts ("Air Fryer", "Diabetic-Friendly", "Low Carb", …).
- **Testimonials** — quote, name, optional photo; shown on homepage.
- **Orders** — created by Stripe webhook: email, product ref, amount, Stripe session ID, Stripe event ID (idempotency), download token, token expiry, download count, status.
- **Subscribers** — email, source (homepage / recipe footer / etc.), created date; synced to a Resend Audience.
- **ContactSubmissions** — name, email, subject, message, read flag.
- **AffiliateLinks** — label, destination URL, click count; referenced by affiliate blocks and the `/go/[id]` redirect.
- **Users** — admin accounts (auth-enabled collection).
- **Media** — uploads with alt text, image resizing presets.
- **SiteSettings (global)** — social links (Instagram, Pinterest, TikTok, Gumroad legacy), default SEO metadata, optional announcement bar.

**Affiliate blocks** (available in Recipe and Post rich text):
1. Inline affiliate link
2. CTA button
3. Product box — image, title, blurb, price note, "View on Amazon" button

All affiliate links render `rel="sponsored nofollow"` and route through `/go/[id]` — a redirect handler that increments a click counter (AffiliateLinks collection: label, destination URL, click count). This provides the PRD's affiliate CTR metric.

## 5. Routes / pages

| Route | Purpose |
|---|---|
| `/` | Hero + primary ebook CTA, featured recipes/posts, testimonials, lead-magnet opt-in |
| `/recipes` | Recipe index with category filter |
| `/recipes/[slug]` | Recipe detail: ingredients, steps, nutrition table, Recipe JSON-LD, lead-magnet footer form |
| `/blog`, `/blog/[slug]` | Article index + detail |
| `/shop` | Product listing |
| `/shop/[slug]` | Sales page with buy button |
| `/thank-you` | Post-purchase: verifies Stripe session server-side, shows instant download button |
| `/download/[token]` | Token-validated PDF delivery; friendly re-request page when expired |
| `/go/[id]` | Affiliate redirect + click counting |
| `/contact` | Contact form |
| `/privacy`, `/terms`, `/affiliate-disclosure` | Legal (required for Stripe + Amazon Associates) |
| `/admin` | Payload admin |
| `/api/webhooks/stripe` | Stripe webhook receiver |
| `sitemap.xml`, `robots.txt` | SEO |

## 6. Purchase flow (PRD Flow A)

1. Buy button on `/shop/[slug]` → server action creates Stripe Checkout Session (hosted page).
2. Customer pays (card / Apple Pay / Google Pay).
3. Stripe webhook `checkout.session.completed` → verify signature → idempotency check on event ID → create Order → generate signed download token (**7-day expiry, 5-download limit**) → Resend email with receipt + download link.
4. Customer redirected to `/thank-you?session_id=…` → server verifies the session with Stripe → shows instant download button (works even if the email fails).
5. `/download/[token]` validates token + expiry + count, streams the PDF from the private volume.

**Failure handling:** email send failures are logged and retried; the order and thank-you-page delivery are independent of email success. Expired/exhausted tokens show a page to re-request a fresh link (emailed to the original purchase address).

## 7. Lead magnet & contact

- Opt-in form (homepage + end of every recipe): "Get the Free 7-Day Diabetic Snack Guide". Creates Subscriber, adds contact to Resend Audience, sends autoresponder email delivering the guide PDF. Guide PDF supplied by user; placeholder file until then.
- Contact form: honeypot anti-spam, saves ContactSubmission, sends notification email to admin via Resend.

## 8. Branding / design system

Defined as Tailwind theme tokens: warm off-white base, deep green primary, warm accent (amber/tomato) for CTAs, modern friendly serif/sans pairing, food-photography-led layouts, mobile-first. Consistent with DrZeeBites' existing social visual identity. Logo is a placeholder wordmark until real assets are supplied.

## 9. Testing

- Unit tests on money-critical paths: webhook handler (signature, idempotency, order creation), download-token generation/validation, checkout session creation.
- One Playwright smoke test: full checkout in Stripe test mode → thank-you page → download.
- No blanket coverage target.

## 10. Non-functional

- HTTPS everywhere (Traefik + Let's Encrypt). Secrets via env vars in compose file on the server (never committed).
- Mobile-first responsive; < 2.5 s mobile load via static generation, image optimization, minimal JS.
- Postgres backup: nightly `pg_dump` cron on the VPS to a dated file (retention 14 days).

## 11. Success metrics (from PRD)

- Purchase conversion 2–3 % (Stripe dashboard + Orders collection)
- Bounce rate < 50 % (analytics tool — deferred, can add Plausible/Umami later)
- Affiliate CTR (via `/go/[id]` click counters)

## 12. Out of scope (v1)

- Customer accounts / login for buyers
- Multiple currencies (USD only)
- Web analytics integration (recommended follow-up: self-hosted Umami on the VPS)
- Comments on recipes
- Migrating the other ~2 Gumroad products (admin supports adding them later, no code change)
- Instagram feed live embed (homepage links to socials instead; can revisit)
