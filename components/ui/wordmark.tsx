import Link from 'next/link'

/** Placeholder wordmark until the brand is final. */
export function Wordmark({ href = '/' }: { href?: '/' | '/dashboard' }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-12 items-center gap-2 text-lg font-bold text-ink"
    >
      <span
        aria-hidden="true"
        className="grid size-8 place-items-center rounded-lg bg-ink text-sm font-bold text-white"
      >
        D
      </span>
      DeyDo
    </Link>
  )
}
