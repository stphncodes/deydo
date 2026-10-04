'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'

const items = [
  {
    href: '/dashboard',
    label: 'Home',
    icon: 'M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z',
  },
  {
    href: '/requests',
    label: 'Requests',
    icon: 'M8 4h8M6 8h12M5 12h14v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z',
  },
  { href: '/messages', label: 'Messages', icon: 'M4 5h16v11H8l-4 4z' },
  {
    href: '/settings',
    label: 'Account',
    icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-8 9a8 8 0 0 1 16 0',
  },
] as const

/** Thumb-reachable navigation for one-handed use on phones. */
export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto grid max-w-2xl grid-cols-4">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium',
                  active ? 'text-brand' : 'text-ink-muted',
                )}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={item.icon} />
                </svg>
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
