import type { CSSProperties, ReactNode } from 'react';

/**
 * Content density tier per DESIGN-STANDARD v2.4 §Content Density Tiers.
 *
 * - `'editorial'`: 720px max-width — marketing / public-facing docs / long-form prose
 * - `'reference'` (DEFAULT): 1200px max-width — internal docs / wikis / dashboards / most app pages
 * - `'data'`: unconstrained with 32px min side padding — wide tables / kanban / calendars / heatmaps
 */
export type ContentTier = 'editorial' | 'reference' | 'data';

export interface ContentContainerProps {
  /**
   * Content density tier — picks max-width + padding.
   * Defaults to `'reference'` (the portfolio default per v2.4).
   */
  tier?: ContentTier;

  /**
   * If `true`, render no padding — useful when the parent app shell already
   * provides layout-level padding (e.g. left-nav offset).
   *
   * Default: `false` (tier padding is applied).
   *
   * **Common use case:** app-shell `layout.tsx` integration where the surrounding
   * layout div sets `padding: '2.5rem 2.5rem 2.5rem 280px'` for left-nav offset.
   * Without `disablePadding`, the container's `3rem 2rem` stacks with the shell
   * padding and reduces effective content width (e.g. 1200px ContentContainer
   * minus 64px container padding minus 320px shell padding ≈ 816px actual).
   *
   * Added in v0.3.0 (2026-05-24) after ERP Overview Phase 1.13 surfaced the
   * left-nav stacking conflict.
   */
  disablePadding?: boolean;

  /** Optional className for additional styling. */
  className?: string;

  /** Children to render inside the container. */
  children: ReactNode;
}

const TIER_MAX_WIDTH: Record<ContentTier, number | string> = {
  editorial: 720,
  reference: 1200,
  data: '100%',
};

const TIER_PADDING: Record<ContentTier, string> = {
  editorial: '3rem 2rem',
  reference: '3rem 2rem',
  data: '1.5rem 2rem',
};

/**
 * Content container that applies the right max-width + padding for its content
 * density tier per DESIGN-STANDARD v2.4 §Content Density Tiers.
 *
 * Per the spec:
 * - Component override > page override > app default (most-specific wins)
 * - Cards INHERIT the parent container's max-width — they do NOT set their own
 *
 * Typical app usage in `src/app/layout.tsx`:
 *
 * ```tsx
 * <main id="main" style={{ marginTop: 44 }}>
 *   <ContentContainer>{children}</ContentContainer>
 * </main>
 * ```
 *
 * Per-page override (rare):
 *
 * ```tsx
 * // A wide-table page within an otherwise-reference app
 * <ContentContainer tier="data">
 *   <DataTable ... />
 * </ContentContainer>
 * ```
 */
export function ContentContainer({
  tier = 'reference',
  disablePadding = false,
  className,
  children,
}: ContentContainerProps) {
  const style: CSSProperties = {
    maxWidth: TIER_MAX_WIDTH[tier],
    margin: '0 auto',
    ...(disablePadding ? {} : { padding: TIER_PADDING[tier] }),
  };
  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}
