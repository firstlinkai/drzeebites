import type { Metadata } from 'next'
import Link from 'next/link'

import { LegalLayout } from '@/components/site/LegalLayout'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Terms of Service',
  alternates: { canonical: '/terms' },
  description: 'The terms that apply when you use drzeebites.com or buy our digital products.',
}

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" lastUpdated="July 18, 2026">
      <p>
        These terms govern your use of drzeebites.com and your purchase of any digital products
        sold on it. By using the site or completing a purchase you agree to these terms.
      </p>

      <h2>1. Digital products</h2>
      <p>
        Our products are digital downloads (PDF files) delivered electronically. Nothing physical
        will be shipped. After a successful payment you receive instant access via a download
        page and a download link sent to the email address you provided at checkout. Download
        links are personal to you and time-limited; if your link expires you can request a fresh
        one and we will send it to your original purchase email.
      </p>

      <h2>2. Payments</h2>
      <p>
        Payments are processed securely by Stripe. Prices are in US dollars. We never see or
        store your full payment card details. Applicable taxes, if any, are calculated at
        checkout.
      </p>

      <h2>3. Refunds</h2>
      <p>
        Because our products are digital and delivered instantly, all sales are generally final.
        That said, we stand behind the cookbook: if it is not what you expected, contact us
        within 30 days of purchase (reply to your receipt email or use the{' '}
        <Link href="/contact">contact form</Link>) and we will work with you on a solution,
        including a refund where appropriate. Refunds are returned to the original payment
        method.
      </p>

      <h2>4. Personal license</h2>
      <p>
        Your purchase grants you a personal, non-transferable license to use the product for your
        own household. You may print a copy for personal use. You may not resell, redistribute,
        share publicly, or republish the product or any substantial part of it, whether for free
        or for payment.
      </p>

      <h2>5. Not medical advice</h2>
      <p>
        DrZeeBites recipes, nutrition information, and articles are provided for general
        informational purposes only. They are not medical advice and are not a substitute for
        guidance from your doctor, dietitian, or diabetes care team. Nutrition values are
        estimates calculated per serving and can vary with ingredients and portions. Always
        consult a qualified health professional before changing your diet, especially if you take
        glucose-lowering medication.
      </p>

      <h2>6. Website content and intellectual property</h2>
      <p>
        All content on this site — recipes, text, photography, and branding — is owned by
        DrZeeBites and protected by copyright. You may link to our pages and share short excerpts
        with attribution; you may not republish full recipes or substantial content without
        written permission.
      </p>

      <h2>7. Affiliate links</h2>
      <p>
        Some links on this site are affiliate links, meaning we may earn a commission if you make
        a purchase through them, at no additional cost to you. See the{' '}
        <Link href="/affiliate-disclosure">Affiliate Disclosure</Link> for details.
      </p>

      <h2>8. Acceptable use</h2>
      <p>
        You agree not to misuse the site — including attempting to gain unauthorized access,
        scraping content at scale, submitting spam through our forms, or interfering with the
        service for other users.
      </p>

      <h2>9. Disclaimer and limitation of liability</h2>
      <p>
        The site and products are provided &quot;as is&quot; without warranties of any kind. To
        the maximum extent permitted by law, DrZeeBites is not liable for indirect, incidental,
        or consequential damages arising from your use of the site or products. Our total
        liability for any claim is limited to the amount you paid us in the 12 months preceding
        the claim.
      </p>

      <h2>10. Changes to these terms</h2>
      <p>
        We may update these terms from time to time; the version published on this page at the
        time of your purchase applies to that purchase.
      </p>

      <h2>11. Contact</h2>
      <p>
        Questions about these terms? Use the <Link href="/contact">contact form</Link>.
      </p>
    </LegalLayout>
  )
}
