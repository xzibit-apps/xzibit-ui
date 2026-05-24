/**
 * Shared types for @xzibit/ui.
 */

/**
 * Canonical app shape consumed by `@xzibit/ui` components.
 *
 * This is what `useApps` returns after normalization. App authors writing
 * NEW `/api/me/apps` endpoints SHOULD return this shape directly. Apps with
 * existing endpoints that return raw Supabase column names (see `RawApp` below)
 * are also accepted — `useApps` normalizes at the fetch boundary.
 */
export interface App {
  /** Display name, e.g. "Capacity Planner". */
  name: string;

  /** Full URL including protocol, e.g. "https://xzibit-capacity-planner.vercel.app". */
  url: string;

  /** Optional one-line description rendered as secondary text in the dropdown. */
  description?: string;

  /** Section grouping label, e.g. "Strategic", "Calculators". Null = no section. */
  section?: string | null;

  /** Sort order for the section itself (matches launcher curation). */
  section_order?: number;
}

/**
 * Raw shape accepted from `/api/me/apps` endpoints.
 *
 * Supports two field-naming conventions:
 * - **Canonical** (recommended for new endpoints): `url`, `section`, `section_order`
 * - **Supabase column-name passthrough** (for endpoints that return raw query rows):
 *   `app_url`, `display_section`, `display_order`
 *
 * `useApps` normalizes to the canonical `App` shape via `normalizeApp()` at the
 * fetch boundary — components downstream only see the canonical shape.
 *
 * Added in v0.1.1 (2026-05-24) after ERP Overview migration surfaced the contract
 * mismatch with raw Supabase column names.
 */
export interface RawApp {
  name: string;
  url?: string;
  app_url?: string;
  description?: string;
  section?: string | null;
  display_section?: string | null;
  section_order?: number;
  display_order?: number;
}

/**
 * Response shape from `/api/me/apps`.
 *
 * Per CODING-STANDARDS §6.4 — successful responses are wrapped in a `data`
 * or domain-specific key (in this case `apps`). The `apps` array contains
 * `RawApp` items; `useApps` normalizes them to `App`.
 */
export interface AppsResponse {
  apps?: RawApp[];
  error?: string;
}

/**
 * Internal helper — normalizes a `RawApp` to the canonical `App` shape.
 * Used by `useApps` at the fetch boundary; not typically called by consumers.
 */
export function normalizeApp(raw: RawApp): App {
  return {
    name: raw.name,
    url: raw.url ?? raw.app_url ?? '',
    description: raw.description,
    section: raw.section ?? raw.display_section ?? null,
    section_order: raw.section_order ?? raw.display_order,
  };
}
