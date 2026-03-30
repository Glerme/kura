import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '~': path.resolve(__dirname, '.'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    fakeTimers: {
      shouldAdvanceTime: true,
    },
  },
  assetsInclude: ['**/*.{png,jpg,jpeg,gif,svg,webp}'],
})
