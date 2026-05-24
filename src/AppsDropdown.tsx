import React, { useState, useEffect, useRef, Fragment } from 'react';
import { useApps } from './useApps';
import type { App } from './types';

export interface AppsDropdownProps {
  /** Override the endpoint URL. Default: '/api/me/apps' via useApps(). */
  endpoint?: string;
}

interface AppGroup {
  section: string | null;
  apps: App[];
}

/**
 * Apps dropdown for the TopBar — sectioned + within-section alphabetical.
 *
 * Per DESIGN-STANDARD v2.3.1 §Top Bar §Apps dropdown panel:
 * - Groups apps by `section` field
 * - Section order from `section_order` (matches launcher curation)
 * - Within each section: alphabetical by `name` ASC, case-insensitive
 * - Section heading: 11px / 500 / muted / uppercase / +0.06em letter-spacing
 * - Section divider: 1px var(--border), 8px margin top/bottom — NOT above
 *   the first section, NOT below the last
 * - Skeleton during fetch; empty-state copy if user has no other apps
 *
 * Accessibility: opens on click; closes on Esc; closes on outside-click;
 * focus returns to trigger on close. Items are role="menuitem".
 */
export function AppsDropdown({ endpoint }: AppsDropdownProps = {}) {
  const [open, setOpen] = useState(false);
  const { apps, loading, error } = useApps({ endpoint });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Esc closes + returns focus to trigger
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  // Outside click closes
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (buttonRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const grouped = groupAndSort(apps);
  const hasApps = grouped.length > 0;

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '0 1rem',
          height: '44px',
          background: open ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
          border: 'none',
          color: open ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
          fontSize: '13px',
          fontWeight: 400,
          cursor: 'pointer',
          fontFamily: 'inherit',
          transition: 'background 120ms, color 120ms',
        }}
      >
        Apps
        <svg width={10} height={10} viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <path
            d={open ? 'M 1 7 L 5 3 L 9 7' : 'M 1 3 L 5 7 L 9 3'}
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div
          ref={panelRef}
          role="menu"
          style={{
            position: 'absolute',
            top: '44px',
            left: 0,
            minWidth: '280px',
            maxWidth: '360px',
            maxHeight: '60vh',
            overflowY: 'auto',
            background: 'var(--xz-white, #ffffff)',
            border: '1px solid var(--border, #E2E4E5)',
            borderRadius: '8px',
            boxShadow:
              'var(--shadow-card-hover, 0 4px 12px rgba(29,37,45,0.10), 0 12px 32px rgba(29,37,45,0.10))',
            padding: '0.5rem',
            zIndex: 110,
          }}
        >
          {loading && <DropdownSkeleton />}
          {!loading && error && <DropdownError message={error} />}
          {!loading && !error && !hasApps && <DropdownEmpty />}
          {!loading && !error && hasApps && (
            <>
              {grouped.map((group, i) => (
                <Fragment key={group.section ?? '__no_section__'}>
                  {i > 0 && (
                    <hr
                      aria-hidden="true"
                      style={{
                        border: 'none',
                        borderTop: '1px solid var(--border, #E2E4E5)',
                        margin: '8px 0',
                      }}
                    />
                  )}
                  <DropdownSection section={group.section} apps={group.apps} />
                </Fragment>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function groupAndSort(apps: App[]): AppGroup[] {
  const sectionMap = new Map<string | null, App[]>();
  const sectionOrder = new Map<string | null, number>();

  apps.forEach((app, i) => {
    const key = app.section ?? null;
    if (!sectionMap.has(key)) {
      sectionMap.set(key, []);
      sectionOrder.set(key, app.section_order ?? i);
    }
    sectionMap.get(key)!.push(app);
  });

  const groups: AppGroup[] = Array.from(sectionMap.entries()).map(
    ([section, sectionApps]) => ({
      section,
      apps: [...sectionApps].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      ),
    })
  );

  groups.sort(
    (a, b) =>
      (sectionOrder.get(a.section) ?? Number.MAX_SAFE_INTEGER) -
      (sectionOrder.get(b.section) ?? Number.MAX_SAFE_INTEGER)
  );

  return groups;
}

function DropdownSection({
  section,
  apps,
}: {
  section: string | null;
  apps: App[];
}) {
  return (
    <div>
      {section && (
        <div
          style={{
            fontSize: '11px',
            fontWeight: 500,
            color: 'var(--muted-foreground, #888A8B)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            padding: '0 0.75rem',
            marginBottom: '4px',
          }}
        >
          {section}
        </div>
      )}
      {apps.map((app) => (
        <DropdownItem key={app.name + app.url} app={app} />
      ))}
    </div>
  );
}

function DropdownItem({ app }: { app: App }) {
  const [hover, setHover] = useState(false);
  return (
    <a
      href={app.url}
      role="menuitem"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'block',
        padding: '0.5rem 0.75rem',
        borderRadius: '4px',
        fontSize: '14px',
        fontWeight: 400,
        color: 'var(--foreground, #1D252D)',
        textDecoration: 'none',
        background: hover ? 'var(--xz-off-white, #F4F4F2)' : 'transparent',
        transition: 'background 80ms',
      }}
    >
      {app.name}
    </a>
  );
}

function DropdownSkeleton() {
  const widths = ['78%', '64%', '82%', '70%'];
  return (
    <div style={{ padding: '0.5rem 0.75rem' }}>
      {widths.map((w, i) => (
        <div
          key={i}
          aria-hidden="true"
          style={{
            height: '14px',
            background: 'rgba(216, 218, 219, 0.4)',
            borderRadius: '4px',
            marginBottom: '8px',
            width: w,
            animation: 'xzibit-pulse 1.4s ease-in-out infinite',
          }}
        />
      ))}
      <style>{`@keyframes xzibit-pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.5 } }`}</style>
    </div>
  );
}

function DropdownError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      style={{
        padding: '0.75rem',
        fontSize: '13px',
        fontWeight: 400,
        color: 'var(--destructive, #C0392B)',
      }}
    >
      Failed to load apps: {message}
    </div>
  );
}

function DropdownEmpty() {
  return (
    <div
      style={{
        padding: '0.75rem',
        fontSize: '13px',
        fontWeight: 400,
        color: 'var(--muted-foreground, #888A8B)',
      }}
    >
      No other apps available
    </div>
  );
}
