// Shared primitives for TAVIL portal mobile
// Phone frame, icons, atoms

const { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } = React;

// ─────────── App Context ───────────
const AppCtx = createContext(null);
const useApp = () => useContext(AppCtx);

// ─────────── Minimalist icons (24x24 stroke) ───────────
// Rule: stroke=1.6, rounded, no filled shapes, no emoji — matches "instinctive, modern" brief
const Icon = ({ name, size = 22, stroke = 1.6, className = '', style }) => {
  const paths = {
    home: <><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10.5V20h14V10.5"/><path d="M10 20v-5h4v5"/></>,
    news: <><rect x="3.5" y="4.5" width="17" height="15" rx="1.5"/><path d="M7 9h10M7 12h10M7 15h6"/></>,
    calendar: <><rect x="3.5" y="5.5" width="17" height="15" rx="1.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></>,
    activity: <><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v4.5l3 2"/></>,
    directory: <><circle cx="9" cy="9" r="3.5"/><path d="M3 19c.5-3.2 3-5 6-5s5.5 1.8 6 5"/><circle cx="17.5" cy="8" r="2.5"/><path d="M17.5 12.5c2.5.2 3.9 1.7 4.5 4"/></>,
    voice: <><path d="M4 14V9c0-.8.7-1.5 1.5-1.5h3l4.5-3.5V20l-4.5-3.5h-3C4.7 15.5 4 14.8 4 14Z"/><path d="M16 8.5c1.5 1 1.5 6 0 7"/><path d="M18.5 6c3 2 3 10 0 12"/></>,
    requests: <><rect x="4" y="3.5" width="16" height="17" rx="1.5"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
    profile: <><circle cx="12" cy="8.5" r="3.5"/><path d="M5 19.5c1-3.5 4-5 7-5s6 1.5 7 5"/></>,
    campus: <><path d="M3 9 12 4l9 5-9 5-9-5Z"/><path d="M7 11v5c0 1.7 2.2 3 5 3s5-1.3 5-3v-5"/></>,
    search: <><circle cx="10.5" cy="10.5" r="6"/><path d="m20 20-5-5"/></>,
    bell: <><path d="M6 15V11c0-3.3 2.7-6 6-6s6 2.7 6 6v4l1.5 2.5H4.5L6 15Z"/><path d="M10 19.5c.4 1 1.1 1.5 2 1.5s1.6-.5 2-1.5"/></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
    chevronLeft: <><path d="m14 6-6 6 6 6"/></>,
    chevronRight: <><path d="m10 6 6 6-6 6"/></>,
    chevronDown: <><path d="m6 10 6 6 6-6"/></>,
    chevronUp: <><path d="m6 14 6-6 6 6"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    filter: <><path d="M4 6h16M7 12h10M10 18h4"/></>,
    check: <><path d="m5 12 4.5 4.5L19 7"/></>,
    arrowRight: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    arrowLeft: <><path d="M19 12H5M11 6l-6 6 6 6"/></>,
    share: <><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="m8.3 10.7 7.4-3.4M8.3 13.3l7.4 3.4"/></>,
    pin: <><path d="M12 21v-5"/><path d="M7 3h10l-1.5 5c1.5 1.2 2.5 3 2.5 5H6c0-2 1-3.8 2.5-5L7 3Z"/></>,
    phone: <><path d="M5 4.5h3.5l1.5 3.5-2 1.5c.8 2.5 3 4.7 5.5 5.5l1.5-2 3.5 1.5v3.5c0 1.1-.9 2-2 2C9.6 20 4 14.4 4 6.5c0-1.1.9-2 2-2Z"/></>,
    mail: <><rect x="3.5" y="5.5" width="17" height="13" rx="1.5"/><path d="m4 7 8 6 8-6"/></>,
    mapPin: <><path d="M12 21c4-4.5 7-8 7-11.5a7 7 0 0 0-14 0C5 13 8 16.5 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></>,
    clock: <><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></>,
    users: <><circle cx="9" cy="9" r="3.5"/><path d="M3 19c.5-3 3-5 6-5s5.5 2 6 5"/><path d="M15.5 6.5a3 3 0 0 1 0 5M19 19c-.2-1.6-.8-2.8-1.7-3.7"/></>,
    moon: <><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/></>,
    globe: <><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 3 2.5 14 0 17M12 3.5c-2.5 3-2.5 14 0 17"/></>,
    flag: <><path d="M5 21V4h12l-2 4 2 4H5"/></>,
    alert: <><path d="M10.5 3.5 2 18h20L13.5 3.5a1.7 1.7 0 0 0-3 0Z"/><path d="M12 10v4M12 17v.5"/></>,
    settings: <><circle cx="12" cy="12" r="2.8"/><path d="M12 3v2.5M12 18.5V21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M3 12h2.5M18.5 12H21M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/></>,
    logout: <><path d="M14 4h4c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2h-4"/><path d="M9 8l-4 4 4 4M5 12h10"/></>,
    more: <><circle cx="6" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18" cy="12" r="1.3"/></>,
    heart: <><path d="M12 20c-1.5-1-8-5.5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 5.5-6.5 10-8 11Z"/></>,
    eye: <><path d="M2 12c2.5-4.5 6-7 10-7s7.5 2.5 10 7c-2.5 4.5-6 7-10 7s-7.5-2.5-10-7Z"/><circle cx="12" cy="12" r="2.8"/></>,
    edit: <><path d="M4 20h4L20 8l-4-4L4 16v4Z"/><path d="m14 6 4 4"/></>,
    upArrow: <><path d="M12 19V5M6 11l6-6 6 6"/></>,
    downArrow: <><path d="M12 5v14M6 13l6 6 6-6"/></>,
    grid: <><rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" className={className} style={style} aria-hidden="true">
      {paths[name]}
    </svg>
  );
};

// ─────────── Phone Frame (browser mobile viewport) ───────────
// 390 x 844 iPhone-ish but lives in a soft bezel so it reads as "mobile web"
function PhoneFrame({ children, width = 390, height = 844, theme, noShadow = false, statusColor }) {
  const t = theme || window.TAVIL_THEMES.light;
  return (
    <div style={{
      width, height,
      background: t.bg,
      borderRadius: 44,
      padding: 10,
      boxShadow: noShadow ? 'none' : `0 1px 2px ${t.shadow}, 0 20px 50px -18px rgba(34,39,37,0.28), 0 0 0 1px ${t.border}`,
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Instrument Sans, Inter, -apple-system, system-ui, sans-serif',
      color: t.text,
    }}>
      <div style={{
        width: '100%', height: '100%',
        borderRadius: 34,
        overflow: 'hidden',
        position: 'relative',
        background: t.bg,
        isolation: 'isolate',
      }}>
        {/* Status bar */}
        <div style={{
          height: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 22px 0 26px', fontSize: 14, fontWeight: 600, color: statusColor || t.text,
          position: 'relative', zIndex: 10, fontFeatureSettings: '"tnum"',
        }}>
          <span>9:41</span>
          {/* Dynamic island */}
          <div style={{
            position: 'absolute', left: '50%', top: 10, transform: 'translateX(-50%)',
            width: 110, height: 30, background: '#000', borderRadius: 18,
          }}/>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {/* Signal bars */}
            <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor"><rect x="0" y="7" width="3" height="4" rx=".5"/><rect x="4.5" y="5" width="3" height="6" rx=".5"/><rect x="9" y="2.5" width="3" height="8.5" rx=".5"/><rect x="13.5" y="0" width="3" height="11" rx=".5"/></svg>
            <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor"><path d="M8 10.5c-2 0-3.8-.8-5.2-2.1L1 10.5l7 .5 7-.5-1.8-2.1A7.5 7.5 0 0 1 8 10.5Z" opacity=".35"/><path d="M8 7.5c-.8 0-1.5.3-2 .8l2 2.2 2-2.2a2.8 2.8 0 0 0-2-.8Z"/></svg>
            <svg width="26" height="12" viewBox="0 0 26 12" fill="none" stroke="currentColor" strokeWidth="1"><rect x=".5" y=".5" width="22" height="11" rx="2.5"/><rect x="2" y="2" width="17" height="8" rx="1.5" fill="currentColor"/><path d="M24 4v4" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </div>
        </div>
        {/* Page content */}
        <div style={{ height: height - 20 - 44, overflow: 'hidden', position: 'relative' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─────────── Primitives ───────────

function Btn({ children, variant = 'primary', size = 'md', full, onClick, icon, iconRight, disabled, style: extra, ...rest }) {
  const { theme, accent } = useApp();
  const sizes = {
    sm: { h: 36, px: 14, fs: 13 },
    md: { h: 44, px: 18, fs: 14.5 },
    lg: { h: 52, px: 22, fs: 15 },
  }[size];
  const variants = {
    primary: { bg: accent.primary, color: '#fff', border: 'transparent', hover: accent.primaryDark },
    secondary: { bg: theme.card, color: theme.text, border: theme.border, hover: theme.bgAlt },
    ghost: { bg: 'transparent', color: theme.text, border: 'transparent', hover: theme.bgAlt },
    subtle: { bg: accent.primaryLight, color: accent.primaryDark, border: 'transparent', hover: accent.primaryLight },
    danger: { bg: 'transparent', color: accent.primary, border: accent.primary, hover: accent.primaryLight },
  }[variant];
  const [hover, setHover] = useState(false);
  const [press, setPress] = useState(false);
  return (
    <button
      onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => { setHover(false); setPress(false); }}
      onMouseDown={() => setPress(true)} onMouseUp={() => setPress(false)}
      style={{
        height: sizes.h, padding: `0 ${sizes.px}px`, fontSize: sizes.fs, fontWeight: 500,
        letterSpacing: '-0.005em',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        borderRadius: 12, border: `1px solid ${variants.border === 'transparent' ? 'transparent' : variants.border}`,
        background: hover && !disabled ? variants.hover : variants.bg,
        color: variants.color,
        width: full ? '100%' : 'auto',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transform: press ? 'scale(0.98)' : 'scale(1)',
        transition: 'all 160ms cubic-bezier(.23,1,.32,1)',
        fontFamily: 'inherit',
        ...extra,
      }}
      {...rest}
    >
      {icon && <Icon name={icon} size={17} stroke={1.7} />}
      {children}
      {iconRight && <Icon name={iconRight} size={17} stroke={1.7} />}
    </button>
  );
}

function Card({ children, padding = 16, style, onClick, interactive }) {
  const { theme } = useApp();
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: theme.card,
        border: `1px solid ${theme.border}`,
        borderRadius: 16,
        padding,
        cursor: onClick || interactive ? 'pointer' : 'default',
        transition: 'all 180ms cubic-bezier(.23,1,.32,1)',
        transform: hover && (onClick || interactive) ? 'translateY(-1px)' : 'none',
        boxShadow: hover && (onClick || interactive) ? `0 8px 22px -10px ${theme.shadowMd}` : 'none',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Badge({ children, variant = 'neutral', style }) {
  const { theme, accent } = useApp();
  const variants = {
    neutral: { bg: theme.bgAlt, color: theme.textMuted, border: theme.border },
    accent: { bg: accent.primaryLight, color: accent.primaryDark, border: 'transparent' },
    olive: { bg: 'rgba(120,132,117,0.14)', color: theme.olive, border: 'transparent' },
    success: { bg: 'rgba(60,120,80,0.12)', color: '#3f7a52', border: 'transparent' },
    warning: { bg: 'rgba(180,130,50,0.14)', color: '#b6833a', border: 'transparent' },
    solid: { bg: accent.primary, color: '#fff', border: 'transparent' },
  }[variant];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 9px', borderRadius: 999, fontSize: 11.5, fontWeight: 500,
      letterSpacing: '0.01em',
      background: variants.bg, color: variants.color, border: `1px solid ${variants.border === 'transparent' ? 'transparent' : variants.border}`,
      ...style,
    }}>
      {children}
    </span>
  );
}

function Avatar({ name = '', initials, size = 40, src, style }) {
  const { theme } = useApp();
  const ini = initials || name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  // Deterministic hue
  const h = [...(name || ini)].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div style={{
      width: size, height: size, borderRadius: size / 2,
      background: src ? `url(${src}) center/cover` : `oklch(0.88 0.03 ${h})`,
      color: `oklch(0.32 0.04 ${h})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 600, fontSize: size * 0.38,
      flexShrink: 0,
      letterSpacing: '-0.01em',
      ...style,
    }}>
      {!src && ini}
    </div>
  );
}

// Placeholder image — subtly striped + monospace label for what goes there
function ImgPh({ label = 'image', ratio = '16/9', tone = 'warm', style }) {
  const { theme } = useApp();
  // Diagonal hatching in the olive/porcelain range
  const color1 = tone === 'accent' ? 'rgba(191,33,30,0.07)' : 'rgba(120,132,117,0.10)';
  const color2 = tone === 'accent' ? 'rgba(191,33,30,0.03)' : 'rgba(120,132,117,0.05)';
  return (
    <div style={{
      aspectRatio: ratio, width: '100%',
      borderRadius: 12,
      background: `repeating-linear-gradient(135deg, ${color1} 0 8px, ${color2} 8px 16px)`,
      border: `1px solid ${theme.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: theme.textFaint,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSize: 11, letterSpacing: '0.02em',
      position: 'relative', overflow: 'hidden',
      ...style,
    }}>
      <span style={{
        padding: '3px 8px', background: theme.card, border: `1px solid ${theme.border}`,
        borderRadius: 4,
      }}>{label}</span>
    </div>
  );
}

function Field({ label, children, hint, error }) {
  const { theme, accent } = useApp();
  return (
    <label style={{ display: 'block', marginBottom: 14 }}>
      {label && <div style={{ fontSize: 13, color: theme.textMuted, marginBottom: 6, fontWeight: 500 }}>{label}</div>}
      {children}
      {hint && !error && <div style={{ fontSize: 12, color: theme.textFaint, marginTop: 5 }}>{hint}</div>}
      {error && <div style={{ fontSize: 12, color: accent.primary, marginTop: 5 }}>{error}</div>}
    </label>
  );
}

function Input({ type = 'text', placeholder, value, onChange, icon, style, ...rest }) {
  const { theme, accent } = useApp();
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      {icon && (
        <span style={{ position: 'absolute', left: 14, color: theme.textFaint, pointerEvents: 'none', display: 'flex' }}>
          <Icon name={icon} size={18} />
        </span>
      )}
      <input
        type={type} placeholder={placeholder} value={value} onChange={onChange}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{
          width: '100%', height: 48, padding: icon ? '0 14px 0 42px' : '0 14px',
          background: theme.card, color: theme.text,
          border: `1px solid ${focus ? accent.ring : theme.border}`,
          borderRadius: 12, fontSize: 15,
          outline: 'none', fontFamily: 'inherit',
          transition: 'all 160ms', boxShadow: focus ? `0 0 0 4px ${accent.primaryLight}80` : 'none',
          ...style,
        }}
        {...rest}
      />
    </div>
  );
}

function Textarea({ placeholder, value, onChange, rows = 4, style }) {
  const { theme, accent } = useApp();
  const [focus, setFocus] = useState(false);
  return (
    <textarea
      placeholder={placeholder} value={value} onChange={onChange} rows={rows}
      onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
      style={{
        width: '100%', padding: '12px 14px',
        background: theme.card, color: theme.text,
        border: `1px solid ${focus ? accent.ring : theme.border}`,
        borderRadius: 12, fontSize: 15, outline: 'none',
        resize: 'none', fontFamily: 'inherit',
        transition: 'all 160ms', boxShadow: focus ? `0 0 0 4px ${accent.primaryLight}80` : 'none',
        ...style,
      }}
    />
  );
}

// SectionHead — small kicker + big title, editorial feel
function SectionHead({ kicker, title, action, onAction, style }) {
  const { theme, accent } = useApp();
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14, ...style }}>
      <div style={{ minWidth: 0 }}>
        {kicker && (
          <div style={{
            fontSize: 10.5, color: accent.primary, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4,
          }}>{kicker}</div>
        )}
        <h2 style={{
          fontFamily: '"Instrument Serif", "Times New Roman", serif',
          fontSize: 24, fontWeight: 400, lineHeight: 1.05, margin: 0,
          letterSpacing: '-0.01em', color: theme.text,
        }}>{title}</h2>
      </div>
      {action && (
        <button onClick={onAction} style={{
          background: 'none', border: 'none', color: theme.textMuted,
          fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', gap: 3, padding: '4px 0',
        }}>
          {action}
          <Icon name="arrowRight" size={14} />
        </button>
      )}
    </div>
  );
}

// ─────────── App header (in-page, inside phone) ───────────
function AppHeader({ title, leading, trailing, onBack, subtitle, large, transparent }) {
  const { theme, t } = useApp();
  return (
    <div style={{
      display: 'flex', alignItems: 'center', padding: '6px 16px',
      background: transparent ? 'transparent' : theme.bg,
      borderBottom: transparent ? 'none' : 'none',
      minHeight: 52,
      gap: 8,
    }}>
      {onBack ? (
        <button onClick={onBack} style={{
          width: 40, height: 40, borderRadius: 20,
          background: theme.card, border: `1px solid ${theme.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: theme.text, flexShrink: 0,
        }}>
          <Icon name="chevronLeft" size={18} />
        </button>
      ) : leading}
      <div style={{ flex: 1, minWidth: 0, textAlign: onBack ? 'center' : 'left' }}>
        {!large && title && <div style={{ fontSize: 15, fontWeight: 600, color: theme.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>}
        {subtitle && <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>{subtitle}</div>}
      </div>
      {trailing || (onBack ? <div style={{ width: 40 }}/> : null)}
    </div>
  );
}

// expose
Object.assign(window, { AppCtx, useApp, Icon, PhoneFrame, Btn, Card, Badge, Avatar, ImgPh, Field, Input, Textarea, SectionHead, AppHeader });
