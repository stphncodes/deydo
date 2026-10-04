import { z } from 'zod'

export type ErrorCode =
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION'
  | 'RATE_LIMITED'
  | 'INTERNAL'

export type FieldErrors = Record<string, string[]>

/** Errors the service layer throws on purpose. Their messages are safe to show users. */
export class DomainError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly fieldErrors?: FieldErrors,
  ) {
    super(message)
    this.name = 'DomainError'
  }
}

export class UnauthenticatedError extends DomainError {
  constructor(message = 'Please sign in to continue.') {
    super('UNAUTHENTICATED', message)
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = 'You do not have permission to do that.') {
    super('FORBIDDEN', message)
  }
}

export class NotFoundError extends DomainError {
  constructor(message = 'We could not find what you were looking for.') {
    super('NOT_FOUND', message)
  }
}

export class ConflictError extends DomainError {
  constructor(message = 'This has changed since you opened it. Please refresh and try again.') {
    super('CONFLICT', message)
  }
}

export class ValidationError extends DomainError {
  constructor(message = 'Please check the highlighted fields.', fieldErrors?: FieldErrors) {
    super('VALIDATION', message, fieldErrors)
  }
}

export class RateLimitedError extends DomainError {
  constructor(message = 'You are doing that too often. Please wait a little and try again.') {
    super('RATE_LIMITED', message)
  }
}

/** Shape of a Postgres or PostgREST error as returned by supabase-js. */
export type DbErrorLike = { code?: string; message?: string; details?: string | null }

/**
 * Translates a database error into a domain error. Postgres messages are
 * never shown to users because they can reveal schema details.
 */
export function mapDbError(error: DbErrorLike): DomainError {
  switch (error.code) {
    case '42501': // insufficient_privilege, including RLS violations
      return new ForbiddenError()
    case '23505': // unique_violation
    case '40001': // serialization_failure
      return new ConflictError()
    case '23502': // not_null_violation
    case '23503': // foreign_key_violation
    case '23514': // check_violation
    case '22P02': // invalid_text_representation
    case '22023': // invalid_parameter_value
      return new ValidationError('Some of the details are not valid.')
    case 'P0002': // no_data_found
    case 'PGRST116': // single row requested, none found
      return new NotFoundError()
    default:
      return new DomainError('INTERNAL', 'Something went wrong on our side. Please try again.')
  }
}

export type ActionError = { code: ErrorCode; message: string; fieldErrors?: FieldErrors }
export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: ActionError }

/**
 * Converts anything thrown in a Server Action into a result the form can show.
 * Returns `unexpected: true` for errors that should be reported to Sentry.
 */
export function toActionError(error: unknown): { error: ActionError; unexpected: boolean } {
  if (error instanceof DomainError) {
    return {
      error: { code: error.code, message: error.message, fieldErrors: error.fieldErrors },
      unexpected: error.code === 'INTERNAL',
    }
  }
  if (error instanceof z.ZodError) {
    const { fieldErrors } = z.flattenError(error)
    return {
      error: {
        code: 'VALIDATION',
        message: 'Please check the highlighted fields.',
        fieldErrors: fieldErrors as FieldErrors,
      },
      unexpected: false,
    }
  }
  return {
    error: { code: 'INTERNAL', message: 'Something went wrong on our side. Please try again.' },
    unexpected: true,
  }
}

/** State returned by form Server Actions used with useActionState. */
export type FormState = { ok?: boolean; message?: string; error?: ActionError }
