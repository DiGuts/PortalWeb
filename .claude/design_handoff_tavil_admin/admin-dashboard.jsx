// Admin dashboard — quick actions only (per spec).

function AdminDashboard({ onNavigate }) {
  const { theme, accent, user } = useDApp();
  const data = window.TAVIL_DATA;

  // Quick-action cards: jump-offs to create entities + bulk flows.
  const quickActions = [
    {
      id: 'new-user', label: 'Nou usuari',
      sub: 'Crea un compte i envia-li l\'accés',
      icon: 'users', target: 'admin-users', kind: 'create',
    },
    {
      id: 'import-users', label: 'Importa CSV',
      sub: 'Alta massiva des d\'un fitxer',
      icon: 'plus', target: 'admin-users', kind: 'import',
    },
    {
      id: 'new-news', label: 'Nova notícia',
      sub: 'Publica o programa un article',
      icon: 'news', target: 'admin-news', kind: 'create',
    },
    {
      id: 'new-activity', label: 'Nova activitat',
      sub: 'Esdeveniment intern amb inscripció',
      icon: 'activity', target: 'admin-activities', kind: 'create',
    },
    {
      id: 'new-formation', label: 'Nova formació',
      sub: 'Curs o itinerari del Campus',
      icon: 'campus', target: 'admin-campus', kind: 'create',
    },
    {
      id: 'new-agenda', label: 'Nou esdeveniment',
      sub: 'Reunió o jornada corporativa',
      icon: 'calendar', target: 'admin-agenda', kind: 'create',
    },
  ];

  // Counts shown beside each module on the lists below
  const counts = {
    users: data.directory.length,
    news: data.news.length,
    activities: data.activities.length,
    formations: data.courses.length,
    agenda: data.agenda.length,
  };

  const modules = [
    { id: 'admin-users', label: 'Usuaris', icon: 'users', n: counts.users, sub: 'comptes actius' },
    { id: 'admin-news', label: 'Notícies', icon: 'news', n: counts.news, sub: 'articles publicats' },
    { id: 'admin-activities', label: 'Activitats', icon: 'activity', n: counts.activities, sub: 'esdeveniments interns' },
    { id: 'admin-campus', label: 'Formacions', icon: 'campus', n: counts.formations, sub: 'cursos al catàleg' },
    { id: 'admin-agenda', label: 'Agenda', icon: 'calendar', n: counts.agenda, sub: 'entrades planificades' },
  ];

  return (
    <AdminFont>
      <AdminHeader
        kicker={`Bon dia, ${user.name.split(' ')[0]}`}
        title="Tauler d'administració"
        subtitle="Accés ràpid a les tasques més freqüents. Selecciona un mòdul per a una vista detallada."
      />

      {/* Quick actions — 3 columns */}
      <div style={{
        fontSize: 10.5, fontWeight: 600, color: theme.textFaint,
        textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 12,
        fontFamily: ADMIN_FONT_BODY,
      }}>Accions ràpides</div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 36,
      }}>
        {quickActions.map(a => (
          <button key={a.id} onClick={() => onNavigate(a.target)} style={{
            padding: 18, background: theme.card, border: `1px solid ${theme.border}`,
            borderRadius: 10, textAlign: 'left', cursor: 'pointer',
            display: 'flex', alignItems: 'flex-start', gap: 14,
            fontFamily: ADMIN_FONT_BODY, color: theme.text,
            transition: 'border-color 140ms, background 140ms',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = theme.bgAlt; e.currentTarget.style.borderColor = accent.primary + '55'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = theme.card; e.currentTarget.style.borderColor = theme.border; }}>
            <div style={{
              width: 38, height: 38, borderRadius: 8,
              background: accent.primaryLight, color: accent.primaryDark,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}><DIcon name={a.icon} size={18} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: ADMIN_FONT_DISPLAY, fontSize: 19, fontWeight: 500,
                letterSpacing: 0, lineHeight: 1.1, color: theme.text,
              }}>{a.label}</div>
              <div style={{ fontSize: 12.5, color: theme.textMuted, marginTop: 4 }}>{a.sub}</div>
            </div>
            <DIcon name="arrowRight" size={15} style={{ color: theme.textFaint, marginTop: 12 }} />
          </button>
        ))}
      </div>

      {/* Module list — open the corresponding management page */}
      <div style={{
        fontSize: 10.5, fontWeight: 600, color: theme.textFaint,
        textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 12,
        fontFamily: ADMIN_FONT_BODY,
      }}>Mòduls</div>
      <div style={{
        background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 10,
        overflow: 'hidden',
      }}>
        {modules.map((m, i) => (
          <button key={m.id} onClick={() => onNavigate(m.id)} style={{
            width: '100%', display: 'grid', gridTemplateColumns: '38px 1fr auto auto',
            alignItems: 'center', gap: 14, padding: '14px 18px',
            border: 'none', background: 'transparent', cursor: 'pointer',
            borderBottom: i < modules.length - 1 ? `1px solid ${theme.border}` : 'none',
            fontFamily: ADMIN_FONT_BODY, color: theme.text, textAlign: 'left',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = theme.bgAlt}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
            <div style={{
              width: 38, height: 38, borderRadius: 8,
              background: theme.bgAlt, color: theme.textMuted,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><DIcon name={m.icon} size={18} /></div>
            <div style={{
              fontFamily: ADMIN_FONT_DISPLAY, fontSize: 20, fontWeight: 500,
              letterSpacing: 0, color: theme.text,
            }}>{m.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{
                fontFamily: ADMIN_FONT_DISPLAY, fontSize: 22, fontWeight: 500,
                color: theme.text, fontFeatureSettings: '"tnum"',
              }}>{m.n}</span>
              <span style={{ fontSize: 11.5, color: theme.textFaint }}>{m.sub}</span>
            </div>
            <DIcon name="arrowRight" size={15} style={{ color: theme.textFaint }} />
          </button>
        ))}
      </div>
    </AdminFont>
  );
}

Object.assign(window, { AdminDashboard });
