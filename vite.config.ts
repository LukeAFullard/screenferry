import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  // Without this, Vite emits root-absolute asset URLs (e.g. "/assets/foo.js")
  // for the worker chunk, which only resolve correctly if the consuming app
  // happens to serve its own root from the same path as our dist/ — true for
  // nothing in practice. A relative base makes those URLs resolve relative
  // to wherever dist/index.js itself was loaded from, as they must for a
  // distributable package.
  base: './',
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.ts'),
      name: 'screenferry',
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
      formats: ['es', 'cjs'],
    },
    sourcemap: true,
  },
  plugins: [
    dts({
      entryRoot: 'src',
      bundleTypes: true,
      // Without this, the plugin mirrors the whole TS program's per-file
      // declarations into dist/ — including test/**, since tsconfig's
      // `include` covers it too. Bundling into a single dist/index.d.ts
      // keeps the shipped surface to what index.ts actually exports.
    }),
  ],
});
