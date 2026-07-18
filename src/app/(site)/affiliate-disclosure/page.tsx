import type { Metadata } from 'next'
import Link from 'next/link'

import { LegalLayout } from '@/components/site/LegalLayout'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Affiliate Disclosure',
  description:
    'How affiliate links work on DrZeeBites, including our participation in the Amazon Associates program.',
}

export default function AffiliateDisclosurePage() {
  return (
    <LegalLayout title="Affiliate Disclosure" lastUpdated="July 18, 2026">
      <p>
        Transparency matters to us, so here it is in plain language: some links on drzeebites.com
        are affiliate links. If you click one and then make a purchase, we may earn a small
        commission — <strong>at no additional cost to you</strong>. The price you pay is exactly
        the same whether you use our link or not.
      </p>

      <h2>Amazon Associates</h2>
      <p>
        DrZeeBites is a participant in the Amazon Services LLC Associates Program, an affiliate
        advertising program designed to provide a means for sites to earn advertising fees by
        advertising and linking to Amazon.com. As an Amazon Associate, we earn from qualifying
        purchases.
      </p>

      <h2>How we choose what to recommend</h2>
      <ul>
        <li>
          We only recommend kitchen tools and ingredients we would genuinely use in a diabetic
          air fryer kitchen.
        </li>
        <li>
          Commissions never change our recipes or our nutrition information — those are written
          first, and product recommendations are added only where they honestly help.
        </li>
        <li>
          Price notes shown next to recommended products (for example &quot;around $89 on
          Amazon&quot;) are approximate and can change at any time; the price shown at the
          retailer is always the one that applies.
        </li>
      </ul>

      <h2>How affiliate links appear</h2>
      <p>
        Affiliate links on this site are marked with <code>rel=&quot;sponsored&quot;</code> for
        search engines, and outbound clicks pass through our own redirect so we can count how
        useful a recommendation is. We do not receive any personal information about what you
        ultimately buy — the retailer only reports anonymous, aggregated commission data.
      </p>

      <h2>Our own products</h2>
      <p>
        Links to our own products (such as The Diabetic Air Fryer Cookbook in the{' '}
        <Link href="/shop">shop</Link>) are not affiliate links — that is simply us selling our
        own work directly.
      </p>

      <h2>Questions</h2>
      <p>
        If anything here is unclear, ask us via the <Link href="/contact">contact form</Link> —
        we are happy to explain exactly how a given link works.
      </p>
    </LegalLayout>
  )
}
