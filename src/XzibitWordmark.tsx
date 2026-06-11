export interface XzibitWordmarkProps {
  /** Height in pixels. Default 18 to fit inside the 44px TopBar. */
  size?: number;
  /** Optional className for additional styling. */
  className?: string;
  /** If provided, sets the accessible name. Omit for decorative usage (defaults to aria-hidden). */
  ariaLabel?: string;
  /**
   * Fill color for the wordmark. Default `currentColor` so the mark inherits
   * the surrounding text color. On the dark TopBar that resolves to white.
   */
  fill?: string;
}

/**
 * Canonical Xzibit wordmark, rendered as inline SVG outlines for crisp display
 * at any size and font-independence.
 *
 * v0.4.0 (2026-06-11): NEW exported component. Source: extracted from
 * `Xzibit DSES 3PMS.svg` brand pack file, preserved at `apps/standards/docs/brand/`.
 * The wordmark is rendered as vector outlines so apps do not need the Xzibit
 * brand typeface installed.
 *
 * Pair with `<XzibitMark>` to build the brand lockup. In the TopBar the lockup
 * sits as: X mark (teal) then wordmark (white) then "Apps" qualifier (light) as
 * separate text, all inside the same back-to-launcher anchor.
 *
 * Default usage is decorative (aria-hidden). Provide `ariaLabel` for cases
 * where the wordmark is the sole semantic content of an interactive element.
 */
export function XzibitWordmark({
  size = 18,
  className,
  ariaLabel,
  fill = 'currentColor',
}: XzibitWordmarkProps) {
  // viewBox is the cropped wordmark bounding box from the brand SVG (66.3 wide x 26.3 tall).
  const aspectRatio = 82 / 26.3;
  const width = size * aspectRatio;
  return (
    <svg
      width={width}
      height={size}
      viewBox="66.3 11.4 82 26.3"
      xmlns="http://www.w3.org/2000/svg"
      role={ariaLabel ? 'img' : 'presentation'}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      className={className}
      fill={fill}
    >
      <path d="M74.39,24.06l-8.07-12.32h3.19l6.75,10.38,6.71-10.38h3.08l-8.03,12.36,8.66,13.2h-3.23l-7.34-11.22-7.26,11.22h-3.04l8.58-13.24Z" />
      <path d="M100.68,21.34h-10.34v-2.53h15.41l-12.36,15.96h11.85v2.53h-16.87l12.32-15.95Z" />
      <path d="M107.25,13.9c0-1.06.88-1.83,1.83-1.83s1.83.77,1.83,1.83-.88,1.83-1.83,1.83-1.83-.77-1.83-1.83ZM107.73,18.81h2.72v18.49h-2.72v-18.49Z" />
      <path d="M112.96,11.73h2.71v9.83c.92-1.58,2.93-3.3,6.57-3.3,5.17,0,9.35,4.14,9.35,9.79s-4.18,9.79-9.35,9.79c-3.63,0-5.65-1.72-6.57-3.3v2.75h-2.71V11.73ZM122.24,35.32c3.81,0,6.64-3.12,6.64-7.26s-2.82-7.26-6.64-7.26-6.9,3.12-6.9,7.26,2.93,7.26,6.9,7.26Z" />
      <path d="M133.24,13.9c0-1.06.88-1.83,1.83-1.83s1.83.77,1.83,1.83-.88,1.83-1.83,1.83-1.83-.77-1.83-1.83ZM133.72,18.81h2.72v18.49h-2.72v-18.49Z" />
      <path d="M141.14,21.34h-2.35v-2.53h2.35v-7.08h2.71v7.08h4.11v2.53h-4.11v15.95h-2.71v-15.95Z" />
    </svg>
  );
}
