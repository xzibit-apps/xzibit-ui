import React, { useState } from 'react';
import { XzibitMark } from './XzibitMark';

export interface BackToLauncherProps {
  /** Launcher URL — defaults to the production Xzibit Apps launcher. */
  launcherUrl?: string;
}

const DEFAULT_LAUNCHER_URL = 'https://xzibit-apps.vercel.app';

/**
 * Back-to-launcher anchor for the TopBar's left cluster.
 *
 * Renders `[chevron-left] [Xzibit X logo] [Xzibit Apps text]` inside a single
 * `<a>` element so the whole cluster is one click target with one navigation
 * destination. Cross-deployment navigation — uses native anchor, NOT Next.js
 * Link (cross-domain).
 *
 * Per DESIGN-STANDARD v2.3.1:
 * - Text "Xzibit Apps" at 15px / 500 / 85% white (full white on hover)
 * - Chevron 12×12 at 70% white (full white on hover)
 * - X logo 28×28 unchanged on hover (stays native white-on-black stamp)
 */
export function BackToLauncher({
  launcherUrl = DEFAULT_LAUNCHER_URL,
}: BackToLauncherProps) {
  const [hover, setHover] = useState(false);

  const chevronColor = hover ? '#ffffff' : 'rgba(255, 255, 255, 0.7)';
  const textColor = hover ? '#ffffff' : 'rgba(255, 255, 255, 0.85)';
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
        gap: '8px',
        padding: '0 1rem',
        height: '44px',
        fontSize: '15px',
        fontWeight: 500,
        color: textColor,
        background: bgColor,
        textDecoration: 'none',
        transition: 'background 120ms, color 120ms',
      }}
    >
      <svg
        width={12}
        height={12}
        viewBox="0 0 12 12"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M 8 2 L 3 6 L 8 10"
          stroke={chevronColor}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <XzibitMark size={28} />
      <span>Xzibit Apps</span>
    </a>
  );
}
