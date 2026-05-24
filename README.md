# @xzibit/ui

Shared chrome components for the Xzibit Apps portfolio. Single source of truth — tweak once, every app picks it up on next deploy.

**v0.1 scope:** `TopBar`, `BackToLauncher`, `AppsDropdown`, `XzibitMark`, `useApps` hook. Modal + Toast wrappers (Sonner / Radix Dialog) deferred to v0.2.

**Stewarded by:** Xzibit Apps Design Standards Cowork. When DESIGN-STANDARD.md changes (currently v2.3.1), this package bumps to match.

---

## Install

```bash
npm install @xzibit/ui
```

Peer dependencies: `react@^18`, `react-dom@^18`.

(Recommended companion: `@xzibit/tokens` for CSS variable values — without it, components fall back to inline hex defaults.)

---

## Use

### Top bar — drop-in chrome for every Xzibit App

```tsx
// src/app/layout.tsx
import { TopBar } from '@xzibit/ui';
import '@xzibit/tokens/tokens.css'; // optional but recommended

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TopBar
          appName="ERP Overview"
          buildSha={process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7)}
          buildTimestamp="22 May 2026, 5:03 pm AEST"
        />
        <main id="main" style={{ marginTop: 44 }}>
          {children}
        </main>
      </body>
    </html>
  );
}
```

That's it. The bar renders:

- Back-to-launcher anchor (chevron + Xzibit X logo + "Xzibit Apps" text)
- Vertical separator
- App wordmark (teal dot + your app name)
- Vertical separator
- Apps dropdown (fetches `/api/me/apps`, sectioned + within-section alphabetical)
- Build badge (SHA + timestamp on right edge)

### `/api/me/apps` endpoint required

`AppsDropdown` calls `GET /api/me/apps` (same-origin) for the cross-app navigation list. Each consuming app must expose this endpoint per CODING-STANDARDS §6.3:

```typescript
// src/app/api/me/apps/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { authenticateUser } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await authenticateUser(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('apps')
      .select('name, url, description, section, section_order')
      .order('section_order', { ascending: true });
    // Filter by role per public.role_app_permissions — see launcher's
    // existing route for the exact query shape:
    // xzibit-apps/launcher/src/app/api/me/apps/route.ts

    if (error) {
      console.error('[GET /api/me/apps] query failed:', error);
      return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }

    return NextResponse.json({ apps: data });
  } catch (err) {
    console.error('[GET /api/me/apps] unexpected error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

### Individual primitives

If you need the components separately:

```tsx
import { BackToLauncher, AppsDropdown, XzibitMark, useApps } from '@xzibit/ui';

// Just the back-to-launcher anchor
<BackToLauncher />

// Just the apps dropdown (with custom endpoint)
<AppsDropdown endpoint="/api/custom/apps" />

// The X mark on its own
<XzibitMark size={32} ariaLabel="Xzibit" />

// The data hook for custom UI
const { apps, loading, error, refetch } = useApps();
```

---

## Theming

Components reference CSS variables for colors. Fallbacks render correct values out of the box, but the recommended way is to install `@xzibit/tokens` and import its CSS:

```typescript
import '@xzibit/tokens/tokens.css';
```

This sets `--xz-charcoal`, `--xz-teal`, `--xz-white`, `--border`, etc. — and `@xzibit/ui` picks them up automatically.

---

## What's included

| Export | Purpose |
|---|---|
| `<TopBar appName="..." ... />` | Universal 44px fixed top bar (composes all the rest) |
| `<BackToLauncher />` | Chevron + X logo + "Xzibit Apps" anchor — single click target back to launcher |
| `<AppsDropdown />` | Sectioned + alphabetical apps dropdown driven by `/api/me/apps` |
| `<XzibitMark size={28} />` | Xzibit X brand mark as inline SVG (any size, any density) |
| `useApps()` | React hook fetching `/api/me/apps` with loading + error + refetch |

---

## What's NOT included (yet)

- **Modal wrapper** — coming v0.2, wraps `@radix-ui/react-dialog`. For now, install Radix Dialog directly and follow DESIGN-STANDARD.md §Modal / Dialog
- **Toast wrapper** — coming v0.2, wraps `sonner`. For now, install Sonner directly and follow DESIGN-STANDARD.md §Toast / Notification
- **Form primitives** — apps maintain their own per DESIGN-STANDARD.md §Form Patterns
- **App-specific components** — Card, Button, FormInput, etc. live in each app

---

## Versioning

Semantic versioning. Apps consume specific versions per CODING-STANDARDS §21.2 (pin production-critical deps; no `^` ranges).

- **Patch** (0.1.x): bug fixes; no API changes
- **Minor** (0.x.0): new components / props (no breaking changes)
- **Major** (x.0.0): breaking changes to existing component APIs (cycle through deprecation per CHANGELOG)

---

## Authority

When `_portfolio/CONVENTIONS/DESIGN-STANDARD.md` changes, this package bumps to match within ~1 week. The reverse is not true — never change a component here without amending the standard first.

Sister-request the Xzibit Apps Design Standards Cowork for amendments to DESIGN-STANDARD or new components requested for `@xzibit/ui`.

---

## License

MIT. See [LICENSE](./LICENSE).
