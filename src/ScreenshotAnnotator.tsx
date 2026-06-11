'use client';

/**
 * ScreenshotAnnotator — lightweight, dependency-free canvas markup for the
 * feedback screenshot (ADR f26c4824). Pen / Box / Arrow draw in red; Text adds
 * red typed labels at a clicked point. On Done the annotations are FLATTENED
 * onto the image raster (drawImage + shape compositing → toDataURL) and become
 * part of the uploaded PNG.
 *
 * Pointer Events drive both mouse and touch. Self-contained + inline-styled.
 * Rendered inside <FeedbackPanel>'s Radix Dialog.Content so its Text input stays
 * within the modal focus scope.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check, Pencil, Square, Trash2, Type, Undo2, X } from 'lucide-react';

type Tool = 'pen' | 'box' | 'arrow' | 'text';
type Pt = { x: number; y: number };
type Shape =
  | { tool: 'pen'; points: Pt[] }
  | { tool: 'box'; a: Pt; b: Pt }
  | { tool: 'arrow'; a: Pt; b: Pt }
  | { tool: 'text'; a: Pt; text: string };

const RED = '#ef4444';

export interface ScreenshotAnnotatorProps {
  src: string;                       // data URL of the captured screenshot
  onCancel: () => void;              // discard annotations, keep the original
  onDone: (flattenedDataUrl: string) => void; // flattened PNG replaces the screenshot
}

export function ScreenshotAnnotator({ src, onCancel, onDone }: ScreenshotAnnotatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const draftRef = useRef<Shape | null>(null);
  const drawingRef = useRef(false);
  const rasterScaleRef = useRef(1);

  const [tool, setTool] = useState<Tool>('box');
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [ready, setReady] = useState(false);
  // In-progress text label: canvas coords (cx,cy) for rendering + screen coords
  // (left,top) for positioning the inline input over the click point.
  const [editing, setEditing] = useState<{ cx: number; cy: number; left: number; top: number; value: string } | null>(null);

  const drawShape = useCallback((ctx: CanvasRenderingContext2D, s: Shape) => {
    const lw = 3 * rasterScaleRef.current;
    if (s.tool === 'text') {
      const fs = Math.max(12, Math.round(16 * rasterScaleRef.current));
      ctx.fillStyle = RED;
      ctx.font = `600 ${fs}px ui-sans-serif, system-ui, -apple-system, sans-serif`;
      ctx.textBaseline = 'top';
      s.text.split('\n').forEach((line, i) => ctx.fillText(line, s.a.x, s.a.y + i * fs * 1.25));
      return;
    }
    ctx.strokeStyle = RED;
    ctx.fillStyle = RED;
    ctx.lineWidth = lw;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    if (s.tool === 'pen') {
      ctx.beginPath();
      s.points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.stroke();
    } else if (s.tool === 'box') {
      ctx.strokeRect(Math.min(s.a.x, s.b.x), Math.min(s.a.y, s.b.y), Math.abs(s.b.x - s.a.x), Math.abs(s.b.y - s.a.y));
    } else if (s.tool === 'arrow') {
      ctx.beginPath();
      ctx.moveTo(s.a.x, s.a.y);
      ctx.lineTo(s.b.x, s.b.y);
      ctx.stroke();
      const ang = Math.atan2(s.b.y - s.a.y, s.b.x - s.a.x);
      const head = 16 * rasterScaleRef.current;
      ctx.beginPath();
      ctx.moveTo(s.b.x, s.b.y);
      ctx.lineTo(s.b.x - head * Math.cos(ang - Math.PI / 6), s.b.y - head * Math.sin(ang - Math.PI / 6));
      ctx.lineTo(s.b.x - head * Math.cos(ang + Math.PI / 6), s.b.y - head * Math.sin(ang + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
    }
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width) rasterScaleRef.current = canvas.width / rect.width;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    for (const s of shapes) drawShape(ctx, s);
    if (draftRef.current) drawShape(ctx, draftRef.current);
  }, [shapes, drawShape]);

  // Load the image, size the canvas to its natural raster (full resolution so
  // annotations composite at the same fidelity as the upload).
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const canvas = canvasRef.current;
      if (canvas) { canvas.width = img.naturalWidth; canvas.height = img.naturalHeight; }
      setReady(true);
    };
    img.src = src;
  }, [src]);

  useEffect(() => { render(); }, [render, ready]);

  const pt = (e: React.PointerEvent): Pt => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const onDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (tool === 'text') {
      // Place a text label: open an inline input at the click; typing commits on Enter/blur.
      const p = pt(e);
      setEditing({ cx: p.x, cy: p.y, left: e.clientX, top: e.clientY, value: '' });
      return;
    }
    canvasRef.current?.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    const p = pt(e);
    draftRef.current = tool === 'pen' ? { tool: 'pen', points: [p] } : { tool: tool as 'box' | 'arrow', a: p, b: p };
    render();
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drawingRef.current || !draftRef.current) return;
    const p = pt(e);
    const d = draftRef.current;
    if (d.tool === 'pen') d.points.push(p);
    else if (d.tool === 'box' || d.tool === 'arrow') d.b = p;
    render();
  };
  const onUp = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const d = draftRef.current;
    draftRef.current = null;
    if (!d) return;
    // Drop accidental zero-size shapes (a click without a drag) for box/arrow.
    if ((d.tool === 'box' || d.tool === 'arrow') && Math.abs(d.b.x - d.a.x) < 4 && Math.abs(d.b.y - d.a.y) < 4) { render(); return; }
    if (d.tool === 'pen' && d.points.length < 2) { render(); return; }
    setShapes((prev) => [...prev, d]);
  };

  const undo = () => setShapes((prev) => prev.slice(0, -1));
  const clear = () => { setShapes([]); setEditing(null); };

  // Commit the in-progress text label into a shape (Enter or blur).
  const commitText = () => {
    if (editing && editing.value.trim()) {
      const ed = editing;
      setShapes((prev) => [...prev, { tool: 'text', a: { x: ed.cx, y: ed.cy }, text: ed.value }]);
    }
    setEditing(null);
  };

  const done = () => {
    render(); // ensure the final frame is composited
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    // Bake any uncommitted text label (Done clicked while still typing).
    if (canvas && ctx && editing && editing.value.trim()) {
      drawShape(ctx, { tool: 'text', a: { x: editing.cx, y: editing.cy }, text: editing.value });
    }
    if (canvas) onDone(canvas.toDataURL('image/png'));
    else onCancel();
  };

  const TOOLS: { key: Tool; label: string; Icon: typeof Pencil }[] = [
    { key: 'pen', label: 'Pen', Icon: Pencil },
    { key: 'box', label: 'Box', Icon: Square },
    { key: 'arrow', label: 'Arrow', Icon: ArrowUpRight },
    { key: 'text', label: 'Text', Icon: Type },
  ];

  return (
    <div
      data-feedback-ignore="true"
      role="dialog"
      aria-label="Annotate screenshot"
      style={{
        position: 'fixed', inset: 0, zIndex: 10010, background: 'rgba(0,0,0,0.6)',
        // The annotator renders inside the Radix Dialog portal, but Radix's modal mode sets
        // pointer-events:none on everything outside the active dialog content. Without this
        // override the overlay paints on top but receives no clicks.
        pointerEvents: 'auto',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 12, padding: 16, fontFamily: 'inherit',
      }}
    >
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--background, #fff)', padding: 8, borderRadius: 10, boxShadow: '0 6px 20px rgba(0,0,0,0.25)' }}>
        {TOOLS.map(({ key, label, Icon }) => {
          const active = tool === key;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={active}
              title={label}
              onClick={() => setTool(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, height: 32, padding: '0 12px', borderRadius: 7, fontSize: 13,
                cursor: 'pointer', transition: 'all 120ms ease',
                border: active ? '1px solid var(--xz-teal, #0E7C86)' : '1px solid var(--border, #E2E4E5)',
                background: active ? 'var(--xz-teal, #0E7C86)' : 'transparent',
                color: active ? '#fff' : 'var(--foreground, #1a1a1a)',
              }}
            >
              <Icon size={15} /> {label}
            </button>
          );
        })}
        <span style={{ width: 1, height: 22, background: 'var(--border, #E2E4E5)', margin: '0 2px' }} />
        <button type="button" title="Undo" onClick={undo} disabled={!shapes.length} style={toolbarIcon(!shapes.length)}><Undo2 size={15} /></button>
        <button type="button" title="Clear" onClick={clear} disabled={!shapes.length} style={toolbarIcon(!shapes.length)}><Trash2 size={15} /></button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        style={{
          display: 'block', maxWidth: 'min(820px, 92vw)', maxHeight: '64vh', width: 'auto', height: 'auto',
          touchAction: 'none', cursor: tool === 'text' ? 'text' : 'crosshair', borderRadius: 6, background: '#fff',
          boxShadow: '0 6px 20px rgba(0,0,0,0.35)',
        }}
      />

      {/* Inline text input — appears at the click point when the Text tool is used */}
      {editing && (
        <input
          autoFocus
          value={editing.value}
          onChange={(e) => setEditing({ ...editing, value: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); commitText(); }
            else if (e.key === 'Escape') { e.preventDefault(); setEditing(null); }
          }}
          onBlur={commitText}
          placeholder="Type, then Enter"
          style={{
            position: 'fixed', left: editing.left, top: editing.top, zIndex: 10011,
            font: '600 16px ui-sans-serif, system-ui, -apple-system, sans-serif', color: RED,
            background: 'rgba(255,255,255,0.92)', border: `1px solid ${RED}`, borderRadius: 4,
            padding: '2px 6px', outline: 'none', minWidth: 140,
          }}
        />
      )}

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>
          Pick a tool, then draw on the image. Text: click, type, Enter. Done bakes it in.
        </span>
        <button type="button" onClick={onCancel} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 16px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.4)', background: 'transparent', color: '#fff', fontSize: 14, cursor: 'pointer' }}>
          <X size={15} /> Cancel
        </button>
        <button type="button" onClick={done} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 16px', borderRadius: 7, border: 'none', background: 'var(--xz-teal, #0E7C86)', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
          <Check size={15} /> Done
        </button>
      </div>
    </div>
  );
}

function toolbarIcon(disabled: boolean): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 7,
    border: '1px solid var(--border, #E2E4E5)', background: 'transparent',
    color: 'var(--foreground, #1a1a1a)', opacity: disabled ? 0.4 : 1,
    cursor: disabled ? 'default' : 'pointer',
  };
}
