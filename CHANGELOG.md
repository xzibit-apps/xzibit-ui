# Changelog

All notable changes to `@xzibit/ui` are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/) loosely; versioning follows [SemVer](https://semver.org/).

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
