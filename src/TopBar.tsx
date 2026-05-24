'use client';

import { BackToLauncher } from './BackToLauncher';
import { AppsDropdown } from './AppsDropdown';

export interface TopBarProps {
  /** App display name shown in the wordmark slot (e.g. "ERP Overview"). */
  appName: string;

  /** Optional click target for the app wordmark. Defaults to "/" (app home). */
  appHomeUrl?: string;

  /** Build SHA — typically `process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7)`. */
  buildSha?: string;

  /**
   * Last-updated timestamp string. Pre-format on the consumer side
   * (e.g. "22 May 2026, 5:03 pm AEST"). Brisbane time recommended per
   * portfolio convention.
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
  buildSha,
  buildTimestamp,
  launcherUrl,
  appsEndpoint,
}: TopBarProps) {
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

      <div
        style={{
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {buildSha && <BuildBadge sha={buildSha} timestamp={buildTimestamp} />}
      </div>
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

function BuildBadge({
  sha,
  timestamp,
}: {
  sha: string;
  timestamp?: string;
}) {
  return (
    <div
      aria-hidden="true"
      style={{
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: '11px',
        fontWeight: 400,
        color: 'rgba(255, 255, 255, 0.5)',
        padding: '0 1rem',
      }}
    >
      {sha}
      {timestamp && ` · Last updated ${timestamp}`}
    </div>
  );
}
