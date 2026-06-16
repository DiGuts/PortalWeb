// Main App — TAVIL portal mobile prototype

const { useState: uSSS, useEffect: uEEE, useRef: uRRR, useMemo: uMMM } = React;

function App() {
  // Tweakable defaults (persisted via edit-mode bridge)
  const TWEAKS = /*EDITMODE-BEGIN*/{
    "darkMode": false,
    "accent": "mahogany",
    "language": "ca"
  }/*EDITMODE-END*/;

  const [darkMode, setDarkMode] = uSSS(TWEAKS.darkMode);
  const [accentKey, setAccentKey] = uSSS(TWEAKS.accent);
  const [lang, setLang] = uSSS(TWEAKS.language);
  const [screen, setScreen] = uSSS('login'); // 'login' | 'register' | 'verify' | 'app'
  const [regEmail, setRegEmail] = uSSS('');
  const [tab, setTab] = uSSS('home');
  const [stack, setStack] = uSSS([]); // pushed screens: 'news-detail', 'activities', 'voice', 'requests', 'profile', 'agenda'
  const [newsId, setNewsId] = uSSS(null);
  const [drawer, setDrawer] = uSSS(false);
  const [nav, setNav] = uSSS({ prev: null, cur: 'home', dir: 0 }); // for tab transitions

  const theme = window.TAVIL_THEMES[darkMode ? 'dark' : 'light'];
  const accent = window.TAVIL_ACCENTS[accentKey];
  const t = window.TAVIL_I18N[lang];
  const user = window.TAVIL_DATA.user;

  // Edit-mode bridge
  uEEE(() => {
    const onMsg = (ev) => {
      if (ev.data?.type === '__activate_edit_mode') setEditOpen(true);
      if (ev.data?.type === '__deactivate_edit_mode') setEditOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const [editOpen, setEditOpen] = uSSS(false);

  // Persist tweaks through the host bridge
  const persistTweaks = (patch) => {
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: patch }, '*');
  };
  const setDM = (v) => { setDarkMode(v); persistTweaks({ darkMode: v }); };
  const setAK = (v) => { setAccentKey(v); persistTweaks({ accent: v }); };
  const setLg = (v) => { setLang(v); persistTweaks({ language: v }); };

  const ctx = {
    theme, accent, t, user, lang, darkMode, accentKey,
    setDarkMode: setDM, setAccentKey: setAK, setLang: setLg,
  };

  // Tab ordering for horizontal transition direction
  const tabOrder = ['home', 'news', 'agenda', 'directory', 'more'];
  const changeTab = (next) => {
    const prevIdx = tabOrder.indexOf(tab);
    const nextIdx = tabOrder.indexOf(next);
    setNav({ prev: tab, cur: next, dir: nextIdx > prevIdx ? 1 : -1 });
    setTab(next);
    setStack([]); // reset any push
    setTimeout(() => setNav(n => ({ ...n, prev: null })), 520);
  };

  const push = (s) => setStack(st => [...st, s]);
  const pop = () => setStack(st => st.slice(0, -1));
  const topStack = stack[stack.length - 1];

  // Nav from quick-access / drawer
  const navigate = (key) => {
    if (tabOrder.includes(key)) { changeTab(key); return; }
    push(key);
  };
  const openNews = (id) => { setNewsId(id); push('news-detail'); };

  const renderTab = (tabKey) => {
    const baseProps = { onOpenDrawer: () => setDrawer(true) };
    switch (tabKey) {
      case 'home': return <HomeScreen {...baseProps} onNavigate={navigate} onOpenNews={openNews}/>;
      case 'news': return <NewsScreen {...baseProps} onOpenNews={openNews}/>;
      case 'agenda': return <AgendaScreen {...baseProps}/>;
      case 'directory': return <DirectoryScreen {...baseProps}/>;
      case 'more': return <MoreScreen onNavigate={navigate} onLogout={() => setScreen('login')}/>;
      default: return null;
    }
  };

  const renderStack = (s) => {
    switch (s) {
      case 'news-detail': return <NewsDetailScreen id={newsId} onBack={pop}/>;
      case 'activities': return <ActivitiesScreen onBack={pop}/>;
      case 'voice': return <VoiceScreen onBack={pop}/>;
      case 'requests': return <RequestsScreen onBack={pop}/>;
      case 'profile': return <ProfileScreen onBack={pop} onLogout={() => { setScreen('login'); setStack([]); }}/>;
      case 'agenda': return <AgendaScreen onBack={pop}/>;
      case 'campus': return <CampusScreen onBack={pop}/>;
      case 'espai': return <EspaiScreen onBack={pop}/>;
      case 'notifications': return <NotificationsScreen onBack={pop} onNavigate={navigate}/>;
      case 'forgot': return <ForgotScreen onBack={pop}/>;
      default: return null;
    }
  };

  return (
    <AppCtx.Provider value={ctx}>
      <div data-screen-label={screen === 'login' ? '00 Login' : `Mobile · ${tab}${topStack ? ' · ' + topStack : ''}`}
        style={{
          height: '100%', background: theme.bg,
          fontFamily: 'Instrument Sans, Inter, -apple-system, system-ui, sans-serif',
          color: theme.text, position: 'relative', overflow: 'hidden',
        }}>
        {screen === 'login' && (
          <div style={{ height: '100%' }}>
            <LoginScreen onLogin={(opts) => {
              if (opts && opts.go === 'register') setScreen('register');
              else if (opts && opts.go === 'forgot') setScreen('forgot');
              else { setScreen('app'); setTab('home'); }
            }}/>
          </div>
        )}
        {screen === 'register' && (
          <div key="reg" style={{ height: '100%', animation: 'pushInRight 380ms cubic-bezier(.23,1,.32,1) both' }}>
            <RegisterScreen onBack={() => setScreen('login')} onNext={(form) => { setRegEmail(form.email); setScreen('verify'); }}/>
          </div>
        )}
        {screen === 'verify' && (
          <div key="ver" style={{ height: '100%', animation: 'pushInRight 380ms cubic-bezier(.23,1,.32,1) both' }}>
            <VerifyScreen email={regEmail} onBack={() => setScreen('register')} onVerified={() => { setScreen('app'); setTab('home'); }}/>
          </div>
        )}
        {screen === 'forgot' && (
          <div key="fgt" style={{ height: '100%', animation: 'pushInRight 380ms cubic-bezier(.23,1,.32,1) both' }}>
            <ForgotScreen onBack={() => setScreen('login')}/>
          </div>
        )}
        {screen === 'app' && (
          <div style={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
            {/* Tabs with crossfade when tab changes */}
            <div style={{ height: '100%', position: 'relative' }}>
              {nav.prev && (
                <div key={nav.prev + '-exit'} style={{
                  position: 'absolute', inset: 0,
                  animation: `${nav.dir > 0 ? 'pushOutLeft' : 'pushOutRight'} 480ms cubic-bezier(.23,1,.32,1) both`,
                  zIndex: 1,
                }}>{renderTab(nav.prev)}</div>
              )}
              <div key={tab + '-enter'} style={{
                position: 'absolute', inset: 0,
                animation: nav.prev ? `${nav.dir > 0 ? 'pushInRight' : 'pushInLeft'} 480ms cubic-bezier(.23,1,.32,1) both` : 'none',
                zIndex: 2,
              }}>{renderTab(tab)}</div>
            </div>

            {/* Stack — pushed screens on top of tabs */}
            {stack.map((s, i) => (
              <div key={s + i} style={{
                position: 'absolute', inset: 0, background: theme.bg,
                animation: 'pushInRight 380ms cubic-bezier(.23,1,.32,1) both',
                zIndex: 50 + i,
              }}>
                {renderStack(s)}
              </div>
            ))}

            {/* Tab bar (always visible on tabs; hidden when stack has pushed) */}
            {stack.length === 0 && <TabBar current={tab} onChange={changeTab}/>}

            <Drawer open={drawer} onClose={() => setDrawer(false)} onNavigate={navigate}/>
          </div>
        )}

        {/* Tweaks panel */}
        {editOpen && <TweaksPanel onClose={() => setEditOpen(false)}/>}
      </div>
      <style>{`
        @keyframes pushInRight  { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes pushOutLeft  { from { transform: translateX(0); } to { transform: translateX(-28%); opacity: .7; } }
        @keyframes pushInLeft   { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        @keyframes pushOutRight { from { transform: translateX(0); } to { transform: translateX(28%); opacity: .7; } }
      `}</style>
    </AppCtx.Provider>
  );
}

function PlaceholderScreen({ onBack, title }) {
  const { theme, accent } = useApp();
  return (
    <div style={{ height: '100%', background: theme.bg, display: 'flex', flexDirection: 'column' }}>
      <AppHeader onBack={onBack} title={title}/>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16, background: accent.primaryLight, color: accent.primary,
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
          }}><Icon name="campus" size={30}/></div>
          <div style={{ fontFamily: '"Instrument Serif", serif', fontSize: 24, letterSpacing: '-0.01em', marginBottom: 6 }}>{title}</div>
          <div style={{ fontSize: 13, color: theme.textMuted, maxWidth: 220, margin: '0 auto', lineHeight: 1.4 }}>Aquesta secció es mostra aquí com a placeholder de navegació.</div>
        </div>
      </div>
    </div>
  );
}

function TweaksPanel({ onClose }) {
  const { theme, accent, darkMode, setDarkMode, lang, setLang, accentKey, setAccentKey } = useApp();
  return (
    <div style={{
      position: 'fixed', right: 20, bottom: 20,
      width: 250, background: theme.card,
      border: `1px solid ${theme.border}`, borderRadius: 16,
      boxShadow: `0 20px 50px -20px ${theme.shadowMd}`,
      padding: 14, zIndex: 1000,
      fontFamily: 'Instrument Sans, Inter, sans-serif',
      color: theme.text,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>Tweaks</div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: theme.textMuted, padding: 2 }}><Icon name="close" size={14}/></button>
      </div>
      <div style={{ fontSize: 10.5, fontWeight: 600, color: theme.textFaint, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>Aparença</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
        {[{ id: false, l: 'Clar' }, { id: true, l: 'Fosc' }].map(o => (
          <button key={String(o.id)} onClick={() => setDarkMode(o.id)} style={{
            padding: '8px 4px', borderRadius: 8, fontSize: 12,
            background: darkMode === o.id ? theme.text : 'transparent',
            color: darkMode === o.id ? theme.bg : theme.text,
            border: `1px solid ${theme.border}`, cursor: 'pointer', fontFamily: 'inherit',
          }}>{o.l}</button>
        ))}
      </div>
      <div style={{ fontSize: 10.5, fontWeight: 600, color: theme.textFaint, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>Accent</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {Object.entries(window.TAVIL_ACCENTS).map(([k, v]) => (
          <button key={k} onClick={() => setAccentKey(k)} style={{
            width: 28, height: 28, borderRadius: 14, background: v.primary,
            border: `2px solid ${accentKey === k ? theme.text : 'transparent'}`,
            boxShadow: accentKey === k ? `0 0 0 2px ${theme.card}, 0 0 0 3px ${theme.text}` : 'none',
            cursor: 'pointer',
          }} aria-label={v.name}/>
        ))}
      </div>
      <div style={{ fontSize: 10.5, fontWeight: 600, color: theme.textFaint, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>Idioma</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
        {['ca', 'es', 'en'].map(l => (
          <button key={l} onClick={() => setLang(l)} style={{
            padding: '7px 0', borderRadius: 8, fontSize: 12, fontWeight: 500,
            background: lang === l ? theme.text : 'transparent',
            color: lang === l ? theme.bg : theme.text,
            border: `1px solid ${theme.border}`, cursor: 'pointer', fontFamily: 'inherit',
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>{l}</button>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { App, TweaksPanel, PlaceholderScreen });
