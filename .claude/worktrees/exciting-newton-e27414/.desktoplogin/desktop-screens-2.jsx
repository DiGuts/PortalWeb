// Desktop screens — part 2: Voice, Requests, Campus, Espai, Profile, Login

const { useState: sc2S, useEffect: sc2E, useRef: sc2R } = React;

// ─────────── Voice (Veu de l'empleat) ───────────
function DVoice() {
  const { theme, accent, t } = useDApp();
  const data = window.TAVIL_DATA;
  const [tab, setTab] = sc2S('suggestions');
  const [newOpen, setNewOpen] = sc2S(false);
  const [title, setTitle] = sc2S('');
  const [body, setBody] = sc2S('');
  const [cat, setCat] = sc2S('Benestar');
  const [anon, setAnon] = sc2S(false);

  const statusVariant = (s) => s === 'Acceptat' ? 'success' : s === 'Implementat' ? 'accent' : 'warning';

  return (
    <div>
      <DPageHeader kicker="Participació" title={t.voice.title} subtitle={t.voice.subtitle}
      actions={<>
          <DBtn variant="secondary" icon="alert">{t.voice.newIncident}</DBtn>
          <DBtn icon="plus" onClick={() => setNewOpen(true)}>{t.voice.newSuggestion}</DBtn>
        </>} />
      
      <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
        {[
        { id: 'suggestions', label: t.voice.suggestions, count: data.suggestions.length },
        { id: 'incidents', label: t.voice.incidents, count: 2 },
        { id: 'surveys', label: t.voice.surveys, count: 1 }].
        map((tb) =>
        <button key={tb.id} onClick={() => setTab(tb.id)} style={{
          padding: '9px 16px', borderRadius: 999,
          background: tab === tb.id ? theme.text : theme.card,
          color: tab === tb.id ? theme.bg : theme.textMuted,
          border: `1px solid ${tab === tb.id ? theme.text : theme.border}`,
          fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
          display: 'inline-flex', alignItems: 'center', gap: 8
        }}>
            {tb.label}
            <span style={{
            minWidth: 20, padding: '1px 6px', borderRadius: 10, fontSize: 11,
            background: tab === tb.id ? accent.primary : theme.bgAlt,
            color: tab === tb.id ? '#fff' : theme.textFaint
          }}>{tb.count}</span>
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 28 }}>
        <div>
          {tab === 'suggestions' &&
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {data.suggestions.map((s) =>
            <DCard key={s.id} padding={18} interactive>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  flexShrink: 0, paddingRight: 14, borderRight: `1px solid ${theme.border}`
                }}>
                      <button style={{ width: 30, height: 30, borderRadius: 8, background: theme.bgAlt, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.textMuted }}><DIcon name="upArrow" size={14} /></button>
                      <div style={{ fontSize: 15, fontWeight: 600, color: theme.text, margin: '6px 0', fontFeatureSettings: '"tnum"' }}>{s.up - s.down}</div>
                      <button style={{ width: 30, height: 30, borderRadius: 8, background: theme.bgAlt, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.textFaint }}><DIcon name="downArrow" size={14} /></button>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                        <DBadge>{s.category}</DBadge>
                        <DBadge variant={statusVariant(s.status)}>{s.status}</DBadge>
                      </div>
                      <div style={{
                    fontFamily: '"Instrument Serif", serif', fontSize: 22, letterSpacing: '-0.01em',
                    color: theme.text, lineHeight: 1.2, marginBottom: 10, textWrap: 'balance'
                  }}>{s.title}</div>
                      <div style={{ fontSize: 12.5, color: theme.textMuted, display: 'flex', gap: 10 }}>
                        <span>{s.author}</span><span>·</span><span>{s.date}</span>
                      </div>
                    </div>
                  </div>
                </DCard>
            )}
            </div>
          }
          {tab === 'incidents' &&
          <DCard padding={40} style={{ textAlign: 'center' }}>
              <DIcon name="alert" size={28} style={{ color: theme.textFaint, marginBottom: 10 }} />
              <div style={{ fontSize: 14, color: theme.textMuted }}>Cap incidència oberta. Tot en ordre.</div>
            </DCard>
          }
          {tab === 'surveys' &&
          <DCard padding={28}>
              <DBadge variant="accent" style={{ marginBottom: 14 }}>Oberta</DBadge>
              <div style={{ fontFamily: '"Instrument Serif", serif', fontSize: 28, letterSpacing: '-0.015em', marginBottom: 10, textWrap: 'balance' }}>Enquesta de clima laboral Q1 2026</div>
              <div style={{ fontSize: 14, color: theme.textMuted, marginBottom: 20, lineHeight: 1.5, maxWidth: 520 }}>
                Aproximadament 10 minuts. Les respostes són anònimes i ens ajuden a millorar la vida a TAVIL.
              </div>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: theme.textMuted }}><DIcon name="clock" size={14} /> 10 min</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: theme.textMuted }}><DIcon name="users" size={14} /> 84 respostes</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: theme.textMuted }}><DIcon name="eye" size={14} /> Anònima</div>
              </div>
              <DBtn>Participa</DBtn>
            </DCard>
          }
        </div>
        <aside>
          <DCard padding={20}>
            <div style={{ fontSize: 11, color: theme.textFaint, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 12 }}>Xifres del trimestre</div>
            {[
            { label: 'Suggeriments totals', value: '64' },
            { label: 'Acceptats', value: '18' },
            { label: 'Implementats', value: '7' },
            { label: 'Temps mig de resposta', value: '4,2 dies' }].
            map((s, i, a) =>
            <div key={s.label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 0', borderBottom: i < a.length - 1 ? `1px solid ${theme.border}` : 'none'
            }}>
                <span style={{ fontSize: 13, color: theme.textMuted }}>{s.label}</span>
                <span style={{ fontFamily: '"Instrument Serif", serif', fontSize: 20, color: theme.text, letterSpacing: '-0.01em' }}>{s.value}</span>
              </div>
            )}
          </DCard>
        </aside>
      </div>

      <DModal open={newOpen} onClose={() => setNewOpen(false)} title={t.voice.newSuggestion} width={560}>
        <DField label="Títol">
          <DInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Un títol curt i clar" />
        </DField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <DField label={t.voice.category}>
            <select value={cat} onChange={(e) => setCat(e.target.value)} style={{
              width: '100%', height: 42, padding: '0 12px', background: theme.card, color: theme.text,
              border: `1px solid ${theme.border}`, borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none'
            }}>
              <option>Benestar</option><option>Instal·lacions</option><option>Organització</option><option>Tecnologia</option>
            </select>
          </DField>
          <DField label={t.voice.priority}>
            <select style={{ width: '100%', height: 42, padding: '0 12px', background: theme.card, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 10, fontSize: 14, fontFamily: 'inherit', outline: 'none' }}>
              <option>Baixa</option><option>Mitjana</option><option>Alta</option>
            </select>
          </DField>
        </div>
        <DField label="Descripció">
          <DTextarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Explica la teva proposta amb detall. Què millora? Quin impacte té?" />
        </DField>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', cursor: 'pointer' }}>
          <div onClick={() => setAnon(!anon)} style={{
            width: 38, height: 22, borderRadius: 11, background: anon ? accent.primary : theme.border,
            position: 'relative', transition: 'background 200ms', cursor: 'pointer', flexShrink: 0
          }}>
            <div style={{
              position: 'absolute', top: 2, left: anon ? 18 : 2, width: 18, height: 18, borderRadius: 9,
              background: '#fff', transition: 'left 200ms'
            }} />
          </div>
          <span style={{ fontSize: 13.5, color: theme.text }}>{t.voice.anonymous}</span>
        </label>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <DBtn variant="secondary" onClick={() => setNewOpen(false)}>{t.common.cancel}</DBtn>
          <DBtn icon="arrowRight" onClick={() => setNewOpen(false)}>{t.voice.send}</DBtn>
        </div>
      </DModal>
    </div>);

}

// ─────────── Requests ───────────
function DRequests() {
  const { theme, accent, t } = useDApp();
  const data = window.TAVIL_DATA;
  const [newOpen, setNewOpen] = sc2S(false);
  const [type, setType] = sc2S('Vacances');
  const [day, setDay] = sc2S('');
  const [motive, setMotive] = sc2S('');
  const statusVariant = (s) => s === 'Aprovada' ? 'success' : s === 'Pendent' ? 'warning' : 'neutral';

  const counts = { total: data.requests.length, approved: data.requests.filter((r) => r.status === 'Aprovada').length, pending: data.requests.filter((r) => r.status === 'Pendent').length };

  return (
    <div>
      <DPageHeader kicker="RRHH" title={t.req.title} subtitle={t.req.subtitle}
      actions={<DBtn icon="plus" onClick={() => setNewOpen(true)}>{t.req.newRequest}</DBtn>} />
      
      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
        { label: 'Total aquest any', value: counts.total, sub: 'peticions' },
        { label: 'Aprovades', value: counts.approved, sub: 'peticions', color: '#3f7a52' },
        { label: 'Pendents', value: counts.pending, sub: 'en revisió', color: '#b6833a' },
        { label: 'Dies disponibles', value: 18, sub: 'de 22 anuals', color: accent.primary }].
        map((s) =>
        <DCard key={s.label} padding={20}>
            <div style={{ fontSize: 11, color: theme.textFaint, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>{s.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <div style={{ fontFamily: '"Instrument Serif", serif', fontSize: 42, lineHeight: 1, letterSpacing: '-0.02em', color: s.color || theme.text }}>{s.value}</div>
              <div style={{ fontSize: 12, color: theme.textMuted }}>{s.sub}</div>
            </div>
          </DCard>
        )}
      </div>

      <DSectionHead kicker="Historial" title={t.req.sent} />
      <DCard padding={0}>
        {/* Table */}
        <div style={{
          display: 'grid', gridTemplateColumns: '160px 180px 1fr 140px 140px 40px',
          padding: '14px 18px', borderBottom: `1px solid ${theme.border}`,
          fontSize: 11, fontWeight: 600, color: theme.textFaint,
          textTransform: 'uppercase', letterSpacing: '0.1em'
        }}>
          <div>Tipus</div>
          <div>Dia sol·licitat</div>
          <div>Motiu</div>
          <div>Enviada</div>
          <div>Estat</div>
          <div></div>
        </div>
        {data.requests.map((r, i, a) =>
        <div key={r.id} style={{
          display: 'grid', gridTemplateColumns: '160px 180px 1fr 140px 140px 40px',
          padding: '16px 18px', alignItems: 'center',
          borderBottom: i < a.length - 1 ? `1px solid ${theme.border}` : 'none',
          fontSize: 13.5, color: theme.text
        }}>
            <div style={{ fontWeight: 600 }}>{r.type}</div>
            <div style={{ color: theme.textMuted }}>{r.day}</div>
            <div style={{ color: theme.textMuted }}>{r.motive}</div>
            <div style={{ color: theme.textFaint, fontSize: 12.5 }}>{r.date}</div>
            <div><DBadge variant={statusVariant(r.status)}>{r.status}</DBadge></div>
            <div><button style={{ width: 28, height: 28, borderRadius: 14, background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.textFaint }}><DIcon name="more" size={16} /></button></div>
          </div>
        )}
      </DCard>

      <DModal open={newOpen} onClose={() => setNewOpen(false)} title={t.req.newRequest}>
        <DField label="Tipus de sol·licitud">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {['Vacances', 'Assumptes propis', 'Teletreball'].map((tp) =>
            <button key={tp} onClick={() => setType(tp)} style={{
              padding: '12px 10px', borderRadius: 10,
              background: type === tp ? accent.primaryLight : theme.card,
              border: `1px solid ${type === tp ? accent.primary : theme.border}`,
              color: type === tp ? accent.primaryDark : theme.text,
              fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit'
            }}>{tp}</button>
            )}
          </div>
        </DField>
        <DField label={t.req.requestedDay}>
          <DInput type="date" value={day} onChange={(e) => setDay(e.target.value)} />
        </DField>
        <DField label={t.req.comments} hint="Opcional. Ajuda a RRHH a prioritzar.">
          <DTextarea rows={4} value={motive} onChange={(e) => setMotive(e.target.value)} placeholder="Visita mèdica, etc." />
        </DField>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          <DBtn variant="secondary" onClick={() => setNewOpen(false)}>{t.common.cancel}</DBtn>
          <DBtn icon="arrowRight" onClick={() => setNewOpen(false)}>{t.req.send}</DBtn>
        </div>
      </DModal>
    </div>);

}

// ─────────── Campus TAVIL (courses) ───────────
function DCampus() {
  const { theme, accent, t } = useDApp();
  const data = window.TAVIL_DATA;
  const [cat, setCat] = sc2S('all');
  const cats = ['all', ...new Set(data.courses.map((c) => c.category))];
  const filtered = data.courses.filter((c) => cat === 'all' || c.category === cat);
  const inProgress = data.courses.filter((c) => c.progress > 0 && c.progress < 100);

  return (
    <div>
      <DPageHeader kicker="Formació contínua" title={t.nav.campus} subtitle="Cursos interns, tallers i aprenentatge autogestionat"
      actions={<DBtn variant="secondary" icon="filter">Els meus cursos</DBtn>} />
      
      {/* Continue learning strip */}
      {inProgress.length > 0 &&
      <>
          <DSectionHead kicker="En curs" title="Continua on ho has deixat" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14, marginBottom: 36 }}>
            {inProgress.map((c) =>
          <DCard key={c.id} padding={0} interactive>
                <DImgPh label={c.category.toLowerCase()} ratio="16/8" tone="accent" style={{ borderRadius: '13px 13px 0 0', border: 'none', borderBottom: `1px solid ${theme.border}` }} />
                <div style={{ padding: 16 }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                    <DBadge>{c.level}</DBadge>
                    <DBadge variant="olive">{c.category}</DBadge>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: theme.text, lineHeight: 1.3, marginBottom: 10, letterSpacing: '-0.005em' }}>{c.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ flex: 1, height: 5, borderRadius: 3, background: theme.bgAlt, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${c.progress}%`, background: accent.primary }} />
                    </div>
                    <span style={{ fontSize: 11.5, color: theme.textFaint, fontFeatureSettings: '"tnum"' }}>{c.progress}%</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: theme.textMuted }}>{c.instructor} · {c.duration}</div>
                </div>
              </DCard>
          )}
          </div>
        </>
      }

      {/* Catalogue */}
      <DSectionHead kicker="Catàleg" title="Tots els cursos" />
      <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
        {cats.map((c) =>
        <button key={c} onClick={() => setCat(c)} style={{
          padding: '7px 13px', borderRadius: 999,
          background: cat === c ? theme.text : theme.card,
          color: cat === c ? theme.bg : theme.textMuted,
          border: `1px solid ${cat === c ? theme.text : theme.border}`,
          fontSize: 12.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit'
        }}>{c === 'all' ? t.common.all : c}</button>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {filtered.map((c) =>
        <DCard key={c.id} padding={0} interactive>
            <div style={{ position: 'relative' }}>
              <DImgPh label={c.category.toLowerCase()} ratio="16/9" style={{ borderRadius: '13px 13px 0 0', border: 'none', borderBottom: `1px solid ${theme.border}` }} />
              {c.isNew &&
            <div style={{
              position: 'absolute', top: 10, left: 10,
              padding: '3px 8px', background: accent.primary, color: '#fff',
              fontSize: 10, fontWeight: 700, borderRadius: 4,
              textTransform: 'uppercase', letterSpacing: '0.1em'
            }}>Nou</div>
            }
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                <DBadge>{c.level}</DBadge>
                <DBadge variant="olive">{c.category}</DBadge>
              </div>
              <div style={{ fontFamily: '"Instrument Serif", serif', fontSize: 19, lineHeight: 1.2, color: theme.text, letterSpacing: '-0.01em', marginBottom: 10, textWrap: 'balance' }}>{c.title}</div>
              <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 12 }}>{c.instructor}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11.5, color: theme.textFaint }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><DIcon name="clock" size={12} />{c.duration}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>★ {c.rating}</span>
                <span>{c.lessons} sessions</span>
              </div>
              {c.progress === 100 && <div style={{ marginTop: 10 }}><DBadge variant="success"><DIcon name="check" size={11} /> Completat</DBadge></div>}
            </div>
          </DCard>
        )}
      </div>
    </div>);

}

// ─────────── Espai corporatiu (docs + links) ───────────
function DEspai() {
  const { theme, accent, t } = useDApp();
  const data = window.TAVIL_DATA;
  const sections = {};
  data.documents.forEach((d) => {(sections[d.section] = sections[d.section] || []).push(d);});

  return (
    <div>
      <DPageHeader kicker="Recursos" title={t.nav.espai} subtitle="Documents, polítiques i eines corporatives" />

      <DSectionHead kicker="Enllaços" title="Sistemes corporatius" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12, marginBottom: 40 }}>
        {data.links.map((l) =>
        <DCard key={l.id} padding={16} interactive>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
              width: 42, height: 42, borderRadius: 10, flexShrink: 0,
              background: accent.primaryLight, color: accent.primaryDark,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}><DIcon name={l.icon} size={20} stroke={1.7} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: theme.text, marginBottom: 2 }}>{l.title}</div>
                <div style={{ fontSize: 12, color: theme.textMuted }}>{l.subtitle}</div>
              </div>
              <DIcon name="arrowRight" size={16} style={{ color: theme.textFaint }} />
            </div>
          </DCard>
        )}
      </div>

      <DSectionHead kicker="Biblioteca" title="Documentació corporativa" />
      {Object.entries(sections).map(([section, docs]) =>
      <div key={section} style={{ marginBottom: 24 }}>
          <div style={{
          fontSize: 11, color: theme.textFaint, fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10
        }}>{section}</div>
          <DCard padding={0}>
            {docs.map((d, i) =>
          <div key={d.id} style={{
            display: 'grid', gridTemplateColumns: 'auto 1fr 80px 100px 100px 40px',
            alignItems: 'center', gap: 14, padding: '14px 18px',
            borderBottom: i < docs.length - 1 ? `1px solid ${theme.border}` : 'none',
            cursor: 'pointer'
          }}>
                <div style={{
              width: 38, height: 44, borderRadius: 6, flexShrink: 0,
              background: accent.primaryLight, color: accent.primaryDark,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
              border: `1px solid ${accent.primary}30`
            }}>{d.format}</div>
                <div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: theme.text }}>{d.title}</div>
                    {d.isNew && <DBadge variant="accent">Nou</DBadge>}
                  </div>
                  <div style={{ fontSize: 11.5, color: theme.textFaint }}>{d.section}</div>
                </div>
                <div style={{ fontSize: 12, color: theme.textMuted }}>{d.size}</div>
                <div style={{ fontSize: 12, color: theme.textMuted }}>Act. {d.updated}</div>
                <div><DBtn variant="secondary" size="sm">Descarrega</DBtn></div>
                <div><button style={{ width: 30, height: 30, borderRadius: 15, background: 'transparent', border: 'none', cursor: 'pointer', color: theme.textFaint, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><DIcon name="more" size={16} /></button></div>
              </div>
          )}
          </DCard>
        </div>
      )}
    </div>);

}

// ─────────── Profile ───────────
function DProfile({ onLogout }) {
  const { theme, accent, t, lang, setLang, darkMode, setDarkMode, user } = useDApp();

  return (
    <div>
      {/* Cover + identity */}
      <div style={{ marginTop: 18 }}>
        <div style={{
          height: 180, borderRadius: 14, position: 'relative',
          background: `linear-gradient(135deg, ${accent.primaryLight} 0%, ${theme.bgAlt} 100%)`,
          border: `1px solid ${theme.border}`, overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(135deg, rgba(191,33,30,0.05) 0 1px, transparent 1px 20px)', opacity: "0", width: "12px", height: "15px" }} />
        </div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end', padding: '0 24px', marginTop: -56, marginBottom: 24 }}>
          <DAvatar name={user.name} size={112} style={{ border: `5px solid ${theme.bg}`, boxShadow: `0 10px 24px -10px ${theme.shadowMd}` }} />
          <div style={{ paddingBottom: 12, flex: 1 }}>
            <h1 style={{ fontFamily: '"Instrument Serif", serif', fontSize: 44, fontWeight: 400, lineHeight: 1, letterSpacing: '-0.025em', margin: 0 }}>{user.name}</h1>
            <div style={{ fontSize: 14.5, color: theme.textMuted, marginTop: 8 }}>{user.role} · {user.dept}</div>
          </div>
          <div style={{ paddingBottom: 12, display: 'flex', gap: 8 }}>
            <DBtn variant="secondary" icon="edit">Editar perfil</DBtn>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 28 }}>
        {/* Account info */}
        <div>
          <DSectionHead kicker="Compte" title="Dades personals" />
          <DCard padding={0}>
            {[
            { label: 'Correu corporatiu', value: 'marta.vidal@tavil.com', icon: 'mail' },
            { label: 'Telèfon', value: '+34 937 20 84 00', icon: 'phone' },
            { label: 'Extensió', value: user.ext, icon: 'phone' },
            { label: 'Oficina', value: 'Seu central · 2a planta', icon: 'mapPin' },
            { label: 'Incorporació', value: '12 setembre 2022', icon: 'calendar' }].
            map((f, i, a) =>
            <div key={f.label} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
              borderBottom: i < a.length - 1 ? `1px solid ${theme.border}` : 'none'
            }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: theme.bgAlt, color: theme.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><DIcon name={f.icon} size={15} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: theme.textFaint, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>{f.label}</div>
                  <div style={{ fontSize: 13.5, color: theme.text }}>{f.value}</div>
                </div>
              </div>
            )}
          </DCard>
        </div>

        {/* Preferences */}
        <div>
          <DSectionHead kicker="Preferències" title={t.profile.settings} />
          <DCard padding={20} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: theme.textFaint, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 14 }}>{t.profile.language}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
              { id: 'ca', label: 'Català' },
              { id: 'es', label: 'Español' },
              { id: 'en', label: 'English' }].
              map((l) =>
              <button key={l.id} onClick={() => setLang(l.id)} style={{
                flex: 1, padding: '12px', borderRadius: 10,
                background: lang === l.id ? accent.primaryLight : theme.bgAlt,
                border: `1px solid ${lang === l.id ? accent.primary : theme.border}`,
                color: lang === l.id ? accent.primaryDark : theme.text,
                fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
              }}>{l.label}</button>
              )}
            </div>
          </DCard>
          <DCard padding={20} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: theme.textFaint, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 14 }}>{t.profile.theme}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
              { id: false, label: 'Clar', icon: 'sun' },
              { id: true, label: 'Fosc', icon: 'moon' }].
              map((tm) =>
              <button key={String(tm.id)} onClick={() => setDarkMode(tm.id)} style={{
                flex: 1, padding: '14px', borderRadius: 10,
                background: darkMode === tm.id ? accent.primaryLight : theme.bgAlt,
                border: `1px solid ${darkMode === tm.id ? accent.primary : theme.border}`,
                color: darkMode === tm.id ? accent.primaryDark : theme.text,
                fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
              }}><DIcon name={tm.icon} size={16} />{tm.label}</button>
              )}
            </div>
          </DCard>
          <DCard padding={0}>
            {[
            { label: t.profile.notifications, icon: 'bell' },
            { label: 'Privacitat i accessos', icon: 'eye' },
            { label: 'Ajuda i suport', icon: 'settings' }].
            map((it, i, a) =>
            <button key={it.label} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 18px', background: 'transparent', border: 'none',
              borderBottom: i < a.length - 1 ? `1px solid ${theme.border}` : 'none',
              cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left'
            }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: theme.bgAlt, color: theme.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><DIcon name={it.icon} size={15} /></div>
                <span style={{ flex: 1, fontSize: 14, color: theme.text }}>{it.label}</span>
                <DIcon name="chevronRight" size={15} style={{ color: theme.textFaint }} />
              </button>
            )}
          </DCard>
          <div style={{ marginTop: 18 }}>
            <DBtn variant="danger" icon="logout" onClick={onLogout}>{t.common.signOut}</DBtn>
          </div>
        </div>
      </div>
    </div>);

}

// ─────────── Login (full-viewport, split) ───────────
function DLogin({ onSignIn, onGoRegister }) {
  const { theme, accent, t } = useDApp();
  const [email, setEmail] = sc2S('');
  const [pw, setPw] = sc2S('');
  const [remember, setRemember] = sc2S(false);
  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.1fr)', background: theme.bg }}>
      {/* Left: form */}
      <div style={{ display: 'flex', flexDirection: 'column', padding: '48px 60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: '"Instrument Serif", serif', fontSize: 24, color: theme.text }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: accent.primary, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, fontWeight: 700, fontFamily: 'Instrument Sans, sans-serif'
          }}>T</div>
          TAVIL
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 440 }}>
          <div style={{ fontSize: 11, color: accent.primary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 14 }}>Portal intern</div>
          <h1 style={{ fontFamily: '"Instrument Serif", serif', fontSize: 56, fontWeight: 400, lineHeight: 1, margin: 0, letterSpacing: '-0.03em', color: theme.text, marginBottom: 16 }}>{t.login.title}</h1>
          <p style={{ fontSize: 15, color: theme.textMuted, margin: '0 0 32px', lineHeight: 1.5 }}>{t.login.subtitle}</p>

          <DField label={t.login.email}>
            <DInput icon="mail" type="email" placeholder="nom.cognom@tavil.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </DField>
          <DField label={t.login.password}>
            <DInput type="password" placeholder="••••••••••" value={pw} onChange={(e) => setPw(e.target.value)} />
          </DField>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: theme.textMuted, cursor: 'pointer' }}>
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} style={{ accentColor: accent.primary }} />
              Recorda'm en aquest equip
            </label>
            <a href="#" style={{ fontSize: 13, color: accent.primary, textDecoration: 'none', fontWeight: 500 }}>{t.login.forgot}</a>
          </div>
          <DBtn size="lg" full iconRight="arrowRight" onClick={() => onSignIn(remember)}>{t.common.signIn}</DBtn>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '28px 0' }}>
            <div style={{ flex: 1, height: 1, background: theme.border }} />
            <span style={{ fontSize: 11, color: theme.textFaint, textTransform: 'uppercase', letterSpacing: '0.14em' }}>{t.login.continueWith}</span>
            <div style={{ flex: 1, height: 1, background: theme.border }} />
          </div>
          <DBtn size="lg" full variant="secondary" icon="profile" onClick={onGoRegister}>{t.login.createAccount}</DBtn>

          <div style={{ marginTop: 36, fontSize: 12.5, color: theme.textFaint, textAlign: 'center' }}>
            © 2026 TAVIL S.A. · Portal intern · v4.2
          </div>
        </div>
      </div>

      {/* Right: editorial cover */}
      <div style={{
        background: accent.primary, color: '#fff', position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', padding: '48px 60px', justifyContent: 'space-between'
      }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.08, background: 'repeating-linear-gradient(45deg, transparent 0 18px, #fff 18px 19px)' }} />
        <div style={{ position: 'absolute', top: '-18%', right: '-14%', width: 480, height: 480, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', bottom: '-22%', left: '-12%', width: 420, height: 420, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

        <div style={{ position: 'relative', fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', opacity: 0.9, textTransform: 'uppercase' }}>
          Abril 2026 · Número 142
        </div>
        <div style={{ position: 'relative' }}>
          <div style={{ fontFamily: '"Instrument Serif", serif', fontSize: 96, lineHeight: 0.95, letterSpacing: '-0.04em', marginBottom: 20, fontStyle: 'italic' }}>
            Som <br />un equip.
          </div>
          <div style={{ fontSize: 16, lineHeight: 1.45, opacity: 0.92, maxWidth: 460 }}>
            El portal intern de TAVIL. Notícies, agenda, formació, sol·licituds i la veu de cadascú — en un sol lloc.
          </div>
          <div style={{ display: 'flex', gap: 32, marginTop: 40 }}>
            {[
            { n: '128', l: 'persones' },
            { n: '3', l: 'seus' },
            { n: '40+', l: 'anys' }].
            map((s) =>
            <div key={s.l}>
                <div style={{ fontFamily: '"Instrument Serif", serif', fontSize: 44, lineHeight: 1, letterSpacing: '-0.025em' }}>{s.n}</div>
                <div style={{ fontSize: 11, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 6 }}>{s.l}</div>
              </div>
            )}
          </div>
        </div>
        <div style={{ position: 'relative', fontSize: 11, opacity: 0.75, letterSpacing: '0.06em', display: 'flex', justifyContent: 'space-between' }}>
          <span>Barcelona · Terrassa · Milà · Lió</span>
          <span>tavil.com</span>
        </div>
      </div>
    </div>);

}

// ─────────── Register (full-viewport, split) ───────────
function DRegister({ onBack }) {
  const { theme, accent, t } = useDApp();
  const [form, setForm] = sc2S({ name: '', email: '', pass: '', confirm: '' });
  const mismatch = form.confirm && form.pass !== form.confirm;
  const valid = form.name && form.email && form.pass.length >= 6 && form.pass === form.confirm;
  const strength = (() => {
    const p = form.pass; let s = 0;
    if (p.length >= 6) s++; if (p.length >= 10) s++;
    if (/[A-Z]/.test(p)) s++; if (/[0-9]/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++;
    return Math.min(s, 4);
  })();
  const strengthLabels = ['—', 'Feble', 'Correcta', 'Bona', 'Forta'];
  const strengthColors = [theme.border, '#c87158', '#b6833a', '#7a8a6b', '#3f7a52'];

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.1fr)', background: theme.bg }}>
      {/* Left: form */}
      <div style={{ display: 'flex', flexDirection: 'column', padding: '48px 60px', overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: '"Instrument Serif", serif', fontSize: 24, color: theme.text }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, background: accent.primary, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, fontWeight: 700, fontFamily: 'Instrument Sans, sans-serif',
            }}>T</div>
            TAVIL
          </div>
          <button onClick={onBack} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'transparent', border: 'none', color: theme.textMuted,
            fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <DIcon name="arrowLeft" size={15}/> {t.common.back}
          </button>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 440, paddingTop: 40 }}>
          <div style={{ fontSize: 11, color: accent.primary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 14 }}>Portal intern</div>
          <h1 style={{ fontFamily: '"Instrument Serif", serif', fontSize: 48, fontWeight: 400, lineHeight: 1, margin: 0, letterSpacing: '-0.03em', color: theme.text, marginBottom: 12 }}>{t.login.regTitle}</h1>
          <p style={{ fontSize: 15, color: theme.textMuted, margin: '0 0 32px', lineHeight: 1.5 }}>{t.login.regSubtitle}</p>

          <DField label={t.login.name}>
            <DInput icon="profile" placeholder="Nom i cognoms" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/>
          </DField>
          <DField label={t.login.email}>
            <DInput icon="mail" type="email" placeholder="nom.cognom@tavil.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}/>
          </DField>
          <DField label={t.login.password} hint={form.pass ? `Seguretat: ${strengthLabels[strength]}` : 'Mínim 6 caràcters'}>
            <DInput type="password" placeholder="••••••••••" value={form.pass} onChange={e => setForm({ ...form, pass: e.target.value })}/>
            {form.pass && (
              <div style={{ display: 'flex', gap: 3, marginTop: 6 }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength ? strengthColors[strength] : theme.border, transition: 'all 200ms' }}/>
                ))}
              </div>
            )}
          </DField>
          <DField label={t.login.confirm} hint={mismatch ? 'Les contrasenyes no coincideixen' : ''}>
            <DInput type="password" placeholder="••••••••••" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })}/>
          </DField>

          <DBtn size="lg" full iconRight="arrowRight" disabled={!valid} onClick={onBack}>{t.login.next}</DBtn>

          <div style={{ marginTop: 28, fontSize: 13, color: theme.textFaint, textAlign: 'center' }}>
            {t.login.noAccount?.replace('no tens compte', 'ja tens compte') || 'Ja tens compte?'}{' '}
            <button onClick={onBack} style={{ background: 'none', border: 'none', color: accent.primary, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
              {t.common.signIn}
            </button>
          </div>
          <div style={{ marginTop: 24, fontSize: 12.5, color: theme.textFaint, textAlign: 'center' }}>
            © 2026 TAVIL S.A. · Portal intern · v4.2
          </div>
        </div>
      </div>

      {/* Right: editorial cover (same as login) */}
      <div style={{
        background: accent.primary, color: '#fff', position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', padding: '48px 60px', justifyContent: 'space-between',
      }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.08, background: 'repeating-linear-gradient(45deg, transparent 0 18px, #fff 18px 19px)' }}/>
        <div style={{ position: 'absolute', top: '-18%', right: '-14%', width: 480, height: 480, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }}/>
        <div style={{ position: 'absolute', bottom: '-22%', left: '-12%', width: 420, height: 420, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}/>

        <div style={{ position: 'relative', fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', opacity: 0.9, textTransform: 'uppercase' }}>
          Abril 2026 · Número 142
        </div>
        <div style={{ position: 'relative' }}>
          <div style={{ fontFamily: '"Instrument Serif", serif', fontSize: 96, lineHeight: 0.95, letterSpacing: '-0.04em', marginBottom: 20, fontStyle: 'italic' }}>
            Uneix-te<br/>a nosaltres.
          </div>
          <div style={{ fontSize: 16, lineHeight: 1.45, opacity: 0.92, maxWidth: 460 }}>
            Crea el teu compte al portal intern de TAVIL i accedeix a notícies, agenda, formació i molt més.
          </div>
          <div style={{ display: 'flex', gap: 32, marginTop: 40 }}>
            {[{ n: '128', l: 'persones' }, { n: '3', l: 'seus' }, { n: '40+', l: 'anys' }].map(s => (
              <div key={s.l}>
                <div style={{ fontFamily: '"Instrument Serif", serif', fontSize: 44, lineHeight: 1, letterSpacing: '-0.025em' }}>{s.n}</div>
                <div style={{ fontSize: 11, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 6 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ position: 'relative', fontSize: 11, opacity: 0.75, letterSpacing: '0.06em', display: 'flex', justifyContent: 'space-between' }}>
          <span>Barcelona · Terrassa · Milà · Lió</span>
          <span>tavil.com</span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { DVoice, DRequests, DCampus, DEspai, DProfile, DLogin, DRegister });