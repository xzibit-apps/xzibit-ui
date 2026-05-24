import { defineConfig } from 'tsup';
import { preserveDirectivesPlugin } from 'esbuild-plugin-preserve-directives';

/**
 * Build config for @xzibit/ui.
 *
 * The `preserveDirectivesPlugin` esbuild plugin keeps `'use client'` (and
 * other top-of-file directives) intact in the emitted ESM + CJS bundles.
 * Without it, esbuild strips directives by default — which broke ERP
 * Overview's Phase 1.11–1.13 deployments (Next.js Server Components tried
 * to SSR our useState-bearing components → `TypeError: useState is not a
 * function`).
 *
 * Added in v0.3.1 alongside `'use client'` directives in:
 *   - src/TopBar.tsx
 *   - src/AppsDropdown.tsx
 *   - src/BackToLauncher.tsx
 *   - src/useApps.ts
 *
 * See CHANGELOG.md v0.3.1 entry for the full incident write-up.
 */
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  metafile: true,
  esbuildPlugins: [
    preserveDirectivesPlugin({
      directives: ['use client'],
      include: /\.(js|ts|jsx|tsx)$/,
      exclude: /node_modules/,
    }),
  ],
});
