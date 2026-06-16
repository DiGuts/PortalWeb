// Desktop app shell — wires everything together

const { useState: aS, useEffect: aE, useMemo: aM, useRef: aR } = React;

// Top-level pages (sidebar destinations). Anything else (e.g. news-detail) is treated as a subpage.
const TOP_LEVEL = new Set([
  'home', 'news', 'agenda', 'directory', 'activities',
  'voice', 'requests', 'campus', 'espai', 'profile', 'notifications',
  'admin-dashboard', 'admin-users', 'admin-news', 'admin-activities', 'admin-campus', 'admin-agenda',
]);

function DesktopApp() {
  const [darkMode, setDarkMode] = aS(false);
  const [lang, setLang] = aS('ca');
  const [accentKey, setAccentKey] = aS('mahogany');
  const [loggedIn, setLoggedIn] = aS(true);
  const [screen, setScreen] = aS('home');
  const [newsId, setNewsId] = aS(null);
  const [collapsed, setCollapsed] = aS(false);
  const [notifs, setNotifs] = aS(window.TAVIL_DATA.notifications);

  // Transition tracking
  const [transition, setTransition] = aS({ mode: 'page', direction: 'forward' });
  const prevScreen = aR(screen);

  const theme = window.TAVIL_THEMES[darkMode ? 'dark' : 'light'];
  const accent = window.TAVIL_ACCENTS[accentKey];
  const t = window.TAVIL_I18N[lang];
  const user = window.TAVIL_DATA.user;
  const unread = notifs.filter(n => n.unread).length;

  aE(() => {
    document.body.style.background = theme.bg;
    document.body.style.color = theme.text;
    document.body.style.transition = 'background 320ms cubic-bezier(0.32, 0.72, 0.24, 1), color 320ms cubic-bezier(0.32, 0.72, 0.24, 1)';
  }, [theme]);

  const ctx = aM(() => ({ theme, accent, t, lang, setLang, darkMode, setDarkMode, user, accentKey, setAccentKey }),
    [theme, accent, t, lang, darkMode, user, accentKey]);

  // Navigation helpers — set transition mode/direction BEFORE updating screen.
  const goTo = (id, { mode, direction = 'forward' } = {}) => {
    const inferredMode = mode || (TOP_LEVEL.has(id) && TOP_LEVEL.has(prevScreen.current) ? 'page' : 'sub');
    setTransition({ mode: inferredMode, direction });
    prevScreen.current = id;
    setScreen(id);
  };

  const handleNavigate = (id) => {
    // Sidebar / top-level navigation
    goTo(id, { mode: 'page', direction: 'forward' });
    setNewsId(null);
  };
  const handleOpenNews = (id) => {
    // List → detail: subpage forward
    setNewsId(id);
    goTo('news-detail', { mode: 'sub', direction: 'forward' });
  };
  const handleBackToNews = () => {
    // Detail → list: subpage backward
    goTo('news', { mode: 'sub', direction: 'backward' });
  };

  if (!loggedIn) {
    return (
      <DesktopAppCtx.Provider value={ctx}>
        <DLogin onSignIn={() => setLoggedIn(true)}/>
      </DesktopAppCtx.Provider>
    );
  }

  const renderContent = () => {
    switch (screen) {
      case 'home': return <DHome onNavigate={handleNavigate} onOpenNews={handleOpenNews}/>;
      case 'news': return <DNewsList onOpenNews={handleOpenNews}/>;
      case 'news-detail': return <DNewsDetail id={newsId} onBack={handleBackToNews} onOpenNews={handleOpenNews}/>;
      case 'agenda': return <DAgenda/>;
      case 'directory': return <DDirectory/>;
      case 'activities': return <DActivities/>;
      case 'voice': return <DVoice/>;
      case 'requests': return <DRequests/>;
      case 'campus': return <DCampus/>;
      case 'espai': return <DEspai/>;
      case 'profile': return <DProfile onLogout={() => setLoggedIn(false)}/>;
      case 'notifications': return <DNotifications items={notifs} onUpdate={setNotifs}/>;
      case 'admin-dashboard': return <AdminDashboard onNavigate={handleNavigate}/>;
      case 'admin-users': return <AdminUsers/>;
      case 'admin-news': return <AdminNews/>;
      case 'admin-activities': return <AdminActivities/>;
      case 'admin-campus': return <AdminCampus/>;
      case 'admin-agenda': return <AdminAgenda/>;
      default: return <DHome onNavigate={handleNavigate} onOpenNews={handleOpenNews}/>;
    }
  };

  // Transition key: include news id so detail→detail also animates
  const transitionKey = screen === 'news-detail' ? `news-detail:${newsId}` : screen;

  return (
    <DesktopAppCtx.Provider value={ctx}>
      <div style={{
        minHeight: '100vh', display: 'flex',
        background: theme.bg, color: theme.text,
        fontFamily: '"Instrument Sans", system-ui, sans-serif',
      }}>
        <DSidebar
          current={screen === 'news-detail' ? 'news' : screen}
          onNavigate={handleNavigate}
          collapsed={collapsed}
          onToggle={() => setCollapsed(v => !v)}
        />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <DTopBar
            onSearch={() => {}}
            onNotifications={() => goTo('notifications', { mode: 'page' })}
            unread={unread}
            onLogout={() => setLoggedIn(false)}
          />
          <main style={{
            flex: 1, padding: '0 56px 72px',
            maxWidth: 1480, width: '100%', margin: '0 auto', boxSizing: 'border-box',
          }}>
            <DPageTransition
              transitionKey={transitionKey}
              mode={transition.mode}
              direction={transition.direction}
            >
              {renderContent()}
            </DPageTransition>
          </main>
        </div>
      </div>
    </DesktopAppCtx.Provider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<DesktopApp/>);
