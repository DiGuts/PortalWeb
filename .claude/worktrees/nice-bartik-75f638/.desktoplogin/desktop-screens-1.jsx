// Desktop screens — part 1: Home, News, Agenda, Directory, Activities, Notifications

const { useState: sc1S, useEffect: sc1E, useRef: sc1R } = React;

// ─────────── Home ───────────
function DHome({ onNavigate, onOpenNews }) {
  const { theme, accent, t, user } = useDApp();
  const data = window.TAVIL_DATA;
  const featured = data.news.find(n => n.featured) || data.news[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t.common.goodMorning : hour < 19 ? t.common.goodAfternoon : t.common.goodEvening;

  return (
    <div>
      {/* Greeting + urgent banner */}
      <div style={{
        padding: '26px 0 28px',
        display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1fr)', gap: 24,
        alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: 13, color: theme.textMuted, marginBottom: 6, letterSpacing: '0.01em' }}>
            {greeting}, {new Date().toLocaleDateString('ca-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          <h1 style={{
            fontFamily: '"Instrument Serif", serif',
            fontSize: 60, fontWeight: 400, lineHeight: 1, margin: 0,
            letterSpacing: '-0.03em', color: theme.text,
          }}>
            Hola, {user.name.split(' ')[0]}.
          </h1>
          <p style={{ fontSize: 14, color: theme.textMuted, margin: '14px 0 0', lineHeight: 1.45, maxWidth: 460 }}>
            Aquest és el resum del teu dia al portal intern TAVIL. 3 notificacions noves i 2 esdeveniments en l'agenda.
          </p>
        </div>
        <div style={{
          background: accent.primary, color: '#fff',
          borderRadius: 14, padding: '18px 20px',
          display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer',
        }}>
          <DIcon name="alert" size={22} stroke={1.8}/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 10.5, fontWeight: 700, letterSpacing: '0.16em',
              textTransform: 'uppercase', opacity: 0.85, marginBottom: 3,
            }}>{t.home.urgent}</div>
            <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.35 }}>
              Tall de llum programat dijous 23 · 08:00–09:30 a la planta Terrassa. Els equips de producció han estat informats.
            </div>
          </div>
          <DIcon name="chevronRight" size={20}/>
        </div>
      </div>

      {/* Quick access */}
      <DSectionHead kicker="Accés ràpid" title={t.home.quickAccess}/>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 36 }}>
        {[
          { id: 'requests', icon: 'requests', label: t.nav.solicituds, sub: '3 pendents' },
          { id: 'agenda', icon: 'calendar', label: t.nav.agenda, sub: '2 avui' },
          { id: 'voice', icon: 'voice', label: t.nav.veu, sub: '1 enquesta' },
          { id: 'campus', icon: 'campus', label: t.nav.campus, sub: '2 en curs' },
          { id: 'espai', icon: 'news', label: t.nav.espai, sub: '6 docs' },
          { id: 'directory', icon: 'directory', label: t.nav.directori, sub: '128 persones' },
        ].map(q => (
          <button key={q.id} onClick={() => onNavigate(q.id)} style={{
            background: theme.card, border: `1px solid ${theme.border}`,
            borderRadius: 14, padding: '16px 14px',
            display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10,
            color: theme.text, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
            transition: 'all 180ms',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 10px 24px -12px ${theme.shadowMd}`; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: accent.primaryLight, color: accent.primaryDark,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><DIcon name={q.icon} size={20} stroke={1.7}/></div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: theme.text, marginBottom: 2 }}>{q.label}</div>
              <div style={{ fontSize: 11.5, color: theme.textFaint }}>{q.sub}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Two-column: featured news + agenda */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.55fr) minmax(0, 1fr)', gap: 28, marginBottom: 36 }}>
        <div>
          <DSectionHead kicker={t.news.featured} title={t.home.latestNews} action={t.common.seeAll} onAction={() => onNavigate('news')}/>
          <DCard padding={0} onClick={() => onOpenNews(featured.id)}>
            <DImgPh label="cover · primavera 2026" ratio="16/8" tone="accent" style={{ borderRadius: '13px 13px 0 0', border: 'none', borderBottom: `1px solid ${theme.border}` }}/>
            <div style={{ padding: 22 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <DBadge variant="accent">{featured.tag}</DBadge>
                <DBadge>{featured.readMin} {t.news.minRead}</DBadge>
              </div>
              <h3 style={{
                fontFamily: '"Instrument Serif", serif',
                fontSize: 28, fontWeight: 400, lineHeight: 1.1, margin: 0, marginBottom: 10,
                letterSpacing: '-0.015em', color: theme.text, textWrap: 'balance',
              }}>{featured.title}</h3>
              <p style={{ fontSize: 14, color: theme.textMuted, margin: 0, lineHeight: 1.5 }}>{featured.summary}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, fontSize: 12.5, color: theme.textFaint }}>
                <DAvatar name={featured.author} size={22}/>
                <span style={{ color: theme.text, fontWeight: 500 }}>{featured.author}</span>
                <span>·</span>
                <span>{featured.date}</span>
              </div>
            </div>
          </DCard>
          {/* Other news list */}
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column' }}>
            {data.news.slice(1, 4).map((n, i) => (
              <button key={n.id} onClick={() => onOpenNews(n.id)} style={{
                display: 'flex', gap: 16, padding: '16px 4px',
                borderBottom: i < 2 ? `1px solid ${theme.border}` : 'none',
                cursor: 'pointer', background: 'transparent', border: 'none', textAlign: 'left',
                fontFamily: 'inherit', width: '100%',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10.5, color: accent.primary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>{n.tag}</div>
                  <div style={{
                    fontFamily: '"Instrument Serif", serif',
                    fontSize: 19, fontWeight: 400, lineHeight: 1.2, color: theme.text,
                    letterSpacing: '-0.01em',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>{n.title}</div>
                  <div style={{ fontSize: 11.5, color: theme.textFaint, marginTop: 8, display: 'flex', gap: 8 }}>
                    <span>{n.date}</span><span>·</span><span>{n.readMin} {t.news.minRead}</span>
                  </div>
                </div>
                <DImgPh label="img" style={{ width: 110, height: 78, flexShrink: 0, aspectRatio: 'auto' }}/>
              </button>
            ))}
          </div>
        </div>

        <div>
          <DSectionHead kicker="Agenda" title={t.home.upcomingAgenda} action={t.common.seeAll} onAction={() => onNavigate('agenda')}/>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.agenda.slice(0, 5).map(ev => {
              const color = ev.color === 'accent' ? accent.primary : ev.color === 'olive' ? theme.olive : theme.text;
              return (
                <div key={ev.id} style={{
                  display: 'flex', gap: 14, padding: 14, background: theme.card,
                  border: `1px solid ${theme.border}`, borderRadius: 12,
                }}>
                  <div style={{
                    width: 56, flexShrink: 0, textAlign: 'center', paddingTop: 4,
                    borderRight: `1px solid ${theme.border}`,
                  }}>
                    <div style={{ fontFamily: '"Instrument Serif", serif', fontSize: 30, lineHeight: 1, color: accent.primary }}>{ev.day}</div>
                    <div style={{ fontSize: 10.5, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 3 }}>{ev.month}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.25, color: theme.text, marginBottom: 6 }}>{ev.title}</div>
                    <div style={{ fontSize: 11.5, color: theme.textMuted, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                      <DIcon name="clock" size={12}/>{ev.time}
                    </div>
                    <div style={{ fontSize: 11.5, color: theme.textMuted, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <DIcon name="mapPin" size={12}/>{ev.where}
                    </div>
                  </div>
                  <div style={{ width: 3, background: color, borderRadius: 2, alignSelf: 'stretch', flexShrink: 0 }}/>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Activities + team strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 28, marginBottom: 36 }}>
        <div>
          <DSectionHead kicker="Vida a l'empresa" title="Activitats properes" action={t.common.seeAll} onAction={() => onNavigate('activities')}/>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.activities.slice(0, 3).map(a => {
              const pct = Math.round((a.enrolled / a.capacity) * 100);
              const full = a.status === 'full';
              return (
                <DCard key={a.id} padding={14} interactive>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                    <DBadge variant="olive">{a.tag}</DBadge>
                    {full && <DBadge variant="warning">Complert</DBadge>}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: theme.text, marginBottom: 6 }}>{a.title}</div>
                  <div style={{ fontSize: 11.5, color: theme.textMuted, marginBottom: 10, display: 'flex', gap: 12 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><DIcon name="clock" size={11}/>{a.date}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><DIcon name="mapPin" size={11}/>{a.where}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, height: 4, borderRadius: 2, background: theme.bgAlt, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: full ? theme.olive : accent.primary }}/>
                    </div>
                    <span style={{ fontSize: 11, color: theme.textFaint, fontFeatureSettings: '"tnum"' }}>{a.enrolled}/{a.capacity}</span>
                  </div>
                </DCard>
              );
            })}
          </div>
        </div>

        <div>
          <DSectionHead kicker="Equip" title="Qui és qui" action={t.common.seeAll} onAction={() => onNavigate('directory')}/>
          <div style={{
            background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 12,
            overflow: 'hidden',
          }}>
            {data.directory.slice(0, 5).map((p, i, arr) => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
                borderBottom: i < arr.length - 1 ? `1px solid ${theme.border}` : 'none',
              }}>
                <DAvatar name={p.name} size={38}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: theme.text }}>{p.name}</div>
                  <div style={{ fontSize: 11.5, color: theme.textMuted }}>{p.role} · {p.dept}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button style={{ width: 30, height: 30, borderRadius: 15, background: theme.bgAlt, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.textMuted }}><DIcon name="phone" size={14}/></button>
                  <button style={{ width: 30, height: 30, borderRadius: 15, background: theme.bgAlt, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.textMuted }}><DIcon name="mail" size={14}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────── News list ───────────
function DNewsList({ onOpenNews }) {
  const { theme, accent, t } = useDApp();
  const data = window.TAVIL_DATA;
  const tags = ['all', 'Empresa', 'Resultats', 'Sostenibilitat', 'Persones', 'Tecnologia'];
  const [tag, setTag] = sc1S('all');
  const [q, setQ] = sc1S('');
  const filtered = data.news.filter(n =>
    (tag === 'all' || n.tag === tag) &&
    (!q || (n.title + n.summary).toLowerCase().includes(q.toLowerCase()))
  );
  return (
    <div>
      <DPageHeader kicker="Comunicació interna" title={t.nav.noticies} subtitle={t.news.subtitle}
        actions={<DBtn icon="plus">{t.news.newArticle}</DBtn>}
      />
      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 22, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 240, maxWidth: 360 }}>
          <DInput icon="search" placeholder="Cerca dins de notícies…" value={q} onChange={e => setQ(e.target.value)}/>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {tags.map(tg => (
            <button key={tg} onClick={() => setTag(tg)} style={{
              padding: '8px 14px', borderRadius: 999,
              background: tag === tg ? theme.text : theme.card,
              color: tag === tg ? theme.bg : theme.textMuted,
              border: `1px solid ${tag === tg ? theme.text : theme.border}`,
              fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
              fontFamily: 'inherit',
            }}>{tg === 'all' ? t.common.all : tg}</button>
          ))}
        </div>
      </div>
      {/* Featured hero */}
      {filtered[0] && (
        <DCard padding={0} onClick={() => onOpenNews(filtered[0].id)} style={{ marginBottom: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)' }}>
            <DImgPh label="cover image" ratio="4/3" tone="accent" style={{ borderRadius: '13px 0 0 13px', border: 'none', aspectRatio: 'auto', height: '100%' }}/>
            <div style={{ padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <DBadge variant="accent">{filtered[0].tag}</DBadge>
                <DBadge>{filtered[0].readMin} {t.news.minRead}</DBadge>
                <DBadge>Destacat</DBadge>
              </div>
              <h2 style={{ fontFamily: '"Instrument Serif", serif', fontSize: 36, fontWeight: 400, lineHeight: 1.05, margin: 0, letterSpacing: '-0.02em', textWrap: 'balance', marginBottom: 14 }}>{filtered[0].title}</h2>
              <p style={{ fontSize: 14.5, color: theme.textMuted, margin: 0, lineHeight: 1.5 }}>{filtered[0].summary}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 20, fontSize: 12.5, color: theme.textFaint }}>
                <DAvatar name={filtered[0].author} size={26}/>
                <span style={{ color: theme.text, fontWeight: 500 }}>{filtered[0].author}</span>
                <span>·</span>
                <span>{filtered[0].date}</span>
              </div>
            </div>
          </div>
        </DCard>
      )}
      {/* Rest: grid of cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        {filtered.slice(1).map(n => (
          <DCard key={n.id} padding={0} onClick={() => onOpenNews(n.id)}>
            <DImgPh label={n.tag.toLowerCase()} ratio="16/10" style={{ borderRadius: '13px 13px 0 0', border: 'none', borderBottom: `1px solid ${theme.border}` }}/>
            <div style={{ padding: 18 }}>
              <div style={{ fontSize: 10.5, color: accent.primary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>{n.tag}</div>
              <h4 style={{ fontFamily: '"Instrument Serif", serif', fontSize: 20, fontWeight: 400, lineHeight: 1.2, margin: 0, letterSpacing: '-0.01em', textWrap: 'balance', marginBottom: 10 }}>{n.title}</h4>
              <p style={{ fontSize: 13, color: theme.textMuted, margin: 0, lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.summary}</p>
              <div style={{ fontSize: 11.5, color: theme.textFaint, marginTop: 12, display: 'flex', gap: 8 }}>
                <span>{n.date}</span><span>·</span><span>{n.readMin} {t.news.minRead}</span>
              </div>
            </div>
          </DCard>
        ))}
      </div>
    </div>
  );
}

// ─────────── News detail ───────────
function DNewsDetail({ id, onBack, onOpenNews }) {
  const { theme, accent, t } = useDApp();
  const data = window.TAVIL_DATA;
  const items = data.news;
  const idx = Math.max(0, items.findIndex(n => n.id === id));
  const n = items[idx];
  const prev = items[idx - 1];
  const next = items[idx + 1];
  return (
    <div>
      {/* Back link */}
      <button onClick={onBack} style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: 'transparent', border: 'none', color: theme.textMuted,
        fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
        padding: '8px 0', marginTop: 18, marginBottom: 16,
      }}>
        <DIcon name="chevronLeft" size={15}/> {t.nav.noticies}
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2.3fr) minmax(0, 1fr)', gap: 48 }}>
        <article>
          <DBadge variant="accent" style={{ marginBottom: 16 }}>{n.tag}</DBadge>
          <h1 style={{
            fontFamily: '"Instrument Serif", serif',
            fontSize: 54, fontWeight: 400, lineHeight: 1.02, margin: 0, marginBottom: 20,
            letterSpacing: '-0.03em', textWrap: 'balance',
          }}>{n.title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28, fontSize: 13, color: theme.textMuted }}>
            <DAvatar name={n.author} size={36}/>
            <div>
              <div style={{ color: theme.text, fontWeight: 500, fontSize: 13.5 }}>{n.author}</div>
              <div style={{ marginTop: 2 }}>{n.date} · {n.readMin} {t.news.minRead}</div>
            </div>
            <div style={{ flex: 1 }}/>
            <DBtn variant="secondary" size="sm" icon="share">{t.news.share}</DBtn>
          </div>
          <DImgPh label="hero image" ratio="16/9" tone="accent" style={{ borderRadius: 14, marginBottom: 28 }}/>
          <div style={{ fontSize: 17, lineHeight: 1.65, color: theme.text, maxWidth: 680 }}>
            <p style={{ margin: '0 0 18px', fontSize: 20, color: theme.textMuted, fontFamily: '"Instrument Serif", serif', fontStyle: 'italic', lineHeight: 1.4 }}>
              {n.summary}
            </p>
            <p style={{ margin: '0 0 18px' }}>
              El passat dijous, a la seu central de TAVIL, es van reunir més d'un centenar de persones dels equips comercial, disseny i producció per la presentació oficial de la nova col·lecció primavera 2026. L'acte, conduit per la directora creativa Laia Font, va repassar les peces més destacades i els processos productius darrere de cadascuna.
            </p>
            <p style={{ margin: '0 0 18px' }}>
              Entre els moments més aplaudits hi va haver la presentació de la nova línia sostenible, fabricada íntegrament amb materials reciclats de proveïdors catalans, i l'anunci d'una col·laboració amb l'escola d'art de Terrassa.
            </p>
            <p style={{ margin: '0 0 18px' }}>
              La presentació es va tancar amb un vermut a la terrassa de l'edifici i un primer dinar d'equip de la temporada.
            </p>
          </div>

          {/* Prev / next */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
            marginTop: 48, paddingTop: 28, borderTop: `1px solid ${theme.border}`,
          }}>
            {prev ? (
              <button onClick={() => onOpenNews(prev.id)} style={{
                background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 16,
                textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <div style={{ fontSize: 11, color: theme.textFaint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>← Anterior</div>
                <div style={{ fontFamily: '"Instrument Serif", serif', fontSize: 16, color: theme.text, letterSpacing: '-0.01em', lineHeight: 1.25 }}>{prev.title}</div>
              </button>
            ) : <div/>}
            {next ? (
              <button onClick={() => onOpenNews(next.id)} style={{
                background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 16,
                textAlign: 'right', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <div style={{ fontSize: 11, color: theme.textFaint, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Següent →</div>
                <div style={{ fontFamily: '"Instrument Serif", serif', fontSize: 16, color: theme.text, letterSpacing: '-0.01em', lineHeight: 1.25 }}>{next.title}</div>
              </button>
            ) : <div/>}
          </div>
        </article>

        <aside style={{ position: 'sticky', top: 96, alignSelf: 'start' }}>
          <div style={{ fontSize: 11, color: theme.textFaint, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 14 }}>Més notícies</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {items.filter(it => it.id !== n.id).slice(0, 4).map(it => (
              <button key={it.id} onClick={() => onOpenNews(it.id)} style={{
                display: 'flex', gap: 12, padding: '10px 0', background: 'transparent',
                border: 'none', borderBottom: `1px solid ${theme.border}`,
                cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', alignItems: 'flex-start',
              }}>
                <DImgPh label="img" style={{ width: 68, height: 52, flexShrink: 0, aspectRatio: 'auto' }}/>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 10, color: accent.primary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>{it.tag}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: theme.text, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{it.title}</div>
                </div>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

// ─────────── Agenda (desktop month view with event list) ───────────
function DAgenda() {
  const { theme, accent, t } = useDApp();
  const data = window.TAVIL_DATA;
  const [selected, setSelected] = sc1S(22);
  // Build a month grid for April 2026 (apr 1 is Wednesday)
  const firstDay = 2; // Mon=0, so Wed=2
  const daysInMonth = 30;
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const weekdays = ['Dl', 'Dt', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg'];
  const eventsByDay = {};
  data.agenda.forEach(e => { (eventsByDay[e.day] = eventsByDay[e.day] || []).push(e); });
  const events = data.agenda.filter(e => e.day === selected);

  return (
    <div>
      <DPageHeader kicker="Abril 2026" title={t.nav.agenda}
        actions={<>
          <DBtn variant="secondary" icon="filter">{t.common.filter}</DBtn>
          <DBtn icon="plus">{t.common.new}</DBtn>
        </>}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)', gap: 28 }}>
        {/* Calendar grid */}
        <DCard padding={20}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={{ fontFamily: '"Instrument Serif", serif', fontSize: 24, letterSpacing: '-0.01em' }}>Abril 2026</div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button style={{ width: 32, height: 32, borderRadius: 8, background: theme.bgAlt, border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.text }}><DIcon name="chevronLeft" size={14}/></button>
              <button style={{ width: 32, height: 32, borderRadius: 8, background: theme.bgAlt, border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.text }}><DIcon name="chevronRight" size={14}/></button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 10 }}>
            {weekdays.map(w => (
              <div key={w} style={{ fontSize: 10.5, fontWeight: 600, color: theme.textFaint, textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', padding: '6px 0' }}>{w}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
            {cells.map((d, i) => {
              if (d === null) return <div key={i}/>;
              const evs = eventsByDay[d] || [];
              const active = d === selected;
              const today = d === 22;
              return (
                <button key={i} onClick={() => setSelected(d)} style={{
                  aspectRatio: '1/1.05', borderRadius: 10,
                  background: active ? theme.text : theme.bgAlt,
                  color: active ? theme.bg : theme.text,
                  border: `1px solid ${active ? theme.text : theme.border}`,
                  padding: '8px 8px', cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start',
                  position: 'relative',
                }}>
                  <div style={{ fontSize: 15, fontWeight: today ? 700 : 500, fontFamily: '"Instrument Serif", serif', letterSpacing: '-0.01em' }}>{d}</div>
                  <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 'auto' }}>
                    {evs.slice(0, 3).map((ev, ei) => {
                      const c = ev.color === 'accent' ? accent.primary : ev.color === 'olive' ? theme.olive : (active ? theme.bg : theme.text);
                      return <div key={ei} style={{ width: 5, height: 5, borderRadius: 3, background: c, opacity: active ? 0.9 : 1 }}/>;
                    })}
                  </div>
                  {today && !active && <div style={{ position: 'absolute', top: 6, right: 6, width: 5, height: 5, borderRadius: 3, background: accent.primary }}/>}
                </button>
              );
            })}
          </div>
        </DCard>

        {/* Day detail */}
        <div>
          <div style={{ fontSize: 11, color: theme.textFaint, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 8 }}>
            {selected === 22 ? t.common.today : `${selected} d'abril`}
          </div>
          <div style={{ fontFamily: '"Instrument Serif", serif', fontSize: 32, letterSpacing: '-0.015em', marginBottom: 6 }}>
            {events.length} {events.length === 1 ? 'esdeveniment' : 'esdeveniments'}
          </div>
          <div style={{ fontSize: 13, color: theme.textMuted, marginBottom: 20 }}>Dimecres 22 d'abril · hora local Barcelona</div>

          {events.length === 0 ? (
            <DCard padding={28} style={{ textAlign: 'center' }}>
              <div style={{ color: theme.textFaint, fontSize: 13 }}>Cap esdeveniment aquest dia</div>
            </DCard>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {events.map(ev => {
                const color = ev.color === 'accent' ? accent.primary : ev.color === 'olive' ? theme.olive : theme.text;
                return (
                  <div key={ev.id} style={{ display: 'flex', gap: 14 }}>
                    <div style={{ width: 64, flexShrink: 0, paddingTop: 2 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: theme.text, fontFeatureSettings: '"tnum"' }}>{ev.time.split('–')[0].trim()}</div>
                      <div style={{ fontSize: 11, color: theme.textFaint, marginTop: 1 }}>{ev.time.split('–')[1]?.trim()}</div>
                    </div>
                    <div style={{ width: 3, background: color, borderRadius: 2, flexShrink: 0, alignSelf: 'stretch' }}/>
                    <DCard padding={14} style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.25, color: theme.text, marginBottom: 6 }}>{ev.title}</div>
                      <div style={{ fontSize: 12, color: theme.textMuted, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                        <DIcon name="mapPin" size={12}/>{ev.where}
                      </div>
                      <div style={{ fontSize: 12, color: theme.textMuted, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <DIcon name="users" size={12}/>{ev.attendees} assistents
                      </div>
                    </DCard>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────── Directory ───────────
function DDirectory() {
  const { theme, accent, t } = useDApp();
  const data = window.TAVIL_DATA;
  const [q, setQ] = sc1S('');
  const [dept, setDept] = sc1S('all');
  const depts = ['all', ...[...new Set(data.directory.map(d => d.dept))]];
  const filtered = data.directory.filter(p =>
    (dept === 'all' || p.dept === dept) &&
    (!q || (p.name + p.role + p.dept).toLowerCase().includes(q.toLowerCase()))
  );
  return (
    <div>
      <DPageHeader kicker="Equip" title={t.nav.directori} subtitle="Troba qualsevol persona de TAVIL per nom, rol o departament."/>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 260, maxWidth: 400 }}>
          <DInput icon="search" placeholder="Cerca per nom, rol, departament…" value={q} onChange={e => setQ(e.target.value)}/>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {depts.map(d => (
            <button key={d} onClick={() => setDept(d)} style={{
              padding: '8px 14px', borderRadius: 999,
              background: dept === d ? theme.text : theme.card,
              color: dept === d ? theme.bg : theme.textMuted,
              border: `1px solid ${dept === d ? theme.text : theme.border}`,
              fontSize: 12.5, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
              fontFamily: 'inherit',
            }}>{d === 'all' ? t.common.all : d}</button>
          ))}
        </div>
      </div>
      {/* Person grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
        {filtered.map(p => (
          <DCard key={p.id} padding={18} interactive>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <DAvatar name={p.name} size={48}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: theme.text, letterSpacing: '-0.005em' }}>{p.name}</div>
                <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>{p.role}</div>
              </div>
            </div>
            <div style={{ fontSize: 11.5, color: theme.textFaint, marginBottom: 12, display: 'flex', gap: 10 }}>
              <span>{p.dept}</span>
              <span>·</span>
              <span>Ext. {p.ext}</span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={{ flex: 1, height: 32, borderRadius: 8, background: theme.bgAlt, border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', color: theme.textMuted, fontFamily: 'inherit', fontSize: 12 }}><DIcon name="phone" size={13}/>Trucar</button>
              <button style={{ flex: 1, height: 32, borderRadius: 8, background: theme.bgAlt, border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', color: theme.textMuted, fontFamily: 'inherit', fontSize: 12 }}><DIcon name="mail" size={13}/>Email</button>
            </div>
          </DCard>
        ))}
      </div>
    </div>
  );
}

// ─────────── Activities ───────────
function DActivities() {
  const { theme, accent, t } = useDApp();
  const data = window.TAVIL_DATA;
  const [tab, setTab] = sc1S('upcoming');
  const [enrolled, setEnrolled] = sc1S({});
  return (
    <div>
      <DPageHeader kicker="Vida a l'empresa" title={t.nav.activitats} subtitle="Activitats internes, formacions i esdeveniments oberts a tothom."
        actions={<DBtn icon="plus">Proposa una activitat</DBtn>}
      />
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        {[
          { id: 'upcoming', label: 'Pròximes' },
          { id: 'past', label: 'Passades' },
          { id: 'mine', label: 'Les meves' },
        ].map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)} style={{
            padding: '9px 16px', borderRadius: 999,
            background: tab === tb.id ? theme.text : theme.card,
            color: tab === tb.id ? theme.bg : theme.textMuted,
            border: `1px solid ${tab === tb.id ? theme.text : theme.border}`,
            fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
          }}>{tb.label}</button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
        {data.activities.map(a => {
          const isEnrolled = enrolled[a.id];
          const pct = Math.round((a.enrolled / a.capacity) * 100);
          const full = a.status === 'full';
          return (
            <DCard key={a.id} padding={0}>
              <DImgPh label={a.tag.toLowerCase()} ratio="16/9" style={{ borderRadius: '13px 13px 0 0', border: 'none', borderBottom: `1px solid ${theme.border}` }}/>
              <div style={{ padding: 18 }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  <DBadge variant="olive">{a.tag}</DBadge>
                  {full && <DBadge variant="warning">Complert</DBadge>}
                </div>
                <div style={{ fontFamily: '"Instrument Serif", serif', fontSize: 20, lineHeight: 1.2, color: theme.text, letterSpacing: '-0.01em', marginBottom: 12 }}>{a.title}</div>
                <div style={{ fontSize: 12.5, color: theme.textMuted, display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><DIcon name="clock" size={13}/>{a.date}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><DIcon name="mapPin" size={13}/>{a.where}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ flex: 1, height: 5, borderRadius: 3, background: theme.bgAlt, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: full ? theme.olive : accent.primary, transition: 'width 400ms' }}/>
                  </div>
                  <span style={{ fontSize: 11.5, color: theme.textFaint, fontFeatureSettings: '"tnum"' }}>{a.enrolled}/{a.capacity}</span>
                </div>
                <DBtn full size="md" variant={isEnrolled ? 'subtle' : full ? 'secondary' : 'primary'}
                  disabled={full && !isEnrolled}
                  onClick={() => setEnrolled(s => ({ ...s, [a.id]: !s[a.id] }))}
                  icon={isEnrolled ? 'check' : undefined}>
                  {isEnrolled ? 'Inscrit' : full ? 'Llista d\'espera' : "M'inscric"}
                </DBtn>
              </div>
            </DCard>
          );
        })}
      </div>
    </div>
  );
}

// ─────────── Notifications (as a page) ───────────
function DNotifications({ items, onUpdate }) {
  const { theme, accent } = useDApp();
  const markAllRead = () => onUpdate(items.map(i => ({ ...i, unread: false })));
  const unread = items.filter(i => i.unread).length;
  const today = items.filter(i => i.time.includes('h'));
  const earlier = items.filter(i => !i.time.includes('h'));
  const iconFor = (type) => ({ news: 'news', request: 'requests', agenda: 'calendar', voice: 'voice' }[type] || 'bell');

  const renderList = (list) => (
    <div style={{
      background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 12, overflow: 'hidden',
    }}>
      {list.map((it, i) => (
        <div key={it.id} style={{
          display: 'flex', gap: 14, padding: '16px 18px',
          borderBottom: i < list.length - 1 ? `1px solid ${theme.border}` : 'none',
          background: it.unread ? accent.primaryLight + '40' : 'transparent',
          cursor: 'pointer',
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            background: theme.bgAlt, color: theme.text,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><DIcon name={iconFor(it.type)} size={18}/></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: theme.text }}>{it.title}</div>
              {it.unread && <div style={{ width: 6, height: 6, borderRadius: 3, background: accent.primary }}/>}
            </div>
            <div style={{ fontSize: 13, color: theme.textMuted, lineHeight: 1.4 }}>{it.body}</div>
            <div style={{ fontSize: 11, color: theme.textFaint, marginTop: 6 }}>{it.from} · {it.time}</div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <DPageHeader kicker="Activitat" title="Notificacions" subtitle={`Tens ${unread} notificacions sense llegir.`}
        actions={unread > 0 && <DBtn variant="secondary" icon="check" onClick={markAllRead}>Marca-ho tot com a llegit</DBtn>}
      />
      <div style={{ maxWidth: 820 }}>
        {today.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, color: theme.textFaint, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 12 }}>Avui</div>
            {renderList(today)}
          </div>
        )}
        {earlier.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, color: theme.textFaint, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 12 }}>Anteriors</div>
            {renderList(earlier)}
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { DHome, DNewsList, DNewsDetail, DAgenda, DDirectory, DActivities, DNotifications });
