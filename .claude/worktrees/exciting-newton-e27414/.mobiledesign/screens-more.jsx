// More screens: Agenda, Activities, Directory, Voice, Requests, Profile

const { useState: uSS, useEffect: uEE, useRef: uRR, useMemo: uMM } = React;

// ─────────── Agenda ───────────
function AgendaScreen({ onOpenDrawer }) {
  const { theme, accent, t } = useApp();
  const data = window.TAVIL_DATA;
  const [selected, setSelected] = uSS(22);
  // Week strip: apr 20 - 26
  const days = [
    { n: 20, l: 'Dl' }, { n: 21, l: 'Dt' }, { n: 22, l: 'Dc' },
    { n: 23, l: 'Dj' }, { n: 24, l: 'Dv' }, { n: 25, l: 'Ds' }, { n: 26, l: 'Dg' },
  ];
  const events = data.agenda.filter(e => e.day === selected);

  return (
    <div style={{ height: '100%', overflow: 'auto', paddingBottom: 96 }}>
      <AppHeader
        leading={<button onClick={onOpenDrawer} style={{ width: 40, height: 40, borderRadius: 20, background: theme.card, border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.text }}><Icon name="menu" size={18}/></button>}
        trailing={<Btn size="sm" icon="plus">{t.common.new}</Btn>}
      />
      <div style={{ padding: '8px 20px 16px' }}>
        <div style={{ fontSize: 11, color: accent.primary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 6 }}>Abril 2026</div>
        <h1 style={{ fontFamily: '"Instrument Serif", serif', fontSize: 36, fontWeight: 400, lineHeight: 1, margin: 0, letterSpacing: '-0.02em' }}>{t.nav.agenda}</h1>
      </div>
      {/* Week strip */}
      <div style={{ padding: '4px 16px 18px', display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {days.map(d => {
          const active = d.n === selected;
          const today = d.n === 22;
          return (
            <button key={d.n} onClick={() => setSelected(d.n)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0 6px',
              background: active ? theme.text : 'transparent',
              color: active ? theme.bg : theme.text,
              border: `1px solid ${active ? theme.text : theme.border}`,
              borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all 200ms',
            }}>
              <span style={{ fontSize: 10, fontWeight: 500, opacity: active ? 0.7 : 0.6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{d.l}</span>
              <span style={{ fontSize: 18, fontWeight: 600, marginTop: 2, fontFamily: '"Instrument Serif", serif' }}>{d.n}</span>
              {today && !active && <div style={{ width: 4, height: 4, borderRadius: 2, background: accent.primary, marginTop: 3 }}/>}
            </button>
          );
        })}
      </div>
      {/* Timeline */}
      <div style={{ padding: '0 20px' }}>
        <div style={{ fontSize: 12.5, color: theme.textMuted, marginBottom: 14 }}>
          {events.length} {events.length === 1 ? 'esdeveniment' : 'esdeveniments'} · {selected === 22 ? t.common.today : `${selected} abril`}
        </div>
        {events.length === 0 && (
          <Card padding={28} style={{ textAlign: 'center' }}>
            <div style={{ color: theme.textFaint, fontSize: 13 }}>Cap esdeveniment aquest dia</div>
          </Card>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {events.map(ev => {
            const color = ev.color === 'accent' ? accent.primary : ev.color === 'olive' ? theme.olive : theme.text;
            return (
              <div key={ev.id} style={{
                display: 'flex', gap: 14, alignItems: 'stretch',
              }}>
                <div style={{ width: 52, flexShrink: 0, paddingTop: 2 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: theme.text, fontFeatureSettings: '"tnum"' }}>{ev.time.split('–')[0].trim()}</div>
                  <div style={{ fontSize: 10.5, color: theme.textFaint, marginTop: 1 }}>{ev.time.split('–')[1]?.trim()}</div>
                </div>
                <div style={{
                  width: 3, background: color, borderRadius: 2, flexShrink: 0,
                  alignSelf: 'stretch',
                }}/>
                <Card padding={14} style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.25, color: theme.text, marginBottom: 6 }}>{ev.title}</div>
                  <div style={{ fontSize: 12, color: theme.textMuted, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                    <Icon name="mapPin" size={12}/>{ev.where}
                  </div>
                  <div style={{ fontSize: 12, color: theme.textMuted, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Icon name="users" size={12}/>{ev.attendees} assistents
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────── Activities ───────────
function ActivitiesScreen({ onBack, onOpenDrawer }) {
  const { theme, accent, t } = useApp();
  const data = window.TAVIL_DATA;
  const [tab, setTab] = uSS('upcoming');
  const [enrolled, setEnrolled] = uSS({});

  return (
    <div style={{ height: '100%', overflow: 'auto', paddingBottom: 96 }}>
      <AppHeader onBack={onBack} title={t.nav.activitats}/>
      <div style={{ padding: '0 20px 12px' }}>
        <div style={{ fontSize: 11, color: accent.primary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 6 }}>Vida a l'empresa</div>
        <h1 style={{ fontFamily: '"Instrument Serif", serif', fontSize: 32, fontWeight: 400, lineHeight: 1.05, margin: 0, letterSpacing: '-0.02em' }}>{t.nav.activitats}</h1>
        <p style={{ fontSize: 13.5, color: theme.textMuted, margin: '8px 0 0', lineHeight: 1.4 }}>Activitats internes, formacions i esdeveniments oberts a tothom.</p>
      </div>
      {/* Segmented */}
      <div style={{ padding: '6px 20px 18px' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4,
          padding: 4, background: theme.bgAlt, borderRadius: 12,
        }}>
          {[
            { id: 'upcoming', label: 'Pròximes' },
            { id: 'past', label: 'Passades' },
          ].map(tb => (
            <button key={tb.id} onClick={() => setTab(tb.id)} style={{
              padding: '9px 0', borderRadius: 9,
              background: tab === tb.id ? theme.card : 'transparent',
              color: tab === tb.id ? theme.text : theme.textMuted,
              fontWeight: 500, fontSize: 13, border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', boxShadow: tab === tb.id ? `0 1px 3px ${theme.shadow}` : 'none',
            }}>{tb.label}</button>
          ))}
        </div>
      </div>
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.activities.map(a => {
          const isEnrolled = enrolled[a.id];
          const pct = Math.round((a.enrolled / a.capacity) * 100);
          const full = a.status === 'full';
          return (
            <Card key={a.id} padding={0}>
              <div style={{ display: 'flex' }}>
                <ImgPh label="activitat" style={{ width: 96, aspectRatio: 'auto', borderRadius: '15px 0 0 15px', border: 'none', borderRight: `1px solid ${theme.border}` }}/>
                <div style={{ flex: 1, padding: 14, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                    <Badge variant="olive">{a.tag}</Badge>
                    {full && <Badge variant="warning">Complert</Badge>}
                  </div>
                  <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.25, color: theme.text, marginBottom: 6 }}>{a.title}</div>
                  <div style={{ fontSize: 11.5, color: theme.textMuted, display: 'flex', gap: 10, marginBottom: 10 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="clock" size={11}/>{a.date}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, height: 4, borderRadius: 2, background: theme.bgAlt, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: full ? theme.olive : accent.primary, transition: 'width 400ms' }}/>
                    </div>
                    <span style={{ fontSize: 11, color: theme.textFaint, fontFeatureSettings: '"tnum"' }}>{a.enrolled}/{a.capacity}</span>
                  </div>
                  <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                    <Btn size="sm" variant={isEnrolled ? 'subtle' : full ? 'secondary' : 'primary'} disabled={full && !isEnrolled}
                      onClick={() => setEnrolled(s => ({ ...s, [a.id]: !s[a.id] }))}
                      icon={isEnrolled ? 'check' : undefined}>
                      {isEnrolled ? 'Inscrit' : full ? 'Llista d\'espera' : "M'inscric"}
                    </Btn>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─────────── Directory ───────────
function DirectoryScreen({ onOpenDrawer }) {
  const { theme, accent, t } = useApp();
  const data = window.TAVIL_DATA;
  const [q, setQ] = uSS('');
  const [dept, setDept] = uSS('all');
  const depts = ['all', ...[...new Set(data.directory.map(d => d.dept))]];
  const filtered = data.directory.filter(p =>
    (dept === 'all' || p.dept === dept) &&
    (!q || (p.name + p.role + p.dept).toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div style={{ height: '100%', overflow: 'auto', paddingBottom: 96 }}>
      <AppHeader
        leading={<button onClick={onOpenDrawer} style={{ width: 40, height: 40, borderRadius: 20, background: theme.card, border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.text }}><Icon name="menu" size={18}/></button>}
      />
      <div style={{ padding: '0 20px 14px' }}>
        <div style={{ fontSize: 11, color: accent.primary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 6 }}>Equip</div>
        <h1 style={{ fontFamily: '"Instrument Serif", serif', fontSize: 36, fontWeight: 400, lineHeight: 1, margin: 0, letterSpacing: '-0.02em' }}>{t.nav.directori}</h1>
      </div>
      <div style={{ padding: '0 20px 14px' }}>
        <Input icon="search" placeholder="Cerca per nom, rol, departament…" value={q} onChange={e => setQ(e.target.value)}/>
      </div>
      <div style={{ padding: '0 0 18px 16px', display: 'flex', gap: 6, overflow: 'auto', scrollbarWidth: 'none' }} className="hide-sb">
        {depts.map(d => (
          <button key={d} onClick={() => setDept(d)} style={{
            padding: '7px 14px', borderRadius: 999,
            background: dept === d ? theme.text : theme.card,
            color: dept === d ? theme.bg : theme.textMuted,
            border: `1px solid ${dept === d ? theme.text : theme.border}`,
            fontSize: 12.5, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
            fontFamily: 'inherit', flexShrink: 0,
          }}>{d === 'all' ? t.common.all : d}</button>
        ))}
        <div style={{ minWidth: 8, flexShrink: 0 }}/>
      </div>
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column' }}>
        {filtered.map((p, i) => (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '12px 4px',
            borderBottom: i < filtered.length - 1 ? `1px solid ${theme.border}` : 'none',
            cursor: 'pointer',
          }}>
            <Avatar name={p.name} size={46}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: theme.text, letterSpacing: '-0.005em' }}>{p.name}</div>
              <div style={{ fontSize: 12.5, color: theme.textMuted, marginTop: 1 }}>{p.role} · {p.dept}</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={{ width: 34, height: 34, borderRadius: 17, background: theme.card, border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.textMuted }}><Icon name="phone" size={15}/></button>
              <button style={{ width: 34, height: 34, borderRadius: 17, background: theme.card, border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.textMuted }}><Icon name="mail" size={15}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────── Voice (suggestions/incidents/surveys) ───────────
function VoiceScreen({ onBack }) {
  const { theme, accent, t } = useApp();
  const data = window.TAVIL_DATA;
  const [tab, setTab] = uSS('suggestions');
  const [form, setForm] = uSS({ open: false, title: '', desc: '', category: 'Benestar', anon: false });
  const [sent, setSent] = uSS(false);

  return (
    <div style={{ height: '100%', overflow: 'auto', paddingBottom: 96, position: 'relative' }}>
      <AppHeader onBack={onBack} title={t.voice.title}/>
      <div style={{ padding: '0 20px 14px' }}>
        <div style={{ fontSize: 11, color: accent.primary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 6 }}>Personal</div>
        <h1 style={{ fontFamily: '"Instrument Serif", serif', fontSize: 32, fontWeight: 400, lineHeight: 1.05, margin: 0, letterSpacing: '-0.02em' }}>{t.voice.title}</h1>
        <p style={{ fontSize: 13.5, color: theme.textMuted, margin: '8px 0 0', lineHeight: 1.4 }}>{t.voice.subtitle}</p>
      </div>
      {/* Tabs */}
      <div style={{ padding: '4px 16px 16px', display: 'flex', gap: 6, overflow: 'auto' }} className="hide-sb">
        {[
          { id: 'suggestions', label: t.voice.suggestions, count: data.suggestions.length },
          { id: 'incidents', label: t.voice.incidents, count: 2 },
          { id: 'surveys', label: t.voice.surveys, count: 1 },
        ].map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)} style={{
            padding: '8px 14px', borderRadius: 999,
            background: tab === tb.id ? theme.text : theme.card,
            color: tab === tb.id ? theme.bg : theme.textMuted,
            border: `1px solid ${tab === tb.id ? theme.text : theme.border}`,
            fontSize: 13, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
            fontFamily: 'inherit', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
          }}>{tb.label} <span style={{ fontSize: 11, opacity: 0.6 }}>{tb.count}</span></button>
        ))}
      </div>

      {tab === 'suggestions' && (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Btn full icon="plus" onClick={() => { setForm({ ...form, open: true }); setSent(false); }}>{t.voice.newSuggestion}</Btn>
          {data.suggestions.map(s => (
            <Card key={s.id} padding={14}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <Badge variant="olive">{s.category}</Badge>
                <Badge variant={s.status === 'Implementat' ? 'success' : s.status === 'Acceptat' ? 'accent' : 'neutral'}>{s.status}</Badge>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.3, color: theme.text, marginBottom: 8, letterSpacing: '-0.005em' }}>{s.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 11.5, color: theme.textFaint }}>{s.author} · {s.date}</div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <button style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 999, background: theme.bgAlt, border: 'none', color: theme.textMuted, fontFamily: 'inherit', fontSize: 12, cursor: 'pointer' }}><Icon name="upArrow" size={13}/>{s.up}</button>
                  <button style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 999, background: theme.bgAlt, border: 'none', color: theme.textFaint, fontFamily: 'inherit', fontSize: 12, cursor: 'pointer' }}><Icon name="downArrow" size={13}/>{s.down}</button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      {tab === 'incidents' && (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Btn full icon="plus">{t.voice.newIncident}</Btn>
          <Card padding={14}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <Badge variant="accent">Alta</Badge>
              <Badge>Planta Terrassa</Badge>
            </div>
            <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.3, color: theme.text, marginBottom: 4 }}>Fuga d'aigua al passadís central</div>
            <div style={{ fontSize: 12, color: theme.textMuted }}>Obert fa 2 dies · En revisió per Manteniment</div>
          </Card>
          <Card padding={14}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <Badge variant="warning">Mitjana</Badge>
              <Badge>Seu central</Badge>
            </div>
            <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.3, color: theme.text, marginBottom: 4 }}>Impressora 2a planta sense tóner</div>
            <div style={{ fontSize: 12, color: theme.textMuted }}>Obert fa 6 h · Assignat a IT</div>
          </Card>
        </div>
      )}
      {tab === 'surveys' && (
        <div style={{ padding: '0 16px' }}>
          <Card padding={18}>
            <Badge variant="accent" style={{ marginBottom: 10 }}>Obert fins 30 abril</Badge>
            <div style={{ fontFamily: '"Instrument Serif", serif', fontSize: 22, fontWeight: 400, lineHeight: 1.15, color: theme.text, marginBottom: 8, letterSpacing: '-0.01em', textWrap: 'balance' }}>
              Enquesta de clima laboral Q1 2026
            </div>
            <p style={{ fontSize: 13.5, color: theme.textMuted, margin: '0 0 14px', lineHeight: 1.4 }}>
              10 minuts. Les teves respostes són anònimes i ajuden a millorar l'entorn de treball.
            </p>
            <Btn full size="md" iconRight="arrowRight">Començar l'enquesta</Btn>
          </Card>
        </div>
      )}

      {/* Sheet for new suggestion */}
      <Sheet open={form.open} onClose={() => setForm({ ...form, open: false })} title={t.voice.newSuggestion}>
        {sent ? (
          <div style={{ textAlign: 'center', padding: '30px 20px' }}>
            <div style={{
              width: 64, height: 64, borderRadius: 32, margin: '0 auto 18px',
              background: accent.primaryLight, color: accent.primary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><Icon name="check" size={30} stroke={2.2}/></div>
            <div style={{ fontFamily: '"Instrument Serif", serif', fontSize: 22, marginBottom: 6 }}>Enviat!</div>
            <p style={{ fontSize: 13.5, color: theme.textMuted, margin: 0, lineHeight: 1.4 }}>Gràcies. L'equip revisarà el teu suggeriment aquesta setmana.</p>
          </div>
        ) : (
          <div>
            <Field label={t.voice.suggestions + ' — títol'}>
              <Input placeholder="Títol del suggeriment" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}/>
            </Field>
            <Field label="Descripció">
              <Textarea rows={4} placeholder="Descriu la teva proposta amb detall…" value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })}/>
            </Field>
            <Field label={t.voice.category}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {['Benestar', 'Instal·lacions', 'Organització', 'Formació', 'Altres'].map(c => (
                  <button key={c} onClick={() => setForm({ ...form, category: c })} style={{
                    padding: '7px 12px', borderRadius: 999,
                    background: form.category === c ? accent.primary : theme.card,
                    color: form.category === c ? '#fff' : theme.textMuted,
                    border: `1px solid ${form.category === c ? accent.primary : theme.border}`,
                    fontSize: 12.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                  }}>{c}</button>
                ))}
              </div>
            </Field>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', cursor: 'pointer', marginBottom: 8 }}>
              <div style={{
                width: 20, height: 20, borderRadius: 5,
                border: `1.5px solid ${form.anon ? accent.primary : theme.borderStrong}`,
                background: form.anon ? accent.primary : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff',
              }} onClick={() => setForm({ ...form, anon: !form.anon })}>
                {form.anon && <Icon name="check" size={14} stroke={2.5}/>}
              </div>
              <span style={{ fontSize: 14, color: theme.text }}>{t.voice.anonymous}</span>
            </label>
            <Btn full size="lg" onClick={() => setSent(true)} disabled={!form.title}>{t.voice.send}</Btn>
          </div>
        )}
      </Sheet>
    </div>
  );
}

// ─────────── Personal Requests ───────────
function RequestsScreen({ onBack }) {
  const { theme, accent, t } = useApp();
  const data = window.TAVIL_DATA;
  const [form, setForm] = uSS({ open: false, type: 'Vacances', day: '', comments: '' });
  const [sent, setSent] = uSS(false);

  return (
    <div style={{ height: '100%', overflow: 'auto', paddingBottom: 96 }}>
      <AppHeader onBack={onBack} title={t.req.title}/>
      <div style={{ padding: '0 20px 14px' }}>
        <div style={{ fontSize: 11, color: accent.primary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 6 }}>RRHH</div>
        <h1 style={{ fontFamily: '"Instrument Serif", serif', fontSize: 32, fontWeight: 400, lineHeight: 1.05, margin: 0, letterSpacing: '-0.02em' }}>{t.req.title}</h1>
        <p style={{ fontSize: 13.5, color: theme.textMuted, margin: '8px 0 0', lineHeight: 1.4 }}>{t.req.subtitle}</p>
      </div>
      {/* Counters */}
      <div style={{ padding: '6px 16px 18px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {[
          { n: 18, l: 'Vacances' },
          { n: 3, l: 'Assumptes' },
          { n: 5, l: 'Teletreball' },
        ].map((c, i) => (
          <Card key={i} padding={12} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: '"Instrument Serif", serif', fontSize: 28, lineHeight: 1, color: accent.primary }}>{c.n}</div>
            <div style={{ fontSize: 10.5, color: theme.textMuted, marginTop: 4, letterSpacing: '0.02em' }}>{c.l} · disponibles</div>
          </Card>
        ))}
      </div>
      <div style={{ padding: '0 16px 14px' }}>
        <Btn full icon="plus" onClick={() => { setForm({ ...form, open: true }); setSent(false); }}>{t.req.newRequest}</Btn>
      </div>
      <div style={{ padding: '6px 20px 6px' }}>
        <div style={{ fontSize: 11, color: theme.textFaint, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em' }}>{t.req.sent} · {data.requests.length}</div>
      </div>
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.requests.map(r => (
          <Card key={r.id} padding={14}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>{r.type}</div>
              <Badge variant={r.status === 'Aprovada' ? 'success' : r.status === 'Pendent' ? 'warning' : 'neutral'}>{r.status}</Badge>
            </div>
            <div style={{ fontFamily: '"Instrument Serif", serif', fontSize: 18, color: theme.text, letterSpacing: '-0.01em', marginBottom: 4 }}>{r.day}</div>
            <div style={{ fontSize: 12, color: theme.textMuted }}>Sol·licitada el {r.date} · {r.motive}</div>
          </Card>
        ))}
      </div>

      <Sheet open={form.open} onClose={() => setForm({ ...form, open: false })} title={t.req.newRequest}>
        {sent ? (
          <div style={{ textAlign: 'center', padding: '30px 20px' }}>
            <div style={{
              width: 64, height: 64, borderRadius: 32, margin: '0 auto 18px',
              background: accent.primaryLight, color: accent.primary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><Icon name="check" size={30} stroke={2.2}/></div>
            <div style={{ fontFamily: '"Instrument Serif", serif', fontSize: 22, marginBottom: 6 }}>Sol·licitud enviada</div>
            <p style={{ fontSize: 13.5, color: theme.textMuted, margin: 0, lineHeight: 1.4 }}>RRHH la revisarà abans de 48 h. Rebràs una notificació.</p>
          </div>
        ) : (
          <div>
            <Field label="Tipus">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                {['Vacances', 'Assumptes', 'Teletreball'].map(c => (
                  <button key={c} onClick={() => setForm({ ...form, type: c })} style={{
                    padding: '12px 6px', borderRadius: 12,
                    background: form.type === c ? accent.primary : theme.card,
                    color: form.type === c ? '#fff' : theme.text,
                    border: `1px solid ${form.type === c ? accent.primary : theme.border}`,
                    fontSize: 12.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                  }}>{c}</button>
                ))}
              </div>
            </Field>
            <Field label={t.req.requestedDay}>
              <Input type="text" placeholder="28 abril 2026" value={form.day} onChange={e => setForm({ ...form, day: e.target.value })}/>
            </Field>
            <Field label={t.req.comments}>
              <Textarea rows={3} placeholder="Explica el motiu o detalls rellevants…" value={form.comments} onChange={e => setForm({ ...form, comments: e.target.value })}/>
            </Field>
            <Btn full size="lg" onClick={() => setSent(true)} disabled={!form.day}>{t.req.send}</Btn>
          </div>
        )}
      </Sheet>
    </div>
  );
}

// ─────────── Profile + Settings ───────────
function ProfileScreen({ onBack, onLogout }) {
  const { theme, accent, t, user, darkMode, setDarkMode, lang, setLang, accentKey, setAccentKey } = useApp();
  return (
    <div style={{ height: '100%', overflow: 'auto', paddingBottom: 96 }}>
      <AppHeader onBack={onBack} title={t.nav.perfil}/>
      <div style={{ padding: '10px 20px 22px', textAlign: 'center' }}>
        <Avatar name={user.name} size={84} style={{ margin: '0 auto 14px' }}/>
        <div style={{ fontFamily: '"Instrument Serif", serif', fontSize: 28, letterSpacing: '-0.01em', lineHeight: 1.1 }}>{user.name}</div>
        <div style={{ fontSize: 13.5, color: theme.textMuted, marginTop: 4 }}>{user.role} · {user.dept}</div>
        <div style={{ fontSize: 12, color: theme.textFaint, marginTop: 2 }}>Ext. {user.ext} · marta.vidal@tavil.com</div>
      </div>

      {/* Appearance */}
      <SettingsGroup label={t.profile.theme}>
        <div style={{ padding: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { id: false, label: t.common.darkMode ? 'Clar' : 'Light', icon: 'sun' },
            { id: true, label: 'Fosc', icon: 'moon' },
          ].map(o => (
            <button key={String(o.id)} onClick={() => setDarkMode(o.id)} style={{
              padding: '14px 8px 12px', borderRadius: 12,
              background: darkMode === o.id ? accent.primaryLight : 'transparent',
              border: `1px solid ${darkMode === o.id ? accent.ring : theme.border}`,
              color: darkMode === o.id ? accent.primaryDark : theme.text,
              cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, fontWeight: 500,
            }}>
              <Icon name={o.icon} size={20}/>{o.label}
            </button>
          ))}
        </div>
      </SettingsGroup>

      <SettingsGroup label="Color d'accent">
        <div style={{ padding: 12, display: 'flex', gap: 10, justifyContent: 'center' }}>
          {Object.entries(window.TAVIL_ACCENTS).map(([k, v]) => (
            <button key={k} onClick={() => setAccentKey(k)} style={{
              width: 36, height: 36, borderRadius: 18, background: v.primary,
              border: `2px solid ${accentKey === k ? theme.text : 'transparent'}`,
              boxShadow: accentKey === k ? `0 0 0 3px ${theme.bg}, 0 0 0 4px ${theme.text}` : 'none',
              cursor: 'pointer', transition: 'all 200ms',
            }} aria-label={v.name}/>
          ))}
        </div>
      </SettingsGroup>

      <SettingsGroup label={t.profile.language}>
        {['ca', 'es', 'en'].map((l, i, arr) => (
          <button key={l} onClick={() => setLang(l)} style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', background: 'transparent', border: 'none',
            borderBottom: i < arr.length - 1 ? `1px solid ${theme.border}` : 'none',
            cursor: 'pointer', fontFamily: 'inherit', fontSize: 14.5, color: theme.text,
          }}>
            <span>{{ ca: 'Català', es: 'Castellano', en: 'English' }[l]}</span>
            {lang === l && <Icon name="check" size={18} stroke={2} style={{ color: accent.primary }}/>}
          </button>
        ))}
      </SettingsGroup>

      <SettingsGroup label={t.profile.account}>
        <SettingsRow icon="bell" label={t.profile.notifications} trailing={<Icon name="chevronRight" size={16}/>}/>
        <SettingsRow icon="settings" label={t.profile.settings} trailing={<Icon name="chevronRight" size={16}/>}/>
        <SettingsRow icon="logout" label={t.common.signOut} onClick={onLogout} destructive/>
      </SettingsGroup>

      <div style={{ textAlign: 'center', padding: '20px 0 10px', fontSize: 11, color: theme.textFaint, letterSpacing: '0.02em' }}>
        TAVIL · v2026.4
      </div>
    </div>
  );
}

function SettingsGroup({ label, children }) {
  const { theme } = useApp();
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{
        fontSize: 10.5, fontWeight: 600, color: theme.textFaint,
        textTransform: 'uppercase', letterSpacing: '0.14em',
        padding: '0 24px 8px',
      }}>{label}</div>
      <div style={{
        margin: '0 16px', background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 14,
        overflow: 'hidden',
      }}>{children}</div>
    </div>
  );
}

function SettingsRow({ icon, label, trailing, onClick, destructive }) {
  const { theme, accent } = useApp();
  return (
    <button onClick={onClick} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
      padding: '14px 16px', background: 'transparent', border: 'none',
      borderBottom: `1px solid ${theme.border}`,
      cursor: 'pointer', fontFamily: 'inherit', fontSize: 14.5,
      color: destructive ? accent.primary : theme.text,
    }}>
      <Icon name={icon} size={18} style={{ color: destructive ? accent.primary : theme.textMuted }}/>
      <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
      {trailing && <span style={{ color: theme.textFaint }}>{trailing}</span>}
    </button>
  );
}

// ─────────── Sheet (bottom modal) ───────────
function Sheet({ open, onClose, title, children }) {
  const { theme } = useApp();
  return (
    <>
      <div style={{
        position: 'absolute', inset: 0, background: theme.overlay,
        opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none',
        transition: 'opacity 260ms', zIndex: 70,
      }} onClick={onClose}/>
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        background: theme.bg,
        borderRadius: '20px 20px 0 0',
        maxHeight: '88%', overflow: 'auto',
        transform: open ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 360ms cubic-bezier(.23,1,.32,1)',
        zIndex: 80, boxShadow: `0 -20px 60px -20px ${theme.shadowMd}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: theme.border }}/>
        </div>
        <div style={{ padding: '14px 20px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: '"Instrument Serif", serif', fontSize: 22, letterSpacing: '-0.01em' }}>{title}</div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 18, background: theme.card, border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.text }}><Icon name="close" size={16}/></button>
        </div>
        <div style={{ padding: '6px 20px 28px' }}>{children}</div>
      </div>
    </>
  );
}

// ─────────── More tab: leads to everything else ───────────
function MoreScreen({ onNavigate, onLogout }) {
  const { theme, accent, t, user } = useApp();
  return (
    <div style={{ height: '100%', overflow: 'auto', paddingBottom: 96 }}>
      <AppHeader/>
      <div style={{ padding: '0 20px 16px' }}>
        <div style={{ fontSize: 11, color: accent.primary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 6 }}>Navegació</div>
        <h1 style={{ fontFamily: '"Instrument Serif", serif', fontSize: 36, fontWeight: 400, lineHeight: 1, margin: 0, letterSpacing: '-0.02em' }}>{t.nav.more}</h1>
      </div>
      <div style={{ padding: '0 16px 16px' }}>
        <Card padding={14} onClick={() => onNavigate('profile')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar name={user.name} size={46}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: theme.text }}>{user.name}</div>
              <div style={{ fontSize: 12.5, color: theme.textMuted }}>{user.role} · {user.dept}</div>
            </div>
            <Icon name="chevronRight" size={18} style={{ color: theme.textFaint }}/>
          </div>
        </Card>
      </div>
      {[
        { label: t.groups.general, items: [
          { id: 'activities', icon: 'activity', label: t.nav.activitats },
        ]},
        { label: t.groups.empresa, items: [
          { id: 'campus', icon: 'campus', label: t.nav.campus },
          { id: 'espai', icon: 'news', label: t.nav.espai },
        ]},
        { label: t.groups.personal, items: [
          { id: 'voice', icon: 'voice', label: t.nav.veu },
          { id: 'requests', icon: 'requests', label: t.nav.solicituds },
        ]},
      ].map((g, gi) => (
        <SettingsGroup key={gi} label={g.label}>
          {g.items.map((it, i, arr) => (
            <button key={it.id} onClick={() => onNavigate(it.id)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 16px', background: 'transparent', border: 'none',
              borderBottom: i < arr.length - 1 ? `1px solid ${theme.border}` : 'none',
              cursor: 'pointer', fontFamily: 'inherit', fontSize: 14.5, color: theme.text,
            }}>
              <Icon name={it.icon} size={18} style={{ color: theme.textMuted }}/>
              <span style={{ flex: 1, textAlign: 'left' }}>{it.label}</span>
              <Icon name="chevronRight" size={16} style={{ color: theme.textFaint }}/>
            </button>
          ))}
        </SettingsGroup>
      ))}
    </div>
  );
}

Object.assign(window, { AgendaScreen, ActivitiesScreen, DirectoryScreen, VoiceScreen, RequestsScreen, ProfileScreen, MoreScreen, Sheet, SettingsGroup, SettingsRow });
