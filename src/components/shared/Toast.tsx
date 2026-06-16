import React, {
  createContext, useContext, useState, useCallback, useEffect, useRef, useMemo,
} from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

export type ToastKind = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  message: string;
  kind: ToastKind;
  duration: number;
  exiting: boolean;
}

export interface ToastAPI {
  toast(message: string, kind?: ToastKind, duration?: number): void;
  success(message: string, duration?: number): void;
  error(message: string, duration?: number): void;
  warning(message: string, duration?: number): void;
  info(message: string, duration?: number): void;
}

// ── Design tokens ────────────────────────────────────────────────────────────

const DEFAULTS: Record<ToastKind, number> = {
  success: 3500,
  info:    4000,
  warning: 6000,
  error:   6000,
};

const KIND: Record<ToastKind, { fg: string; bg: string; ring: string }> = {
  success: { fg: 'var(--status-ok-fg)',     bg: 'var(--status-ok-bg)',     ring: 'rgba(63,122,82,0.25)'  },
  error:   { fg: 'var(--status-danger-fg)', bg: 'var(--status-danger-bg)', ring: 'rgba(196,61,61,0.25)'  },
  warning: { fg: 'var(--status-warn-fg)',   bg: 'var(--status-warn-bg)',   ring: 'rgba(182,131,58,0.25)' },
  info:    { fg: '#2e7fc2',                 bg: 'rgba(46,127,194,0.10)',   ring: 'rgba(46,127,194,0.25)' },
};

const ICONS = {
  success: CheckCircle,
  error:   XCircle,
  warning: AlertTriangle,
  info:    Info,
} satisfies Record<ToastKind, React.ComponentType<{ size: number; color: string; strokeWidth: number }>>;

// ── Context ──────────────────────────────────────────────────────────────────

const ToastCtx = createContext<ToastAPI | null>(null);

let _nextId = 0;

// ── Individual chip ──────────────────────────────────────────────────────────

function ToastChip({ item, onRemove }: { item: ToastItem; onRemove(id: string): void }) {
  const c = KIND[item.kind];
  const Icon = ICONS[item.kind];

  return (
    <div
      className={item.exiting ? 'anim-toast-out' : 'anim-toast-in'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '9px 10px 9px 10px',
        borderRadius: 999,
        background: 'var(--tavil-card)',
        border: `1px solid ${c.ring}`,
        boxShadow: '0 4px 20px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
        fontFamily: "'Instrument Sans', system-ui, sans-serif",
        fontSize: 13.5,
        fontWeight: 500,
        color: 'var(--tavil-text)',
        pointerEvents: 'auto',
        whiteSpace: 'nowrap',
        maxWidth: 'min(400px, calc(100vw - 40px))',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        userSelect: 'none',
      }}
    >
      {/* Icon badge */}
      <span style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 22,
        height: 22,
        borderRadius: 6,
        background: c.bg,
      }}>
        <Icon size={13} color={c.fg} strokeWidth={2.3} />
      </span>

      {/* Message */}
      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: 2 }}>
        {item.message}
      </span>

      {/* Dismiss */}
      <button
        onClick={() => onRemove(item.id)}
        aria-label="Tancar"
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 20,
          height: 20,
          borderRadius: '50%',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          color: 'var(--tavil-muted)',
          padding: 0,
          marginLeft: 2,
          transition: 'color 120ms',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--tavil-text)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--tavil-muted)'; }}
      >
        <X size={12} />
      </button>
    </div>
  );
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    const t = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      timers.current.delete(id);
      timers.current.delete(`x-${id}`);
    }, 240);
    timers.current.set(`x-${id}`, t);
  }, []);

  const add = useCallback((message: string, kind: ToastKind = 'success', duration?: number) => {
    const id = String(++_nextId);
    const dur = duration ?? DEFAULTS[kind];
    setToasts(prev => [...prev.slice(-4), { id, message, kind, duration: dur, exiting: false }]);
    if (dur > 0) {
      const t = setTimeout(() => dismiss(id), dur);
      timers.current.set(id, t);
    }
    return id;
  }, [dismiss]);

  useEffect(() => {
    const map = timers.current;
    return () => { map.forEach(t => clearTimeout(t)); };
  }, []);

  const api = useMemo<ToastAPI>(() => ({
    toast:   (m, k, d) => { add(m, k, d); },
    success: (m, d)    => { add(m, 'success', d); },
    error:   (m, d)    => { add(m, 'error',   d); },
    warning: (m, d)    => { add(m, 'warning', d); },
    info:    (m, d)    => { add(m, 'info',    d); },
  }), [add]);

  return (
    <ToastCtx.Provider value={api}>
      {children}
      {createPortal(
        <div
          role="region"
          aria-live="polite"
          aria-label="Notificacions"
          style={{
            position: 'fixed',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 8998,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            pointerEvents: 'none',
          }}
        >
          {toasts.map(t => (
            <ToastChip key={t.id} item={t} onRemove={dismiss} />
          ))}
        </div>,
        document.body
      )}
    </ToastCtx.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useToast(): ToastAPI {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}
