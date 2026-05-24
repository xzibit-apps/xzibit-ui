/**
 * Shared types for @xzibit/ui.
 */

/**
 * An app in the Xzibit Apps portfolio.
 *
 * Shape matches the response from each app's `/api/me/apps` endpoint,
 * which queries `public.apps` JOIN `public.role_app_permissions` and returns
 * the apps the authenticated user has access to per their role.
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
 * Response shape from `/api/me/apps`.
 *
 * Per CODING-STANDARDS §6.4 — successful responses are wrapped in a `data`
 * or domain-specific key (in this case `apps`).
 */
export interface AppsResponse {
  apps?: App[];
  error?: string;
}
