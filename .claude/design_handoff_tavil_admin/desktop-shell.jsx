// Desktop shell: sidebar navigation + top bar

const { useState: shS, useEffect: shE, useRef: shR } = React;

function DSidebar({ current, onNavigate, collapsed, onToggle }) {
  const { theme, accent, t, user } = useDApp();
  const groups = [
    { label: t.groups.general, items: [
      { id: 'home', icon: 'home', label: t.nav.inici },
      { id: 'news', icon: 'news', label: t.nav.noticies },
      { id: 'activities', icon: 'activity', label: t.nav.activitats },
      { id: 'agenda', icon: 'calendar', label: t.nav.agenda },
    ]},
    { label: t.groups.empresa, items: [
      { id: 'directory', icon: 'directory', label: t.nav.directori },
      { id: 'campus', icon: 'campus', label: t.nav.campus },
      { id: 'espai', icon: 'news', label: t.nav.espai },
    ]},
    { label: t.groups.personal, items: [
      { id: 'voice', icon: 'voice', label: t.nav.veu },
      { id: 'requests', icon: 'requests', label: t.nav.solicituds },
      { id: 'profile', icon: 'profile', label: t.nav.perfil },
    ]},
    { label: 'Administració', isAdmin: true, items: [
      { id: 'admin-dashboard', icon: 'grid', label: 'Tauler' },
      { id: 'admin-users', icon: 'users', label: 'Usuaris' },
      { id: 'admin-news', icon: 'news', label: t.nav.noticies },
      { id: 'admin-activities', icon: 'activity', label: t.nav.activitats },
      { id: 'admin-campus', icon: 'campus', label: 'Formacions' },
      { id: 'admin-agenda', icon: 'calendar', label: t.nav.agenda },
    ]},
  ];

  const width = collapsed ? 76 : 248;

  return (
    <aside style={{
      width, flexShrink: 0, height: '100vh', position: 'sticky', top: 0,
      borderRight: `1px solid ${theme.border}`,
      background: theme.bgAlt,
      display: 'flex', flexDirection: 'column',
      transition: 'width 240ms cubic-bezier(.23,1,.32,1)',
      overflow: 'hidden',
    }}>
      {/* Brand */}
      <div style={{
        padding: collapsed ? '22px 0 18px' : '22px 22px 18px',
        display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between',
        borderBottom: `1px solid ${theme.border}`,
        minHeight: 72, boxSizing: 'border-box',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          fontFamily: '"Instrument Serif", serif', fontSize: 22, color: theme.text,
          letterSpacing: '-0.01em',
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 7, background: accent.primary, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, fontFamily: 'Instrument Sans, sans-serif', flexShrink: 0,
          }}>T</div>
          {!collapsed && <span>TAVIL</span>}
        </div>
        {!collapsed && (
          <button onClick={onToggle} style={{
            width: 28, height: 28, borderRadius: 14, background: 'transparent',
            border: `1px solid ${theme.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: theme.textMuted,
          }} title="Col·lapsa menú">
            <DIcon name="chevronLeft" size={14}/>
          </button>
        )}
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflow: 'auto', padding: collapsed ? '16px 8px' : '16px 12px' }}>
        {groups.map((g, gi) => (
          <div key={gi} style={{ marginBottom: 18 }}>
            {!collapsed && (
              <div style={{
                fontSize: 10, fontWeight: 600, color: g.isAdmin ? accent.primary : theme.textFaint,
                textTransform: 'uppercase', letterSpacing: '0.14em',
                padding: '4px 14px 8px',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                {g.label}
                {g.isAdmin && (
                  <span style={{
                    fontSize: 8.5, padding: '1px 5px', borderRadius: 3,
                    background: accent.primary, color: '#fff', letterSpacing: '0.12em',
                    fontWeight: 700,
                  }}>ADMIN</span>
                )}
              </div>
            )}
            {collapsed && gi > 0 && (
              <div style={{ height: 1, background: theme.border, margin: '12px 10px' }}/>
            )}
            {g.items.map(it => {
              const active = current === it.id;
              return (
                <button key={it.id} onClick={() => onNavigate(it.id)} title={collapsed ? it.label : undefined} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: collapsed ? '11px 0' : '9px 14px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  background: active ? theme.card : 'transparent',
                  border: `1px solid ${active ? theme.border : 'transparent'}`,
                  borderRadius: 10,
                  color: active ? theme.text : theme.textMuted,
                  cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, textAlign: 'left',
                  fontWeight: active ? 600 : 500,
                  marginBottom: 2, position: 'relative',
                  transition: 'background 160ms',
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = theme.bg; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
                  {active && !collapsed && <div style={{ position: 'absolute', left: -12, top: 8, bottom: 8, width: 3, borderRadius: 2, background: accent.primary }}/>}
                  <DIcon name={it.icon} size={18} stroke={active ? 1.9 : 1.6} style={{ color: active ? accent.primary : 'currentColor', flexShrink: 0 }}/>
                  {!collapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.label}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer: user */}
      <div style={{
        padding: collapsed ? '12px 8px' : '12px 14px',
        borderTop: `1px solid ${theme.border}`,
      }}>
        <button onClick={() => onNavigate('profile')} style={{
          width: '100%', display: 'flex', alignItems: 'center',
          gap: 10, padding: collapsed ? '6px 0' : '8px 10px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          background: 'transparent', border: 'none', borderRadius: 10,
          cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = theme.bg; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
          <DAvatar name={user.name} size={collapsed ? 34 : 34}/>
          {!collapsed && (
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: theme.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
              <div style={{ fontSize: 11.5, color: theme.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.role}</div>
            </div>
          )}
          {!collapsed && <DIcon name="chevronRight" size={14} style={{ color: theme.textFaint, flexShrink: 0 }}/>}
        </button>
        {collapsed && (
          <button onClick={onToggle} style={{
            width: '100%', height: 32, marginTop: 8, borderRadius: 8,
            background: 'transparent', border: `1px solid ${theme.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: theme.textMuted,
          }} title="Expandeix menú">
            <DIcon name="chevronRight" size={14}/>
          </button>
        )}
      </div>
    </aside>
  );
}

function DTopBar({ onSearch, onNotifications, unread, onLogout }) {
  const { theme, accent, t, lang, setLang, darkMode, setDarkMode, user } = useDApp();
  const [q, setQ] = shS('');
  const [menuOpen, setMenuOpen] = shS(false);
  const ref = shR(null);
  shE(() => {
    const h = (e) => { if (!ref.current?.contains(e.target)) setMenuOpen(false); };
    window.addEventListener('mousedown', h);
    return () => window.removeEventListener('mousedown', h);
  }, []);
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      height: 72, display: 'flex', alignItems: 'center', gap: 16,
      padding: '0 36px',
      background: `${theme.bg}f2`,
      backdropFilter: 'blur(10px)',
      borderBottom: `1px solid ${theme.border}`,
    }}>
      {/* Search */}
      <div style={{ flex: 1, maxWidth: 520, position: 'relative' }}>
        <DIcon name="search" size={17} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: theme.textFaint, pointerEvents: 'none' }}/>
        <input
          value={q} onChange={e => setQ(e.target.value)} placeholder={`${t.common.search} notícies, persones, documents…`}
          onKeyDown={e => { if (e.key === 'Enter' && onSearch) onSearch(q); }}
          style={{
            width: '100%', height: 40, padding: '0 80px 0 40px',
            background: theme.card, border: `1px solid ${theme.border}`,
            borderRadius: 10, fontSize: 13.5, color: theme.text,
            outline: 'none', fontFamily: 'inherit',
          }}
        />
        <span style={{
          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
          fontSize: 10.5, color: theme.textFaint, fontFamily: 'JetBrains Mono, monospace',
          padding: '3px 6px', background: theme.bgAlt, border: `1px solid ${theme.border}`, borderRadius: 4,
          letterSpacing: '0.04em',
        }}>⌘K</span>
      </div>

      <div style={{ flex: 1 }}/>

      {/* Language switch */}
      <div style={{
        display: 'inline-flex', background: theme.card, border: `1px solid ${theme.border}`,
        borderRadius: 999, padding: 3,
      }}>
        {['ca', 'es', 'en'].map(l => (
          <button key={l} onClick={() => setLang(l)} style={{
            padding: '5px 11px', fontSize: 11, fontWeight: 600,
            background: lang === l ? theme.text : 'transparent',
            color: lang === l ? theme.bg : theme.textMuted,
            border: 'none', borderRadius: 999, cursor: 'pointer',
            textTransform: 'uppercase', letterSpacing: '0.06em',
            fontFamily: 'inherit', transition: 'all 200ms',
          }}>{l}</button>
        ))}
      </div>

      {/* Theme toggle */}
      <button onClick={() => setDarkMode(!darkMode)} style={{
        width: 40, height: 40, borderRadius: 20,
        background: theme.card, border: `1px solid ${theme.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: theme.text,
      }} title={darkMode ? 'Mode clar' : 'Mode fosc'}>
        <DIcon name={darkMode ? 'sun' : 'moon'} size={17}/>
      </button>

      {/* Notifications */}
      <button onClick={onNotifications} style={{
        width: 40, height: 40, borderRadius: 20, position: 'relative',
        background: theme.card, border: `1px solid ${theme.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: theme.text,
      }}>
        <DIcon name="bell" size={17}/>
        {unread > 0 && (
          <div style={{
            position: 'absolute', top: 6, right: 7,
            minWidth: 16, height: 16, borderRadius: 8,
            background: accent.primary, color: '#fff',
            fontSize: 9.5, fontWeight: 700, display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: '0 4px',
            border: `2px solid ${theme.card}`, boxSizing: 'content-box',
          }}>{unread}</div>
        )}
      </button>

      {/* User menu */}
      <div ref={ref} style={{ position: 'relative' }}>
        <button onClick={() => setMenuOpen(v => !v)} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '4px 4px 4px 4px', background: theme.card,
          border: `1px solid ${theme.border}`, borderRadius: 999,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>
          <DAvatar name={user.name} size={32}/>
          <DIcon name="chevronDown" size={14} style={{ color: theme.textFaint, marginRight: 6 }}/>
        </button>
        {menuOpen && (
          <div style={{
            position: 'absolute', right: 0, top: 48, width: 220,
            background: theme.card, border: `1px solid ${theme.border}`,
            borderRadius: 12, overflow: 'hidden',
            boxShadow: `0 14px 40px -10px ${theme.shadowMd}`,
          }}>
            <div style={{ padding: '14px 16px', borderBottom: `1px solid ${theme.border}` }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: theme.text }}>{user.name}</div>
              <div style={{ fontSize: 11.5, color: theme.textMuted, marginTop: 2 }}>marta.vidal@tavil.com</div>
            </div>
            <button onClick={onLogout} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 16px', background: 'transparent', border: 'none',
              cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, color: accent.primary, textAlign: 'left',
            }}>
              <DIcon name="logout" size={16}/>
              {t.common.signOut}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

Object.assign(window, { DSidebar, DTopBar });
