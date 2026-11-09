import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';
import pkg from './package.json' with { type: 'json' };
import { buildPwa } from './tools/pwa.ts';

/** After a production build, generate dist/sw.js from the real output (G5 PWA, tools/pwa.ts). */
const pwa = (): Plugin => {
  let outDir = 'dist';
  return {
    name: 'crowned-kingdoms-pwa',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const { files, version } = buildPwa(outDir);
      console.log(`[pwa] sw.js precaches ${files} files (cache ck-${version})`);
    },
  };
};

export default defineConfig({
  // Relative base so the same build works on itch.io, a sub-path, Tauri and Capacitor.
  base: './',
  plugins: [pwa()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    target: 'es2022',
    // Phaser alone is ~1.2 MB minified; that's expected for a game bundle.
    chunkSizeWarningLimit: 2000,
  },
  server: {
    host: true,
    port: 5173,
    // On Windows the change event can fire before the editor finishes writing, and
    // Vite then caches the old file contents. Wait for writes to settle.
    watch: { awaitWriteFinish: { stabilityThreshold: 120, pollInterval: 30 } },
  },
  test: {
    include: ['src/**/*.test.ts', 'tools/*.test.ts'],
    environment: 'node',
  },
});
