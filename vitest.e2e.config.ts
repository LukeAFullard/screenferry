import { defineConfig } from 'vitest/config';

// Standalone from vite.config.ts on purpose — this suite only runs tests,
// never builds, so it doesn't need the library/dts build config at all.
export default defineConfig({
  test: {
    include: ['test/e2e/**/*.test.ts'],
  },
});
