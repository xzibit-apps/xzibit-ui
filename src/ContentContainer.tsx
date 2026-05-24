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

  /** Optional className for additional styling. */
  className?: string;

  /** Children to render inside the container. */
  children: ReactNode;
}

const TIER_STYLES: Record<ContentTier, CSSProperties> = {
  editorial: { maxWidth: 720, margin: '0 auto', padding: '3rem 2rem' },
  reference: { maxWidth: 1200, margin: '0 auto', padding: '3rem 2rem' },
  data: { maxWidth: '100%', margin: '0 auto', padding: '1.5rem 2rem' },
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
  className,
  children,
}: ContentContainerProps) {
  return (
    <div className={className} style={TIER_STYLES[tier]}>
      {children}
    </div>
  );
}
