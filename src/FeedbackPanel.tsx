'use client';

/**
 * FeedbackPanel — Radix Dialog feedback form (ADR f26c4824, DS spec 2026-06-10).
 *
 * Presentational + portable: it owns NO auth, no toast and no network — the host
 * (the packaged <FeedbackButton> orchestrator, or any consumer) wires those
 * through `onSubmit`/`clarify`. All styling is inline tokens (var(--xz-*)) so it
 * carries no Tailwind/class dependency across the package boundary.
 *
 * v0.6.0 (2026-06-11): promoted from the lighter native-<dialog> form to the full
 * rich widget lifted from the launcher — screenshot capture + annotate + AI
 * clarifier. Pairs with <FeedbackButton> and <ScreenshotAnnotator>.
 */

import * as Dialog from '@radix-ui/react-dialog';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, Loader2, Pencil, RefreshCw, X } from 'lucide-react';
import { ScreenshotAnnotator } from './ScreenshotAnnotator';

export type FeedbackType = 'bug' | 'idea';

export interface FeedbackPayload {
  type: FeedbackType;
  title: string;
  description: string;
  screenshot: string | null; // base64 data URL or null if capture failed
  app: string;
  route: string;
  build_sha: string;
  user_email: string;
}

export interface FeedbackPanelProps {
  open: boolean;
  onClose: () => void;
  app: string;
  route: string;
  buildSha: string;
  userEmail: string;
  onSubmit: (payload: FeedbackPayload) => Promise<{ ok: boolean; error?: string }>;
  // Optional AI completeness check, run once on Send before submitting. Returns
  // up to 2 questions when the draft is too thin. Host-wired (keeps the panel
  // network/auth-free); if absent, Send submits straight through. Never blocks.
  clarify?: (draft: { type: FeedbackType; title: string; description: string }) => Promise<{ clear: boolean; questions: string[] }>;
}

const TITLE_MAX = 120;
const DESC_MAX = 4000;

// Capture the current viewport, excluding the dialog itself (tagged data-feedback-ignore).
async function captureScreenshot(): Promise<string | null> {
  try {
    // html2canvas-pro (oklch-aware): the original html2canvas@1.4.1 throws on
    // modern CSS color functions (oklch/lab), which silently broke screenshot
    // capture on Tailwind-v4 apps. The pro fork parses them. Same default-export API.
    const { default: html2canvas } = await import('html2canvas-pro');
    const canvas = await html2canvas(document.body, {
      ignoreElements: (el) => (el as HTMLElement).getAttribute?.('data-feedback-ignore') === 'true',
      logging: false,
      useCORS: true,
      backgroundColor: '#ffffff',
      scale: Math.min(window.devicePixelRatio || 1, 2),
      x: window.scrollX,
      y: window.scrollY,
      width: window.innerWidth,
      height: window.innerHeight,
      windowWidth: document.documentElement.clientWidth,
      windowHeight: document.documentElement.clientHeight,
    });
    return canvas.toDataURL('image/png');
  } catch (e) {
    console.error('Feedback screenshot capture failed:', e);
    return null;
  }
}

export function FeedbackPanel({ open, onClose, app, route, buildSha, userEmail, onSubmit, clarify }: FeedbackPanelProps) {
  const [type, setType] = useState<FeedbackType>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [annotating, setAnnotating] = useState(false);
  const [clarifyChecking, setClarifyChecking] = useState(false);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const clarifiedRef = useRef(false); // clarify runs at most once per submission

  const descRef = useRef<HTMLTextAreaElement>(null);

  const runCapture = useCallback(async () => {
    setCapturing(true);
    const shot = await captureScreenshot();
    setScreenshot(shot);
    setCapturing(false);
  }, []);

  // Reset + capture each time the panel opens.
  useEffect(() => {
    if (!open) return;
    setType('bug');
    setTitle('');
    setDescription('');
    setError(null);
    setTouched(false);
    setSubmitting(false);
    setScreenshot(null);
    setAnnotating(false);
    setClarifyChecking(false);
    setQuestions([]);
    setAnswers([]);
    clarifiedRef.current = false;
    void runCapture();
  }, [open, runCapture]);

  const titleValid = title.trim().length > 0 && title.length <= TITLE_MAX;
  const descValid = description.trim().length > 0 && description.length <= DESC_MAX;
  const canSend = titleValid && descValid && !submitting && !clarifyChecking;

  // Fold any answered clarifier questions into the description as a delimited block,
  // so downstream ai_triage + Send-to-Cowork see the enriched text. No DB column.
  const enrichDescription = (base: string): string => {
    const answered = questions
      .map((q, i) => ({ q, a: (answers[i] ?? '').trim() }))
      .filter((x) => x.a.length > 0);
    if (answered.length === 0) return base;
    const block = answered.map(({ q, a }) => `Q: ${q}\nA: ${a}`).join('\n\n');
    return `${base}\n\n--- Clarifications ---\n${block}`;
  };

  const doSubmit = async (finalDescription: string) => {
    setSubmitting(true);
    setError(null);
    const result = await onSubmit({
      type,
      title: title.trim(),
      description: finalDescription,
      screenshot,
      app,
      route,
      build_sha: buildSha,
      user_email: userEmail,
    });
    if (result.ok) {
      onClose(); // host shows the success toast
    } else {
      setError(result.error || "Couldn't send feedback. Try again.");
      setSubmitting(false);
    }
  };

  // Send: run the one-time AI completeness check first; if it asks questions, show
  // them inline (the user answers or skips), otherwise submit straight through.
  const handleSend = async () => {
    setTouched(true);
    if (!titleValid || !descValid || submitting || clarifyChecking) return;

    // Questions already showing → the user answered/skipped: submit enriched.
    if (questions.length > 0) {
      await doSubmit(enrichDescription(description.trim()));
      return;
    }

    // One-time clarify (graceful: clarify may be absent, error, or time out).
    if (clarify && !clarifiedRef.current) {
      clarifiedRef.current = true;
      setClarifyChecking(true);
      let result = { clear: true, questions: [] as string[] };
      try {
        result = await clarify({ type, title: title.trim(), description: description.trim() });
      } catch { /* never block on clarify */ }
      setClarifyChecking(false);
      if (!result.clear && result.questions.length > 0) {
        const qs = result.questions.slice(0, 2);
        setQuestions(qs);
        setAnswers(new Array(qs.length).fill(''));
        return; // wait for the user to answer or Send anyway
      }
    }
    await doSubmit(description.trim());
  };

  // Skip the questions and submit (folding in any answers the user did type).
  const sendAnyway = async () => {
    if (submitting) return;
    await doSubmit(enrichDescription(description.trim()));
  };

  // Cmd/Ctrl+Enter sends from anywhere in the panel.
  const onKeyDownPanel = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      void handleSend();
    }
  };

  const titleOver = title.length > TITLE_MAX;
  const descOver = description.length > DESC_MAX;

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay
          data-feedback-ignore="true"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 10000, animation: 'fbFade 200ms ease' }}
        />
        <Dialog.Content
          data-feedback-ignore="true"
          onKeyDown={onKeyDownPanel}
          aria-busy={submitting}
          // The annotator overlay renders above (outside) this content; without these
          // guards Radix treats drawing on it as a "pointer down outside" and closes the
          // whole dialog. Keep the panel open while the annotator is up.
          onPointerDownOutside={(e) => { if (annotating) e.preventDefault(); }}
          onInteractOutside={(e) => { if (annotating) e.preventDefault(); }}
          onEscapeKeyDown={(e) => { if (annotating) e.preventDefault(); }}
          style={{
            // Centre WITHOUT a persistent transform: the annotator overlay renders inside
            // this content (so its Text input stays within Radix's focus scope), and a
            // position:fixed child is mispositioned under a transformed ancestor. inset:0 +
            // margin:auto + height:fit-content centres the panel; the open animation below
            // uses a transient translateY that finishes before the annotator can be opened.
            position: 'fixed', inset: 0, margin: 'auto',
            width: 528, maxWidth: 'calc(100vw - 32px)', height: 'fit-content', maxHeight: 'calc(100vh - 48px)', overflowY: 'auto',
            background: 'var(--background, #fff)', borderRadius: 12, padding: 24, zIndex: 10001,
            boxShadow: '0 12px 32px rgba(0,0,0,0.18)', animation: 'fbSlideUp 200ms ease',
            fontFamily: 'inherit', color: 'var(--foreground, #1a1a1a)',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <Dialog.Title style={{ fontSize: 18, fontWeight: 500, margin: 0 }}>Send feedback</Dialog.Title>
            <Dialog.Close asChild>
              <button aria-label="Close" style={iconBtn(24)}><X size={18} /></button>
            </Dialog.Close>
          </div>

          {/* Inline error banner */}
          {error && (
            <div role="alert" style={{
              display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 16, padding: '10px 12px',
              borderLeft: '3px solid var(--destructive, #d4380d)', background: 'rgba(212,56,13,0.06)',
              borderRadius: 6, fontSize: 13, color: 'var(--destructive, #d4380d)',
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Type segmented control — single off-white track, white active pill, emoji glyphs (matches Team Schedule) */}
            <div role="radiogroup" aria-label="Feedback type"
                 style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 8, background: 'var(--xz-off-white, #F4F5F5)' }}>
              {([['bug', 'Bug', '🐞'], ['idea', 'Idea', '💡']] as const).map(([val, label, emoji]) => {
                const active = type === val;
                return (
                  <button
                    key={val}
                    role="radio"
                    aria-checked={active}
                    onClick={() => setType(val)}
                    disabled={submitting}
                    style={{
                      flex: 1, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      borderRadius: 6, fontSize: 14, fontWeight: 500, cursor: submitting ? 'default' : 'pointer',
                      border: 'none',
                      background: active ? 'var(--background, #fff)' : 'transparent',
                      color: 'var(--foreground, #1a1a1a)',
                      boxShadow: active ? '0 1px 2px rgba(0,0,0,0.10)' : 'none', transition: 'all 120ms ease',
                    }}
                  >
                    <span aria-hidden="true" style={{ fontSize: 15, lineHeight: 1 }}>{emoji}</span> {label}
                  </button>
                );
              })}
            </div>

            {/* Title */}
            <Field label="Title" counter={`${title.length}/${TITLE_MAX}`} over={titleOver}
                   hint={touched && !titleValid ? 'Add a short summary' : undefined}>
              <input
                autoFocus
                className="fb-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); descRef.current?.focus(); } }}
                placeholder="Short summary..."
                disabled={submitting}
                maxLength={TITLE_MAX + 20}
                style={inputStyle(titleOver)}
              />
            </Field>

            {/* Description */}
            <Field label="Description" counter={`${description.length}/${DESC_MAX}`} over={descOver}
                   hint={touched && !descValid ? 'Tell us what happened' : undefined}>
              <textarea
                ref={descRef}
                className="fb-input"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  const el = e.target;
                  el.style.height = 'auto';
                  el.style.height = `${Math.min(el.scrollHeight, 12 * 22)}px`;
                }}
                placeholder="Describe the issue or idea..."
                disabled={submitting}
                rows={4}
                style={{ ...inputStyle(descOver), resize: 'none', minHeight: 88, lineHeight: '22px', overflowY: 'auto' }}
              />
            </Field>

            {/* Screenshot — label, then thumbnail + Retake + Annotate in a row (matches Team Schedule) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 500 }}>Screenshot</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => { if (screenshot && !capturing && !submitting) setAnnotating(true); }}
                  disabled={!screenshot || capturing || submitting}
                  title={screenshot ? 'Annotate screenshot' : undefined}
                  aria-label="Annotate screenshot"
                  style={{
                    width: 120, height: 80, borderRadius: 6, border: '1px solid var(--border, #E2E4E5)', overflow: 'hidden', padding: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--xz-off-white, #F4F5F5)',
                    fontSize: 11, color: 'var(--muted-foreground, #888A8B)', flexShrink: 0,
                    cursor: screenshot && !capturing && !submitting ? 'pointer' : 'default',
                  }}
                >
                  {capturing ? <Loader2 size={16} className="fb-spin" />
                    : screenshot ? <img src={screenshot} alt="Screenshot preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : 'No screenshot'}
                </button>
                <button onClick={() => void runCapture()} disabled={capturing || submitting} style={ghostBtn}>
                  <RefreshCw size={14} /> Retake
                </button>
                <button onClick={() => setAnnotating(true)} disabled={!screenshot || capturing || submitting} style={ghostBtn}>
                  <Pencil size={14} /> Annotate
                </button>
              </div>
            </div>

            {/* Auto-context line */}
            <div style={{ fontSize: 11, color: 'var(--muted-foreground, #888A8B)' }}>
              Sending from {app} · {route} · build {buildSha} · {userEmail}
            </div>

            {/* AI clarifier — shown only when the completeness check asked questions */}
            {questions.length > 0 && (
              <div style={{
                display: 'flex', flexDirection: 'column', gap: 10, padding: 12, borderRadius: 8,
                background: 'var(--xz-off-white, #F4F5F5)', border: '1px solid var(--border, #E2E4E5)',
              }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>A couple of quick questions so this can be fixed faster</span>
                {questions.map((q, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12 }}>{q}</label>
                    <input
                      value={answers[i] ?? ''}
                      onChange={(e) => setAnswers((prev) => { const next = [...prev]; next[i] = e.target.value; return next; })}
                      placeholder="Optional — your answer"
                      disabled={submitting}
                      style={inputStyle(false)}
                    />
                  </div>
                ))}
                <span style={{ fontSize: 11, color: 'var(--muted-foreground, #888A8B)' }}>Optional — answer to help, or just send.</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
            {questions.length > 0 && !submitting && (
              <button
                type="button"
                onClick={() => void sendAnyway()}
                style={{
                  background: 'none', border: 'none', padding: 0, fontFamily: 'inherit',
                  fontSize: 13, color: 'var(--muted-foreground, #888A8B)', textDecoration: 'underline', cursor: 'pointer',
                }}
              >
                Send anyway
              </button>
            )}
            <button onClick={onClose} style={{ ...ghostBtn, height: 36, padding: '0 16px' }}>Cancel</button>
            <button
              onClick={() => void handleSend()}
              disabled={!canSend}
              style={{
                height: 36, padding: '0 16px', display: 'flex', alignItems: 'center', gap: 6, borderRadius: 6,
                border: 'none', fontSize: 14, fontWeight: 500, color: '#fff',
                background: 'var(--xz-teal, #0E7C86)',
                opacity: canSend ? 1 : 0.5, cursor: canSend ? 'pointer' : 'default', transition: 'opacity 120ms ease',
              }}
            >
              {clarifyChecking ? <><Loader2 size={14} className="fb-spin" /> Checking…</>
                : submitting ? <><Loader2 size={14} className="fb-spin" /> Sending</>
                : questions.length > 0 ? 'Send' : 'Send feedback'}
            </button>
          </div>

          {/* Annotator renders INSIDE Dialog.Content so it sits within Radix's focus
              scope — otherwise the modal focus trap steals focus from the Text-tool
              input and blocks typing. position:fixed still overlays full-screen. */}
          {annotating && screenshot && (
            <ScreenshotAnnotator
              src={screenshot}
              onCancel={() => setAnnotating(false)}
              onDone={(flattened) => { setScreenshot(flattened); setAnnotating(false); }}
            />
          )}
        </Dialog.Content>
      </Dialog.Portal>

      <style>{`
        @keyframes fbFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes fbSlideUp { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes fbSpin { to { transform: rotate(360deg) } }
        .fb-spin { animation: fbSpin 0.8s linear infinite; }
        .fb-input:focus { border-color: var(--xz-teal, #0E7C86) !important; box-shadow: 0 0 0 1px var(--xz-teal, #0E7C86); }
      `}</style>
    </Dialog.Root>
  );
}

// ── small presentational helpers ────────────────────────────────────────────
function Field({ label, counter, over, hint, children }: { label: string; counter: string; over: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <label style={{ fontSize: 13, fontWeight: 500 }}>{label}</label>
        <span style={{ fontSize: 11, color: over ? 'var(--destructive, #d4380d)' : 'var(--muted-foreground, #888A8B)' }}>{counter}</span>
      </div>
      {children}
      {hint && <span style={{ fontSize: 11, color: 'var(--destructive, #d4380d)' }}>{hint}</span>}
    </div>
  );
}

function inputStyle(over: boolean): React.CSSProperties {
  return {
    width: '100%', minHeight: 36, padding: '8px 10px', fontSize: 14, fontFamily: 'inherit',
    borderRadius: 6, border: `1px solid ${over ? 'var(--destructive, #d4380d)' : 'var(--border, #E2E4E5)'}`,
    background: 'var(--background, #fff)', color: 'var(--foreground, #1a1a1a)', outline: 'none', boxSizing: 'border-box',
  };
}

const ghostBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6, height: 28, padding: '0 10px', borderRadius: 6,
  border: '1px solid var(--border, #E2E4E5)', background: 'transparent', color: 'var(--foreground, #1a1a1a)',
  fontSize: 13, cursor: 'pointer',
};

function iconBtn(size: number): React.CSSProperties {
  return {
    width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: 'none', background: 'transparent', color: 'var(--muted-foreground, #888A8B)', cursor: 'pointer', borderRadius: 4,
  };
}
