# DrZeeBites

Website for DrZeeBites — 15-minute diabetic-friendly air fryer recipes. Next.js 15 (App Router) with Payload 3 embedded as the CMS, Postgres 16, Tailwind CSS v4. Sells the $27 Diabetic Air Fryer Cookbook (PDF) via Stripe, hosts recipes and blog posts, and collects newsletter signups.

Design spec: `docs/superpowers/specs/2026-07-18-drzeebites-website-design.md`
Implementation plan: `docs/superpowers/plans/2026-07-18-drzeebites-website-plan.md`

## Requirements

- Node 22+ (tested on Node 24)
- pnpm 11
- A reachable Postgres 16 database (the dev DB is the `drzee_dev` database on the remote `drzee-postgres` container; connection string in `.env`)

## Setup

```sh
pnpm install
cp .env.example .env   # then fill in real values (never commit .env)
```

## Commands

| Command | What it does |
|---|---|
| `pnpm dev` | Start the dev server at http://localhost:3000 (admin at `/admin`) |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm seed` | Idempotent seed: categories, 3 recipes, 1 post, testimonials, the flagship cookbook product (placeholder images/PDF), site settings |
| `pnpm generate:types` | Regenerate `src/payload-types.ts` from the Payload config |
| `pnpm generate:importmap` | Regenerate the admin import map after adding admin components |
| `pnpm lint` | ESLint |

First run: `pnpm dev`, open http://localhost:3000/admin, create the first admin user, then `pnpm seed`.

## Structure

- `src/payload.config.ts` — Payload config (collections, global, Postgres adapter, conditional Vercel Blob storage)
- `src/collections/` — one file per collection (recipes, posts, products, orders, …)
- `src/blocks/` — Lexical affiliate blocks (inline link, CTA button, product box)
- `src/globals/SiteSettings.ts` — social links, default SEO, announcement bar
- `src/lib/` — access helpers, shared Lexical editor, ISR revalidation helpers, cached `getPayload`
- `src/seed/` — idempotent seed script + placeholder asset generators
- `src/app/(payload)/` — Payload admin + REST/GraphQL routes (no Tailwind here)
- `src/app/(site)/` — public site (Tailwind v4 brand theme in `globals.css`)
- `media/`, `private/` — local upload storage (gitignored); on Vercel, uploads use Vercel Blob when `BLOB_READ_WRITE_TOKEN` is set

## Storage & deployment notes

- Deploy target is **Vercel** — no Docker/standalone output. Media and product PDFs move to Vercel Blob in production (`@payloadcms/storage-vercel-blob`, enabled only when `BLOB_READ_WRITE_TOKEN` is present).
- `product-files` uploads are private: read access is admin-only; customers receive files only through the tokenized `/download/[token]` route (Phase 3).
