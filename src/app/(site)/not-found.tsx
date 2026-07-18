import Image from 'next/image'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-5 py-24 text-center sm:px-8">
      <Image
        src="/brand/logo-badge.jpg"
        alt=""
        width={88}
        height={88}
        className="rounded-full border-4 border-primary-soft opacity-90"
      />
      <p className="mt-8 font-display text-6xl font-semibold text-primary">404</p>
      <h1 className="mt-3 font-display text-3xl font-semibold text-ink">
        This page got lost in the air fryer
      </h1>
      <p className="mt-4 max-w-md leading-relaxed text-ink/70">
        The page you&apos;re looking for doesn&apos;t exist or has moved. But dinner is still on
        — there are plenty of 15-minute recipes waiting.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/recipes"
          className="rounded-full bg-primary px-7 py-3 text-sm font-semibold text-cream transition-colors hover:bg-primary-hover"
        >
          Browse recipes
        </Link>
        <Link
          href="/"
          className="rounded-full border-2 border-primary px-7 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary-soft"
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}
