import Image from 'next/image'

// Placeholder homepage — the full homepage (hero, featured recipes, testimonials,
// lead magnet) is built in Phase 2.
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <Image
        src="/brand/logo-badge.jpg"
        alt="DrZeeBites logo"
        width={112}
        height={112}
        priority
        className="mb-8 rounded-full border-4 border-primary-soft shadow-md"
      />
      <p className="mb-3 text-sm font-semibold tracking-[0.2em] text-accent uppercase">
        Coming soon
      </p>
      <h1 className="font-display text-5xl font-semibold text-primary sm:text-6xl">
        DrZeeBites
      </h1>
      <p className="mt-4 max-w-xl text-lg text-ink/80">
        15-Minute Diabetic-Friendly Air Fryer Recipes
      </p>
      <div className="mt-10 flex items-center gap-4">
        <span className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-cream transition-colors hover:bg-primary-hover">
          The Diabetic Air Fryer Cookbook
        </span>
        <span className="rounded-full bg-primary-soft px-6 py-3 text-sm font-semibold text-primary">
          $27 · Instant PDF
        </span>
      </div>
    </main>
  )
}
