import { avatarUrl } from '@/lib/avatars'
import { cn } from '@/lib/utils'

/** Profile photo, or initials on a solid colour when there is none. */
export function Avatar({
  path,
  name,
  size = 48,
  className,
}: {
  path: string | null
  name: string | null
  size?: number
  className?: string
}) {
  const url = avatarUrl(path)
  const initials =
    (name ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || '?'

  return url ? (
    // Small, already-compressed images: a plain img avoids the image optimizer round trip.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      className={cn('shrink-0 rounded-full object-cover', className)}
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      aria-hidden="true"
      className={cn(
        'grid shrink-0 place-items-center rounded-full bg-ink font-semibold text-white',
        className,
      )}
      style={{ width: size, height: size, fontSize: size / 2.6 }}
    >
      {initials}
    </span>
  )
}
