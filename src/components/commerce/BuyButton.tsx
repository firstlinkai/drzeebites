'use client'

import { useState, useTransition } from 'react'
import { createCheckoutSession } from '@/app/actions/checkout'

type Props = {
  productId: string
  label?: string
  className?: string
}

export function BuyButton({ productId, label = 'Get Instant Access', className }: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleClick = () => {
    setError(null)
    startTransition(async () => {
      const result = await createCheckoutSession(productId)
      if ('url' in result) {
        window.location.assign(result.url)
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div>
      <button type="button" onClick={handleClick} disabled={pending} className={className}>
        {pending ? 'Redirecting…' : label}
      </button>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  )
}
