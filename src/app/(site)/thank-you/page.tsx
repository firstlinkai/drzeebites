import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import { findOrderBySessionId, resolveOrderProduct } from '@/lib/commerce/orders'
import { getStripe } from '@/lib/commerce/stripe'
import { getPayload } from '@/lib/payload'
import type { Order, Product } from '@/payload-types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Thank you',
  robots: { index: false, follow: false },
}

const SUPPORT_EMAIL = 'hello@drzeebites.com'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * The webhook usually lands before the customer is redirected here, but not
 * always — poll briefly before falling back to "check your email".
 */
async function waitForOrder(sessionId: string): Promise<Order | null> {
  const payload = await getPayload()
  for (let attempt = 0; attempt < 5; attempt++) {
    if (attempt > 0) await sleep(1000)
    const order = await findOrderBySessionId(payload, sessionId)
    if (order) return order
  }
  return null
}

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const { session_id: sessionId } = await searchParams

  if (!sessionId || !sessionId.startsWith('cs_')) {
    return <InvalidSession />
  }

  let paid = false
  let customerEmail: string | null = null
  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId)
    paid = session.payment_status === 'paid'
    customerEmail = session.customer_details?.email ?? null
  } catch {
    return <InvalidSession />
  }

  if (!paid) return <InvalidSession unpaid />

  const order = await waitForOrder(sessionId)
  let product: Product | null = null
  if (order) {
    const payload = await getPayload()
    product = await resolveOrderProduct(payload, order)
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-16 sm:py-24">
      <div className="rounded-2xl bg-white p-8 shadow-sm sm:p-12">
        <p className="text-sm font-semibold tracking-wide text-accent uppercase">Order confirmed</p>
        <h1 className="font-display mt-2 text-3xl font-bold text-primary sm:text-4xl">
          Thank you — it&apos;s yours!
        </h1>
        <p className="mt-4 leading-relaxed">
          Your payment went through{customerEmail ? <> and a receipt with your download link is on its way to <strong>{customerEmail}</strong></> : null}.
        </p>

        {order?.downloadToken ? (
          <>
            <a
              href={`/download/${order.downloadToken}`}
              className="mt-8 inline-block rounded-lg bg-accent px-8 py-4 text-lg font-bold text-white shadow transition hover:opacity-90"
            >
              Download your cookbook now
            </a>
            <p className="mt-3 text-sm text-ink/70">
              Your link works for 7 days and up to 5 downloads — save the PDF once it opens.
            </p>
          </>
        ) : (
          <div className="mt-8 rounded-lg bg-primary-soft p-5 text-sm leading-relaxed">
            <strong>Your download link is being prepared.</strong> It will arrive in your inbox within a
            few minutes. If nothing shows up (check spam too), write to{' '}
            <a className="font-semibold text-primary underline" href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </a>{' '}
            and we&apos;ll sort it out right away.
          </div>
        )}

        <div className="mt-10 border-t border-primary-soft pt-6">
          <h2 className="text-sm font-semibold tracking-wide text-ink/60 uppercase">What you got</h2>
          <p className="mt-2 font-display text-xl font-semibold text-primary">
            {product?.name ?? 'The Diabetic Air Fryer Cookbook'}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink/80">
            {product?.shortPitch ??
              'Diabetic-friendly air fryer recipes — low net carbs, high protein. Instant PDF download.'}
          </p>
          {order ? (
            <p className="mt-3 text-sm text-ink/60">
              Paid: ${(order.amountCents / 100).toFixed(2)} {(order.currency ?? 'usd').toUpperCase()}
            </p>
          ) : null}
        </div>
      </div>
    </main>
  )
}

function InvalidSession({ unpaid = false }: { unpaid?: boolean }) {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-16 sm:py-24">
      <div className="rounded-2xl bg-white p-8 shadow-sm sm:p-12">
        <h1 className="font-display text-3xl font-bold text-primary">
          {unpaid ? 'Payment not completed' : 'We couldn’t find that order'}
        </h1>
        <p className="mt-4 leading-relaxed">
          {unpaid
            ? 'It looks like this checkout wasn’t completed. If you believe you were charged, don’t worry — your payment is safe with Stripe and we can look it up for you.'
            : 'This confirmation link is invalid or has expired. If you just bought the cookbook, your receipt email contains your download link.'}
        </p>
        <p className="mt-4 leading-relaxed">
          Need a hand? Email{' '}
          <a className="font-semibold text-primary underline" href={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_EMAIL}
          </a>{' '}
          and include the email address you used at checkout.
        </p>
        <Link
          href="/shop"
          className="mt-8 inline-block rounded-lg bg-primary px-6 py-3 font-semibold text-white transition hover:bg-primary-hover"
        >
          Back to the shop
        </Link>
      </div>
    </main>
  )
}
