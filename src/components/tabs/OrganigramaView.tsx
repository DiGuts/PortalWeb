import React, { useState, useRef, useCallback, useMemo, useLayoutEffect, useEffect, memo } from 'react';
import { X, Users, Crown, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Employee } from '../../api';
import { DEPT_CANONICAL, avatarBg } from '../../lib/depts';
import { resolveImg } from '../../lib/resolveImg';

// ── Layout constants ──────────────────────────────────────────────────────────
const NODE_W = 172;
const NODE_H = 120;
const NODE_GAP = 28;
const CANVAS_PAD_X = 100;
const CANVAS_PAD_Y = 64;
const DIR_W = 248;
const DIR_H = 80;
const DEPT_Y = 210;

const DIRECTION_FALLBACK = { label: 'DIRECCIÓN', responsible: 'David Vilanova Fabregà' };

interface DeptGroup {
  name: string;
  employees: Employee[];
  head: Employee | null;
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ emp, size = 34 }: { emp: Employee; size?: number }) {
  if (emp.avatar_url) {
    return <img src={resolveImg(emp.avatar_url)} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: avatarBg(emp.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.floor(size * 0.3), fontWeight: 700, color: '#f7f7f2', flexShrink: 0 }}>
      {emp.initials}
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface OrganigramaViewProps {
  employees: Employee[];
  search: string;
  deptFilters: string[];
}

// ── OrganigramaView ───────────────────────────────────────────────────────────
export function OrganigramaView({ employees, search, deptFilters }: OrganigramaViewProps) {
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  // Measured layout: height fills viewport, negative margins escape container padding
  const [canvasH, setCanvasH] = useState<number | null>(null);
  const [bleed, setBleed] = useState({ ml: 0, mr: 0 });

  // Ref-based transform — bypasses React render cycle for 60fps zoom/pan
  const viewRef = useRef({ x: 0, y: 0, scale: 0.8 });
  const canvasTransformRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const initializedRef = useRef(false);

  // Full-bleed: let the canvas escape container padding to fill main's full width
  useEffect(() => {
    document.body.classList.add('org-view-active');
    return () => document.body.classList.remove('org-view-active');
  }, []);

  // Measure height + horizontal bleed on mount and resize
  useEffect(() => {
    const measure = () => {
      if (!rootRef.current) return;
      const rect = rootRef.current.getBoundingClientRect();
      setCanvasH(Math.max(400, window.innerHeight - rect.top - 2));
      // Escape to <main> edges (main starts right of the sidebar)
      const main = document.querySelector('main');
      const mainLeft = main ? main.getBoundingClientRect().left : 0;
      const mainRight = main ? main.getBoundingClientRect().right : window.innerWidth;
      setBleed({ ml: rect.left - mainLeft, mr: mainRight - rect.right });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Lock body scroll while mounted
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // ── Transform helpers ─────────────────────────────────────────────────────
  const applyTransform = useCallback((v: { x: number; y: number; scale: number }) => {
    viewRef.current = v;
    if (canvasTransformRef.current) {
      canvasTransformRef.current.style.transform = `translate(${v.x}px,${v.y}px) scale(${v.scale})`;
    }
  }, []);

  // For deliberate button-driven moves: smooth ease-out, then restore instant mode
  const animateTo = useCallback((v: { x: number; y: number; scale: number }) => {
    const el = canvasTransformRef.current;
    if (!el) { applyTransform(v); return; }
    el.style.transition = 'transform 360ms cubic-bezier(.23,1,.32,1)';
    applyTransform(v);
    const done = () => { el.style.transition = ''; };
    el.addEventListener('transitionend', done, { once: true });
  }, [applyTransform]);

  // ── Data ──────────────────────────────────────────────────────────────────
  const allDepts = useMemo<DeptGroup[]>(() => {
    const ordered = (DEPT_CANONICAL as readonly string[]).filter(d => d !== 'Direcció General');
    const extra = employees.map(e => e.dept).filter((d, i, arr) => arr.indexOf(d) === i && !(DEPT_CANONICAL as readonly string[]).includes(d));
    return [...ordered, ...extra]
      .map(name => {
        const emps = employees.filter(e => e.dept === name);
        if (emps.length === 0) return null;
        const head = emps.find(e => Number(e.is_head) === 1) ?? null;
        return { name, employees: emps, head };
      })
      .filter(Boolean) as DeptGroup[];
  }, [employees]);

  const directionPerson = useMemo(() => {
    const dirEmps = employees.filter(e => e.dept === 'Direcció General');
    return dirEmps.find(e => Number(e.is_head) === 1) ?? dirEmps[0] ?? null;
  }, [employees]);

  const visibleDepts = useMemo(() => {
    return allDepts.filter(d => {
      if (deptFilters.length > 0 && !deptFilters.includes(d.name)) return false;
      if (search) {
        const q = search.toLowerCase();
        return d.name.toLowerCase().includes(q) || d.employees.some(e => e.name.toLowerCase().includes(q));
      }
      return true;
    });
  }, [allDepts, deptFilters, search]);

  // ── Canvas layout ─────────────────────────────────────────────────────────
  const totalCanvasW = visibleDepts.length > 0
    ? CANVAS_PAD_X * 2 + visibleDepts.length * NODE_W + Math.max(0, visibleDepts.length - 1) * NODE_GAP
    : CANVAS_PAD_X * 2 + DIR_W;
  const totalCanvasH = CANVAS_PAD_Y + DEPT_Y + NODE_H + CANVAS_PAD_Y;
  const deptX = (i: number) => CANVAS_PAD_X + i * (NODE_W + NODE_GAP);
  const dirCX = totalCanvasW / 2;

  const centerView = useCallback((animate = false) => {
    if (!containerRef.current) return;
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    const s = Math.max(0.55, Math.min(1, (cw - 80) / totalCanvasW));
    const x = (cw - totalCanvasW * s) / 2;
    const y = Math.max(24, (ch - totalCanvasH * s) / 3);
    if (animate) animateTo({ x, y, scale: s });
    else applyTransform({ x, y, scale: s });
  }, [totalCanvasW, totalCanvasH, applyTransform, animateTo]);

  useLayoutEffect(() => {
    if (initializedRef.current || employees.length === 0 || canvasH === null) return;
    initializedRef.current = true;
    // Slight delay so containerRef has correct dimensions after height is set
    requestAnimationFrame(() => centerView(false));
  }, [employees.length, canvasH, centerView]);

  // Auto-center when search/filter changes result set
  useEffect(() => {
    if (!initializedRef.current) return;
    requestAnimationFrame(() => centerView(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleDepts.length, search]);

  // ── Pan: direct DOM ───────────────────────────────────────────────────────
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-node]')) return;
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    if (containerRef.current) containerRef.current.style.cursor = 'grabbing';
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    const v = viewRef.current;
    applyTransform({ x: v.x + dx, y: v.y + dy, scale: v.scale });
  }, [applyTransform]);

  const onMouseUp = useCallback(() => {
    dragging.current = false;
    if (containerRef.current) containerRef.current.style.cursor = 'grab';
  }, []);

  // ── Wheel + touch: attach directly as non-passive so preventDefault works ──
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.10 : 1 / 1.10;
      const v = viewRef.current;
      const ns = Math.min(3, Math.max(0.2, v.scale * factor));
      const cx = (mx - v.x) / v.scale;
      const cy = (my - v.y) / v.scale;
      applyTransform({ scale: ns, x: mx - cx * ns, y: my - cy * ns });
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1 && dragging.current) {
        const dx = e.touches[0].clientX - lastPos.current.x;
        const dy = e.touches[0].clientY - lastPos.current.y;
        lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        const v = viewRef.current;
        applyTransform({ x: v.x + dx, y: v.y + dy, scale: v.scale });
      } else if (e.touches.length === 2 && lastTouchDist.current !== null && lastTouchMid.current !== null) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const factor = dist / lastTouchDist.current;
        lastTouchDist.current = dist;
        const mid = lastTouchMid.current;
        const v = viewRef.current;
        const ns = Math.min(3, Math.max(0.2, v.scale * factor));
        const cx = (mid.x - v.x) / v.scale;
        const cy = (mid.y - v.y) / v.scale;
        applyTransform({ scale: ns, x: mid.x - cx * ns, y: mid.y - cy * ns });
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
      el.removeEventListener('touchmove', handleTouchMove);
    };
  }, [applyTransform]);

  // Zoom button helpers (animated)
  const zoomBy = useCallback((factor: number) => {
    const v = viewRef.current;
    const cw = containerRef.current?.clientWidth ?? 800;
    const ch = containerRef.current?.clientHeight ?? 600;
    const ns = Math.min(3, Math.max(0.2, v.scale * factor));
    const cx = (cw / 2 - v.x) / v.scale;
    const cy = (ch / 2 - v.y) / v.scale;
    animateTo({ scale: ns, x: cw / 2 - cx * ns, y: ch / 2 - cy * ns });
  }, [animateTo]);

  // Touch
  const lastTouchDist = useRef<number | null>(null);
  const lastTouchMid = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      dragging.current = true;
      lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      dragging.current = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist.current = Math.hypot(dx, dy);
      lastTouchMid.current = { x: (e.touches[0].clientX + e.touches[1].clientX) / 2, y: (e.touches[0].clientY + e.touches[1].clientY) / 2 };
    }
  }, []);


  const onTouchEnd = useCallback(() => {
    dragging.current = false;
    lastTouchDist.current = null;
    lastTouchMid.current = null;
  }, []);

  const selectedDeptData = selectedDept ? allDepts.find(d => d.name === selectedDept) ?? null : null;

  return (
    <div
      ref={rootRef}
      style={{
        height: canvasH != null ? canvasH : 'calc(100vh - 280px)',
        minHeight: 400,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        marginLeft: -bleed.ml,
        marginRight: -bleed.mr,
        borderTop: '1px solid var(--tavil-border)',
        borderBottom: '1px solid var(--tavil-border)',
      }}
    >
      {/* ── Canvas ── */}
      <div
        ref={containerRef}
        style={{ flex: 1, overflow: 'hidden', position: 'relative', cursor: 'grab' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Dot grid */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.4 }}>
          <defs>
            <pattern id="org-dot-grid" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1.5" fill="var(--tavil-border)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#org-dot-grid)" />
        </svg>

        {/* Canvas — transform via ref, no React state */}
        <div
          ref={canvasTransformRef}
          style={{ position: 'absolute', transformOrigin: '0 0', willChange: 'transform', userSelect: 'none' }}
        >
          {/* SVG connector lines */}
          <svg style={{ position: 'absolute', top: 0, left: 0, width: totalCanvasW, height: totalCanvasH, pointerEvents: 'none', overflow: 'visible' }}>
            {visibleDepts.map((dept, i) => {
              const dCX = deptX(i) + NODE_W / 2;
              const fromY = CANVAS_PAD_Y + DIR_H;
              const toY = CANVAS_PAD_Y + DEPT_Y;
              const midY = fromY + (toY - fromY) * 0.5;
              return (
                <path
                  key={dept.name}
                  d={`M ${dirCX} ${fromY} C ${dirCX} ${midY}, ${dCX} ${midY}, ${dCX} ${toY}`}
                  fill="none"
                  stroke="var(--tavil-border)"
                  strokeWidth={1.5}
                />
              );
            })}
          </svg>

          {/* Direction node */}
          <div
            data-node="direction"
            style={{
              position: 'absolute',
              left: dirCX - DIR_W / 2,
              top: CANVAS_PAD_Y,
              width: DIR_W, height: DIR_H,
              background: 'var(--tavil-text)', color: 'var(--tavil-bg)',
              borderRadius: 16, display: 'flex', alignItems: 'center', gap: 14,
              padding: '0 20px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', cursor: 'default',
            }}
          >
            {directionPerson ? (
              <Avatar emp={directionPerson} size={36} />
            ) : (
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Crown size={16} />
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.12em', opacity: 0.55, textTransform: 'uppercase', marginBottom: 3 }}>
                {DIRECTION_FALLBACK.label}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.01em' }}>
                {directionPerson?.name ?? DIRECTION_FALLBACK.responsible}
              </div>
            </div>
          </div>

          {/* Dept nodes — memoized, won't re-render during zoom/pan */}
          {visibleDepts.map((dept, i) => (
            <DeptNode
              key={dept.name}
              dept={dept}
              x={deptX(i)}
              y={CANVAS_PAD_Y + DEPT_Y}
              isSelected={selectedDept === dept.name}
              onClick={() => setSelectedDept(selectedDept === dept.name ? null : dept.name)}
            />
          ))}

          {/* Canvas bounds spacer */}
          <div style={{ position: 'absolute', left: 0, top: 0, width: totalCanvasW, height: totalCanvasH, pointerEvents: 'none' }} />
        </div>

        {/* Zoom controls */}
        <div style={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 4, zIndex: 5 }}>
          <OrgZoomBtn icon={<ZoomIn size={15} />} title="Apropar" onClick={() => zoomBy(1.25)} />
          <OrgZoomBtn icon={<ZoomOut size={15} />} title="Allunyar" onClick={() => zoomBy(1 / 1.25)} />
          <OrgZoomBtn icon={<Maximize2 size={14} />} title="Centrar" onClick={() => { initializedRef.current = false; centerView(true); }} />
        </div>

        {/* Empty state */}
        {employees.length > 0 && visibleDepts.length === 0 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--tavil-faint)', gap: 10, pointerEvents: 'none' }}>
            <Users size={36} style={{ opacity: 0.25 }} />
            <span style={{ fontSize: 13.5 }}>Cap departament coincideix</span>
          </div>
        )}
        {employees.length === 0 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tavil-faint)', pointerEvents: 'none' }}>
            <span style={{ fontSize: 13.5, letterSpacing: '-0.01em' }}>Carregant organigrama…</span>
          </div>
        )}
      </div>

      {/* Right panel */}
      {selectedDeptData && (
        <DeptPanel dept={selectedDeptData} onClose={() => setSelectedDept(null)} />
      )}
    </div>
  );
}

// ── DeptNode (memoized — won't re-render during zoom/pan) ─────────────────────
const DeptNode = memo(function DeptNode({ dept, x, y, isSelected, onClick }: {
  dept: DeptGroup; x: number; y: number; isSelected: boolean; onClick: () => void;
}) {
  return (
    <div
      data-node="dept"
      onClick={onClick}
      className={isSelected ? '' : 'org-node-hover'}
      style={{
        position: 'absolute', left: x, top: y, width: NODE_W, height: NODE_H,
        background: isSelected ? 'var(--tavil-accent)' : 'var(--tavil-card)',
        border: `1.5px solid ${isSelected ? 'var(--tavil-accent)' : 'var(--tavil-border)'}`,
        borderRadius: 14, cursor: 'pointer',
        padding: '12px 14px', boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column', gap: 7,
        transition: 'background 150ms ease-out, border-color 150ms ease-out, box-shadow 200ms cubic-bezier(.23,1,.32,1)',
        boxShadow: isSelected ? '0 6px 20px rgba(0,0,0,0.16)' : '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        {dept.head ? (
          <Avatar emp={dept.head} size={28} />
        ) : (
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: isSelected ? 'rgba(255,255,255,0.2)' : 'var(--tavil-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Users size={12} style={{ color: isSelected ? '#fff' : 'var(--tavil-muted)' }} />
          </div>
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', lineHeight: 1.3,
            color: isSelected ? 'rgba(255,255,255,0.75)' : 'var(--tavil-accent)',
            wordBreak: 'break-word',
          }}>
            {dept.name}
          </div>
        </div>
      </div>
      {dept.head && (
        <div style={{ fontSize: 11.5, fontWeight: 500, color: isSelected ? 'rgba(255,255,255,0.92)' : 'var(--tavil-text)', lineHeight: 1.3, letterSpacing: '-0.005em' }}>
          {dept.head.name.split(' ').slice(0, 3).join(' ')}
        </div>
      )}
      <div style={{
        position: 'absolute', bottom: 9, right: 10,
        background: isSelected ? 'rgba(255,255,255,0.18)' : 'var(--tavil-bg)',
        border: `1px solid ${isSelected ? 'transparent' : 'var(--tavil-border)'}`,
        borderRadius: 999, padding: '2px 7px',
        fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
        color: isSelected ? '#fff' : 'var(--tavil-muted)',
      }}>
        {dept.employees.length}
      </div>
    </div>
  );
});

// ── DeptPanel ─────────────────────────────────────────────────────────────────
function DeptPanel({ dept, onClose }: { dept: DeptGroup; onClose: () => void }) {
  const heads = dept.employees.filter(e => Number(e.is_head) === 1);
  const members = dept.employees.filter(e => Number(e.is_head) !== 1);

  return (
    <div style={{
      position: 'absolute', top: 0, right: 0, bottom: 0,
      width: 'clamp(280px, 33%, 400px)',
      background: 'var(--tavil-bg)',
      borderLeft: '1px solid var(--tavil-border)',
      display: 'flex', flexDirection: 'column',
      boxShadow: '-6px 0 32px rgba(0,0,0,0.08)',
      zIndex: 10,
      animation: 'tavil-panel-enter 0.22s var(--ease-out-cubic) both',
    }}>
      <div style={{ flexShrink: 0, padding: '16px 16px 14px', borderBottom: '1px solid var(--tavil-border)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, color: 'var(--tavil-accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 3 }}>Persones de</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--tavil-text)', lineHeight: 1.2, letterSpacing: '-0.01em', wordBreak: 'break-word' }}>{dept.name}</div>
          <div style={{ fontSize: 12, color: 'var(--tavil-muted)', marginTop: 3 }}>{dept.employees.length} {dept.employees.length === 1 ? 'persona' : 'persones'}</div>
        </div>
        <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--tavil-muted)', flexShrink: 0 }}>
          <X size={14} />
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
        {(heads.length > 0 || (heads.length === 0 && dept.head)) && (
          <>
            <SectionLabel label="Responsables" />
            {heads.length > 0
              ? heads.map(e => <PanelCard emp={e} key={e.id} isHead />)
              : <PanelCard emp={dept.head!} isHead />
            }
            {members.length > 0 && <div style={{ height: 1, background: 'var(--tavil-border)', margin: '10px 16px' }} />}
          </>
        )}
        {members.length > 0 && (
          <>
            <SectionLabel label="Empleados" />
            {members.map(e => <PanelCard emp={e} key={e.id} />)}
          </>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div style={{ padding: '0 16px 7px', fontSize: 10, fontWeight: 700, color: 'var(--tavil-muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
      {label}
    </div>
  );
}

function PanelCard({ emp, isHead = false }: { emp: Employee; isHead?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '7px 16px' }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <Avatar emp={emp} size={38} />
        {isHead && (
          <div style={{ position: 'absolute', bottom: -2, right: -2, width: 13, height: 13, borderRadius: '50%', background: 'var(--tavil-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid var(--tavil-bg)' }}>
            <Crown size={7} style={{ color: '#fff' }} />
          </div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--tavil-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.005em' }}>{emp.name}</div>
        <div style={{ fontSize: 11.5, color: 'var(--tavil-muted)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.role || emp.dept}</div>
      </div>
    </div>
  );
}

function OrgZoomBtn({ icon, onClick, title }: { icon: React.ReactNode; onClick: () => void; title?: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 34, height: 34, borderRadius: 9,
        background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)',
        cursor: 'pointer', color: 'var(--tavil-text)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
        transition: 'background 140ms ease-out',
      }}
    >
      {icon}
    </button>
  );
}
