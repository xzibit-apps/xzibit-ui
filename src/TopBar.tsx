'use client';

import type { ReactNode } from 'react';
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
   * this prop is ignored. Will be removed in v0.5.
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

  /**
   * Optional right-aligned slot content (v0.4.0+). Typically used to pair
   * `<BuildBadge>` and `<FeedbackButton>` inside a fragment so both sit on
   * the right side of the bar with consistent spacing:
   *
   * ```tsx
   * rightSlot={
   *   <>
   *     <BuildBadge sha={BUILD_SHA} timestamp={BUILD_TIME} />
   *     <FeedbackButton onClick={() => setOpen(true)} />
   *   </>
   * }
   * ```
   *
   * The slot wrapper is a flex row with 8px gap, so multiple children space
   * cleanly without consumer-side margins. Accepts any ReactNode.
   */
  rightSlot?: ReactNode;
}

/**
 * Universal 44px fixed top bar across every Xzibit App.
 *
 * v0.4.0 (2026-06-11) visual amendment, API unchanged except optional `rightSlot`:
 * - Background corrected to brand Pantone 433 C (#1D252D). The old #252E38 was drift.
 * - The BackToLauncher anchor now renders the brand lockup: grid icon, X mark
 *   teal, Xzibit wordmark white, "Apps" qualifier. No chevron.
 * - App identity dot is 6px brand teal. App name is 15px / 500 / white.
 * - Apps dropdown trigger label is unchanged ("Apps").
 * - Optional `rightSlot` lets apps mount a FeedbackButton or other right-aligned
 *   content at the right edge of the bar's content area, with a 200px right
 *   padding reserved for the BuildBadge corner overlay.
 *
 * Per DESIGN-STANDARD v2.6 §Top Bar + §Build Badge.
 *
 * Reference impl: xzibit-apps/launcher root layout SHA TBD post v0.4.0 adoption.
 */
export function TopBar({
  appName,
  appHomeUrl = '/',
  buildSha: _deprecatedBuildSha,
  buildTimestamp: _deprecatedBuildTimestamp,
  launcherUrl,
  appsEndpoint,
  rightSlot,
}: TopBarProps) {
  if (
    typeof console !== 'undefined' &&
    (_deprecatedBuildSha || _deprecatedBuildTimestamp)
  ) {
    // eslint-disable-next-line no-console
    console.warn(
      '[@xzibit/ui] <TopBar buildSha|buildTimestamp> props were deprecated in v0.3.3. ' +
        'Render <BuildBadge sha={...} timestamp={...} /> in your root layout instead. ' +
        'The props are ignored and will be removed in v0.5.'
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
        background: 'var(--xz-charcoal, #1D252D)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        // v0.5.0 returns to symmetric padding. BuildBadge is no longer a
        // corner overlay; it sits inline inside rightSlot alongside FeedbackButton,
        // so the fixed right-reservation that v0.4.1 added is no longer needed.
        padding: '0 0.875rem',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
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

      {rightSlot && (
        <>
          <div style={{ flex: 1 }} />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexShrink: 0,
            }}
          >
            {rightSlot}
          </div>
        </>
      )}
    </header>
  );
}

function VerticalSeparator() {
  return (
    <div
      aria-hidden="true"
      style={{
        width: '1px',
        height: '18px',
        background: 'rgba(255, 255, 255, 0.16)',
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
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '0 0.5rem',
        height: '32px',
        textDecoration: 'none',
        color: '#ffffff',
        fontSize: '15px',
        fontWeight: 500,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: '6px',
          height: '6px',
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
