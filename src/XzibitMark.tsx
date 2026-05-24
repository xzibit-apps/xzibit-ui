export interface XzibitMarkProps {
  /** Size in pixels (square). Default 28 to fit inside the 44px TopBar. */
  size?: number;
  /** Optional className for additional styling. */
  className?: string;
  /** If provided, sets the accessible name. Omit for decorative usage (defaults to aria-hidden). */
  ariaLabel?: string;
  /**
   * Fill color for the mark strokes. Default `currentColor` so the mark inherits
   * the surrounding text color (useful inside the dark TopBar where text is white).
   * Override for explicit colour control.
   */
  fill?: string;
}

/**
 * Canonical Xzibit X brand mark, rendered as inline SVG for crisp display at any size.
 *
 * The mark is two mirrored stylised "chevron" shapes — left half and right half —
 * crossing in the middle to form an X with a small central void. Each half has
 * stepped/notched outer terminations rather than flat or rounded caps, which is
 * the brand-defining detail.
 *
 * Paths are extracted from the canonical raster at
 * `_source-materials/xzibit-ui-draft/brand/xzibit-mark.png` (591×591) via
 * scikit-image `find_contours` + `approximate_polygon(tolerance=2.5)`, normalised
 * to a viewBox of `0 0 100 100`. The two polygon paths are filled (not stroked),
 * so scaling preserves the original proportions and stepped corners exactly.
 *
 * v0.3.2 (2026-05-24): replaced the v0.1.0–v0.3.1 hand-drawn approximation
 * (4 straight strokes meeting at centre) with the canonical brand geometry.
 *
 * Default usage is decorative (aria-hidden). Provide `ariaLabel` for cases
 * where the mark is the sole semantic content of an interactive element.
 */
export function XzibitMark({
  size = 28,
  className,
  ariaLabel,
  fill = 'currentColor',
}: XzibitMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      role={ariaLabel ? 'img' : 'presentation'}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      className={className}
      fill={fill}
    >
      {/* Left half */}
      <path d="M 36.38 76.90 L 21.32 76.90 L 20.22 76.14 L 19.88 74.79 L 47.46 41.46 L 35.03 26.65 L 26.06 26.65 L 37.82 40.95 L 36.80 42.81 L 35.19 43.74 L 20.56 26.40 L 19.88 24.70 L 21.15 23.10 L 37.06 23.27 L 51.86 41.29 L 51.52 42.64 L 25.97 72.93 L 35.03 73.18 L 41.03 65.99 L 42.47 65.40 L 44.25 68.19 Z" />
      {/* Right half */}
      <path d="M 78.51 76.90 L 62.77 76.57 L 48.14 59.05 L 48.31 57.36 L 73.86 26.90 L 64.97 26.65 L 57.70 34.60 L 55.75 31.64 L 63.11 23.10 L 78.85 23.10 L 79.95 25.21 L 52.37 58.38 L 64.81 73.18 L 73.77 73.18 L 62.18 59.05 L 63.54 56.85 L 64.81 56.26 L 79.78 74.11 L 79.95 75.47 Z" />
    </svg>
  );
}
