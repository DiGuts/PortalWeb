// Admin / Backoffice primitives — shared building blocks for the admin modules.
// Visual character: Barlow Condensed (display) + Barlow Semi Condensed (UI/body).
// All admin pages render inside <AdminFont> which applies the condensed family,
// so we never inherit Instrument Serif in this section.

const { useState: aPS, useRef: aPR, useEffect: aPE } = React;

const ADMIN_FONT_DISPLAY = '"Barlow Condensed", "Instrument Sans", system-ui, sans-serif';
const ADMIN_FONT_BODY = '"Barlow Semi Condensed", "Instrument Sans", system-ui, sans-serif';

// ─────────── Font wrapper ───────────
function AdminFont({ children, style }) {
  return (
    <div style={{ fontFamily: ADMIN_FONT_BODY, fontFeatureSettings: '"ss01"', ...style }}>
      {children}
    </div>
  );
}

// ─────────── Admin page header ───────────
function AdminHeader({ kicker = 'Administració', title, subtitle, actions, badge = 'ADMIN' }) {
  const { theme, accent } = useDApp();
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      gap: 24, padding: '32px 0 22px', marginBottom: 20,
      borderBottom: `1px solid ${theme.border}`,
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          fontSize: 11, fontWeight: 600, color: theme.textFaint,
          textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 12,
          fontFamily: ADMIN_FONT_BODY,
        }}>
          {badge && (
            <span style={{
              fontSize: 9.5, padding: '2px 7px', borderRadius: 3,
              background: accent.primary, color: '#fff', letterSpacing: '0.14em',
              fontWeight: 700,
            }}>{badge}</span>
          )}
          {kicker}
        </div>
        <h1 style={{
          fontFamily: ADMIN_FONT_DISPLAY, fontSize: 46, fontWeight: 500,
          letterSpacing: '-0.005em', lineHeight: 1, margin: 0,
          color: theme.text, textTransform: 'none',
        }}>{title}</h1>
        {subtitle && (
          <div style={{
            fontSize: 14, color: theme.textMuted, marginTop: 10, maxWidth: 620,
            fontFamily: ADMIN_FONT_BODY,
          }}>{subtitle}</div>
        )}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>{actions}</div>}
    </div>
  );
}

// ─────────── Toolbar (search + filters above tables) ───────────
function AdminToolbar({ children }) {
  const { theme } = useDApp();
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      padding: '14px 16px', marginBottom: 14,
      background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 10,
      fontFamily: ADMIN_FONT_BODY,
    }}>
      {children}
    </div>
  );
}

function AdminSearch({ value, onChange, placeholder = 'Cerca…' }) {
  const { theme } = useDApp();
  return (
    <div style={{ position: 'relative', flex: 1, minWidth: 220, maxWidth: 380 }}>
      <DIcon name="search" size={15} style={{
        position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
        color: theme.textFaint, pointerEvents: 'none',
      }} />
      <input
        value={value} onChange={onChange} placeholder={placeholder}
        style={{
          width: '100%', height: 36, padding: '0 12px 0 34px',
          background: theme.bgAlt, color: theme.text,
          border: `1px solid ${theme.border}`, borderRadius: 8,
          fontFamily: ADMIN_FONT_BODY, fontSize: 13, outline: 'none',
        }}
      />
    </div>
  );
}

// Compact pill-row used for filter chips.
function AdminFilterPills({ value, options, onChange }) {
  const { theme } = useDApp();
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
      {options.map(o => {
        const active = value === o.id;
        return (
          <button key={o.id} onClick={() => onChange(o.id)} style={{
            padding: '6px 12px', borderRadius: 6,
            background: active ? theme.text : 'transparent',
            color: active ? theme.bg : theme.textMuted,
            border: 'none', cursor: 'pointer',
            fontFamily: ADMIN_FONT_BODY, fontSize: 12.5, fontWeight: 500,
            letterSpacing: '0.01em', textTransform: 'none',
          }}>{o.label}{o.count != null && (
            <span style={{
              marginLeft: 6, fontSize: 11, opacity: active ? 0.75 : 0.6,
              fontFeatureSettings: '"tnum"',
            }}>{o.count}</span>
          )}</button>
        );
      })}
    </div>
  );
}

// Standard small admin button (more compact than DBtn)
function ABtn({ children, onClick, variant = 'primary', icon, iconRight, size = 'md', disabled, style }) {
  const { theme, accent } = useDApp();
  const v = {
    primary: { bg: theme.text, color: theme.bg, border: theme.text, hover: theme.text },
    secondary: { bg: theme.card, color: theme.text, border: theme.border, hover: theme.bgAlt },
    ghost: { bg: 'transparent', color: theme.textMuted, border: 'transparent', hover: theme.bgAlt },
    accent: { bg: accent.primary, color: '#fff', border: accent.primary, hover: accent.primaryDark },
    danger: { bg: 'transparent', color: accent.primary, border: accent.primary, hover: accent.primaryLight },
  }[variant];
  const s = size === 'sm' ? { h: 28, px: 10, fs: 12 } : { h: 36, px: 14, fs: 13 };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      height: s.h, padding: `0 ${s.px}px`, borderRadius: 7,
      background: v.bg, color: v.color, border: `1px solid ${v.border}`,
      display: 'inline-flex', alignItems: 'center', gap: 6,
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
      fontFamily: ADMIN_FONT_BODY, fontSize: s.fs, fontWeight: 600,
      letterSpacing: '0.005em', whiteSpace: 'nowrap',
      transition: 'background 140ms',
      ...style,
    }}
    onMouseEnter={(e) => { if (!disabled && v.hover) e.currentTarget.style.background = v.hover; }}
    onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.background = v.bg; }}>
      {icon && <DIcon name={icon} size={14} stroke={1.7} />}
      <span>{children}</span>
      {iconRight && <DIcon name={iconRight} size={14} stroke={1.7} />}
    </button>
  );
}

// ─────────── Status pill ───────────
function AStatusPill({ status }) {
  const { theme, accent } = useDApp();
  // map: id -> { label, dot, bg, color }
  const map = {
    published:  { label: 'Publicat',   dot: '#3f7a52', bg: 'rgba(63,122,82,0.10)',  color: '#3f7a52' },
    draft:      { label: 'Esborrany',  dot: '#b6833a', bg: 'rgba(182,131,58,0.10)', color: '#b6833a' },
    scheduled:  { label: 'Programat',  dot: accent.primary, bg: accent.primaryLight, color: accent.primaryDark },
    archived:   { label: 'Arxivat',    dot: theme.textFaint, bg: theme.bgAlt,        color: theme.textMuted },
    active:     { label: 'Actiu',      dot: '#3f7a52', bg: 'rgba(63,122,82,0.10)',  color: '#3f7a52' },
    inactive:   { label: 'Inactiu',    dot: theme.textFaint, bg: theme.bgAlt,        color: theme.textMuted },
    pending:    { label: 'Pendent',    dot: '#b6833a', bg: 'rgba(182,131,58,0.10)', color: '#b6833a' },
    full:       { label: 'Complet',    dot: '#b6833a', bg: 'rgba(182,131,58,0.10)', color: '#b6833a' },
    upcoming:   { label: 'Proper',     dot: accent.primary, bg: accent.primaryLight, color: accent.primaryDark },
  };
  const it = map[status] || { label: status, dot: theme.textFaint, bg: theme.bgAlt, color: theme.textMuted };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 9px 3px 7px', borderRadius: 4,
      background: it.bg, color: it.color,
      fontFamily: ADMIN_FONT_BODY, fontSize: 11, fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '0.08em',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 3, background: it.dot }} />
      {it.label}
    </span>
  );
}

// ─────────── Role pill ───────────
function ARolePill({ role }) {
  const { theme, accent } = useDApp();
  const map = {
    admin:   { label: 'Admin',   bg: accent.primaryLight, color: accent.primaryDark, border: accent.primary + '33' },
    editor:  { label: 'Editor',  bg: theme.bgAlt, color: theme.text, border: theme.border },
    empleat: { label: 'Empleat', bg: 'transparent', color: theme.textMuted, border: theme.border },
  };
  const it = map[role] || map.empleat;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 4,
      background: it.bg, color: it.color, border: `1px solid ${it.border}`,
      fontFamily: ADMIN_FONT_BODY, fontSize: 11, fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '0.1em',
    }}>{it.label}</span>
  );
}

// ─────────── Table primitives ───────────
function AdminTable({ columns, rows, selectedId, onRowClick, emptyMessage = 'No hi ha resultats.' }) {
  const { theme, accent } = useDApp();
  const gridTemplate = columns.map(c => c.width || 'minmax(0, 1fr)').join(' ');
  return (
    <div style={{
      background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 10,
      overflow: 'hidden', fontFamily: ADMIN_FONT_BODY,
    }}>
      {/* Header row */}
      <div style={{
        display: 'grid', gridTemplateColumns: gridTemplate,
        padding: '11px 16px', gap: 14,
        background: theme.bgAlt, borderBottom: `1px solid ${theme.border}`,
        fontSize: 10.5, fontWeight: 600, color: theme.textFaint,
        textTransform: 'uppercase', letterSpacing: '0.12em',
      }}>
        {columns.map(c => <div key={c.key} style={{ textAlign: c.align || 'left' }}>{c.label}</div>)}
      </div>
      {/* Body rows */}
      {rows.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: theme.textFaint, fontSize: 13 }}>
          {emptyMessage}
        </div>
      ) : rows.map((row, i) => {
        const isActive = selectedId === row.id;
        return (
          <div key={row.id} onClick={() => onRowClick && onRowClick(row.id)} style={{
            display: 'grid', gridTemplateColumns: gridTemplate,
            padding: '12px 16px', gap: 14, alignItems: 'center',
            borderBottom: i < rows.length - 1 ? `1px solid ${theme.border}` : 'none',
            background: isActive ? accent.primaryLight + '66' : 'transparent',
            cursor: onRowClick ? 'pointer' : 'default',
            fontSize: 13, color: theme.text,
            position: 'relative',
            transition: 'background 120ms',
          }}
          onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = theme.bgAlt; }}
          onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}>
            {isActive && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: accent.primary }} />}
            {columns.map(c => (
              <div key={c.key} style={{ textAlign: c.align || 'left', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: c.wrap ? 'normal' : 'nowrap' }}>
                {c.render ? c.render(row) : row[c.key]}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ─────────── Detail pane (right column) ───────────
function AdminDetail({ title, badge, onClose, footer, children }) {
  const { theme, accent } = useDApp();
  return (
    <div style={{
      background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 10,
      display: 'flex', flexDirection: 'column', fontFamily: ADMIN_FONT_BODY,
      position: 'sticky', top: 90, maxHeight: 'calc(100vh - 120px)',
    }}>
      <div style={{
        padding: '14px 16px', borderBottom: `1px solid ${theme.border}`,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {badge && (
            <div style={{
              fontSize: 10, fontWeight: 600, color: accent.primary,
              textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 3,
            }}>{badge}</div>
          )}
          <div style={{
            fontFamily: ADMIN_FONT_DISPLAY, fontSize: 24, fontWeight: 500,
            letterSpacing: '-0.005em', lineHeight: 1.05,
            color: theme.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{title}</div>
        </div>
        {onClose && (
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: 14, background: 'transparent',
            border: 'none', cursor: 'pointer', color: theme.textFaint,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><DIcon name="close" size={16} /></button>
        )}
      </div>
      <div style={{
        flex: 1, padding: 18, overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        {children}
      </div>
      {footer && (
        <div style={{
          padding: '12px 16px', borderTop: `1px solid ${theme.border}`,
          display: 'flex', justifyContent: 'flex-end', gap: 8, background: theme.bgAlt,
        }}>{footer}</div>
      )}
    </div>
  );
}

// Empty state for the detail pane
function AdminDetailEmpty({ icon = 'edit', label, hint }) {
  const { theme } = useDApp();
  return (
    <div style={{
      border: `1px dashed ${theme.border}`, borderRadius: 10,
      padding: '60px 30px', textAlign: 'center', color: theme.textFaint,
      fontFamily: ADMIN_FONT_BODY,
      position: 'sticky', top: 90,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 22, margin: '0 auto 14px',
        background: theme.bgAlt, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: theme.textMuted,
      }}><DIcon name={icon} size={20} /></div>
      <div style={{ fontSize: 14, fontWeight: 600, color: theme.text, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 12.5, lineHeight: 1.45 }}>{hint}</div>
    </div>
  );
}

// ─────────── Detail field primitives ───────────
function AField({ label, hint, children, optional }) {
  const { theme } = useDApp();
  return (
    <label style={{ display: 'block', fontFamily: ADMIN_FONT_BODY }}>
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6,
      }}>
        <span style={{
          fontSize: 10.5, fontWeight: 600, color: theme.textFaint,
          textTransform: 'uppercase', letterSpacing: '0.12em',
        }}>{label}</span>
        {optional && <span style={{ fontSize: 10, color: theme.textFaint, fontStyle: 'italic', textTransform: 'lowercase', letterSpacing: 0 }}>opcional</span>}
      </div>
      {children}
      {hint && <div style={{ fontSize: 11.5, color: theme.textFaint, marginTop: 5 }}>{hint}</div>}
    </label>
  );
}

function AInput({ value, onChange, placeholder, type = 'text', icon, ...rest }) {
  const { theme, accent } = useDApp();
  const [focus, setFocus] = aPS(false);
  return (
    <div style={{ position: 'relative' }}>
      {icon && <DIcon name={icon} size={14} style={{
        position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: theme.textFaint,
      }} />}
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{
          width: '100%', height: 38, padding: icon ? '0 12px 0 34px' : '0 12px',
          background: theme.card, color: theme.text,
          border: `1px solid ${focus ? accent.primary : theme.border}`,
          boxShadow: focus ? `0 0 0 3px ${accent.primaryLight}` : 'none',
          borderRadius: 8, outline: 'none',
          fontFamily: ADMIN_FONT_BODY, fontSize: 13.5,
          transition: 'border-color 140ms, box-shadow 140ms',
        }}
        {...rest}
      />
    </div>
  );
}

function ATextarea({ value, onChange, placeholder, rows = 4 }) {
  const { theme, accent } = useDApp();
  const [focus, setFocus] = aPS(false);
  return (
    <textarea
      value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
      style={{
        width: '100%', padding: 12, resize: 'vertical',
        background: theme.card, color: theme.text,
        border: `1px solid ${focus ? accent.primary : theme.border}`,
        boxShadow: focus ? `0 0 0 3px ${accent.primaryLight}` : 'none',
        borderRadius: 8, outline: 'none', boxSizing: 'border-box',
        fontFamily: ADMIN_FONT_BODY, fontSize: 13.5, lineHeight: 1.5,
        transition: 'border-color 140ms, box-shadow 140ms',
      }}
    />
  );
}

function ASelect({ value, onChange, options }) {
  const { theme } = useDApp();
  return (
    <select value={value} onChange={onChange} style={{
      width: '100%', height: 38, padding: '0 12px',
      background: theme.card, color: theme.text,
      border: `1px solid ${theme.border}`, borderRadius: 8, outline: 'none',
      fontFamily: ADMIN_FONT_BODY, fontSize: 13.5,
    }}>
      {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
    </select>
  );
}

// Segmented control — used for role, status switches, schedule type.
function ASegmented({ value, onChange, options, dense }) {
  const { theme, accent } = useDApp();
  return (
    <div style={{
      display: 'inline-flex', background: theme.bgAlt, border: `1px solid ${theme.border}`,
      borderRadius: 8, padding: 3, gap: 2, width: '100%',
    }}>
      {options.map(o => {
        const active = value === (o.value ?? o);
        return (
          <button key={o.value ?? o} onClick={() => onChange(o.value ?? o)} style={{
            flex: 1, height: dense ? 28 : 32, padding: '0 10px', borderRadius: 6,
            background: active ? theme.card : 'transparent',
            color: active ? theme.text : theme.textMuted,
            border: active ? `1px solid ${theme.border}` : '1px solid transparent',
            boxShadow: active ? `0 1px 2px ${theme.shadowSm || 'rgba(0,0,0,0.04)'}` : 'none',
            cursor: 'pointer', fontFamily: ADMIN_FONT_BODY,
            fontSize: dense ? 11.5 : 12.5, fontWeight: 600,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            {o.icon && <DIcon name={o.icon} size={13} />}
            {o.label ?? o.value ?? o}
          </button>
        );
      })}
    </div>
  );
}

// Toggle switch (label + helper text + switch).
function AToggle({ value, onChange, label, hint }) {
  const { theme, accent } = useDApp();
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 12px', background: theme.bgAlt,
      border: `1px solid ${theme.border}`, borderRadius: 8,
    }}>
      <div onClick={() => onChange(!value)} style={{
        width: 34, height: 20, borderRadius: 10, flexShrink: 0,
        background: value ? accent.primary : theme.border,
        position: 'relative', cursor: 'pointer', transition: 'background 180ms',
      }}>
        <div style={{
          position: 'absolute', top: 2, left: value ? 16 : 2, width: 16, height: 16, borderRadius: 8,
          background: '#fff', transition: 'left 180ms',
        }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: theme.text }}>{label}</div>
        {hint && <div style={{ fontSize: 11.5, color: theme.textFaint, marginTop: 2 }}>{hint}</div>}
      </div>
    </div>
  );
}

// Multi-select chip group (audiences, etc).
function AChipMulti({ value, onChange, options }) {
  const { theme, accent } = useDApp();
  const toggle = (v) => {
    if (value.includes(v)) onChange(value.filter(x => x !== v));
    else onChange([...value, v]);
  };
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
      {options.map(o => {
        const id = o.value ?? o;
        const active = value.includes(id);
        return (
          <button key={id} onClick={() => toggle(id)} style={{
            padding: '5px 11px', borderRadius: 999,
            background: active ? accent.primaryLight : 'transparent',
            color: active ? accent.primaryDark : theme.textMuted,
            border: `1px solid ${active ? accent.primary : theme.border}`,
            cursor: 'pointer', fontFamily: ADMIN_FONT_BODY,
            fontSize: 12, fontWeight: 500,
          }}>{o.label ?? id}</button>
        );
      })}
    </div>
  );
}

// ─────────── Language tabs (CA/ES/EN) for editor content ───────────
function ALangTabs({ value, onChange }) {
  const { theme, accent } = useDApp();
  const langs = [
    { id: 'ca', label: 'CA', name: 'Català' },
    { id: 'es', label: 'ES', name: 'Español' },
    { id: 'en', label: 'EN', name: 'English' },
  ];
  return (
    <div style={{
      display: 'flex', gap: 0, borderBottom: `1px solid ${theme.border}`,
      marginBottom: 4,
    }}>
      {langs.map(l => {
        const active = value === l.id;
        return (
          <button key={l.id} onClick={() => onChange(l.id)} style={{
            padding: '8px 14px', background: 'transparent',
            border: 'none', borderBottom: `2px solid ${active ? accent.primary : 'transparent'}`,
            color: active ? theme.text : theme.textMuted,
            cursor: 'pointer', fontFamily: ADMIN_FONT_BODY,
            fontSize: 12, fontWeight: 600, letterSpacing: '0.08em',
            display: 'inline-flex', alignItems: 'center', gap: 6,
            marginBottom: -1,
          }}>
            <span>{l.label}</span>
            <span style={{ fontSize: 11, fontWeight: 400, color: theme.textFaint, letterSpacing: 0 }}>{l.name}</span>
          </button>
        );
      })}
    </div>
  );
}

// Image dropzone (placeholder).
function AImageDrop({ ratio = '16/9', label = 'Arrossega una imatge', hint = 'JPG / PNG · màx. 4 MB' }) {
  const { theme, accent } = useDApp();
  const [over, setOver] = aPS(false);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); }}
      style={{
        aspectRatio: ratio, width: '100%',
        border: `1.5px dashed ${over ? accent.primary : theme.border}`,
        borderRadius: 8, background: over ? accent.primaryLight + '40' : theme.bgAlt,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 6, color: theme.textMuted, cursor: 'pointer', fontFamily: ADMIN_FONT_BODY,
        transition: 'background 140ms, border-color 140ms',
      }}>
      <DIcon name="plus" size={20} />
      <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 11.5, color: theme.textFaint }}>{hint}</div>
    </div>
  );
}

// Mini stat card for dashboards.
function AStatCard({ label, value, sub, tint }) {
  const { theme, accent } = useDApp();
  return (
    <div style={{
      padding: 18, background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 10,
      fontFamily: ADMIN_FONT_BODY,
    }}>
      <div style={{
        fontSize: 10.5, fontWeight: 600, color: theme.textFaint,
        textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10,
      }}>{label}</div>
      <div style={{
        fontFamily: ADMIN_FONT_DISPLAY, fontSize: 38, fontWeight: 500,
        letterSpacing: '-0.01em', lineHeight: 1, color: tint || theme.text,
        fontFeatureSettings: '"tnum"',
      }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

// Initials/avatar bubble for users column.
function AAvatar({ name, size = 28 }) {
  const { theme, accent } = useDApp();
  const initials = (name || '').split(' ').map(s => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: size / 2, flexShrink: 0,
      background: accent.primaryLight, color: accent.primaryDark,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: ADMIN_FONT_BODY, fontSize: size * 0.4, fontWeight: 600,
      letterSpacing: '0.02em',
    }}>{initials}</div>
  );
}

// ─────────── Two-pane layout (table left, detail right) ───────────
function AdminTwoPane({ left, right, ratio = '1.8fr 1fr' }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: ratio, gap: 18, alignItems: 'start',
    }}>
      <div style={{ minWidth: 0 }}>{left}</div>
      <div style={{ minWidth: 0 }}>{right}</div>
    </div>
  );
}

Object.assign(window, {
  AdminFont, AdminHeader, AdminToolbar, AdminSearch, AdminFilterPills,
  ABtn, AStatusPill, ARolePill, AdminTable, AdminDetail, AdminDetailEmpty,
  AField, AInput, ATextarea, ASelect, ASegmented, AToggle, AChipMulti,
  ALangTabs, AImageDrop, AStatCard, AAvatar, AdminTwoPane,
  ADMIN_FONT_DISPLAY, ADMIN_FONT_BODY,
});
