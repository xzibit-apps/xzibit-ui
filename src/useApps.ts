import { useState, useEffect, useCallback } from 'react';
import { normalizeApp } from './types';
import type { App, AppsResponse } from './types';

export interface UseAppsResult {
  apps: App[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseAppsOptions {
  /** Override the endpoint URL. Default: '/api/me/apps' (same-origin per-app endpoint). */
  endpoint?: string;
  /** If true, defer the initial fetch until refetch() is called explicitly. Default false (fetch on mount). */
  lazy?: boolean;
}

/**
 * Fetch the list of Xzibit Apps the current user has access to.
 *
 * Each consuming app exposes its own `/api/me/apps` endpoint (same-origin)
 * that queries shared `public.apps` + `public.role_app_permissions` and
 * returns the filtered list. This hook wraps the fetch with loading + error
 * state and an exposed `refetch()`.
 *
 * Per DESIGN-STANDARD v2.3 §Top Bar — the dropdown MUST be dynamic for
 * production (no hardcoded lists). Adding a new portfolio app then becomes
 * one INSERT in `public.apps` + role grants — zero per-app code changes.
 */
export function useApps(options: UseAppsOptions = {}): UseAppsResult {
  const { endpoint = '/api/me/apps', lazy = false } = options;
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchApps = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(endpoint, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) {
        throw new Error(`Failed to load apps (HTTP ${res.status})`);
      }
      const data: AppsResponse = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      // Normalize raw API rows to the canonical App shape at the fetch boundary.
      // Accepts both canonical field names (url, section, section_order) and Supabase
      // raw column names (app_url, display_section, display_order) — see RawApp type.
      // Added in v0.1.1 (2026-05-24) after ERP Overview migration surfaced the contract mismatch.
      setApps((data.apps ?? []).map(normalizeApp));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[@xzibit/ui useApps] fetch failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setApps([]);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    if (!lazy) {
      fetchApps();
    }
  }, [fetchApps, lazy]);

  return { apps, loading, error, refetch: fetchApps };
}
