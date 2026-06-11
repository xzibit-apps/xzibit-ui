'use client';

import { useState } from 'react';
import { XzibitMark } from './XzibitMark';

export interface BackToLauncherProps {
  /** Launcher URL — defaults to the production Xzibit Apps launcher. */
  launcherUrl?: string;
}

const DEFAULT_LAUNCHER_URL = 'https://xzibit-apps.vercel.app';

/**
 * Back-to-launcher anchor for the TopBar's left cluster.
 *
 * v0.4.1 (2026-06-11) visual amendment, no API change:
 * - Renders `[grid icon] [X mark teal] [Apps text]` inside a single `<a>` element
 *   so the whole cluster is one click target with one navigation destination
 *   (the launcher).
 * - The Xzibit wordmark SVG that v0.4.0 introduced between the X mark and the
 *   qualifier is removed. The brand X carries the Xzibit identity, "Apps" is
 *   the qualifier text.
 * - "Apps" promoted from 13px / 400 / 74% white to 15px / 500 / full white so
 *   it carries the lockup's weight now that the wordmark is gone.
 * - The chevron-left from v0.3.x is still gone (removed in v0.4.0).
 * - Cross-deployment navigation. Uses native anchor, NOT Next.js Link.
 *
 * `<XzibitWordmark>` remains exported from the package as a standalone primitive
 * for other use cases (marketing pages, the standards site landing, etc.).
 *
 * Per DESIGN-STANDARD v2.6 §Top Bar.
 */
export function BackToLauncher({
  launcherUrl = DEFAULT_LAUNCHER_URL,
}: BackToLauncherProps) {
  const [hover, setHover] = useState(false);

  const iconColor = hover ? '#ffffff' : 'rgba(255, 255, 255, 0.82)';
  const qualifierColor = hover ? '#ffffff' : 'rgba(255, 255, 255, 0.95)';
  const bgColor = hover ? 'rgba(255, 255, 255, 0.07)' : 'transparent';

  return (
    <a
      href={launcherUrl}
      aria-label="Back to Xzibit Apps launcher"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '0 0.75rem',
        height: '44px',
        background: bgColor,
        textDecoration: 'none',
        borderRadius: 6,
        transition: 'background 120ms, color 120ms',
      }}
    >
      <svg
        width={18}
        height={18}
        viewBox="0 0 24 24"
        fill="none"
        stroke={iconColor}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="4" y="4" width="6" height="6" rx="1" />
        <rect x="14" y="4" width="6" height="6" rx="1" />
        <rect x="4" y="14" width="6" height="6" rx="1" />
        <rect x="14" y="14" width="6" height="6" rx="1" />
      </svg>
      <XzibitMark size={22} />
      <span
        style={{
          fontSize: '15px',
          fontWeight: 500,
          color: qualifierColor,
          letterSpacing: '0.01em',
        }}
      >
        Apps
      </span>
    </a>
  );
}
