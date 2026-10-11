import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Resolve @respec/contracts to the local source during tests
    alias: {
      '@respec/contracts': new URL('../contracts/src/index.ts', import.meta.url).pathname,
    },
  },
});
