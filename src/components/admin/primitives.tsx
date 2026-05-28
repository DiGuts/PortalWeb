import React, { useState, useEffect, ReactNode, CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { Search, Plus, X, FileText, Check } from 'lucide-react';
import { API_BASE } from '../../api';

// ── Font constants ──────────────────────────────────────────────────────────
export const F_DISPLAY = "'Barlow Condensed', 'Instrument Sans', system-ui, sans-serif";
export const F_BODY = "'Barlow Semi Condensed', 'Instrument Sans', system-ui, sans-serif";
export const F_MONO = "'JetBrains Mono', ui-monospace, monospace";

// ── Theme tokens (CSS var hooks) ────────────────────────────────────────────
export const T = {
  bg: 'var(--tavil-bg)',
  bgAlt: 'var(--tavil-bgAlt)',
  card: 'var(--tavil-card)',
  text: 'var(--tavil-text)',
  textMuted: 'var(--tavil-muted)',
  textFaint: 'var(--tavil-faint)',
  border: 'var(--tavil-border)',
  accent: 'var(--tavil-accent)',
  accentDark: 'var(--tavil-accent-dark)',
  accentLight: 'var(--tavil-accent-light)',
};

// ── URL helper (admin uploads) ──────────────────────────────────────────────
export function resolveUploadUrl(p: string): string {
  if (!p) return '';
  if (p.startsWith('/uploads/')) return API_BASE + p;
  if (p.startsWith('http')) return p;
  return p;
}

// ── Primitives ──────────────────────────────────────────────────────────────

export function AdminFont({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ fontFamily: F_BODY, color: T.text, ...style }}>{children}</div>;
}

export function AdminHeader({ kicker = 'Administració', title, subtitle, actions, badge = 'ADMIN' }: {
  kicker?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  badge?: string | null;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      gap: 24, padding: '32px 0 22px', marginBottom: 20,
      borderBottom: `1px solid ${T.border}`,
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          fontSize: 11, fontWeight: 600, color: T.textFaint,
          textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 12,
        }}>
          {badge && (
            <span style={{
              fontSize: 9.5, padding: '2px 7px', borderRadius: 3,
              background: T.accent, color: '#fff', letterSpacing: '0.14em',
              fontWeight: 700,
            }}>{badge}</span>
          )}
          {kicker}
        </div>
        <h1 style={{
          fontFamily: F_DISPLAY, fontSize: 46, fontWeight: 600,
          letterSpacing: '-0.005em', lineHeight: 1, margin: 0,
          color: T.text,
        }}>{title}</h1>
        {subtitle && (
          <div style={{ fontSize: 14, color: T.textMuted, marginTop: 10, maxWidth: 620 }}>
            {subtitle}
          </div>
        )}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>{actions}</div>}
    </div>
  );
}

export function AdminToolbar({ children }: { children: ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      marginBottom: 14,
    }}>{children}</div>
  );
}

export function AdminSearch({ value, onChange, placeholder = 'Cerca…' }: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}) {
  return (
    <div style={{ position: 'relative', flex: 1, minWidth: 220, maxWidth: 380 }}>
      <Search size={15} style={{
        position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
        color: T.textFaint, pointerEvents: 'none',
      }} />
      <input
        value={value} onChange={onChange} placeholder={placeholder}
        style={{
          width: '100%', height: 40, padding: '0 14px 0 38px',
          background: T.bgAlt, color: T.text,
          border: `1px solid ${T.border}`, borderRadius: 8,
          fontFamily: F_BODY, fontSize: 14, outline: 'none', boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

type PillOption = { id: string; label: string; count?: number };
export function AdminFilterPills({ value, options, onChange }: {
  value: string;
  options: PillOption[];
  onChange: (id: string) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
      {options.map(o => {
        const active = value === o.id;
        return (
          <button key={o.id} onClick={() => onChange(o.id)} style={{
            padding: '6px 14px', borderRadius: 8, minHeight: 36,
            background: active ? T.text : 'white',
            color: active ? T.bg : T.textMuted,
            border: `1px solid ${active ? T.text : T.border}`,
            cursor: 'pointer',
            fontFamily: F_BODY, fontSize: 13, fontWeight: 500,
            transition: 'background 140ms, border-color 140ms, color 140ms',
          }}>
            {o.label}
            {o.count != null && (
              <span style={{ marginLeft: 6, fontSize: 11, opacity: active ? 0.75 : 0.6, fontFeatureSettings: '"tnum"' }}>{o.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'accent' | 'danger';
export function ABtn({ children, onClick, variant = 'primary', icon: Icon, iconRight: IconRight, size = 'md', disabled, style }: {
  children: ReactNode;
  onClick?: () => void;
  variant?: BtnVariant;
  icon?: React.ComponentType<{ size?: number }>;
  iconRight?: React.ComponentType<{ size?: number }>;
  size?: 'sm' | 'md';
  disabled?: boolean;
  style?: CSSProperties;
}) {
  const variants: Record<BtnVariant, { bg: string; color: string; border: string; hover: string }> = {
    primary:   { bg: T.text,       color: T.bg,    border: T.text,         hover: T.text },
    secondary: { bg: T.card,       color: T.text,  border: T.border,       hover: T.bgAlt },
    ghost:     { bg: 'transparent', color: T.textMuted, border: 'transparent', hover: T.bgAlt },
    accent:    { bg: T.accent,     color: '#fff',  border: T.accent,       hover: T.accentDark },
    danger:    { bg: 'transparent', color: T.accent, border: T.accent,     hover: T.accentLight },
  };
  const v = variants[variant];
  const s = size === 'sm' ? { h: 34, px: 12, fs: 13 } : { h: 42, px: 16, fs: 14 };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      height: s.h, padding: `0 ${s.px}px`, borderRadius: 7,
      background: v.bg, color: v.color, border: `1px solid ${v.border}`,
      display: 'inline-flex', alignItems: 'center', gap: 6,
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
      fontFamily: F_BODY, fontSize: s.fs, fontWeight: 600,
      whiteSpace: 'nowrap', transition: 'background 140ms', ...style,
    }}
    onMouseEnter={(e) => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = v.hover; }}
    onMouseLeave={(e) => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = v.bg; }}>
      {Icon && <Icon size={14} />}
      <span>{children}</span>
      {IconRight && <IconRight size={14} />}
    </button>
  );
}

const STATUS_MAP: Record<string, { label: string; dot: string; bg: string; color: string }> = {
  published: { label: 'Publicat',  dot: 'var(--status-ok-fg)',   bg: 'var(--status-ok-bg)',    color: 'var(--status-ok-fg)' },
  draft:     { label: 'Esborrany', dot: 'var(--status-warn-fg)', bg: 'var(--status-warn-bg)',  color: 'var(--status-warn-fg)' },
  scheduled: { label: 'Programat', dot: T.accent,                bg: T.accentLight,             color: T.accentDark },
  archived:  { label: 'Arxivat',   dot: T.textFaint,             bg: T.bgAlt,                   color: T.textMuted },
  active:    { label: 'Actiu',     dot: 'var(--status-ok-fg)',   bg: 'var(--status-ok-bg)',    color: 'var(--status-ok-fg)' },
  inactive:  { label: 'Inactiu',   dot: T.textFaint,             bg: T.bgAlt,                   color: T.textMuted },
  pending:   { label: 'Pendent',   dot: 'var(--status-warn-fg)', bg: 'var(--status-warn-bg)',  color: 'var(--status-warn-fg)' },
  full:      { label: 'Complet',   dot: 'var(--status-warn-fg)', bg: 'var(--status-warn-bg)',  color: 'var(--status-warn-fg)' },
  upcoming:  { label: 'Proper',    dot: T.accent,                bg: T.accentLight,             color: T.accentDark },
};
export function AStatusPill({ status }: { status: string }) {
  const it = STATUS_MAP[status] || { label: status, dot: T.textFaint, bg: T.bgAlt, color: T.textMuted };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      padding: '4px 11px 4px 9px', borderRadius: 5,
      background: it.bg, color: it.color,
      fontFamily: F_BODY, fontSize: 12, fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '0.08em',
    }}>
      <span style={{ width: 7, height: 7, borderRadius: 4, background: it.dot }} />
      {it.label}
    </span>
  );
}

const ROLE_MAP: Record<string, { label: string; bg: string; color: string; border: string }> = {
  admin:   { label: 'Admin',   bg: T.accentLight, color: T.accentDark, border: T.accent + '33' },
  editor:  { label: 'Editor',  bg: T.bgAlt,       color: T.text,        border: T.border },
  empleat: { label: 'Empleat', bg: 'transparent', color: T.textMuted,   border: T.border },
};
export function ARolePill({ role }: { role: string }) {
  const it = ROLE_MAP[role] || ROLE_MAP.empleat;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 10px', borderRadius: 5,
      background: it.bg, color: it.color, border: `1px solid ${it.border}`,
      fontFamily: F_BODY, fontSize: 12, fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '0.1em',
    }}>{it.label}</span>
  );
}

export type Column<T> = {
  key: string;
  label: string;
  width?: string;
  align?: 'left' | 'right' | 'center';
  wrap?: boolean;
  render?: (row: T) => ReactNode;
};

export function AdminTable<TRow extends { id: number | string }>({ columns, rows, selectedId, onRowClick, emptyMessage = 'No hi ha resultats.' }: {
  columns: Column<TRow>[];
  rows: TRow[];
  selectedId?: number | string | null;
  onRowClick?: (id: number | string) => void;
  emptyMessage?: string;
}) {
  const gridTemplate = columns.map(c => c.width || 'minmax(0, 1fr)').join(' ');
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`, borderRadius: 10,
      overflow: 'hidden', fontFamily: F_BODY,
    }}>
      <div style={{
        display: 'grid', gridTemplateColumns: gridTemplate,
        padding: '14px 18px', gap: 16,
        background: T.bgAlt, borderBottom: `1px solid ${T.border}`,
        fontSize: 11.5, fontWeight: 600, color: T.textMuted,
        textTransform: 'uppercase', letterSpacing: '0.12em',
      }}>
        {columns.map(c => (
          <div key={c.key} style={{ textAlign: c.align || 'left' }}>{c.label}</div>
        ))}
      </div>
      {rows.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: T.textFaint, fontSize: 13 }}>
          {emptyMessage}
        </div>
      ) : rows.map((row, i) => {
        const isActive = selectedId === row.id;
        return (
          <div key={row.id} onClick={() => onRowClick && onRowClick(row.id)} style={{
            display: 'grid', gridTemplateColumns: gridTemplate,
            padding: '16px 18px', gap: 16, alignItems: 'center', minHeight: 56,
            borderBottom: i < rows.length - 1 ? `1px solid ${T.border}` : 'none',
            background: isActive ? `color-mix(in srgb, ${T.accentLight} 70%, transparent)` : 'transparent',
            cursor: onRowClick ? 'pointer' : 'default',
            fontSize: 14, color: T.text, position: 'relative',
            transition: 'background 120ms',
          }}
          onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = T.bgAlt; }}
          onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}>
            {isActive && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: T.accent }} />}
            {columns.map(c => (
              <div key={c.key} style={{ textAlign: c.align || 'left', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: c.wrap ? 'normal' : 'nowrap' }}>
                {c.render ? c.render(row) : (row as any)[c.key]}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export function AdminTwoPane({ left, right, ratio = '1.8fr 1fr' }: { left: ReactNode; right: ReactNode; ratio?: string }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: ratio, gap: 20, alignItems: 'start',
    }} className="admin-twopane">
      <div style={{ minWidth: 0 }}>{left}</div>
      <div style={{ minWidth: 0 }}>{right}</div>
    </div>
  );
}

export function AdminDetail({ title, badge, onClose, footer, children }: {
  title: string;
  badge?: string;
  onClose?: () => void;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`, borderRadius: 10,
      display: 'flex', flexDirection: 'column', fontFamily: F_BODY,
      position: 'sticky', top: 90, maxHeight: 'calc(100vh - 120px)',
    }}>
      <div style={{
        padding: '14px 16px', borderBottom: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {badge && (
            <div style={{
              fontSize: 10, fontWeight: 600, color: T.accent,
              textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 3,
            }}>{badge}</div>
          )}
          <div style={{
            fontFamily: F_DISPLAY, fontSize: 24, fontWeight: 500,
            letterSpacing: '-0.005em', lineHeight: 1.05, color: T.text,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{title}</div>
        </div>
        {onClose && (
          <button onClick={onClose} aria-label="Tanca" style={{
            width: 36, height: 36, borderRadius: 18, background: 'transparent',
            border: 'none', cursor: 'pointer', color: T.textMuted,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><X size={18} /></button>
        )}
      </div>
      <div style={{
        flex: 1, padding: 18, overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>{children}</div>
      {footer && (
        <div style={{
          padding: '12px 16px', borderTop: `1px solid ${T.border}`,
          display: 'flex', justifyContent: 'flex-end', gap: 8, background: T.bgAlt,
        }}>{footer}</div>
      )}
    </div>
  );
}

export function AdminDetailEmpty({ icon: Icon = FileText, label, hint }: {
  icon?: React.ComponentType<{ size?: number }>;
  label: string;
  hint: string;
}) {
  return (
    <div style={{
      border: `1px dashed ${T.border}`, borderRadius: 10,
      padding: '60px 30px', textAlign: 'center', color: T.textFaint,
      fontFamily: F_BODY, position: 'sticky', top: 90,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 22, margin: '0 auto 14px',
        background: T.bgAlt, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: T.textMuted,
      }}><Icon size={20} /></div>
      <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 12.5, lineHeight: 1.45 }}>{hint}</div>
    </div>
  );
}

export function AField({ label, hint, optional, children }: {
  label: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <label style={{ display: 'block', fontFamily: F_BODY }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
        <span style={{
          fontSize: 12, fontWeight: 600, color: T.textMuted,
          textTransform: 'uppercase', letterSpacing: '0.12em',
        }}>{label}</span>
        {optional && <span style={{ fontSize: 11, color: T.textFaint, fontStyle: 'italic' }}>opcional</span>}
      </div>
      {children}
      {hint && <div style={{ fontSize: 12.5, color: T.textMuted, marginTop: 6, lineHeight: 1.45 }}>{hint}</div>}
    </label>
  );
}

export function AInput({ value, onChange, placeholder, type = 'text', icon: Icon, ...rest }: {
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  icon?: React.ComponentType<{ size?: number; style?: CSSProperties }>;
  [key: string]: any;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      {Icon && <Icon size={14} style={{
        position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.textFaint,
      }} />}
      <input
        type={type} value={value ?? ''} onChange={onChange} placeholder={placeholder}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{
          width: '100%', height: 44, padding: Icon ? '0 14px 0 38px' : '0 14px',
          background: T.card, color: T.text,
          border: `1px solid ${focus ? T.accent : T.border}`,
          boxShadow: focus ? `0 0 0 3px ${T.accentLight}` : 'none',
          borderRadius: 8, outline: 'none', boxSizing: 'border-box',
          fontFamily: F_BODY, fontSize: 14.5,
          transition: 'border-color 140ms, box-shadow 140ms',
        }}
        {...rest}
      />
    </div>
  );
}

export function ATextarea({ value, onChange, placeholder, rows = 4 }: {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <textarea
      value={value ?? ''} onChange={onChange} placeholder={placeholder} rows={rows}
      onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
      style={{
        width: '100%', padding: 14, resize: 'vertical',
        background: T.card, color: T.text,
        border: `1px solid ${focus ? T.accent : T.border}`,
        boxShadow: focus ? `0 0 0 3px ${T.accentLight}` : 'none',
        borderRadius: 8, outline: 'none', boxSizing: 'border-box',
        fontFamily: F_BODY, fontSize: 14.5, lineHeight: 1.55,
        transition: 'border-color 140ms, box-shadow 140ms',
      }}
    />
  );
}

export function ASelect({ value, onChange, options }: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: (string | { value: string; label: string })[];
}) {
  return (
    <select value={value} onChange={onChange} style={{
      width: '100%', height: 44, padding: '0 14px',
      background: T.card, color: T.text,
      border: `1px solid ${T.border}`, borderRadius: 8, outline: 'none',
      fontFamily: F_BODY, fontSize: 14.5, boxSizing: 'border-box',
    }}>
      {options.map(o => {
        const val = typeof o === 'string' ? o : o.value;
        const lab = typeof o === 'string' ? o : o.label;
        return <option key={val} value={val}>{lab}</option>;
      })}
    </select>
  );
}

type SegOption<V extends string> = { value: V; label: string; icon?: React.ComponentType<{ size?: number }> };
export function ASegmented<V extends string>({ value, onChange, options, dense }: {
  value: V;
  onChange: (v: V) => void;
  options: SegOption<V>[];
  dense?: boolean;
}) {
  return (
    <div style={{
      display: 'inline-flex', background: T.bgAlt, border: `1px solid ${T.border}`,
      borderRadius: 8, padding: 3, gap: 2, width: '100%',
    }}>
      {options.map(o => {
        const active = value === o.value;
        const Icon = o.icon;
        return (
          <button key={o.value} onClick={() => onChange(o.value)} style={{
            flex: 1, height: dense ? 34 : 40, padding: '0 12px', borderRadius: 6,
            background: active ? T.card : 'transparent',
            color: active ? T.text : T.textMuted,
            border: active ? `1px solid ${T.border}` : '1px solid transparent',
            cursor: 'pointer', fontFamily: F_BODY,
            fontSize: dense ? 12.5 : 13.5, fontWeight: 600,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            {Icon && <Icon size={13} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function AToggle({ value, onChange, label, hint }: {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 16px', background: T.bgAlt,
      border: `1px solid ${T.border}`, borderRadius: 8,
    }}>
      <button onClick={() => onChange(!value)} aria-pressed={value} aria-label={label} style={{
        width: 44, height: 26, borderRadius: 13, flexShrink: 0,
        background: value ? T.accent : T.border,
        position: 'relative', cursor: 'pointer', transition: 'background 180ms',
        border: 'none', padding: 0,
      }}>
        <span style={{
          position: 'absolute', top: 3, left: value ? 21 : 3, width: 20, height: 20, borderRadius: 10,
          background: '#fff', transition: 'left 180ms',
          boxShadow: '0 1px 3px rgba(0,0,0,0.22)',
        }} />
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: T.text }}>{label}</div>
        {hint && <div style={{ fontSize: 12.5, color: T.textMuted, marginTop: 3 }}>{hint}</div>}
      </div>
    </div>
  );
}

export function AChipMulti({ value, onChange, options }: {
  value: string[];
  onChange: (v: string[]) => void;
  options: { value: string; label: string }[];
}) {
  const toggle = (v: string) => {
    if (value.includes(v)) onChange(value.filter(x => x !== v));
    else onChange([...value, v]);
  };
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
      {options.map(o => {
        const active = value.includes(o.value);
        return (
          <button key={o.value} onClick={() => toggle(o.value)} style={{
            padding: '8px 14px', borderRadius: 999, minHeight: 34,
            background: active ? T.accentLight : 'transparent',
            color: active ? T.accentDark : T.textMuted,
            border: `1px solid ${active ? T.accent : T.border}`,
            cursor: 'pointer', fontFamily: F_BODY,
            fontSize: 13, fontWeight: 500,
          }}>{o.label}</button>
        );
      })}
    </div>
  );
}

export function ALangTabs({ value, onChange }: { value: 'ca' | 'es' | 'en'; onChange: (v: 'ca' | 'es' | 'en') => void }) {
  const langs: { id: 'ca' | 'es' | 'en'; label: string; name: string }[] = [
    { id: 'ca', label: 'CA', name: 'Català' },
    { id: 'es', label: 'ES', name: 'Español' },
    { id: 'en', label: 'EN', name: 'English' },
  ];
  return (
    <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}`, marginBottom: 4 }}>
      {langs.map(l => {
        const active = value === l.id;
        return (
          <button key={l.id} onClick={() => onChange(l.id)} style={{
            padding: '12px 16px', minHeight: 44, background: 'transparent',
            border: 'none', borderBottom: `2px solid ${active ? T.accent : 'transparent'}`,
            color: active ? T.text : T.textMuted,
            cursor: 'pointer', fontFamily: F_BODY,
            fontSize: 13, fontWeight: 600, letterSpacing: '0.08em',
            display: 'inline-flex', alignItems: 'center', gap: 6,
            marginBottom: -1,
          }}>
            <span>{l.label}</span>
            <span style={{ fontSize: 12, fontWeight: 400, color: T.textMuted, letterSpacing: 0 }}>{l.name}</span>
          </button>
        );
      })}
    </div>
  );
}

export function AImageDrop({ ratio = '16/9', label = 'Arrossega una imatge', hint = 'JPG / PNG · màx. 4 MB', src, onDrop }: {
  ratio?: string;
  label?: string;
  hint?: string;
  src?: string | null;
  onDrop?: (file: File) => void;
}) {
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault(); setOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file && onDrop) onDrop(file);
      }}
      style={{
        aspectRatio: ratio, width: '100%',
        border: `1.5px dashed ${over ? T.accent : T.border}`,
        borderRadius: 8,
        background: src
          ? `url(${src}) center/cover no-repeat`
          : (over ? `color-mix(in srgb, ${T.accentLight} 40%, transparent)` : T.bgAlt),
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 6, color: T.textMuted, cursor: 'pointer', fontFamily: F_BODY,
        transition: 'background 140ms, border-color 140ms',
      }}>
      {!src && (
        <>
          <Plus size={20} />
          <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
          <div style={{ fontSize: 11.5, color: T.textFaint }}>{hint}</div>
        </>
      )}
    </div>
  );
}

export function AAvatar({ name, size = 28, src }: { name: string; size?: number; src?: string | null }) {
  const initials = (name || '').split(' ').map(s => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  if (src) {
    const url = src.startsWith('/uploads/') ? `${API_BASE}${src}` : src;
    return <img src={url} alt="" style={{
      width: size, height: size, borderRadius: size / 2, flexShrink: 0, objectFit: 'cover',
    }} />;
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: size / 2, flexShrink: 0,
      background: T.accentLight, color: T.accentDark,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: F_BODY, fontSize: size * 0.4, fontWeight: 600,
    }}>{initials}</div>
  );
}

// ── AdminCreateModalShell ───────────────────────────────────────────────────
// Reusable scaffold for "Nou X" creation modals. Header (kicker + title),
// scrollable body, footer with Cancel + Save buttons. Portals to document.body
// so the backdrop covers the full viewport regardless of containing-block ancestors.

export function AdminCreateModalShell({
  open, onClose, onSubmit, title, kicker, footerNote, saveLabel = 'Crea', savingLabel = 'Creant…',
  saving = false, disabled = false, error, width = 560, children,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  title: string;
  kicker: string;
  footerNote?: ReactNode;
  saveLabel?: string;
  savingLabel?: string;
  saving?: boolean;
  disabled?: boolean;
  error?: string | null;
  width?: number;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(34,39,37,0.55)',
        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        fontFamily: F_BODY,
      }}
      className="anim-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.card, border: `1px solid ${T.border}`, borderRadius: 12,
          width: `min(${width}px, 92vw)`, maxHeight: '88vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 80px -20px rgba(34,39,37,0.40)',
        }}
        className="anim-scale-in"
      >
        <div style={{
          padding: '16px 20px', borderBottom: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 3 }}>{kicker}</div>
            <div style={{ fontFamily: F_DISPLAY, fontSize: 24, fontWeight: 500, color: T.text, lineHeight: 1.1 }}>{title}</div>
          </div>
          <button onClick={onClose} aria-label="Tanca" style={{
            width: 36, height: 36, borderRadius: 18, background: 'transparent', border: 'none',
            cursor: 'pointer', color: T.textMuted,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><X size={18} /></button>
        </div>

        <div style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 8,
              background: 'var(--status-warn-bg)', color: 'var(--status-warn-fg)',
              fontSize: 13, fontWeight: 500,
              border: '1px solid var(--status-warn-fg)',
            }}>{error}</div>
          )}
          {children}
        </div>

        <div style={{
          padding: '14px 20px', borderTop: `1px solid ${T.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
          background: T.bgAlt,
        }}>
          <span style={{ fontSize: 12, color: T.textFaint }}>
            {footerNote ?? <>&nbsp;</>}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <ABtn variant="ghost" onClick={onClose}>Cancel·la</ABtn>
            <ABtn variant="primary" icon={Check} onClick={onSubmit} disabled={saving || disabled}>
              {saving ? savingLabel : saveLabel}
            </ABtn>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
