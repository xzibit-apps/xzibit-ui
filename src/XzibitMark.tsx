export interface XzibitMarkProps {
  /** Size in pixels (height). Default 22 to fit inside the 44px TopBar. */
  size?: number;
  /** Optional className for additional styling. */
  className?: string;
  /** If provided, sets the accessible name. Omit for decorative usage (defaults to aria-hidden). */
  ariaLabel?: string;
  /**
   * Fill color for the mark. Default `#19B1A1` (Pantone 3262 CP brand teal). The mark
   * is teal in the canonical brand sheet regardless of the surrounding context.
   * Override only when an alternate brand approval is in place.
   */
  fill?: string;
}

/**
 * Canonical Xzibit X brand mark, rendered as inline SVG for crisp display at any size.
 *
 * v0.4.0 (2026-06-11): replaced the v0.3.2 contour-traced approximation with the
 * official brand vector path data. Source: `Xzibit X RGB.svg` from the brand pack,
 * preserved at `apps/standards/docs/brand/`. The mark fills teal (#19B1A1, Pantone
 * 3262 CP) by default per the Xzibit Brand Colours sheet.
 *
 * The mark is asymmetric across the X axis — the right half is offset from the left
 * half by a small gap at the centre crossing, and each arm has stepped/notched outer
 * terminations rather than flat or rounded caps. These are the brand-defining details
 * the previous traced approximation could not reproduce.
 *
 * Default usage is decorative (aria-hidden). Provide `ariaLabel` for cases where
 * the mark is the sole semantic content of an interactive element.
 */
export function XzibitMark({
  size = 22,
  className,
  ariaLabel,
  fill = '#19B1A1',
}: XzibitMarkProps) {
  // viewBox preserves the brand SVG aspect ratio (54.57 wide, 49.03 tall).
  const aspectRatio = 54.57 / 49.03;
  const width = size * aspectRatio;
  return (
    <svg
      width={width}
      height={size}
      viewBox="0 0 54.57 49.03"
      xmlns="http://www.w3.org/2000/svg"
      role={ariaLabel ? 'img' : 'presentation'}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      className={className}
      fill={fill}
    >
      <path d="M52.88,49.03h-12.89c-.5,0-.97-.22-1.29-.6l-12.71-15.14c-.53-.63-.53-1.54,0-2.17L49.26,3.38h-8.48l-5.84,6.96c-.22.26-.63.26-.84,0l-1.47-1.81c-.17-.2-.16-.5,0-.7l6.06-7.22c.32-.38.8-.6,1.29-.6h12.89c.66,0,1.25.38,1.53.98.28.59.18,1.3-.24,1.8l-24.68,29.42,11.29,13.45h8.48l-10.71-12.77c-.17-.21-.17-.51,0-.71l1.53-1.73c.22-.25.61-.25.83.01l13.26,15.81c.42.5.51,1.2.24,1.8-.28.6-.87.98-1.53.98Z" />
      <path d="M14.58,49.03H1.69c-.66,0-1.25-.38-1.53-.98-.28-.59-.18-1.3.24-1.8l24.68-29.42L13.79,3.38H5.31l10.82,12.89c.17.21.17.51,0,.71l-1.52,1.75c-.22.25-.62.25-.83,0L.39,2.78C-.03,2.27-.12,1.57.16.98c.28-.6.87-.98,1.53-.98h12.89c.5,0,.97.22,1.29.6l12.71,15.14c.53.63.53,1.54,0,2.17L5.31,45.65h8.48l5.86-6.98c.22-.26.61-.26.83,0l1.53,1.74c.18.2.18.51,0,.71l-6.14,7.32c-.32.38-.8.6-1.29.6Z" />
    </svg>
  );
}
