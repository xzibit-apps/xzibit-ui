/**
 * Client-side diagnostics ring buffer (ADR f26c4824, Feedback V2 Part A).
 *
 * A tiny, always-on collector that the packaged <FeedbackButton> installs once on
 * mount. It keeps the last ~20 client errors (window 'error', 'unhandledrejection',
 * console.error) and the last failed fetch/XHR, so that when the user opens the
 * feedback widget we can attach what just went wrong — without the user having to
 * describe it.
 *
 * Deliberately dependency-free and self-contained. All capture is best-effort: any
 * failure here must never break the host app, so every patch is wrapped defensively.
 *
 * Secrets are scrubbed (Bearer tokens, password=/token= pairs, JWT-shaped
 * strings) before anything is stored, and recorded URLs have their query string
 * stripped so a token in a query param can't leak into the row.
 */

const MAX_ERRORS = 20;
const MAX_MESSAGE = 1000;
const MAX_STACK = 2000;
const MAX_JSON_BYTES = 32 * 1024; // hard cap so a noisy page can't bloat the row

export interface DiagError {
  kind: 'error' | 'unhandledrejection' | 'console.error';
  message: string;
  stack?: string;
  timestamp: string;
}

export interface FailedRequest {
  url: string;
  status: number; // 0 = network failure / thrown
  method: string;
  timestamp: string;
}

export interface ClientDiagnostics {
  errors: DiagError[];
  lastFailedRequest: FailedRequest | null;
  env: {
    userAgent: string;
    platform: string | null;
    language: string | null;
    viewport: { width: number; height: number };
    role: string | null;
    url: string;
  };
  capturedAt: string;
}

// ── Module-level ring buffer state ──────────────────────────────────────────
const errors: DiagError[] = [];
let lastFailedRequest: FailedRequest | null = null;
let installed = false;

// ── Secret scrubbing ────────────────────────────────────────────────────────
export function scrub(input: string): string {
  if (!input) return input;
  return input
    // Authorization: Bearer <token>  /  "Bearer eyJ..."
    .replace(/(bearer\s+)[A-Za-z0-9._~+/-]+=*/gi, '$1[REDACTED]')
    // password / passwd / pwd / token / secret / api[-_]?key = value  (json or query style)
    .replace(/(["']?(?:password|passwd|pwd|token|secret|api[-_]?key|access[-_]?token|refresh[-_]?token)["']?\s*[:=]\s*["']?)[^"'\s,&}]+/gi, '$1[REDACTED]')
    // Bare JWT-shaped strings (three base64url segments)
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[REDACTED-JWT]');
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max) + `…(+${s.length - max} chars)`;
}

// Strip query string + fragment from a captured URL so tokens in params don't leak.
function safeUrl(raw: string): string {
  try {
    const u = new URL(raw, typeof location !== 'undefined' ? location.href : 'http://localhost');
    return scrub(u.origin + u.pathname);
  } catch {
    return scrub(raw.split('?')[0] ?? raw);
  }
}

function pushError(kind: DiagError['kind'], message: string, stack?: string) {
  try {
    errors.push({
      kind,
      message: truncate(scrub(message || ''), MAX_MESSAGE),
      stack: stack ? truncate(scrub(stack), MAX_STACK) : undefined,
      timestamp: new Date().toISOString(),
    });
    while (errors.length > MAX_ERRORS) errors.shift();
  } catch { /* never let capture throw into the host */ }
}

function recordFailedRequest(url: string, status: number, method: string) {
  try {
    lastFailedRequest = {
      url: safeUrl(url),
      status,
      method: (method || 'GET').toUpperCase(),
      timestamp: new Date().toISOString(),
    };
  } catch { /* swallow */ }
}

/**
 * Install the global listeners + fetch/XHR wrappers. Idempotent and safe to call
 * from any number of mounts; only the first call wires anything up.
 */
export function installDiagnostics(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  try {
    window.addEventListener('error', (e: ErrorEvent) => {
      const loc = e.filename ? ` (${e.filename}:${e.lineno}:${e.colno})` : '';
      pushError('error', (e.message || 'Uncaught error') + loc, e.error?.stack);
    });

    window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
      const r = e.reason;
      const msg = r instanceof Error ? r.message : (typeof r === 'string' ? r : safeStringify(r));
      pushError('unhandledrejection', msg || 'Unhandled promise rejection', r instanceof Error ? r.stack : undefined);
    });

    // console.error — wrap, record, then delegate to the original.
    const origConsoleError = window.console.error.bind(window.console);
    window.console.error = (...args: unknown[]) => {
      try {
        const msg = args.map(a => (a instanceof Error ? a.message : typeof a === 'string' ? a : safeStringify(a))).join(' ');
        const stack = args.find(a => a instanceof Error) as Error | undefined;
        pushError('console.error', msg, stack?.stack);
      } catch { /* swallow */ }
      origConsoleError(...args);
    };

    // fetch — record the last non-ok response or thrown network error.
    if (typeof window.fetch === 'function') {
      const origFetch = window.fetch.bind(window);
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        const method = init?.method ?? (typeof input === 'object' && 'method' in input ? (input as Request).method : 'GET');
        try {
          const res = await origFetch(input, init);
          if (!res.ok) recordFailedRequest(url, res.status, method);
          return res;
        } catch (err) {
          recordFailedRequest(url, 0, method);
          throw err;
        }
      };
    }

    // XHR — best-effort capture of failed requests.
    if (typeof window.XMLHttpRequest === 'function') {
      const XHR = window.XMLHttpRequest.prototype;
      const origOpen = XHR.open;
      const origSend = XHR.send;
      XHR.open = function (this: XMLHttpRequest, method: string, url: string | URL, ...rest: unknown[]) {
        try {
          (this as unknown as { __diag?: { method: string; url: string } }).__diag = { method, url: String(url) };
        } catch { /* swallow */ }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (origOpen as any).call(this, method, url, ...rest);
      };
      XHR.send = function (this: XMLHttpRequest, ...args: unknown[]) {
        try {
          this.addEventListener('loadend', () => {
            const d = (this as unknown as { __diag?: { method: string; url: string } }).__diag;
            if (d && (this.status === 0 || this.status >= 400)) recordFailedRequest(d.url, this.status, d.method);
          });
        } catch { /* swallow */ }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (origSend as any).apply(this, args);
      };
    }
  } catch {
    // If wiring up anything fails, leave the host untouched.
  }
}

function safeStringify(v: unknown): string {
  try { return JSON.stringify(v); } catch { return String(v); }
}

/**
 * Snapshot the current diagnostics for inclusion in a feedback POST. Returns an
 * object guaranteed to serialize under ~32KB (oldest errors dropped if needed).
 */
export function collectClientDiagnostics(role: string | null): ClientDiagnostics {
  const env = {
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    platform: typeof navigator !== 'undefined' ? (navigator.platform || null) : null,
    language: typeof navigator !== 'undefined' ? (navigator.language || null) : null,
    viewport: {
      width: typeof window !== 'undefined' ? window.innerWidth : 0,
      height: typeof window !== 'undefined' ? window.innerHeight : 0,
    },
    role: role ?? null,
    url: safeUrl(typeof location !== 'undefined' ? location.href : ''),
  };

  let snapshot: ClientDiagnostics = {
    errors: errors.slice(),
    lastFailedRequest,
    env,
    capturedAt: new Date().toISOString(),
  };

  // Enforce the 32KB cap by dropping oldest errors until it fits.
  while (snapshot.errors.length > 0 && byteLength(snapshot) > MAX_JSON_BYTES) {
    snapshot = { ...snapshot, errors: snapshot.errors.slice(1) };
  }
  return snapshot;
}

function byteLength(obj: unknown): number {
  try {
    const s = JSON.stringify(obj);
    return typeof TextEncoder !== 'undefined' ? new TextEncoder().encode(s).length : s.length;
  } catch {
    return 0;
  }
}
