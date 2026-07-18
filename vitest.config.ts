import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      // Must match tsconfig paths. `@payload-config` is aliased for
      // completeness but the real Payload config is never loaded in unit
      // tests — `@/lib/payload` is mocked at the module boundary.
      '@payload-config': path.resolve(dirname, 'src/payload.config.ts'),
      '@': path.resolve(dirname, 'src'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    // Sets test-only env values (DOWNLOAD_TOKEN_SECRET etc.) before any
    // module under test is imported. Unit tests never read the real .env.
    setupFiles: ['tests/setup.ts'],
  },
})
