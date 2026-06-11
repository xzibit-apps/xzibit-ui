export interface BuildBadgeProps {
  /** Build SHA — typically `process.env.NEXT_PUBLIC_BUILD_SHA?.slice(0, 7)`. Required. */
  sha: string;

  /**
   * Build timestamp — pre-formatted on the consumer side OR raw ISO string.
   * If an ISO string is passed, the badge formats it in Brisbane time (`en-AU`,
   * `Australia/Brisbane`, 12-hour). If a non-ISO string is passed, it renders as-is.
   * Recommended: pass the ISO from `process.env.NEXT_PUBLIC_BUILD_TIME` and let
   * the badge format consistently.
   */
  timestamp?: string;

  /**
   * Position corner. Default `'top-right'`. The badge is fixed-positioned and
   * z-index 9999 so it sits above app chrome (including the TopBar).
   */
  position?: 'top-right' | 'top-left';
}

const ISO_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

function formatTimestamp(input: string): string {
  if (!ISO_REGEX.test(input)) return input;
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  return (
    d.toLocaleString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Australia/Brisbane',
    }) + ' AEST'
  );
}

/**
 * Canonical build provenance badge. Small off-white pill in the corner of the
 * viewport, fixed-positioned, displaying SHA and last-updated timestamp.
 *
 * Per DESIGN-STANDARD v2.6 §Build Badge:
 * - Off-white background (#F4F4F2, a UI utility shade)
 * - Soft subtle shadow so the bubble lifts off the dark TopBar
 * - Monospace SHA in brand dark #1D252D
 * - Separator middot in border colour, then "Last updated {timestamp}" in muted grey
 * - Bottom-left corner radius 6px, looks like a tab attached to the corner
 * - Fixed top-right (default), z-index 9999, above the TopBar's 100
 * - Brisbane time formatting if a raw ISO string is passed
 *
 * Render in your root layout, alongside (not inside) `<TopBar />`. Pattern:
 *
 * ```tsx
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <TopBar appName="ERP Overview" />
 *         <BuildBadge
 *           sha={process.env.NEXT_PUBLIC_BUILD_SHA ?? 'local'}
 *           timestamp={process.env.NEXT_PUBLIC_BUILD_TIME ?? new Date().toISOString()}
 *         />
 *         <main style={{ marginTop: 44 }}>{children}</main>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 *
 * The deprecated `buildSha` / `buildTimestamp` props on `<TopBar />` are ignored
 * as of v0.3.3 and will be removed in v0.5. See CHANGELOG.
 */
export function BuildBadge({
  sha,
  timestamp,
  position = 'top-right',
}: BuildBadgeProps) {
  const formatted = timestamp ? formatTimestamp(timestamp) : undefined;
  const isLeft = position === 'top-left';

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        right: isLeft ? undefined : 0,
        left: isLeft ? 0 : undefined,
        zIndex: 9999,
        background: 'var(--xz-off-white, #F4F4F2)',
        borderBottom: '1px solid var(--border, #E2E4E5)',
        borderLeft: isLeft ? 'none' : '1px solid var(--border, #E2E4E5)',
        borderRight: isLeft ? '1px solid var(--border, #E2E4E5)' : 'none',
        borderBottomLeftRadius: isLeft ? 0 : 6,
        borderBottomRightRadius: isLeft ? 6 : 0,
        padding: '0.25rem 0.625rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        fontSize: '0.6875rem',
        color: 'var(--muted-foreground, #888A8B)',
        fontFamily: 'inherit',
        lineHeight: 1,
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
      }}
    >
      <span
        style={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          letterSpacing: '0.02em',
          color: 'var(--foreground, #1D252D)',
        }}
      >
        {sha}
      </span>
      {formatted && (
        <>
          <span style={{ color: 'var(--border, #E2E4E5)' }}>·</span>
          <span>Last updated {formatted}</span>
        </>
      )}
    </div>
  );
}
