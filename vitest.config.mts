import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    alias: {
      // `server-only` throws outside a React Server environment; tests import
      // server modules directly, so swap it for an empty module.
      'server-only': new URL('./tests/support/empty-module.ts', import.meta.url).pathname,
    },
  },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.{ts,tsx}', '**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'tests/e2e/**', 'supabase/**'],
    restoreMocks: true,
  },
})
