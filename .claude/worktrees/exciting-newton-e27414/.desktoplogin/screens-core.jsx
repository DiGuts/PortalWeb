// Screens for TAVIL portal mobile prototype

const { useState: uS, useEffect: uE, useRef: uR, useMemo: uM } = React;

// ─────────── Shell (tab bar + drawer) ───────────
function TabBar({ current, onChange }) {
  const { theme, accent, t } = useApp();
  const tabs = [
    { id: 'home', label: t.nav.inici, icon: 'home' },
    { id: 'news', label: t.nav.noticies, icon: 'news' },
    { id: 'agenda', label: t.nav.agenda, icon: 'calendar' },
    { id: 'directory', label: t.nav.directori, icon: 'directory' },
    { id: 'more', label: t.nav.more, icon: 'menu' },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      background: theme.card,
      borderTop: `1px solid ${theme.border}`,
      padding: '8px 8px 22px',
      display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
      boxShadow: `0 -4px 24px -12px ${theme.shadow}`,
      zIndex: 40,
    }}>
      {tabs.map(tb => {
        const active = current === tb.id;
        return (
          <button key={tb.id} onClick={() => onChange(tb.id)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '6px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            color: active ? accent.primary : theme.textMuted,
            fontFamily: 'inherit', position: 'relative',
          }}>
            <div style={{
              height: 3, width: active ? 22 : 0, background: accent.primary,
              borderRadius: 2, position: 'absolute', top: -8,
              transition: 'width 260ms cubic-bezier(.23,1,.32,1)',
            }}/>
            <Icon name={tb.icon} size={22} stroke={active ? 1.9 : 1.6} />
            <span style={{ fontSize: 10.5, fontWeight: active ? 600 : 500, letterSpacing: '0.01em' }}>{tb.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function Drawer({ open, onClose, onNavigate }) {
  const { theme, accent, t, user } = useApp();
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
    ]},
    { label: t.groups.personal, items: [
      { id: 'voice', icon: 'voice', label: t.nav.veu },
      { id: 'requests', icon: 'requests', label: t.nav.solicituds },
      { id: 'profile', icon: 'profile', label: t.nav.perfil },
    ]},
  ];
  return (
    <>
      <div style={{
        position: 'absolute', inset: 0, background: theme.overlay,
        opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none',
        transition: 'opacity 260ms', zIndex: 80,
      }} onClick={onClose}/>
      <div style={{
        position: 'absolute', top: 0, bottom: 0, left: 0, width: '78%',
        background: theme.bg, zIndex: 90,
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 340ms cubic-bezier(.23,1,.32,1)',
        display: 'flex', flexDirection: 'column',
        borderRight: `1px solid ${theme.border}`,
      }}>
        <div style={{ padding: '50px 20px 20px', borderBottom: `1px solid ${theme.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              fontFamily: '"Instrument Serif", serif',
              fontSize: 22, color: theme.text, letterSpacing: '-0.01em',
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: 6,
                background: accent.primary, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, fontFamily: 'Instrument Sans, sans-serif',
              }}>T</div>
              TAVIL
            </div>
            <button onClick={onClose} style={{
              width: 36, height: 36, borderRadius: 18, background: 'transparent',
              border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: theme.text,
            }}><Icon name="close" size={16}/></button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar name={user.name} size={42}/>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: theme.text }}>{user.name}</div>
              <div style={{ fontSize: 12, color: theme.textMuted }}>{user.role}</div>
            </div>
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 12px' }}>
          {groups.map((g, gi) => (
            <div key={gi} style={{ marginBottom: 18 }}>
              <div style={{
                fontSize: 10, fontWeight: 600, color: theme.textFaint,
                textTransform: 'uppercase', letterSpacing: '0.14em',
                padding: '4px 12px 8px',
              }}>{g.label}</div>
              {g.items.map(it => (
                <button key={it.id} onClick={() => { onNavigate(it.id); onClose(); }} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 12px', background: 'transparent', border: 'none',
                  borderRadius: 10, color: theme.text, cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 14.5, textAlign: 'left',
                }}>
                  <Icon name={it.icon} size={19} stroke={1.6}/>
                  {it.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─────────── Login ───────────
function LoginScreen({ onLogin }) {
  const { theme, accent, t } = useApp();
  const [email, setEmail] = uS('');
  const [pass, setPass] = uS('');
  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: theme.bg, padding: '20px 24px 32px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 60 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9,
          background: accent.primary, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 700,
        }}>T</div>
        <LangSwitch inline/>
      </div>
      <div style={{ marginBottom: 36 }}>
        <div style={{
          fontSize: 10.5, color: accent.primary, fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 12,
        }}>Portal intern</div>
        <h1 style={{
          fontFamily: '"Instrument Serif", serif',
          fontSize: 34, fontWeight: 400, lineHeight: 1.05, margin: 0, marginBottom: 12,
          letterSpacing: '-0.02em', color: theme.text, textWrap: 'balance',
        }}>{t.login.title}</h1>
        <p style={{ fontSize: 14.5, color: theme.textMuted, margin: 0, lineHeight: 1.45 }}>{t.login.subtitle}</p>
      </div>
      <div style={{ marginBottom: 20 }}>
        <Field label={t.login.email}>
          <Input type="email" icon="mail" placeholder="nom.cognom@tavil.com" value={email} onChange={e => setEmail(e.target.value)}/>
        </Field>
        <Field label={t.login.password}>
          <Input type="password" placeholder="••••••••" value={pass} onChange={e => setPass(e.target.value)}/>
        </Field>
        <div style={{ textAlign: 'right', marginTop: -4 }}>
          <button onClick={() => onLogin && onLogin({ go: 'forgot' })} style={{ background: 'none', border: 'none', color: accent.primary, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>{t.login.forgot}</button>
        </div>
      </div>
      <Btn full size="lg" onClick={onLogin}>{t.common.signIn}</Btn>
      <div style={{ flex: 1 }}/>
      <div style={{ textAlign: 'center', fontSize: 13.5, color: theme.textMuted, marginBottom: 14 }}>
        {t.login.noAccount}{' '}
        <button onClick={() => onLogin && onLogin({ go: 'register' })} style={{ background: 'none', border: 'none', color: accent.primary, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>{t.login.createAccount}</button>
      </div>
      <div style={{ textAlign: 'center', fontSize: 11, color: theme.textFaint, letterSpacing: '0.02em' }}>
        TAVIL · v2026.4 · support@tavil.com
      </div>
    </div>
  );
}

// ─────────── Register ───────────
function RegisterScreen({ onBack, onNext }) {
  const { theme, accent, t } = useApp();
  const [form, setForm] = uS({ name: '', email: '', pass: '', confirm: '' });
  const mismatch = form.confirm && form.pass !== form.confirm;
  const valid = form.name && form.email && form.pass.length >= 6 && form.pass === form.confirm;
  // password strength
  const strength = (() => {
    const p = form.pass; let s = 0;
    if (p.length >= 6) s++; if (p.length >= 10) s++;
    if (/[A-Z]/.test(p)) s++; if (/[0-9]/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++;
    return Math.min(s, 4);
  })();
  const strengthLabels = ['—', 'Feble', 'Correcta', 'Bona', 'Forta'];
  const strengthColors = [theme.border, '#c87158', '#b6833a', '#7a8a6b', '#3f7a52'];
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: theme.bg, padding: '10px 24px 28px', overflow: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <button onClick={onBack} style={{ width: 40, height: 40, borderRadius: 20, background: theme.card, border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.text }}><Icon name="chevronLeft" size={18}/></button>
        <LangSwitch inline/>
      </div>
      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
        <div style={{ flex: 1, height: 3, borderRadius: 2, background: accent.primary }}/>
        <div style={{ flex: 1, height: 3, borderRadius: 2, background: theme.border }}/>
      </div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 10.5, color: accent.primary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10 }}>Pas 1 de 2</div>
        <h1 style={{ fontFamily: '"Instrument Serif", serif', fontSize: 36, fontWeight: 400, lineHeight: 1.02, margin: 0, marginBottom: 8, letterSpacing: '-0.02em', color: theme.text, textWrap: 'balance' }}>{t.login.regTitle}</h1>
        <p style={{ fontSize: 14, color: theme.textMuted, margin: 0, lineHeight: 1.4 }}>{t.login.regSubtitle}</p>
      </div>
      <Field label={t.login.name}>
        <Input icon="profile" placeholder="Nom i cognoms" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/>
      </Field>
      <Field label={t.login.email}>
        <Input type="email" icon="mail" placeholder="nom.cognom@tavil.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}/>
      </Field>
      <Field label={t.login.password} hint={form.pass ? `Seguretat: ${strengthLabels[strength]}` : 'Mínim 6 caràcters'}>
        <Input type="password" placeholder="••••••••" value={form.pass} onChange={e => setForm({ ...form, pass: e.target.value })}/>
        {form.pass && (
          <div style={{ display: 'flex', gap: 3, marginTop: 6 }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength ? strengthColors[strength] : theme.border, transition: 'all 200ms' }}/>
            ))}
          </div>
        )}
      </Field>
      <Field label={t.login.confirm} error={mismatch ? 'Les contrasenyes no coincideixen' : ''}>
        <Input type="password" placeholder="••••••••" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })}/>
      </Field>
      <div style={{ flex: 1, minHeight: 8 }}/>
      <Btn full size="lg" iconRight="arrowRight" disabled={!valid} onClick={() => onNext(form)}>{t.login.next}</Btn>
    </div>
  );
}

// ─────────── Verify email ───────────
function VerifyScreen({ email, onBack, onVerified }) {
  const { theme, accent, t } = useApp();
  const CODE_LEN = 8;
  // Realistic code shown for demo — E2A76B29 style (hex-ish)
  const [code, setCode] = uS(Array(CODE_LEN).fill(''));
  const [resentAt, setResentAt] = uS(null);
  const refs = uR([]);
  const set = (i, v) => {
    v = v.toUpperCase().replace(/[^0-9A-F]/g, '').slice(0, 1);
    const next = [...code]; next[i] = v; setCode(next);
    if (v && i < CODE_LEN - 1) refs.current[i + 1]?.focus();
  };
  const onKey = (i, e) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) refs.current[i - 1]?.focus();
    if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < CODE_LEN - 1) refs.current[i + 1]?.focus();
  };
  const onPaste = (e) => {
    const txt = (e.clipboardData?.getData('text') || '').toUpperCase().replace(/[^0-9A-F]/g, '').slice(0, CODE_LEN);
    if (!txt) return;
    e.preventDefault();
    const next = Array(CODE_LEN).fill('');
    for (let i = 0; i < txt.length; i++) next[i] = txt[i];
    setCode(next);
    refs.current[Math.min(txt.length, CODE_LEN - 1)]?.focus();
  };
  const full = code.join('');
  const complete = full.length === CODE_LEN;
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: theme.bg, padding: '10px 24px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <button onClick={onBack} style={{ width: 40, height: 40, borderRadius: 20, background: theme.card, border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.text }}><Icon name="chevronLeft" size={18}/></button>
        <LangSwitch inline/>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
        <div style={{ flex: 1, height: 3, borderRadius: 2, background: accent.primary }}/>
        <div style={{ flex: 1, height: 3, borderRadius: 2, background: accent.primary }}/>
      </div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10.5, color: accent.primary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10 }}>Pas 2 de 2</div>
        <h1 style={{ fontFamily: '"Instrument Serif", serif', fontSize: 34, fontWeight: 400, lineHeight: 1.04, margin: 0, marginBottom: 10, letterSpacing: '-0.02em', color: theme.text, textWrap: 'balance' }}>{t.login.verify}</h1>
        <p style={{ fontSize: 14, color: theme.textMuted, margin: 0, lineHeight: 1.45 }}>
          {t.login.verifySub} <span style={{ color: theme.text, fontWeight: 500 }}>{email || 'nom.cognom@tavil.com'}</span>
        </p>
      </div>
      {/* Code slots */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 13, color: theme.textMuted, marginBottom: 10, fontWeight: 500 }}>{t.login.codeLabel}</div>
        <div style={{ display: 'flex', gap: 4, justifyContent: 'space-between' }} onPaste={onPaste}>
          {code.map((c, i) => (
            <input
              key={i}
              ref={el => refs.current[i] = el}
              value={c}
              onChange={e => set(i, e.target.value)}
              onKeyDown={e => onKey(i, e)}
              maxLength={1}
              inputMode="text"
              autoCapitalize="characters"
              style={{
                flex: '1 1 0', minWidth: 0, width: 30, height: 48, textAlign: 'center',
                fontFamily: 'JetBrains Mono, ui-monospace, Menlo, monospace',
                fontSize: 18, fontWeight: 500, color: theme.text,
                background: theme.card,
                border: `1px solid ${c ? accent.ring : theme.border}`,
                borderRadius: 9, outline: 'none', padding: 0,
                transition: 'all 160ms',
                boxShadow: c ? `0 0 0 3px ${accent.primaryLight}80` : 'none',
                textTransform: 'uppercase',
              }}
            />
          ))}
        </div>
        <div style={{ fontSize: 11.5, color: theme.textFaint, marginTop: 8, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.04em' }}>
          Format: 8 car. hex · e.g. E2A76B29
        </div>
      </div>
      <div style={{ fontSize: 13, color: theme.textMuted, marginBottom: 22 }}>
        No l'has rebut?{' '}
        <button onClick={() => setResentAt(Date.now())} style={{ background: 'none', border: 'none', color: accent.primary, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>{t.login.resend}</button>
        {resentAt && <span style={{ display: 'block', fontSize: 11.5, color: theme.olive, marginTop: 4 }}>✓ Codi reenviat</span>}
      </div>
      <div style={{ flex: 1 }}/>
      <Btn full size="lg" disabled={!complete} onClick={() => onVerified && onVerified(full)}>{t.common.signIn}</Btn>
    </div>
  );
}

function LangSwitch({ inline }) {
  const { theme, lang, setLang } = useApp();
  const langs = ['ca', 'es', 'en'];
  return (
    <div style={{
      display: 'inline-flex', background: theme.card, border: `1px solid ${theme.border}`,
      borderRadius: 999, padding: 3, gap: 0,
    }}>
      {langs.map(l => (
        <button key={l} onClick={() => setLang(l)} style={{
          padding: '5px 10px', fontSize: 11, fontWeight: 600,
          background: lang === l ? theme.text : 'transparent',
          color: lang === l ? theme.bg : theme.textMuted,
          border: 'none', borderRadius: 999, cursor: 'pointer',
          textTransform: 'uppercase', letterSpacing: '0.06em',
          fontFamily: 'inherit', transition: 'all 200ms',
        }}>{l}</button>
      ))}
    </div>
  );
}

// ─────────── Home ───────────
function HomeScreen({ onOpenDrawer, onNavigate, onOpenNews }) {
  const { theme, accent, t, user } = useApp();
  const data = window.TAVIL_DATA;
  const featured = data.news.find(n => n.featured) || data.news[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t.common.goodMorning : hour < 19 ? t.common.goodAfternoon : t.common.goodEvening;
  return (
    <div style={{ height: '100%', overflow: 'auto', paddingBottom: 96 }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 16px 4px', justifyContent: 'space-between' }}>
        <button onClick={onOpenDrawer} style={{
          width: 40, height: 40, borderRadius: 20,
          background: theme.card, border: `1px solid ${theme.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: theme.text,
        }}><Icon name="menu" size={18}/></button>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          fontFamily: '"Instrument Serif", serif', fontSize: 20,
          letterSpacing: '-0.01em',
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: 5,
            background: accent.primary, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, fontFamily: 'Instrument Sans, sans-serif',
          }}>T</div>
          TAVIL
        </div>
        <button onClick={() => onNavigate('notifications')} style={{
          width: 40, height: 40, borderRadius: 20,
          background: theme.card, border: `1px solid ${theme.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: theme.text, position: 'relative',
        }}>
          <Icon name="bell" size={18}/>
          <div style={{
            position: 'absolute', top: 8, right: 9,
            width: 8, height: 8, borderRadius: 4,
            background: accent.primary, border: `2px solid ${theme.card}`,
          }}/>
        </button>
      </div>

      {/* Greeting */}
      <div style={{ padding: '18px 20px 8px' }}>
        <div style={{ fontSize: 13, color: theme.textMuted, marginBottom: 2, letterSpacing: '0.01em' }}>
          {greeting},
        </div>
        <h1 style={{
          fontFamily: '"Instrument Serif", serif',
          fontSize: 34, fontWeight: 400, lineHeight: 1, margin: 0,
          letterSpacing: '-0.02em', color: theme.text,
        }}>
          {user.name.split(' ')[0]}.
        </h1>
      </div>

      {/* Urgent banner */}
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{
          background: accent.primary, color: '#fff',
          borderRadius: 14, padding: '14px 16px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <Icon name="alert" size={20} stroke={1.8}/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
              textTransform: 'uppercase', opacity: 0.8, marginBottom: 1,
            }}>{t.home.urgent}</div>
            <div style={{ fontSize: 13.5, fontWeight: 500, lineHeight: 1.3 }}>
              Tall de llum programat dijous 23 · 08:00–09:30 a la planta Terrassa.
            </div>
          </div>
          <Icon name="chevronRight" size={18}/>
        </div>
      </div>

      {/* Quick access */}
      <div style={{ padding: '24px 20px 4px' }}>
        <SectionHead kicker="Accés ràpid" title={t.home.quickAccess}/>
      </div>
      <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {[
          { id: 'requests', icon: 'requests', label: t.nav.solicituds },
          { id: 'agenda', icon: 'calendar', label: t.nav.agenda },
          { id: 'voice', icon: 'voice', label: t.nav.veu },
          { id: 'campus', icon: 'campus', label: t.nav.campus },
        ].map(q => (
          <button key={q.id} onClick={() => onNavigate(q.id)} style={{
            background: theme.card, border: `1px solid ${theme.border}`,
            borderRadius: 14, padding: '14px 6px 12px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            color: theme.text, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: accent.primaryLight, color: accent.primaryDark,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><Icon name={q.icon} size={18} stroke={1.7}/></div>
            <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.01em', textAlign: 'center', lineHeight: 1.2 }}>{q.label}</span>
          </button>
        ))}
      </div>

      {/* Featured news */}
      <div style={{ padding: '28px 20px 0' }}>
        <SectionHead kicker={t.news.featured} title={t.home.latestNews} action={t.common.seeAll} onAction={() => onNavigate('news')}/>
      </div>
      <div style={{ padding: '0 16px' }}>
        <Card padding={0} onClick={() => onOpenNews(featured.id)}>
          <ImgPh label="cover · primavera 2026" ratio="16/10" tone="accent" style={{ borderRadius: '15px 15px 0 0', border: 'none', borderBottom: `1px solid ${theme.border}` }}/>
          <div style={{ padding: 16 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <Badge variant="accent">{featured.tag}</Badge>
              <Badge>{featured.readMin} {t.news.minRead}</Badge>
            </div>
            <h3 style={{
              fontFamily: '"Instrument Serif", serif',
              fontSize: 22, fontWeight: 400, lineHeight: 1.15, margin: 0, marginBottom: 8,
              letterSpacing: '-0.01em', color: theme.text,
              textWrap: 'balance',
            }}>{featured.title}</h3>
            <p style={{ fontSize: 13.5, color: theme.textMuted, margin: 0, lineHeight: 1.45 }}>{featured.summary}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 12, color: theme.textFaint }}>
              <span>{featured.author}</span>
              <span>·</span>
              <span>{featured.date}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Upcoming agenda strip */}
      <div style={{ padding: '28px 20px 0' }}>
        <SectionHead kicker="Agenda" title={t.home.upcomingAgenda} action={t.common.seeAll} onAction={() => onNavigate('agenda')}/>
      </div>
      <div style={{ padding: '0 0 0 16px', display: 'flex', gap: 10, overflow: 'auto', scrollbarWidth: 'none' }} className="hide-sb">
        {data.agenda.slice(0, 4).map(ev => (
          <Card key={ev.id} padding={14} style={{ minWidth: 220, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
              <div style={{
                fontFamily: '"Instrument Serif", serif',
                fontSize: 28, lineHeight: 1, fontWeight: 400, color: accent.primary,
              }}>{ev.day}</div>
              <div style={{ fontSize: 11, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{ev.month}</div>
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.25, color: theme.text, marginBottom: 6 }}>{ev.title}</div>
            <div style={{ fontSize: 11.5, color: theme.textMuted, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Icon name="clock" size={12}/>{ev.time}
            </div>
          </Card>
        ))}
        <div style={{ minWidth: 8, flexShrink: 0 }}/>
      </div>

      {/* More news list */}
      <div style={{ padding: '28px 20px 0' }}>
        <SectionHead kicker="Novetats" title="Més notícies"/>
      </div>
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.news.slice(1, 4).map(n => (
          <Card key={n.id} padding={14} onClick={() => onOpenNews(n.id)}>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: theme.textFaint, marginBottom: 4 }}>{n.tag} · {n.date}</div>
                <div style={{
                  fontSize: 14.5, fontWeight: 600, lineHeight: 1.3, color: theme.text,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>{n.title}</div>
              </div>
              <ImgPh label="img" ratio="1/1" style={{ width: 64, height: 64, flexShrink: 0, aspectRatio: 'auto' }}/>
            </div>
          </Card>
        ))}
      </div>
      <style>{`.hide-sb::-webkit-scrollbar{display:none}`}</style>
    </div>
  );
}

// ─────────── News list + detail ───────────
function NewsScreen({ onOpenNews, onOpenDrawer }) {
  const { theme, accent, t } = useApp();
  const data = window.TAVIL_DATA;
  const tags = ['all', 'Empresa', 'Resultats', 'Sostenibilitat', 'Persones', 'Tecnologia'];
  const [tag, setTag] = uS('all');
  const [q, setQ] = uS('');
  const filtered = data.news.filter(n =>
    (tag === 'all' || n.tag === tag) &&
    (!q || (n.title + n.summary).toLowerCase().includes(q.toLowerCase()))
  );
  return (
    <div style={{ height: '100%', overflow: 'auto', paddingBottom: 96 }}>
      <AppHeader
        leading={<button onClick={onOpenDrawer} style={{ width: 40, height: 40, borderRadius: 20, background: theme.card, border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.text }}><Icon name="menu" size={18}/></button>}
        trailing={<button style={{ width: 40, height: 40, borderRadius: 20, background: theme.card, border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.text }}><Icon name="search" size={18}/></button>}
      />
      <div style={{ padding: '8px 20px 16px' }}>
        <div style={{ fontSize: 11, color: accent.primary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 6 }}>Comunicació interna</div>
        <h1 style={{ fontFamily: '"Instrument Serif", serif', fontSize: 36, fontWeight: 400, lineHeight: 1, margin: 0, letterSpacing: '-0.02em' }}>{t.nav.noticies}</h1>
        <p style={{ fontSize: 13.5, color: theme.textMuted, margin: '8px 0 0', lineHeight: 1.4 }}>{t.news.subtitle}</p>
      </div>
      {/* Filter chips */}
      <div style={{ padding: '0 0 16px 16px', display: 'flex', gap: 6, overflow: 'auto', scrollbarWidth: 'none' }} className="hide-sb">
        {tags.map(tg => (
          <button key={tg} onClick={() => setTag(tg)} style={{
            padding: '7px 14px', borderRadius: 999,
            background: tag === tg ? theme.text : theme.card,
            color: tag === tg ? theme.bg : theme.textMuted,
            border: `1px solid ${tag === tg ? theme.text : theme.border}`,
            fontSize: 12.5, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
            fontFamily: 'inherit', flexShrink: 0,
          }}>{tg === 'all' ? t.common.all : tg}</button>
        ))}
        <div style={{ minWidth: 8, flexShrink: 0 }}/>
      </div>
      {/* Featured item */}
      {filtered[0] && (
        <div style={{ padding: '0 16px 12px' }}>
          <Card padding={0} onClick={() => onOpenNews(filtered[0].id)}>
            <ImgPh label="cover image" ratio="16/10" tone="accent" style={{ borderRadius: '15px 15px 0 0', border: 'none' }}/>
            <div style={{ padding: 16 }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                <Badge variant="accent">{filtered[0].tag}</Badge>
                <Badge>{filtered[0].date}</Badge>
              </div>
              <h3 style={{ fontFamily: '"Instrument Serif", serif', fontSize: 22, fontWeight: 400, lineHeight: 1.15, margin: 0, letterSpacing: '-0.01em', textWrap: 'balance' }}>{filtered[0].title}</h3>
              <p style={{ fontSize: 13.5, color: theme.textMuted, margin: '10px 0 0', lineHeight: 1.45 }}>{filtered[0].summary}</p>
            </div>
          </Card>
        </div>
      )}
      {/* Rest as list */}
      <div style={{ padding: '4px 16px', display: 'flex', flexDirection: 'column' }}>
        {filtered.slice(1).map((n, i) => (
          <div key={n.id} onClick={() => onOpenNews(n.id)} style={{
            display: 'flex', gap: 14, padding: '14px 4px',
            borderBottom: i < filtered.length - 2 ? `1px solid ${theme.border}` : 'none',
            cursor: 'pointer',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10.5, color: accent.primary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 5 }}>{n.tag}</div>
              <h4 style={{ fontFamily: '"Instrument Serif", serif', fontSize: 17, fontWeight: 400, lineHeight: 1.2, margin: 0, letterSpacing: '-0.01em', color: theme.text, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.title}</h4>
              <div style={{ fontSize: 11.5, color: theme.textFaint, marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                <span>{n.date}</span><span>·</span><span>{n.readMin} {t.news.minRead}</span>
              </div>
            </div>
            <ImgPh label="img" style={{ width: 86, height: 86, flexShrink: 0, aspectRatio: 'auto' }}/>
          </div>
        ))}
      </div>
    </div>
  );
}

// News detail with swipe-between articles
function NewsDetailScreen({ id, onBack }) {
  const { theme, accent, t } = useApp();
  const data = window.TAVIL_DATA;
  const items = data.news;
  const startIdx = Math.max(0, items.findIndex(n => n.id === id));
  const [idx, setIdx] = uS(startIdx);
  const [dragX, setDragX] = uS(0);
  const [dragging, setDragging] = uS(false);
  const startX = uR(0);
  const [anim, setAnim] = uS(null); // 'left'|'right'|null — direction the new card comes from
  const onStart = (x) => { startX.current = x; setDragging(true); setAnim(null); };
  const onMove = (x) => { if (dragging) setDragX(x - startX.current); };
  const onEnd = () => {
    const w = 390;
    if (dragX < -60 && idx < items.length - 1) {
      setAnim('right'); setIdx(idx + 1);
    } else if (dragX > 60 && idx > 0) {
      setAnim('left'); setIdx(idx - 1);
    }
    setDragX(0); setDragging(false);
  };
  uE(() => { if (anim) { const to = setTimeout(() => setAnim(null), 420); return () => clearTimeout(to); } }, [anim, idx]);

  const n = items[idx];
  return (
    <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: theme.bg }}>
      <AppHeader onBack={onBack} title={t.nav.noticies} trailing={<button style={{ width: 40, height: 40, borderRadius: 20, background: theme.card, border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.text }}><Icon name="share" size={17}/></button>}/>
      <div
        style={{ flex: 1, overflow: 'hidden', position: 'relative', touchAction: 'pan-y' }}
        onMouseDown={(e) => onStart(e.clientX)}
        onMouseMove={(e) => onMove(e.clientX)}
        onMouseUp={onEnd}
        onMouseLeave={() => dragging && onEnd()}
        onTouchStart={(e) => onStart(e.touches[0].clientX)}
        onTouchMove={(e) => onMove(e.touches[0].clientX)}
        onTouchEnd={onEnd}
      >
        <div
          key={n.id}
          style={{
            height: '100%', overflow: 'auto',
            transform: dragging ? `translateX(${dragX}px)` : 'translateX(0)',
            transition: dragging ? 'none' : 'transform 360ms cubic-bezier(.23,1,.32,1)',
            animation: anim === 'right' ? 'slideFromRight 380ms cubic-bezier(.23,1,.32,1)' :
                       anim === 'left' ? 'slideFromLeft 380ms cubic-bezier(.23,1,.32,1)' : 'none',
            paddingBottom: 40,
          }}
        >
          <div style={{ padding: '4px 20px 0' }}>
            <Badge variant="accent" style={{ marginBottom: 14 }}>{n.tag}</Badge>
            <h1 style={{
              fontFamily: '"Instrument Serif", serif',
              fontSize: 30, fontWeight: 400, lineHeight: 1.08, margin: 0, marginBottom: 14,
              letterSpacing: '-0.02em', textWrap: 'balance',
            }}>{n.title}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, fontSize: 12.5, color: theme.textMuted }}>
              <Avatar name={n.author} size={28}/>
              <div>
                <div style={{ color: theme.text, fontWeight: 500 }}>{n.author}</div>
                <div>{n.date} · {n.readMin} {t.news.minRead}</div>
              </div>
            </div>
          </div>
          <ImgPh label="hero image" ratio="4/3" tone="accent" style={{ borderRadius: 0, border: 'none', margin: '0 0 20px' }}/>
          <div style={{ padding: '0 22px', fontSize: 15, lineHeight: 1.6, color: theme.text }}>
            <p style={{ margin: '0 0 14px', fontSize: 17, color: theme.textMuted, lineHeight: 1.5, fontFamily: '"Instrument Serif", serif', fontStyle: 'italic' }}>
              {n.summary}
            </p>
            <p style={{ margin: '0 0 14px' }}>
              El passat dijous, a la seu central de TAVIL, es van reunir més d'un centenar de persones dels equips comercial, disseny i producció per la presentació oficial de la nova col·lecció primavera 2026. L'acte, conduit per la directora creativa Laia Font, va repassar les peces més destacades i els processos productius darrere de cadascuna.
            </p>
            <p style={{ margin: '0 0 14px' }}>
              Entre els moments més aplaudits hi va haver la presentació de la nova línia sostenible, fabricada íntegrament amb materials reciclats de proveïdors catalans, i l'anunci d'una col·laboració amb l'escola d'art de Terrassa.
            </p>
            <p style={{ margin: '0 0 14px' }}>
              La presentació es va tancar amb un vermut a la terrassa de l'edifici i un primer dinar d'equip de la temporada.
            </p>
          </div>
          {/* Dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '20px 0 4px' }}>
            {items.map((_, i) => (
              <div key={i} style={{
                width: i === idx ? 18 : 6, height: 6, borderRadius: 3,
                background: i === idx ? accent.primary : theme.border,
                transition: 'all 300ms',
              }}/>
            ))}
          </div>
          <div style={{ textAlign: 'center', fontSize: 11, color: theme.textFaint, padding: '4px 20px 0', fontStyle: 'italic' }}>
            Llisca per passar al següent article →
          </div>
        </div>
      </div>
      <style>{`
        @keyframes slideFromRight { from { transform: translateX(100%); opacity: 0.5; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideFromLeft { from { transform: translateX(-100%); opacity: 0.5; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
    </div>
  );
}

Object.assign(window, { TabBar, Drawer, LoginScreen, RegisterScreen, VerifyScreen, HomeScreen, NewsScreen, NewsDetailScreen, LangSwitch });
