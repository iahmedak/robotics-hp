import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@lib': fileURLToPath(new URL('./src/lib', import.meta.url)),
      '@data': fileURLToPath(new URL('./src/data', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    // `workers/**` so the live-offers Worker suites actually run. Without this
    // they are silently skipped and every Worker test looks green by omission.
    include: ['src/**/*.test.ts', 'workers/**/*.test.ts'],
  },
});