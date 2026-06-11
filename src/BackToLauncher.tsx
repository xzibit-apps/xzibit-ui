'use client';

import { useState } from 'react';
import { XzibitMark } from './XzibitMark';
import { XzibitWordmark } from './XzibitWordmark';

export interface BackToLauncherProps {
  /** Launcher URL — defaults to the production Xzibit Apps launcher. */
  launcherUrl?: string;
}

const DEFAULT_LAUNCHER_URL = 'https://xzibit-apps.vercel.app';

/**
 * Back-to-launcher anchor for the TopBar's left cluster.
 *
 * v0.4.0 (2026-06-11) visual amendment, no API change:
 * - Renders `[grid icon] [X mark teal] [Xzibit wordmark white] [Apps qualifier]`
 *   inside a single `<a>` element so the whole cluster is one click target with
 *   one navigation destination (the launcher).
 * - The leading chevron-left icon from v0.3.x is removed. The grid icon takes
 *   its place as the "all apps" affordance.
 * - The "Xzibit Apps" text element is replaced with the canonical Xzibit
 *   wordmark SVG outlines (white) followed by a small "Apps" qualifier (light
 *   weight, light tint).
 * - Cross-deployment navigation, uses native anchor not Next.js Link.
 *
 * Per DESIGN-STANDARD v2.6 §Top Bar:
 * - Grid icon 18px at 82% white (full white on hover)
 * - X mark height 22, teal #19B1A1 (Pantone 3262 CP brand teal)
 * - Wordmark height 18, white via currentColor
 * - "Apps" qualifier 13px, 74% white, light weight
 */
export function BackToLauncher({
  launcherUrl = DEFAULT_LAUNCHER_URL,
}: BackToLauncherProps) {
  const [hover, setHover] = useState(false);

  const iconColor = hover ? '#ffffff' : 'rgba(255, 255, 255, 0.82)';
  const wordmarkColor = hover ? '#ffffff' : 'rgba(255, 255, 255, 0.95)';
  const qualifierColor = hover ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.74)';
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
      <XzibitWordmark size={18} fill={wordmarkColor} />
      <span
        style={{
          fontSize: '13px',
          fontWeight: 400,
          color: qualifierColor,
          letterSpacing: '0.01em',
        }}
      >
        Apps
      </span>
    </a>
  );
}
