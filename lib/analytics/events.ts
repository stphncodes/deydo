import { z } from 'zod'

// The only events we send to product analytics: the funnel from the product
// vision. Business metrics (match rate, completion rate, repeat rate) come
// from Postgres views, not from these events.
//
// Every property schema is strict, so a phone number, address or message
// cannot be attached by accident. Ids are opaque UUIDs.

const id = z.uuid()
const categorySlug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
const urgency = z.enum(['asap', 'today', 'scheduled', 'flexible'])

export const FunnelEventSchemas = {
  request_posted: z.strictObject({
    request_id: id,
    category: categorySlug,
    urgency,
    has_photos: z.boolean(),
    has_budget: z.boolean(),
  }),
  first_provider_response: z.strictObject({
    request_id: id,
    category: categorySlug,
    minutes_to_response: z.number().int().nonnegative(),
    response_kind: z.enum(['interest', 'question', 'quote']),
  }),
  proposal_accepted: z.strictObject({
    request_id: id,
    job_id: id,
    category: categorySlug,
    had_quote: z.boolean(),
  }),
  job_completed: z.strictObject({
    job_id: id,
    category: categorySlug,
    auto_confirmed: z.boolean(),
  }),
  review_submitted: z.strictObject({
    job_id: id,
    role: z.enum(['customer_to_provider', 'provider_to_customer']),
    rating: z.number().int().min(1).max(5),
  }),
} as const

export type FunnelEvent = keyof typeof FunnelEventSchemas
export type FunnelEventProps<E extends FunnelEvent> = z.infer<(typeof FunnelEventSchemas)[E]>

export function parseFunnelEvent<E extends FunnelEvent>(
  event: E,
  props: unknown,
): FunnelEventProps<E> {
  return FunnelEventSchemas[event].parse(props) as FunnelEventProps<E>
}
