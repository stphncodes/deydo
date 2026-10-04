// Writes .env.local from the running local Supabase stack, keeping any
// values already set for other variables. Usage: npm run env:local
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const status = JSON.parse(
  execFileSync('npx', ['supabase', 'status', '-o', 'json'], { encoding: 'utf8' }),
)

const pick = (...keys) => keys.map((key) => status[key]).find(Boolean)

const hookSecret = readFileSync('supabase/config.toml', 'utf8').match(
  /\[auth\.hook\.send_sms\][^[]*?secrets = "([^"]+)"/,
)?.[1]

const fromSupabase = {
  NEXT_PUBLIC_SUPABASE_URL: pick('API_URL', 'api_url'),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: pick('PUBLISHABLE_KEY', 'publishable_key', 'ANON_KEY'),
  SUPABASE_SECRET_KEY: pick('SECRET_KEY', 'secret_key', 'SERVICE_ROLE_KEY'),
  SEND_SMS_HOOK_SECRET: hookSecret,
  SMS_PROVIDER: 'console',
}

for (const [key, value] of Object.entries(fromSupabase)) {
  if (!value) {
    console.error(`Could not read ${key} from \`supabase status\`. Is the stack running?`)
    process.exit(1)
  }
}

const template = readFileSync('.env.example', 'utf8')
const existing = existsSync('.env.local') ? readFileSync('.env.local', 'utf8') : ''
const current = Object.fromEntries(
  existing
    .split('\n')
    .map((line) => line.match(/^([A-Z0-9_]+)=(.*)$/))
    .filter(Boolean)
    .map((match) => [match[1], match[2]]),
)

const output = template
  .split('\n')
  .map((line) => {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (!match) return line
    const [, key, fallback] = match
    return `${key}=${fromSupabase[key] ?? current[key] ?? fallback}`
  })
  .join('\n')

writeFileSync('.env.local', output)
console.log('Wrote .env.local from the local Supabase stack.')
