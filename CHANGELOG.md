# Changelog

All notable changes to `@xzibit/ui` are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/) loosely; versioning follows [SemVer](https://semver.org/).

## [0.4.0] — 2026-06-11

Visual amendment driven by Joel's "ok but not great" call on the header and a Claude Design pass that explored options. Functional API is unchanged. Three new exports add capability without removing or breaking anything in v0.3.x.

### Changed (visual)

- **Brand colour corrected.** The TopBar background moves from `#252E38` (historical drift) to `#1D252D` (Pantone 433 C, the official brand dark from Xzibit's brand colour sheet). Apps using `var(--xz-charcoal)` will tint subtly to the brand-correct value when they pick up v0.4.0 plus matching `@xzibit/tokens`.
- **`<XzibitMark>` swaps the v0.3.2 contour-traced approximation for the canonical brand SVG path data.** Source: `Xzibit X RGB.svg` from the brand pack, preserved at `apps/standards/docs/brand/`. Fill default changes from `currentColor` to brand teal `#19B1A1` (Pantone 3262 CP) since the mark is always teal in the canonical brand sheet. viewBox changes from `0 0 100 100` to the brand-native `0 0 54.57 49.03`.
- **`<BackToLauncher>` brand lockup restyle.** Renders as `[grid icon] [X mark teal] [Xzibit wordmark white] [Apps qualifier]` inside a single anchor. The chevron-left from v0.3.x is removed. The "Xzibit Apps" plain text is replaced by the canonical Xzibit wordmark SVG outlines (white) plus a small "Apps" qualifier text. One click target, one destination, no behavioural change.
- **`<TopBar>` background uses brand `#1D252D`.** Right padding bumped to 200px to reserve a corner zone for the BuildBadge overlay so right-slot content does not collide with it. App name typography tightened (15px / 500, was 18px / 500). Teal app-identity dot bumped from 4px to 6px.
- **`<BuildBadge>` bubble fill switches from pure white to off-white (`#F4F4F2`).** Adds a subtle `box-shadow: 0 1px 2px rgba(0,0,0,0.04)` so the bubble lifts off the dark TopBar. Internal type and layout are unchanged.

### Added

- **`<XzibitWordmark>`** — exported component. Inline SVG outlines of the canonical Xzibit wordmark, font-independent, fills via `currentColor` by default (white on the dark TopBar). Sized via the `size` prop (height in px), preserves the brand-native aspect ratio.
- **`<FeedbackButton>`** — exported component. Teal pill (Pantone 3262 CP) with **dark text** (Pantone 433 C) and a message icon. Dark on teal is a WCAG AA contrast decision (5.8:1, vs 2.7:1 for white on teal which fails). Render via the new `<TopBar rightSlot={...}>` prop. Click handler is whatever opens your in-app feedback modal per ADR `f26c4824`.
- **`<TopBar rightSlot={...}>`** — optional prop. Any ReactNode you pass renders at the right edge of the bar's content area, sized to flex-shrink so the existing left cluster stays visible. The 200px right-side reservation keeps the slot clear of the BuildBadge corner overlay.

### Deprecated (further along the v0.3.3 path)

- `<TopBar buildSha buildTimestamp>` props remain deprecated. v0.3.3 changed them to ignored + warn. v0.4.0 leaves the deprecation in place. Removal target is now v0.5 (not v0.4 as previously stated). Render `<BuildBadge>` in your root layout instead.

### Why this matters

The header is the most-seen surface in the portfolio. Joel approved the visual direction across two mockup rounds. The brand colour correction (#252E38 → #1D252D) is a one-time fix that brings every TopBar back to the official brand. The new exports unlock the Feedback widget rollout per ADR `f26c4824` without per-app reinvention.

### Backward compatible

API surface from v0.3.3 is preserved. Every existing export (TopBar, BackToLauncher, AppsDropdown, XzibitMark, ContentContainer, BuildBadge, useApps, normalizeApp) retains its prop signature. The new optional `rightSlot` prop on TopBar is purely additive. v0.3.3 consumers can upgrade to v0.4.0 with a one-line dependency bump.

### Acceptance test (for regression checks)

- `'use client'` directives still preserved in `dist/index.js` and `dist/index.cjs` head (v0.3.3 fix intact).
- Brand X path data present in dist (`grep "M52.88,49.03"` returns non-zero).
- New `XzibitWordmark` and `FeedbackButton` exports surfaced in `dist/index.d.ts`.

---

## [0.3.3] — 2026-05-28

### Added

- **`<BuildBadge sha={...} timestamp={...} />` exported component.** Fixed-position white pill in the corner of the viewport (top-right default; `position="top-left"` available), displaying SHA in monospace + `·` separator + "Last updated {timestamp}" in muted text. Renders ALONGSIDE the TopBar (not inside it) — sits at z-index 9999 above the TopBar's 100 and looks like a small tab attached to the corner.

  ```tsx
  // src/app/layout.tsx
  import { TopBar, BuildBadge } from '@xzibit/ui';

  export default function RootLayout({ children }) {
    return (
      <html><body>
        <TopBar appName="ERP Overview" />
        <BuildBadge
          sha={process.env.NEXT_PUBLIC_BUILD_SHA ?? 'local'}
          timestamp={process.env.NEXT_PUBLIC_BUILD_TIME ?? new Date().toISOString()}
        />
        <main style={{ marginTop: 44 }}>{children}</main>
      </body></html>
    );
  }
  ```

  - **Style:** white background (`var(--xz-white, #FFFFFF)`), 1px border `var(--border)` on bottom + the inside edge, 6px corner radius on the inside-bottom corner, 0.25rem × 0.625rem padding, 11px text (`0.6875rem`), monospace SHA in `var(--foreground)`, dot separator in `var(--border)`, "Last updated…" in `var(--muted-foreground)`.
  - **Timestamp formatting:** if you pass a raw ISO string (e.g. `process.env.NEXT_PUBLIC_BUILD_TIME` from a build step that writes the build time as ISO), the badge formats it in Brisbane time (`en-AU`, `Australia/Brisbane`, 12-hour, `21 May 2026, 5:03 pm AEST`). If you pass a pre-formatted string, it renders as-is.
  - **No `'use client'` directive** — server-safe. Renders identically in Server Components and Client Components.

### Deprecated (will be removed in v0.4)

- **`<TopBar buildSha={...} buildTimestamp={...} />` props.** The TopBar no longer renders its own internal build badge. Passing the props logs a one-shot `console.warn` and the props are ignored. **Migration:** add `<BuildBadge sha={...} timestamp={...} />` to your root layout next to `<TopBar />` and drop the props from the TopBar call.

  Rationale: the previous in-bar badge was `rgba(255, 255, 255, 0.5)` faint text against the dark TopBar — legible but visually weak. Joel's preference (surfaced 2026-05-28 from launcher CC's Staff App build) is the white-pill overlay style — much higher contrast and treats the build provenance as a first-class corner artifact rather than chrome noise. The overlay also leaves the right side of the TopBar's 44px bar free for future affordances.

### Why this matters

The build badge is the canonical mechanism for cross-app deploy provenance — Joel uses it to verify SHA on live URL matches SHA on main (per the production-verification convention from Phase 1.16). The new style makes the SHA + timestamp readable at a glance without having to lean in. Every Xzibit App should adopt this in their root layout.

### Backward compatible (with deprecation warnings)

- `<TopBar>` API surface unchanged at the type level; deprecated props log a warning but don't error
- Existing consumers (ERP Overview v0.3.0–v0.3.2, Staff App pre-launcher-CC-overlay) will see the warning + lose the in-bar badge silently. Add `<BuildBadge>` to restore the visual + upgrade to the new style.
- All other exports (`TopBar`, `BackToLauncher`, `AppsDropdown`, `XzibitMark`, `useApps`, `ContentContainer`, `normalizeApp`) unchanged from v0.3.2

---

## [0.3.2] — 2026-05-24

### Changed

- **`<XzibitMark />` now renders the canonical brand X.** Previous versions (v0.1.0 – v0.3.1) rendered a hand-drawn approximation: four straight strokes meeting at a centre point, contained inside a solid black square stamp. v0.3.2 replaces both elements with the brand-faithful mark — two mirrored stylised "chevron" halves with stepped/notched outer terminations, crossing in the middle with a small central void. No background fill; the mark is rendered as filled paths in `currentColor` so it inherits the surrounding text colour (useful inside the dark TopBar where text is white).

  The paths were extracted from the canonical raster asset at `brand/xzibit-mark.png` (591×591, Joel-provided) via `scikit-image.measure.find_contours` + `approximate_polygon(tolerance=2.5)`, then normalised to a `viewBox="0 0 100 100"`.

### Added

- **`fill` prop on `<XzibitMark />`** — defaults to `currentColor`. Override for explicit colour control if the mark needs to differ from its surrounding text.

### Visual impact

- **TopBar consumers (v0.3.0 – v0.3.1):** the brand-faithful X replaces the placeholder geometric X. Visible change. No code change required by consumers — just bump the package and re-deploy.
- **Standalone `<XzibitMark />` consumers:** the black square background is GONE. If you were relying on the self-contained black stamp for contrast against a non-charcoal background, wrap the mark in a `<div style={{ background: '#000', padding: ... }}>` or set `fill` explicitly.

### Why this matters

The placeholder approximation was a v0.1.0 stopgap until the brand asset was available. Shipping the canonical mark closes a long-standing gap — the TopBar now displays the actual Xzibit logo, not a hand-drawn stand-in. Per DS Cowork's brand-asset note: "do not invent brand marks; if the canonical asset isn't available, ship a placeholder and flag it for replacement."

### Backward compatible (with one nuance)

Same export name, same API surface, same default prop signatures. The `fill` prop is new and optional. The visual change is intentional. Consumers wanting the v0.1.0-style stamp can render `<div style={{ background: '#000' }}><XzibitMark fill="#fff" /></div>` themselves, but the recommendation is to let the canonical mark stand on its own.

---

## [0.3.1] — 2026-05-24

### Fixed

- **`'use client'` directives now ship in the bundled output.** Source files for `TopBar`, `AppsDropdown`, `BackToLauncher`, and `useApps` now carry a top-of-file `'use client'` directive, and the build (tsup + new `esbuild-plugin-preserve-directives`) preserves these directives in both ESM and CJS output. Previous versions (v0.1.0 – v0.3.0) stripped the directives at build time, which caused Next.js App Router to attempt server-side rendering of `useState`-bearing components and crash during prerender (`TypeError: (0 , d.useState) is not a function`).

  Concretely: any consumer importing `TopBar` (or `AppsDropdown` / `BackToLauncher` / `useApps`) directly into a Server Component (default for `app/layout.tsx` and `app/page.tsx` files in Next.js 13+) would fail at build time with an exit-code-1 prerender error. ERP Overview Phase 1.11–1.13 deployments all hit this and silently failed Vercel deploys for three consecutive ships (live site continued serving the Phase 1.10 cached build, which masked the failures from reporting).

  After upgrading to v0.3.1, no consumer-side workaround is required. Direct import into Server Components works.

### Why this happened

esbuild's default behaviour is to strip top-of-file directives during bundling. tsup wraps esbuild and inherits this default. Without an explicit plugin (`esbuild-plugin-preserve-directives`), source-file `'use client'` declarations disappear from the dist output, leaving consumers to wrap the imports themselves in a local `'use client'` re-export module — the workaround ERP Overview shipped as Phase 1.14's `src/components/TopBarClient.tsx`.

### Build config change

- **NEW** `tsup.config.ts` replaces the inline `tsup src/index.ts --format cjs,esm --dts --clean` script. Equivalent flags, plus `esbuildPlugins: [preserveDirectives()]`.
- **NEW devDependency:** `esbuild-plugin-preserve-directives@^0.0.11`.
- `scripts.build` simplified to `tsup` (reads `tsup.config.ts`); same for `dev`.

### Consumer migration after v0.3.1 lands

If you previously created a local `'use client'` wrapper for `TopBar` (or any other v0.3.0 export), you can now delete the wrapper and import directly from `@xzibit/ui` into your Server Component layout. See ERP Overview SHA `9fb78a4` for the pre-fix workaround pattern; SHA after Phase 1.15 will show the post-fix clean pattern.

### Backward compatible

API surface unchanged from v0.3.0. Same exports, same prop signatures, same default behaviour. v0.3.1 is a strict bug-fix release.

### Acceptance test (for future package work)

In a fresh Next.js 14+ App Router scaffold, place this in `app/layout.tsx`:

```tsx
import { TopBar } from '@xzibit/ui';
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <TopBar appName="Test App" />
        <main style={{ marginTop: 44 }}>{children}</main>
      </body>
    </html>
  );
}
```

Then `npm run build` must complete without a `useState is not a function` error and Vercel must report READY. This is the canonical regression test for the v0.3.1 fix.

---

## [0.3.0] — 2026-05-24

### Added

- **`disablePadding` prop on `<ContentContainer>`** — when `true`, renders no padding (only `max-width` + `margin: 0 auto`). For app-shell integration where the parent layout already provides padding (e.g. left-nav offset), preventing the tier padding from stacking and reducing effective content width.

  ```tsx
  <ContentContainer tier="reference" disablePadding>
    {/* shell-managed padding flows through */}
  </ContentContainer>
  ```

### Why

ERP Overview Phase 1.13 (the canonical `<ContentContainer>` migration ship 2026-05-24) surfaced a left-nav stacking conflict: the per-page outer div uses `padding: '2.5rem 2.5rem 2.5rem 280px'` (left-nav offset), and stacking the container's `3rem 2rem` reduces effective width on wide monitors from the spec's 1200px to ~816px. Their resolution — `className="content-container--layout"` + `!important` padding zero — works but is a smell. `disablePadding` is the canonical API. Every left-nav-bearing portfolio app will hit this same conflict; this prop is the right answer for v0.3 before the portfolio-wide broadcast.

### Backward compatible

`disablePadding` defaults to `false`. v0.2.x adopters who don't set it see no change. v0.3+ is the recommended version for app-shell integration; v0.2.x is fine for page-level adoption where shell padding isn't a concern.

---

## [0.2.0] — 2026-05-24

### Added

- **`<ContentContainer tier="...">`** — implements DESIGN-STANDARD v2.4 §Content Density Tiers. Three tiers: `'editorial'` (720px), `'reference'` (1200px, DEFAULT), `'data'` (unconstrained with 32px side padding). Drop-in wrapper for `<main>` content. Per-page overrides via `tier` prop.
- **`ContentTier`** type exported for app authors wanting to type tier props at their own layer.

### Coming next

- `<Toast />` + `useToast()` — wrapper around `sonner` per DESIGN-STANDARD §Toast / Notification (v2.2). Will ship as v0.2.1 once drafted.
- `<Modal />` — wrapper around `@radix-ui/react-dialog` per DESIGN-STANDARD §Modal / Dialog (v2.2). Will ship as v0.2.2 once drafted.

(Joel chose Option A 2026-05-24 — fast-ship v0.2.0 with just ContentContainer to unblock portfolio-wide adoption of the new content tier system. Toast + Modal ship as subsequent patches.)

---

## [0.1.1] — 2026-05-24

### Fixed
- **Peer dependency widened** to accept React 19 (`react@"^18.0.0 || ^19.0.0"` and `react-dom` same). Surfaced during ERP Overview migration — `--legacy-peer-deps` was needed to install on the React 19 app. Affects every React 19 app planning to adopt; v0.1.0 blocked clean install.
- **API field-name contract resilience.** `useApps` now normalizes raw Supabase column names (`app_url`, `display_section`, `display_order`) to the canonical `App` shape (`url`, `section`, `section_order`) via internal `normalizeApp()` at the fetch boundary. Apps with existing endpoints returning raw query rows now work without changes; new endpoints can return either shape. Surfaced during ERP Overview migration — package rendered empty dropdown until CC added a manual `.map()` normalization in the route handler.

### Added
- `RawApp` type exported for apps that want to type their endpoint response explicitly
- `normalizeApp(raw: RawApp): App` helper exported for apps that want to call it directly (rare; `useApps` calls it automatically)

### Documentation
- README's `/api/me/apps` section now documents both accepted field-name conventions and the normalization behaviour.

---

## [0.1.0] — 2026-05-22 (drafted) / 2026-05-23 (published)

### Published artifact
- npm: https://www.npmjs.com/package/@xzibit/ui
- Provenance attestation: present
- Install: `npm install @xzibit/ui`

### Bug fixes applied between draft and publish (sync'd back into this draft 2026-05-23)
- **`package-lock.json` generated** via `npm install` (not present in initial draft — required for `npm ci` in CI).
- **Removed stale `import React` namespace imports** from 4 source files (`TopBar.tsx`, `XzibitMark.tsx`, `BackToLauncher.tsx`, `AppsDropdown.tsx`). The package's `tsconfig.json` uses `"jsx": "react-jsx"` (modern transform, doesn't need React import) + `noUnusedLocals: true`, so bare `import React from 'react'` fails the DTS build. Fixed by removing the unused namespace import — named imports (`useState`, `useEffect`, etc.) where actually needed are kept.

### Future-package note
When drafting any future React component package for the `@xzibit/*` scope, omit `import React from 'react'` unless React is actually used directly (e.g. `React.forwardRef`). Just import the hooks / types you need by name.

### Added

Initial release. Implements DESIGN-STANDARD.md v2.3.1 §Top Bar canonical chrome.

- **`<TopBar />`** — universal 44px fixed top bar (composes everything below)
- **`<BackToLauncher />`** — chevron + Xzibit X logo + "Xzibit Apps" anchor as one click target; cross-deployment navigation to https://xzibit-apps.vercel.app
- **`<AppsDropdown />`** — sectioned + within-section alphabetical apps dropdown; fetches `/api/me/apps`; loading skeleton + empty state + error state; Esc + outside-click close; focus return on close
- **`<XzibitMark />`** — Xzibit X brand mark as inline SVG; any size, any pixel density; native black background stamp
- **`useApps()`** — React hook fetching `/api/me/apps` with loading + error + refetch; same-origin per-app endpoint pattern
- **CSS variable theming** — components reference `var(--xz-charcoal, ...)`, `var(--xz-teal, ...)`, etc. with hex fallbacks; recommended companion `@xzibit/tokens` for full token surface

### Not yet included (planned for v0.2+)

- **`<Modal />`** — wrapper around `@radix-ui/react-dialog` per DESIGN-STANDARD §Modal / Dialog
- **`<Toast />`** + `useToast()` — wrapper around `sonner` per DESIGN-STANDARD §Toast / Notification
- **Animation tokens / motion** — pending DESIGN-STANDARD §Motion

### Reference implementation

`xzibit-apps/erp-overview` SHA `6f1a5b5+` is the canonical reference for the v0.1 component behavior. ERP Overview's local `TopBar.tsx` will be the first migrate-to-shared candidate when this package publishes (eat-our-own-dog-food).

## Authority chain

This package version matches `_portfolio/CONVENTIONS/DESIGN-STANDARD.md` v2.3.1. When DESIGN-STANDARD bumps, this package bumps to match within ~1 week.
