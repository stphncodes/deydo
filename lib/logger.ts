import 'server-only'

import { redactValue } from '@/lib/observability/redact'

type Level = 'debug' | 'info' | 'warn' | 'error'
type Context = Record<string, unknown>

const LEVELS: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 }
const minLevel: Level = process.env.NODE_ENV === 'production' ? 'info' : 'debug'

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack }
  }
  return { message: String(error) }
}

function write(level: Level, msg: string, context: Context) {
  if (LEVELS[level] < LEVELS[minLevel]) return
  const { err, ...rest } = context
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    msg,
    ...(redactValue(rest) as Context),
    ...(err === undefined ? {} : { err: redactValue(serializeError(err)) }),
  })
  if (level === 'error' || level === 'warn') console.error(line)
  else console.log(line)
}

export type Logger = {
  debug: (msg: string, context?: Context) => void
  info: (msg: string, context?: Context) => void
  warn: (msg: string, context?: Context) => void
  error: (msg: string, context?: Context) => void
  child: (context: Context) => Logger
}

/** Structured JSON logger. Personal data is redacted before writing. */
export function createLogger(base: Context = {}): Logger {
  return {
    debug: (msg, context = {}) => write('debug', msg, { ...base, ...context }),
    info: (msg, context = {}) => write('info', msg, { ...base, ...context }),
    warn: (msg, context = {}) => write('warn', msg, { ...base, ...context }),
    error: (msg, context = {}) => write('error', msg, { ...base, ...context }),
    child: (context) => createLogger({ ...base, ...context }),
  }
}

export const logger = createLogger()

/** Request id from Vercel, or a fresh one, for correlating logs and Sentry. */
export function requestIdFrom(headers: Headers): string {
  return headers.get('x-request-id') ?? headers.get('x-vercel-id') ?? crypto.randomUUID()
}
