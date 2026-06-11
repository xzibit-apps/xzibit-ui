'use client';

import { useState } from 'react';

export interface FeedbackButtonProps {
  /** Click handler. Typically opens the in-app feedback modal per ADR f26c4824. */
  onClick: () => void;

  /** Button label. Defaults to "Feedback". */
  label?: string;

  /** Optional className for additional styling. */
  className?: string;
}

/**
 * Feedback pill for the TopBar's right slot.
 *
 * v0.4.0 (2026-06-11): NEW exported component per DESIGN-STANDARD v2.6 §Top Bar.
 *
 * Visual:
 * - Teal fill (#19B1A1, Pantone 3262 CP brand teal)
 * - Dark text (#1D252D, brand Pantone 433 C). White on teal fails WCAG AA at
 *   2.7:1 contrast; dark on teal passes at 5.8:1.
 * - Message icon (inline SVG), label "Feedback"
 * - 28px tall, full pill radius, 12px horizontal padding
 * - Subtle background brighten on hover
 *
 * Render via the TopBar's `rightSlot` prop:
 *
 * ```tsx
 * <TopBar
 *   appName="ERP Overview"
 *   rightSlot={<FeedbackButton onClick={() => setFeedbackOpen(true)} />}
 * />
 * ```
 *
 * Pair with a `<FeedbackPanel>` modal (queued for v0.4.x) per the in-app
 * feedback widget ADR f26c4824. The modal handles the form, the screenshot
 * capture, and the submission. This component is just the trigger.
 */
export function FeedbackButton({
  onClick,
  label = 'Feedback',
  className,
}: FeedbackButtonProps) {
  const [hover, setHover] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      aria-label={label}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        height: 28,
        padding: '0 12px',
        background: hover ? '#1FC2B1' : 'var(--xz-teal, #19B1A1)',
        color: 'var(--xz-charcoal, #1D252D)',
        border: 'none',
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 500,
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'background 120ms',
        flexShrink: 0,
      }}
    >
      <svg
        width={14}
        height={14}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
      <span>{label}</span>
    </button>
  );
}
