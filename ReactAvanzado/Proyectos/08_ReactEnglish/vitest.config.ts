import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@domain': new URL('./src/domain', import.meta.url).pathname,
      '@application': new URL('./src/application', import.meta.url).pathname,
      '@infrastructure': new URL('./src/infrastructure', import.meta.url).pathname,
      '@presentation': new URL('./src/presentation', import.meta.url).pathname,
    },
  },
})
