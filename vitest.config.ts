import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

// Vitest config. Kept separate from vite.config.ts because Vitest vendors its
// own (older) copy of Vite, and unifying plugin types across the two versions
// breaks the TS compiler. Aliases are duplicated so tests can resolve '@engine/*' etc.
export default defineConfig({
  resolve: {
    alias: {
      '@engine': fileURLToPath(new URL('./src/engine', import.meta.url)),
      '@data': fileURLToPath(new URL('./src/data', import.meta.url)),
      '@audio': fileURLToPath(new URL('./src/audio', import.meta.url)),
      '@ui': fileURLToPath(new URL('./src/ui', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    globals: false,
    include: ['tests/**/*.test.ts'],
  },
});
