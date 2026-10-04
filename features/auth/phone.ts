// Nigerian mobile numbers in the format Supabase uses for phones: country
// code without the plus, for example 2348031234567. Used for the contact
// number providers give (ADR-015), not for sign-in.

const NATIONAL = /^0([789][01]\d{8})$/ // 08031234567
const BARE = /^([789][01]\d{8})$/ // 8031234567
const INTERNATIONAL = /^(?:\+|00)?234([789][01]\d{8})$/ // +2348031234567, 2348031234567

/** Returns 234XXXXXXXXXX, or null if the input is not a Nigerian mobile number. */
export function normalizeNigerianPhone(input: string): string | null {
  const compact = input.replace(/[\s().-]/g, '')
  const match = compact.match(INTERNATIONAL) ?? compact.match(NATIONAL) ?? compact.match(BARE)
  return match?.[1] ? `234${match[1]}` : null
}

/** 2348031234567 to "0803 123 4567", for showing a number to its owner or staff. */
export function formatNigerianPhone(phone: string): string {
  const national = phone.startsWith('234') ? `0${phone.slice(3)}` : phone
  return `${national.slice(0, 4)} ${national.slice(4, 7)} ${national.slice(7)}`
}

/** chidi@example.com to "ch***@example.com". */
export function maskEmail(email: string): string {
  const [local = '', domain = ''] = email.split('@')
  return `${local.slice(0, 2)}***@${domain}`
}
