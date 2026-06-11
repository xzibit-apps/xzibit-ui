export interface BuildBadgeProps {
  /** Build SHA — typically `process.env.NEXT_PUBLIC_BUILD_SHA?.slice(0, 7)`. Required. */
  sha: string;

  /**
   * Build timestamp — pre-formatted on the consumer side OR raw ISO string.
   * If an ISO string is passed, the badge renders a condensed Brisbane time
   * format ("11 June 3:25 pm") on the second line. The native `title` tooltip
   * carries the full long form ("11 June 2026, 3:25 pm AEST") for hover.
   */
  timestamp?: string;
}

const ISO_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

function formatCondensed(input: string): string {
  if (!ISO_REGEX.test(input)) return input;
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  const datePart = d.toLocaleString('en-AU', {
    day: 'numeric',
    month: 'long',
    timeZone: 'Australia/Brisbane',
  });
  const timePart = d.toLocaleString('en-AU', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Australia/Brisbane',
  });
  return `${datePart} ${timePart}`;
}

function formatLong(input: string): string {
  if (!ISO_REGEX.test(input)) return input;
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  return (
    d.toLocaleString('en-AU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Australia/Brisbane',
    }) + ' AEST'
  );
}

/**
 * Canonical build provenance badge. Inline rounded-rectangle pill that pairs
 * with `<FeedbackButton>` on the right side of the TopBar.
 *
 * Per DESIGN-STANDARD v2.6.2 §Build Badge (2026-06-11 revision):
 * - Off-white background `#F4F4F2`, 1px `var(--border)` outline, 8px corner
 *   radius to match the FeedbackButton shape.
 * - 32px tall to pair visually with FeedbackButton at the same height.
 * - Two centred lines: SHA in 11px monospace / 500 / brand dark on top,
 *   condensed Brisbane time in 10px / muted underneath.
 * - Native `title` attribute carries the long form for hover, so power users
 *   still get the full year + AEST timestamp without cluttering the UI.
 *
 * v0.5.0 (2026-06-11) replaces the v0.3.3 fixed-corner overlay model with an
 * inline component. The `position` prop is gone. Apps compose the badge and
 * the feedback button together inside `<TopBar rightSlot={...}>`:
 *
 * ```tsx
 * <TopBar
 *   appName="ERP Overview"
 *   rightSlot={
 *     <>
 *       <BuildBadge sha={BUILD_SHA} timestamp={BUILD_TIME} />
 *       <FeedbackButton onClick={() => setOpen(true)} />
 *     </>
 *   }
 * />
 * ```
 *
 * The TopBar's rightSlot wrapper applies a small gap between siblings, so the
 * two pills sit neatly adjacent without consumer-side spacing concerns.
 */
export function BuildBadge({ sha, timestamp }: BuildBadgeProps) {
  const condensed = timestamp ? formatCondensed(timestamp) : undefined;
  const long = timestamp ? formatLong(timestamp) : undefined;
  const tooltip = long ? `Build ${sha}, updated ${long}` : `Build ${sha}`;

  return (
    <div
      aria-label={tooltip}
      title={tooltip}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: 32,
        padding: '0 14px',
        background: 'var(--xz-off-white, #F4F4F2)',
        border: '1px solid var(--border, #E2E4E5)',
        borderRadius: 8,
        color: 'var(--foreground, #1D252D)',
        flexShrink: 0,
        lineHeight: 1.1,
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        cursor: 'help',
        fontFamily: 'inherit',
      }}
    >
      <span
        style={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.02em',
        }}
      >
        {sha}
      </span>
      {condensed && (
        <span
          style={{
            fontSize: 10,
            color: 'var(--muted-foreground, #888A8B)',
            marginTop: 1,
            whiteSpace: 'nowrap',
          }}
        >
          {condensed}
        </span>
      )}
    </div>
  );
}
