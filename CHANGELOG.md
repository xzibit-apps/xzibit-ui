# Changelog

All notable changes to `@xzibit/ui` are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/) loosely; versioning follows [SemVer](https://semver.org/).

## [0.1.0] — 2026-05-22

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
