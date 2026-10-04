import 'server-only'

import { parseEnv, ServerEnvSchema } from './env.schema'

export const serverEnv = parseEnv(ServerEnvSchema, process.env, 'server')
