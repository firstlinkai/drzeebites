import type { Metadata } from 'next'
import Link from 'next/link'

import { LegalLayout } from '@/components/site/LegalLayout'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Privacy Policy',
  alternates: { canonical: '/privacy' },
  description: 'How DrZeeBites collects, uses, and protects your personal information.',
}

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="July 18, 2026">
      <p>
        DrZeeBites (&quot;we&quot;, &quot;us&quot;) operates drzeebites.com. This policy explains
        what personal information we collect, why we collect it, and how you can control it. The
        short version: we collect the minimum needed to sell you a cookbook, send you emails you
        asked for, and keep the site working.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>
          <strong>Purchases.</strong> When you buy a digital product, our payment processor
          Stripe collects your payment details and billing information. We never see or store
          your full card number. We store your email address, the product purchased, the amount
          paid, and order identifiers so we can deliver your download and provide support.
        </li>
        <li>
          <strong>Email signups.</strong> If you subscribe to our newsletter or request the free
          snack guide, we store your email address and where on the site you signed up.
        </li>
        <li>
          <strong>Contact form.</strong> If you contact us we store your name, email address, and
          message so we can reply.
        </li>
        <li>
          <strong>Technical data.</strong> Our hosting provider processes standard server logs
          (IP address, browser type, pages requested) to keep the site secure and reliable.
        </li>
      </ul>

      <h2>How we use your information</h2>
      <ul>
        <li>To process orders and deliver your digital downloads (including receipt and download-link emails).</li>
        <li>To send the newsletter and free guide you requested — every email includes an unsubscribe link.</li>
        <li>To respond to messages you send us.</li>
        <li>To protect the site against fraud and abuse.</li>
      </ul>
      <p>We do not sell or rent your personal information to anyone.</p>

      <h2>Who we share data with</h2>
      <ul>
        <li>
          <strong>Stripe</strong> — payment processing. See{' '}
          <a href="https://stripe.com/privacy" rel="noopener noreferrer" target="_blank">Stripe&apos;s privacy policy</a>.
        </li>
        <li>
          <strong>Resend</strong> — sending transactional and marketing email on our behalf.
        </li>
        <li>
          <strong>Hosting and infrastructure providers</strong> — running the website and database.
        </li>
      </ul>
      <p>
        These providers process data only on our instructions. We may also disclose information
        when required by law.
      </p>

      <h2>Affiliate links</h2>
      <p>
        Some outbound links (for example to Amazon) are affiliate links. When you click one we
        count the click on our own server before redirecting you; the destination site then
        applies its own cookies and privacy policy. See our{' '}
        <Link href="/affiliate-disclosure">Affiliate Disclosure</Link>.
      </p>

      <h2>Cookies</h2>
      <p>
        We keep cookies to a functional minimum. Third parties we rely on (such as Stripe during
        checkout) may set cookies necessary to provide their service, including fraud
        prevention.
      </p>

      <h2>Data retention</h2>
      <p>
        Order records are kept for as long as we need them for accounting and support. Newsletter
        data is kept until you unsubscribe. Contact messages are kept as long as needed to handle
        your request.
      </p>

      <h2>Your rights</h2>
      <p>
        Depending on where you live (including under GDPR and CCPA), you may have the right to
        access, correct, export, or delete your personal information, and to object to or
        restrict certain processing. To exercise any of these rights, use the{' '}
        <Link href="/contact">contact form</Link> and we will respond within the legally required
        timeframe. You can unsubscribe from marketing email at any time via the link in any
        email.
      </p>

      <h2>Children</h2>
      <p>
        This site is not directed at children under 16 and we do not knowingly collect their
        personal information.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this policy from time to time. Material changes will be reflected by the
        &quot;last updated&quot; date at the top of this page.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about privacy? Reach us through the <Link href="/contact">contact form</Link>.
      </p>
    </LegalLayout>
  )
}
