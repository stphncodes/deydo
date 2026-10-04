/** Only same-site paths, so `next` can never send someone to another site. */
export function safeNextPath(next: unknown, fallback = '/dashboard'): string {
  return typeof next === 'string' && /^\/(?!\/)[\w\-./?=&%]*$/.test(next) ? next : fallback
}
