// Desktop primitives for TAVIL portal
// Shares AppCtx + tokens with the mobile version

const { useState: dS, useEffect: dE, useRef: dR, useMemo: dM, createContext: dCtx, useContext: dUseCtx } = React;

// Reuse the same AppCtx name so components work identically
const DesktopAppCtx = dCtx(null);
const useDApp = () => dUseCtx(DesktopAppCtx);

// ─────────── Minimalist icons (same set as mobile) ───────────
const DIcon = ({ name, size = 20, stroke = 1.6, className = '', style }) => {
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
    finance: <><path d="M3 20V7l9-4 9 4v13"/><path d="M3 20h18M8 20V11M12 20v-5M16 20v-7"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" className={className} style={style} aria-hidden="true">
      {paths[name]}
    </svg>
  );
};

// ─────────── Atoms ───────────

function DBtn({ children, variant = 'primary', size = 'md', full, onClick, icon, iconRight, disabled, style: extra, ...rest }) {
  const { theme, accent } = useDApp();
  const sizes = {
    sm: { h: 34, px: 12, fs: 12.5 },
    md: { h: 40, px: 16, fs: 13.5 },
    lg: { h: 48, px: 22, fs: 14.5 },
  }[size];
  const variants = {
    primary: { bg: accent.primary, color: '#fff', border: 'transparent', hover: accent.primaryDark },
    secondary: { bg: theme.card, color: theme.text, border: theme.border, hover: theme.bgAlt },
    ghost: { bg: 'transparent', color: theme.text, border: 'transparent', hover: theme.bgAlt },
    subtle: { bg: accent.primaryLight, color: accent.primaryDark, border: 'transparent', hover: accent.primaryLight },
    danger: { bg: 'transparent', color: accent.primary, border: accent.primary, hover: accent.primaryLight },
  }[variant];
  const [hover, setHover] = dS(false);
  const [press, setPress] = dS(false);
  return (
    <button
      onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => { setHover(false); setPress(false); }}
      onMouseDown={() => setPress(true)} onMouseUp={() => setPress(false)}
      style={{
        height: sizes.h, padding: `0 ${sizes.px}px`, fontSize: sizes.fs, fontWeight: 500,
        letterSpacing: '-0.005em',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        borderRadius: 10, border: `1px solid ${variants.border === 'transparent' ? 'transparent' : variants.border}`,
        background: hover && !disabled ? variants.hover : variants.bg,
        color: variants.color,
        width: full ? '100%' : 'auto',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transform: press ? 'scale(0.985)' : 'scale(1)',
        transition: 'all 160ms cubic-bezier(.23,1,.32,1)',
        fontFamily: 'inherit',
        ...extra,
      }}
      {...rest}
    >
      {icon && <DIcon name={icon} size={16} stroke={1.7} />}
      {children}
      {iconRight && <DIcon name={iconRight} size={16} stroke={1.7} />}
    </button>
  );
}

function DCard({ children, padding = 20, style, onClick, interactive }) {
  const { theme } = useDApp();
  const [hover, setHover] = dS(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: theme.card,
        border: `1px solid ${theme.border}`,
        borderRadius: 14,
        padding,
        cursor: onClick || interactive ? 'pointer' : 'default',
        transition: 'all 180ms cubic-bezier(.23,1,.32,1)',
        transform: hover && (onClick || interactive) ? 'translateY(-1px)' : 'none',
        boxShadow: hover && (onClick || interactive) ? `0 10px 28px -12px ${theme.shadowMd}` : 'none',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function DBadge({ children, variant = 'neutral', style }) {
  const { theme, accent } = useDApp();
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
      padding: '3px 9px', borderRadius: 999, fontSize: 11, fontWeight: 500,
      letterSpacing: '0.01em',
      background: variants.bg, color: variants.color, border: `1px solid ${variants.border === 'transparent' ? 'transparent' : variants.border}`,
      ...style,
    }}>
      {children}
    </span>
  );
}

function DAvatar({ name = '', initials, size = 40, src, style }) {
  const ini = initials || name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
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

function DImgPh({ label = 'image', ratio = '16/9', tone = 'warm', style }) {
  const { theme } = useDApp();
  const color1 = tone === 'accent' ? 'rgba(191,33,30,0.07)' : 'rgba(120,132,117,0.10)';
  const color2 = tone === 'accent' ? 'rgba(191,33,30,0.03)' : 'rgba(120,132,117,0.05)';
  return (
    <div style={{
      aspectRatio: ratio, width: '100%',
      borderRadius: 12,
      background: `repeating-linear-gradient(135deg, ${color1} 0 10px, ${color2} 10px 20px)`,
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

function DField({ label, children, hint, error }) {
  const { theme, accent } = useDApp();
  return (
    <label style={{ display: 'block', marginBottom: 14 }}>
      {label && <div style={{ fontSize: 12.5, color: theme.textMuted, marginBottom: 6, fontWeight: 500 }}>{label}</div>}
      {children}
      {hint && !error && <div style={{ fontSize: 12, color: theme.textFaint, marginTop: 5 }}>{hint}</div>}
      {error && <div style={{ fontSize: 12, color: accent.primary, marginTop: 5 }}>{error}</div>}
    </label>
  );
}

function DInput({ type = 'text', placeholder, value, onChange, icon, style, ...rest }) {
  const { theme, accent } = useDApp();
  const [focus, setFocus] = dS(false);
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      {icon && (
        <span style={{ position: 'absolute', left: 14, color: theme.textFaint, pointerEvents: 'none', display: 'flex' }}>
          <DIcon name={icon} size={17} />
        </span>
      )}
      <input
        type={type} placeholder={placeholder} value={value} onChange={onChange}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{
          width: '100%', height: 42, padding: icon ? '0 14px 0 40px' : '0 14px',
          background: theme.card, color: theme.text,
          border: `1px solid ${focus ? accent.ring : theme.border}`,
          borderRadius: 10, fontSize: 14,
          outline: 'none', fontFamily: 'inherit',
          transition: 'all 160ms', boxShadow: focus ? `0 0 0 3px ${accent.primaryLight}80` : 'none',
          ...style,
        }}
        {...rest}
      />
    </div>
  );
}

function DTextarea({ placeholder, value, onChange, rows = 4, style }) {
  const { theme, accent } = useDApp();
  const [focus, setFocus] = dS(false);
  return (
    <textarea
      placeholder={placeholder} value={value} onChange={onChange} rows={rows}
      onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
      style={{
        width: '100%', padding: '12px 14px',
        background: theme.card, color: theme.text,
        border: `1px solid ${focus ? accent.ring : theme.border}`,
        borderRadius: 10, fontSize: 14, outline: 'none',
        resize: 'none', fontFamily: 'inherit',
        transition: 'all 160ms', boxShadow: focus ? `0 0 0 3px ${accent.primaryLight}80` : 'none',
        ...style,
      }}
    />
  );
}

// SectionHead — editorial-style section header
function DSectionHead({ kicker, title, subtitle, action, onAction, style }) {
  const { theme, accent } = useDApp();
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18, gap: 16, ...style }}>
      <div style={{ minWidth: 0 }}>
        {kicker && (
          <div style={{
            fontSize: 10.5, color: accent.primary, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 6,
          }}>{kicker}</div>
        )}
        <h2 style={{
          fontFamily: '"Instrument Serif", "Times New Roman", serif',
          fontSize: 28, fontWeight: 400, lineHeight: 1.05, margin: 0,
          letterSpacing: '-0.015em', color: theme.text,
        }}>{title}</h2>
        {subtitle && <div style={{ fontSize: 13.5, color: theme.textMuted, marginTop: 6, lineHeight: 1.4, maxWidth: 560 }}>{subtitle}</div>}
      </div>
      {action && (
        <button onClick={onAction} style={{
          background: 'none', border: 'none', color: theme.textMuted,
          fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', gap: 4, padding: '4px 0',
          flexShrink: 0,
        }}>
          {action}
          <DIcon name="arrowRight" size={14} />
        </button>
      )}
    </div>
  );
}

// Page header used at top of each screen
function DPageHeader({ kicker, title, subtitle, actions, style }) {
  const { theme, accent } = useDApp();
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24,
      padding: '30px 0 26px', borderBottom: `1px solid ${theme.border}`, marginBottom: 28, ...style,
    }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        {kicker && (
          <div style={{
            fontSize: 11, color: accent.primary, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10,
          }}>{kicker}</div>
        )}
        <h1 style={{
          fontFamily: '"Instrument Serif", serif',
          fontSize: 48, fontWeight: 400, lineHeight: 1, margin: 0,
          letterSpacing: '-0.025em', color: theme.text,
        }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 14.5, color: theme.textMuted, margin: '12px 0 0', lineHeight: 1.5, maxWidth: 640 }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>{actions}</div>}
    </div>
  );
}

// ─────────── Modal (centered, desktop style) ───────────
function DModal({ open, onClose, title, children, width = 560 }) {
  const { theme } = useDApp();
  return (
    <>
      <div style={{
        position: 'fixed', inset: 0, background: theme.overlay,
        opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none',
        transition: 'opacity 220ms', zIndex: 200,
        backdropFilter: 'blur(2px)',
      }} onClick={onClose}/>
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: open ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -48%) scale(0.98)',
        opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none',
        width, maxWidth: 'calc(100vw - 48px)', maxHeight: 'calc(100vh - 80px)',
        background: theme.bg,
        borderRadius: 16, border: `1px solid ${theme.border}`,
        boxShadow: `0 30px 80px -20px ${theme.shadowMd}`,
        transition: 'all 240ms cubic-bezier(.23,1,.32,1)',
        zIndex: 201, overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: `1px solid ${theme.border}`,
        }}>
          <div style={{ fontFamily: '"Instrument Serif", serif', fontSize: 22, letterSpacing: '-0.01em', color: theme.text }}>{title}</div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 17, background: theme.card, border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.text }}><DIcon name="close" size={15}/></button>
        </div>
        <div style={{ padding: '20px 22px 24px', overflow: 'auto' }}>{children}</div>
      </div>
    </>
  );
}

Object.assign(window, {
  DesktopAppCtx, useDApp, DIcon, DBtn, DCard, DBadge, DAvatar, DImgPh,
  DField, DInput, DTextarea, DSectionHead, DPageHeader, DModal,
});
