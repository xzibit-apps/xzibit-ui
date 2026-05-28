'use client';

import { BackToLauncher } from './BackToLauncher';
import { AppsDropdown } from './AppsDropdown';

export interface TopBarProps {
  /** App display name shown in the wordmark slot (e.g. "ERP Overview"). */
  appName: string;

  /** Optional click target for the app wordmark. Defaults to "/" (app home). */
  appHomeUrl?: string;

  /**
   * @deprecated as of v0.3.3 — render `<BuildBadge sha={...} />` in your root
   * layout instead. The TopBar no longer displays the build badge internally;
   * this prop is ignored and will be removed in v0.4. The new badge sits as a
   * fixed overlay in the corner of the viewport (see BuildBadge component) and
   * supports white-pill styling that's more legible than the previous in-bar
   * faint-text treatment. Reference impl: xzibit-apps/launcher root layout
   * (Staff App style, 2026-05-28).
   */
  buildSha?: string;

  /**
   * @deprecated as of v0.3.3 — see `buildSha`.
   */
  buildTimestamp?: string;

  /** Launcher URL override — defaults to https://xzibit-apps.vercel.app. */
  launcherUrl?: string;

  /** Override the /api/me/apps endpoint for the dropdown. */
  appsEndpoint?: string;
}

/**
 * Universal 44px fixed top bar across every Xzibit App.
 *
 * Per DESIGN-STANDARD v2.3 + v2.3.1 §Top Bar:
 * - Absorbs back-to-launcher anchor + app wordmark + build badge
 * - Adds Apps dropdown (dynamic data, sectioned + within-section alphabetical)
 * - Sits above the left rail (Pattern A apps) at z-index 100
 * - Page content offsets `margin-top: 44px`
 *
 * Reference impl: xzibit-apps/erp-overview SHA 6f1a5b5+
 */
export function TopBar({
  appName,
  appHomeUrl = '/',
  buildSha: _deprecatedBuildSha,
  buildTimestamp: _deprecatedBuildTimestamp,
  launcherUrl,
  appsEndpoint,
}: TopBarProps) {
  if (
    typeof console !== 'undefined' &&
    (_deprecatedBuildSha || _deprecatedBuildTimestamp)
  ) {
    // One-shot deprecation warning. Surface loudly so consumers migrate.
    // eslint-disable-next-line no-console
    console.warn(
      '[@xzibit/ui] <TopBar buildSha|buildTimestamp> props are deprecated as of v0.3.3. ' +
        'Render <BuildBadge sha={...} timestamp={...} /> in your root layout instead. ' +
        'The props are ignored and will be removed in v0.4.'
    );
  }

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '44px',
        zIndex: 100,
        background: 'var(--xz-charcoal, #252E38)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '0 1rem',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <a
        href="#main"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 'auto',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
        }}
      >
        Skip to main content
      </a>

      <BackToLauncher launcherUrl={launcherUrl} />
      <VerticalSeparator />
      <AppWordmark appName={appName} appHomeUrl={appHomeUrl} />
      <VerticalSeparator />
      <AppsDropdown endpoint={appsEndpoint} />

      {/*
        Build badge moved out of TopBar in v0.3.3 — render <BuildBadge /> in
        root layout instead. See BuildBadge component + CHANGELOG v0.3.3.
      */}
    </header>
  );
}

function VerticalSeparator() {
  return (
    <div
      aria-hidden="true"
      style={{
        width: '1px',
        height: '26px',
        background: 'rgba(255, 255, 255, 0.08)',
        flexShrink: 0,
      }}
    />
  );
}

function AppWordmark({
  appName,
  appHomeUrl,
}: {
  appName: string;
  appHomeUrl: string;
}) {
  return (
    <a
      href={appHomeUrl}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '0 1rem',
        height: '44px',
        textDecoration: 'none',
        color: '#ffffff',
        fontSize: '18px',
        fontWeight: 500,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: '4px',
          height: '4px',
          background: 'var(--xz-teal, #19B1A1)',
          borderRadius: '50%',
          display: 'inline-block',
          flexShrink: 0,
        }}
      />
      <span>{appName}</span>
    </a>
  );
}

/*
  The in-bar BuildBadge helper was removed in v0.3.3. The canonical BuildBadge
  now lives as a top-level exported component (src/BuildBadge.tsx) that renders
  a fixed-position white pill in the corner of the viewport, ALONGSIDE the
  TopBar rather than inside it. See CHANGELOG v0.3.3.
*/
