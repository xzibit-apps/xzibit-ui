'use client';

import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';

export type FeedbackType = 'bug' | 'idea';

export interface FeedbackPanelProps {
  /** Whether the modal is open. Drive from app state. */
  open: boolean;

  /** Called when the modal should close (Cancel, Esc, backdrop, or after submit success). */
  onClose: () => void;

  /** App display name for the auto-context line (e.g. "ERP Overview"). Required. */
  appName: string;

  /**
   * Endpoint the form POSTs to. Defaults to `/api/feedback` on the same origin.
   * For "same feedback tool across the portfolio" wire every app to the same
   * absolute URL (typically the launcher's `/api/feedback`) so all submissions
   * land in one `feedback_submissions` table.
   */
  submitUrl?: string;

  /** Optional user email shown in the auto-context line and sent in the body. */
  userEmail?: string;

  /** Optional build SHA shown in the auto-context line and sent in the body. */
  buildSha?: string;

  /** Optional fetch credentials mode. Defaults to 'include' so cookies travel cross-origin. */
  credentials?: RequestCredentials;

  /** Optional callback fired after a successful submit, before the auto-close. */
  onSubmitted?: () => void;
}

const MAX_TITLE = 120;
const MAX_DESC = 4000;

/**
 * Canonical in-app feedback modal per DESIGN-STANDARD v2.6 §Feedback Widget
 * and Architecture's ADR f26c4824.
 *
 * v0.4.2 (2026-06-11): NEW exported component. Pairs with `<FeedbackButton>`
 * (the trigger in the TopBar rightSlot).
 *
 * The panel handles its own form state, validation, submit, success and error
 * states. Apps provide `open`, `onClose`, and `submitUrl`. The body posted is:
 *
 *   {
 *     type: 'bug' | 'idea',
 *     title: string,            // trimmed, 1..120
 *     description: string,      // trimmed, 1..4000
 *     app: string,              // appName prop
 *     route: string,            // window.location.pathname
 *     build_sha: string | null, // buildSha prop
 *     user_email: string | null // userEmail prop
 *   }
 *
 * The backend that receives this POST is owned by Architecture per ADR
 * f26c4824. Apps either hit `/api/feedback` on their own host (per-app handler)
 * or post to a portfolio-wide URL like the launcher's `/api/feedback` for one
 * shared submissions table. The `submitUrl` prop covers both patterns.
 *
 * Screenshot capture from the ADR spec is deferred to v0.4.3 to keep the v0.4.2
 * bundle small (html2canvas is ~50KB minified). The form + auto-context covers
 * the bulk of the value.
 *
 * Uses the native `<dialog>` element so focus trap, Esc, and inert background
 * come from the browser for free. No external modal dependency.
 *
 * Render example:
 *
 * ```tsx
 * 'use client';
 * import { useState } from 'react';
 * import { TopBar, BuildBadge, FeedbackButton, FeedbackPanel } from '@xzibit/ui';
 *
 * export default function RootLayout({ children }) {
 *   const [open, setOpen] = useState(false);
 *   return (
 *     <html><body>
 *       <TopBar
 *         appName="ERP Overview"
 *         rightSlot={<FeedbackButton onClick={() => setOpen(true)} />}
 *       />
 *       <BuildBadge sha={BUILD_SHA} timestamp={BUILD_TIME} />
 *       <FeedbackPanel
 *         open={open}
 *         onClose={() => setOpen(false)}
 *         appName="ERP Overview"
 *         submitUrl="https://xzibit-apps.vercel.app/api/feedback"
 *         buildSha={BUILD_SHA}
 *         userEmail={user.email}
 *       />
 *       <main style={{ marginTop: 44 }}>{children}</main>
 *     </body></html>
 *   );
 * }
 * ```
 */
export function FeedbackPanel({
  open,
  onClose,
  appName,
  submitUrl = '/api/feedback',
  userEmail,
  buildSha,
  credentials = 'include',
  onSubmitted,
}: FeedbackPanelProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [type, setType] = useState<FeedbackType>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Imperative open/close via the dialog API.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      try {
        dialog.showModal();
      } catch {
        // showModal throws if the dialog is already open. Safe to ignore.
      }
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Reset form when the panel closes.
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setType('bug');
        setTitle('');
        setDescription('');
        setSubmitting(false);
        setError(null);
        setSuccess(false);
      }, 200);
      return () => clearTimeout(t);
    }
    return;
  }, [open]);

  // Native dialog's "close" event fires for Esc or programmatic close.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => {
      if (open) onClose();
    };
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [open, onClose]);

  const route = typeof window !== 'undefined' ? window.location.pathname : '';

  const titleTrim = title.trim();
  const descTrim = description.trim();
  const titleLen = title.length;
  const descLen = description.length;
  const canSubmit =
    titleTrim.length > 0 &&
    descTrim.length > 0 &&
    titleLen <= MAX_TITLE &&
    descLen <= MAX_DESC &&
    !submitting &&
    !success;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(submitUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials,
        body: JSON.stringify({
          type,
          title: titleTrim,
          description: descTrim,
          app: appName,
          route,
          build_sha: buildSha ?? null,
          user_email: userEmail ?? null,
        }),
      });
      if (!res.ok) {
        let msg = `Submit failed (HTTP ${res.status})`;
        try {
          const body = await res.json();
          if (body && typeof body.error === 'string') msg = body.error;
        } catch {
          // swallow JSON parse errors
        }
        throw new Error(msg);
      }
      setSuccess(true);
      onSubmitted?.();
      // Auto-close after a beat so the success state is visible.
      setTimeout(() => onClose(), 1400);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submit failed');
      setSubmitting(false);
    }
  }

  // Click on the backdrop closes. Native dialog backdrop = click on the dialog itself
  // when the target is the dialog node (not its inner content).
  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      aria-labelledby="xz-feedback-title"
      style={{
        padding: 0,
        border: 'none',
        borderRadius: 12,
        background: 'var(--background, #FFFFFF)',
        color: 'var(--foreground, #1D252D)',
        maxWidth: 528,
        width: '90vw',
        boxShadow: '0 12px 32px rgba(29,37,45,0.18), 0 4px 12px rgba(29,37,45,0.10)',
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          padding: '24px',
          fontFamily: 'inherit',
          fontSize: 14,
          color: 'var(--foreground, #1D252D)',
        }}
        // Stop the form click from reaching the dialog's backdrop handler.
        onClick={(e) => e.stopPropagation()}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <h2
            id="xz-feedback-title"
            style={{ margin: 0, fontSize: 18, fontWeight: 500, color: 'var(--foreground, #1D252D)' }}
          >
            Send feedback
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 4,
              color: 'var(--muted-foreground, #888A8B)',
              lineHeight: 0,
            }}
          >
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </header>

        {/* Type segmented control */}
        <div style={{ marginBottom: 16 }}>
          <div
            role="radiogroup"
            aria-label="Feedback type"
            style={{
              display: 'inline-flex',
              padding: 3,
              background: 'var(--xz-off-white, #F4F4F2)',
              borderRadius: 6,
              gap: 0,
            }}
          >
            <TypeOption value="bug" current={type} onChange={setType} label="Bug" />
            <TypeOption value="idea" current={type} onChange={setType} label="Idea" />
          </div>
        </div>

        {/* Title */}
        <label style={{ display: 'block', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>
              Title <span style={{ color: 'var(--xz-teal, #19B1A1)' }}>*</span>
            </span>
            <span style={{ fontSize: 11, color: 'var(--muted-foreground, #888A8B)' }}>
              {titleLen}/{MAX_TITLE}
            </span>
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Short summary"
            disabled={submitting || success}
            maxLength={MAX_TITLE + 8 /* allow paste overflow that the counter shows */}
            style={{
              width: '100%',
              height: 36,
              padding: '0 12px',
              border: `1px solid ${titleLen > MAX_TITLE ? 'var(--destructive, #C0392B)' : 'var(--border, #E2E4E5)'}`,
              borderRadius: 6,
              background: 'var(--background, #FFFFFF)',
              color: 'var(--foreground, #1D252D)',
              fontSize: 14,
              fontFamily: 'inherit',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </label>

        {/* Description */}
        <label style={{ display: 'block', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>
              What happened <span style={{ color: 'var(--xz-teal, #19B1A1)' }}>*</span>
            </span>
            <span style={{ fontSize: 11, color: 'var(--muted-foreground, #888A8B)' }}>
              {descLen}/{MAX_DESC}
            </span>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What you saw, what you expected"
            rows={5}
            disabled={submitting || success}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: `1px solid ${descLen > MAX_DESC ? 'var(--destructive, #C0392B)' : 'var(--border, #E2E4E5)'}`,
              borderRadius: 6,
              background: 'var(--background, #FFFFFF)',
              color: 'var(--foreground, #1D252D)',
              fontSize: 14,
              fontFamily: 'inherit',
              outline: 'none',
              resize: 'vertical',
              minHeight: 100,
              boxSizing: 'border-box',
            }}
          />
        </label>

        {/* Auto-captured context */}
        <p
          style={{
            margin: '0 0 20px',
            fontSize: 11,
            color: 'var(--muted-foreground, #888A8B)',
            lineHeight: 1.6,
          }}
        >
          Sending from <strong style={{ fontWeight: 500 }}>{appName}</strong> · {route || '/'}
          {buildSha ? <> · build <code style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{buildSha}</code></> : null}
          {userEmail ? <> · {userEmail}</> : null}
        </p>

        {/* Error banner */}
        {error && !success && (
          <div
            role="alert"
            style={{
              marginBottom: 16,
              padding: '10px 12px',
              background: 'var(--background, #FFFFFF)',
              borderLeft: '3px solid var(--destructive, #C0392B)',
              borderTop: '1px solid var(--border, #E2E4E5)',
              borderRight: '1px solid var(--border, #E2E4E5)',
              borderBottom: '1px solid var(--border, #E2E4E5)',
              borderRadius: 4,
              fontSize: 13,
              color: 'var(--foreground, #1D252D)',
            }}
          >
            {error}
          </div>
        )}

        {/* Success banner */}
        {success && (
          <div
            role="status"
            style={{
              marginBottom: 16,
              padding: '10px 12px',
              background: 'rgba(25, 177, 161, 0.10)',
              borderLeft: '3px solid var(--xz-teal, #19B1A1)',
              borderTop: '1px solid var(--border, #E2E4E5)',
              borderRight: '1px solid var(--border, #E2E4E5)',
              borderBottom: '1px solid var(--border, #E2E4E5)',
              borderRadius: 4,
              fontSize: 13,
              color: 'var(--foreground, #1D252D)',
            }}
          >
            Feedback sent. Thanks.
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{
              padding: '0 14px',
              height: 36,
              background: 'transparent',
              color: 'var(--muted-foreground, #888A8B)',
              border: '1px solid var(--border, #E2E4E5)',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 400,
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              padding: '0 16px',
              height: 36,
              background: canSubmit ? 'var(--xz-teal, #19B1A1)' : 'var(--xz-off-white, #F4F4F2)',
              color: canSubmit ? 'var(--xz-charcoal, #1D252D)' : 'var(--muted-foreground, #888A8B)',
              border: 'none',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 500,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {submitting ? 'Sending…' : success ? 'Sent' : 'Send feedback'}
          </button>
        </div>
      </form>
    </dialog>
  );
}

function TypeOption({
  value,
  current,
  onChange,
  label,
}: {
  value: FeedbackType;
  current: FeedbackType;
  onChange: (v: FeedbackType) => void;
  label: string;
}) {
  const selected = current === value;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={() => onChange(value)}
      style={{
        padding: '0 14px',
        height: 26,
        background: selected ? 'var(--background, #FFFFFF)' : 'transparent',
        color: selected ? 'var(--foreground, #1D252D)' : 'var(--muted-foreground, #888A8B)',
        border: selected ? '1px solid var(--border, #E2E4E5)' : 'none',
        borderRadius: 4,
        fontSize: 13,
        fontWeight: selected ? 500 : 400,
        cursor: 'pointer',
        fontFamily: 'inherit',
        boxShadow: selected ? '0 1px 2px rgba(0,0,0,0.04)' : undefined,
      }}
    >
      {label}
    </button>
  );
}
