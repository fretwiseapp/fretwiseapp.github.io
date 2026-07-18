import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { fileURLToPath, URL } from 'node:url';

// Vite config (dev server, build). Test config lives in vitest.config.ts so it
// stays typed against Vitest's vendored Vite copy and doesn't clash with
// top-level Vite plugin types.
export default defineConfig({
  // Relative base so the single-file build works from any path — the org root
  // (fretwiseapp.github.io) or a project subpath — all assets are inlined anyway.
  base: './',
  plugins: [react(), viteSingleFile()],
  resolve: {
    alias: {
      '@engine': fileURLToPath(new URL('./src/engine', import.meta.url)),
      '@data': fileURLToPath(new URL('./src/data', import.meta.url)),
      '@audio': fileURLToPath(new URL('./src/audio', import.meta.url)),
      '@ui': fileURLToPath(new URL('./src/ui', import.meta.url)),
    },
  },
  build: {
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2020',
    cssMinify: true,
    reportCompressedSize: true,
  },
});
