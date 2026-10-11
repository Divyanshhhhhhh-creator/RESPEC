import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    alias: {
      '@respec/contracts': fileURLToPath(new URL('../contracts/src/index.ts', import.meta.url)),
    },
  },
});
