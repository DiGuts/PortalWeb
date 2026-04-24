import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserCircle, Mail, Lock, Eye, EyeOff, ChevronLeft, ArrowRight } from 'lucide-react';
import { apiRegister, AuthOut } from '../../../api';
import { LangSwitch } from './LangSwitch';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputBase: React.CSSProperties = {
  width: '100%',
  height: 50,
  padding: '0 14px 0 44px',
  background: 'var(--tavil-card)',
  color: 'var(--tavil-text)',
  border: '1px solid var(--tavil-border)',
  borderRadius: 14,
  fontSize: 15,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  color: 'var(--tavil-muted)',
  marginBottom: 6,
  fontWeight: 500,
  display: 'block',
};

interface Props {
  onBack: () => void;
  onRegisterResult: (data: AuthOut) => void;
  isDarkMode: boolean;
}

const STRENGTH_COLORS = ['var(--tavil-border)', '#c87158', '#b6833a', '#7a8a6b', '#3f7a52'];
const STRENGTH_LABELS = ['—', 'Feble', 'Correcta', 'Bona', 'Forta'];

function passwordStrength(p: string): number {
  let s = 0;
  if (p.length >= 6) s++;
  if (p.length >= 10) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return Math.min(s, 4);
}

export function RegisterScreen({ onBack, onRegisterResult, isDarkMode }: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const strength = passwordStrength(password);
  const pwMatch = confirm === '' || password === confirm;
  const valid = !!(name.trim() && EMAIL_RE.test(email.trim()) && password.length >= 6 && password === confirm);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!EMAIL_RE.test(email.trim())) { setError('Format de correu no vàlid.'); return; }
    if (password.length < 6) { setError('La contrasenya ha de tenir mínim 6 caràcters.'); return; }
    if (password !== confirm) { setError('Les contrasenyes no coincideixen.'); return; }
    setLoading(true);
    try {
      const data = await apiRegister(name.trim(), email.trim().toLowerCase(), password);
      onRegisterResult(data);
    } catch (err: any) {
      setError(err.message ?? 'Error desconegut.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={isDarkMode ? 'dark' : ''}
      style={{
        minHeight: '100svh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--tavil-bg)',
        color: 'var(--tavil-text)',
        padding: '10px 24px 28px',
        boxSizing: 'border-box',
        overflowY: 'auto',
      }}
    >
      {/* Top: back + lang */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <button
          onClick={onBack}
          aria-label={t('common.back')}
          style={{
            width: 40, height: 40, borderRadius: 20,
            background: 'var(--tavil-card)', border: '1px solid var(--tavil-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--tavil-text)', flexShrink: 0,
          }}
        >
          <ChevronLeft size={18} />
        </button>
        <LangSwitch />
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
        <div style={{ flex: 1, height: 3, borderRadius: 2, background: '#bf211e' }} />
        <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'var(--tavil-border)' }} />
      </div>

      {/* Heading */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 10.5, color: '#bf211e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10 }}>
          PAS 1 DE 2
        </div>
        <h1 style={{
          fontFamily: '"Instrument Serif", "Times New Roman", serif',
          fontSize: 36, fontWeight: 400, lineHeight: 1.02, margin: '0 0 8px',
          letterSpacing: '-0.02em', color: 'var(--tavil-text)',
        }}>
          {t('auth.registerTitle')}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--tavil-muted)', margin: 0, lineHeight: 1.4 }}>
          {t('auth.regSubtitle')}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Name */}
        <div style={{ marginBottom: 14 }}>
          <span style={labelStyle}>{t('auth.name')}</span>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <UserCircle size={16} style={{ position: 'absolute', left: 14, color: 'var(--tavil-faint)', pointerEvents: 'none' }} />
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Nom i cognoms" required autoComplete="name"
              style={inputBase}
            />
          </div>
        </div>

        {/* Email */}
        <div style={{ marginBottom: 14 }}>
          <span style={labelStyle}>{t('auth.email')}</span>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Mail size={16} style={{ position: 'absolute', left: 14, color: 'var(--tavil-faint)', pointerEvents: 'none' }} />
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="nom.cognom@tavil.net" required
              inputMode="email" autoComplete="email"
              style={{ ...inputBase, borderColor: email && !EMAIL_RE.test(email) ? '#bf211e' : 'var(--tavil-border)' }}
            />
          </div>
          {email && !EMAIL_RE.test(email) && (
            <p style={{ fontSize: 12, color: '#bf211e', margin: '4px 0 0' }}>Format: nom@tavil.net</p>
          )}
        </div>

        {/* Password */}
        <div style={{ marginBottom: 14 }}>
          <span style={labelStyle}>
            {t('auth.password')}
            {password
              ? ` · ${STRENGTH_LABELS[strength]}`
              : ' · Mínim 6 caràcters'}
          </span>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Lock size={16} style={{ position: 'absolute', left: 14, color: 'var(--tavil-faint)', pointerEvents: 'none' }} />
            <input
              type={showPass ? 'text' : 'password'} value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required autoComplete="new-password"
              style={{ ...inputBase, padding: '0 44px' }}
            />
            <button type="button" onClick={() => setShowPass(v => !v)} aria-label="Toggle password"
              style={{ position: 'absolute', right: 14, color: 'var(--tavil-faint)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}>
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {password && (
            <div style={{ display: 'flex', gap: 3, marginTop: 6 }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength ? STRENGTH_COLORS[strength] : 'var(--tavil-border)', transition: 'background 200ms' }} />
              ))}
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div style={{ marginBottom: 24 }}>
          <span style={labelStyle}>{t('auth.confirm')}</span>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Lock size={16} style={{ position: 'absolute', left: 14, color: 'var(--tavil-faint)', pointerEvents: 'none' }} />
            <input
              type={showConfirm ? 'text' : 'password'} value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="••••••••" required autoComplete="new-password"
              style={{ ...inputBase, padding: '0 44px', borderColor: !pwMatch ? '#bf211e' : 'var(--tavil-border)' }}
            />
            <button type="button" onClick={() => setShowConfirm(v => !v)} aria-label="Toggle confirm"
              style={{ position: 'absolute', right: 14, color: 'var(--tavil-faint)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}>
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {!pwMatch && (
            <p style={{ fontSize: 12, color: '#bf211e', margin: '4px 0 0' }}>Les contrasenyes no coincideixen</p>
          )}
        </div>

        {error && <p style={{ fontSize: 13, color: '#bf211e', margin: '0 0 12px', textAlign: 'center' }}>{error}</p>}

        <div style={{ flex: 1, minHeight: 8 }} />

        <button
          type="submit"
          disabled={loading || !valid}
          style={{
            height: 50, borderRadius: 14, border: 'none',
            background: '#bf211e', color: '#fff',
            fontSize: 15, fontWeight: 600,
            cursor: (loading || !valid) ? 'not-allowed' : 'pointer',
            opacity: (loading || !valid) ? 0.6 : 1,
            transition: 'opacity 160ms',
            fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {loading ? t('common.loading') : <>{t('auth.next')} <ArrowRight size={16} /></>}
        </button>
      </form>
    </div>
  );
}
