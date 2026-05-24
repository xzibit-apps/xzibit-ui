export interface XzibitMarkProps {
  /** Size in pixels (square). Default 28 to fit inside the 44px TopBar. */
  size?: number;
  /** Optional className for additional styling. */
  className?: string;
  /** If provided, sets the accessible name. Omit for decorative usage (defaults to aria-hidden). */
  ariaLabel?: string;
}

/**
 * Xzibit X brand mark, rendered as inline SVG for crisp display at any pixel density.
 *
 * Native black background — the "stamp" treatment that gives the mark visual weight
 * against the var(--xz-charcoal) TopBar background. The mark is geometric / angular,
 * approximating the architectural character of the brand asset.
 *
 * Default usage is decorative (aria-hidden). Provide `ariaLabel` for cases where
 * the mark is the sole semantic content of an interactive element.
 */
export function XzibitMark({ size = 28, className, ariaLabel }: XzibitMarkProps) {
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
    >
      <rect x={0} y={0} width={100} height={100} fill="#000000" />
      <g
        stroke="#FFFFFF"
        strokeWidth={9}
        fill="none"
        strokeLinecap="square"
        strokeLinejoin="miter"
      >
        <path d="M 22 22 L 30 22 L 30 32 L 50 50" />
        <path d="M 78 22 L 70 22 L 70 32 L 50 50" />
        <path d="M 22 78 L 30 78 L 30 68 L 50 50" />
        <path d="M 78 78 L 70 78 L 70 68 L 50 50" />
      </g>
    </svg>
  );
}
