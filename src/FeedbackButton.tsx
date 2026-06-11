'use client';

import { useEffect, useRef, useState } from 'react';
import { FeedbackPanel, type FeedbackPayload, type FeedbackType } from './FeedbackPanel';
import { installDiagnostics, collectClientDiagnostics, type ClientDiagnostics } from './diagnostics';

export interface FeedbackButtonProps {
  /**
   * Endpoint the feedback POSTs to (absolute, e.g. the launcher's
   * `https://xzibit-apps.vercel.app/api/feedback`, or same-origin). The body is
   * the FeedbackPayload plus a `client_diagnostics` snapshot. Default '/api/feedback'.
   */
  submitUrl?: string;

  /**
   * Optional AI completeness-check endpoint. When set, Send runs a one-time check
   * and may surface up to two quick questions before submitting. Omit to disable
   * the clarifier entirely. Failures/timeouts never block the submit.
   */
  clarifyUrl?: string;

  /** App display name for the context line + payload `app` (e.g. "ERP Overview"). */
  appName: string;

  /** Optional signed-in user's email (shown in the context line, sent in the body). */
  userEmail?: string;

  /** Optional build SHA (shown in the context line, sent in the body). */
  buildSha?: string;

  /** fetch credentials mode. Defaults to 'include' so cookies travel cross-origin. */
  credentials?: RequestCredentials;

  /** Button label. Defaults to "Feedback". */
  label?: string;

  /** Optional className passthrough. */
  className?: string;

  /** Disable the trigger (e.g. while the host's auth is still loading). */
  disabled?: boolean;

  /**
   * Optional callback after each submit attempt — wire it to your toast system.
   * The panel already shows inline success/error, so this is purely additive.
   */
  onResult?: (result: { ok: boolean; error?: string }) => void;
}

// A short, trimmed diagnostics view for the clarify check (NOT the full blob):
// route + recent error messages + last failed request.
function summariseForClarify(diag: ClientDiagnostics, route: string): string {
  const errs = (diag.errors ?? []).slice(-5).map((e) => `- [${e.kind ?? 'error'}] ${e.message ?? ''}`).join('\n') || '- none';
  const lr = diag.lastFailedRequest;
  const req = lr ? `${lr.method ?? ''} ${lr.url ?? ''} → ${lr.status ?? ''}` : 'none';
  return `Route: ${route}\nRecent client errors:\n${errs}\nLast failed request: ${req}`;
}

/**
 * FeedbackButton — the packaged feedback entry point for the TopBar's right slot.
 *
 * v0.6.0 (2026-06-11): self-contained orchestrator. The teal pill (unchanged 0.5.0
 * visuals) now owns the whole flow internally — installs the diagnostics collector
 * on mount, captures + lets the user annotate a screenshot on open, runs the
 * optional AI clarifier on Send, and POSTs {payload, client_diagnostics} to
 * `submitUrl`. No app glue required beyond the props.
 *
 * Decoupled from any host framework: plain `fetch` (no auth client), internal
 * success/error state (no toast dependency), `window.location.pathname` for route
 * (no router dependency), `appName` via prop.
 *
 * Visual (unchanged from v0.5.0, per DESIGN-STANDARD v2.6.2 §Top Bar):
 * - Teal fill (#19B1A1, brand teal); dark text (#1D252D). White on teal fails
 *   WCAG AA at 2.7:1; dark on teal passes at 5.8:1.
 *
 * ```tsx
 * <TopBar
 *   appName="ERP Overview"
 *   rightSlot={
 *     <>
 *       <BuildBadge sha={BUILD_SHA} timestamp={BUILD_TIME} />
 *       <FeedbackButton
 *         appName="ERP Overview"
 *         submitUrl="https://xzibit-apps.vercel.app/api/feedback"
 *         clarifyUrl="https://xzibit-apps.vercel.app/api/feedback/clarify"
 *         buildSha={BUILD_SHA}
 *         userEmail={user.email}
 *       />
 *     </>
 *   }
 * />
 * ```
 */
export function FeedbackButton({
  submitUrl = '/api/feedback',
  clarifyUrl,
  appName,
  userEmail,
  buildSha,
  credentials = 'include',
  label = 'Feedback',
  className,
  disabled = false,
  onResult,
}: FeedbackButtonProps) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  // Start collecting client errors / failed requests as early as the button
  // mounts (it lives in the TopBar), so they're already captured by the time the
  // user opens the panel. Idempotent.
  useEffect(() => { installDiagnostics(); }, []);

  const route = typeof window !== 'undefined' ? window.location.pathname : '/';

  const onSubmit = async (payload: FeedbackPayload): Promise<{ ok: boolean; error?: string }> => {
    try {
      // Attach an auto-captured diagnostics snapshot (no role — the package owns no auth).
      const client_diagnostics = collectClientDiagnostics(null);
      const res = await fetch(submitUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials,
        body: JSON.stringify({ ...payload, client_diagnostics }),
      });
      if (res.ok) {
        onResult?.({ ok: true });
        return { ok: true };
      }
      const body = await res.json().catch(() => ({}));
      const error = (body as { error?: string }).error;
      onResult?.({ ok: false, error });
      return { ok: false, error };
    } catch {
      onResult?.({ ok: false, error: 'Network error' });
      return { ok: false, error: 'Network error' };
    }
  };

  // AI completeness check on Send — only wired when clarifyUrl is provided.
  // Graceful end-to-end: non-200, bad body, or >6s all resolve to clear:true.
  const clarify = clarifyUrl
    ? async (draft: { type: FeedbackType; title: string; description: string }): Promise<{ clear: boolean; questions: string[] }> => {
        try {
          const diag = collectClientDiagnostics(null);
          const diagnostics_summary = summariseForClarify(diag, route);
          const res = await Promise.race([
            fetch(clarifyUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials,
              body: JSON.stringify({ type: draft.type, title: draft.title, description: draft.description, diagnostics_summary }),
            }),
            new Promise<Response>((_, reject) => setTimeout(() => reject(new Error('clarify client timeout')), 6000)),
          ]);
          if (!res.ok) return { clear: true, questions: [] };
          const body = await res.json().catch(() => ({ clear: true, questions: [] }));
          return {
            clear: body.clear !== false,
            questions: Array.isArray(body.questions) ? body.questions.filter((q: unknown): q is string => typeof q === 'string').slice(0, 2) : [],
          };
        } catch {
          return { clear: true, questions: [] };
        }
      }
    : undefined;

  const close = () => {
    setOpen(false);
    // Return focus to the trigger (DS spec §4).
    requestAnimationFrame(() => btnRef.current?.focus());
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(true)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
        aria-label={label}
        title={disabled ? 'Sign in to send feedback' : 'Send feedback'}
        disabled={disabled}
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          height: 32,
          padding: '0 16px',
          background: hover ? '#1FC2B1' : 'var(--xz-teal, #19B1A1)',
          color: 'var(--xz-charcoal, #1D252D)',
          border: 'none',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 500,
          cursor: disabled ? 'default' : 'pointer',
          fontFamily: 'inherit',
          transition: 'background 120ms',
          flexShrink: 0,
          opacity: disabled ? 0.5 : 1,
          pointerEvents: disabled ? 'none' : 'auto',
        }}
      >
        <svg
          width={16}
          height={16}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
        <span>{label}</span>
      </button>

      {open && !disabled && (
        <FeedbackPanel
          open={open}
          onClose={close}
          app={appName}
          route={route}
          buildSha={buildSha ?? ''}
          userEmail={userEmail ?? ''}
          onSubmit={onSubmit}
          clarify={clarify}
        />
      )}
    </>
  );
}
