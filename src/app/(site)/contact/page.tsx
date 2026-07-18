import type { Metadata } from 'next'
import Link from 'next/link'

import { ContactForm } from '@/components/forms/ContactForm'
import { SocialLinks } from '@/components/site/SocialIcons'
import { getPayload } from '@/lib/payload'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Contact',
  alternates: { canonical: '/contact' },
  description:
    'Questions about a recipe, your cookbook order, or working with DrZeeBites? Send us a message.',
}

export default async function ContactPage() {
  let socialLinks = null
  try {
    const payload = await getPayload()
    const settings = await payload.findGlobal({ slug: 'site-settings' })
    socialLinks = settings?.socialLinks ?? null
  } catch {
    // Social links are decorative here — the form must still render.
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 md:py-16">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold tracking-[0.25em] text-accent uppercase">Say hello</p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-ink sm:text-5xl">
          Get in touch
        </h1>
        <p className="mt-4 leading-relaxed text-ink/75">
          Recipe questions, trouble with a cookbook download, brand collaborations — we read
          every message.
        </p>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-14">
        <section aria-label="Contact form" className="rounded-3xl border border-primary/15 bg-white p-6 shadow-sm sm:p-8">
          <ContactForm />
        </section>

        <aside className="space-y-8">
          <div className="rounded-2xl bg-primary-soft p-6">
            <h2 className="font-display text-lg font-semibold text-ink">Response time</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink/75">
              We usually reply within 1–2 business days. Order or download problems jump the
              queue — mention your purchase email so we can find your order fast.
            </p>
          </div>

          <div className="rounded-2xl bg-primary-soft p-6">
            <h2 className="font-display text-lg font-semibold text-ink">Find us on social</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink/75">
              New 15-minute recipes are posted first on our social channels.
            </p>
            <SocialLinks
              socialLinks={socialLinks ?? undefined}
              className="mt-4 flex items-center gap-2 text-primary"
              iconClassName="h-6 w-6"
            />
          </div>

          <div className="rounded-2xl border border-primary/15 p-6">
            <h2 className="font-display text-lg font-semibold text-ink">Cookbook orders</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink/75">
              Bought the cookbook and can&apos;t find your download? Check your spam folder for
              the delivery email first, then message us here — see also the{' '}
              <Link href="/shop" className="font-semibold text-primary underline underline-offset-2">
                shop
              </Link>{' '}
              for what&apos;s included.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
