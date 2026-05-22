import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { apiLogin, AuthOut } from '../../../api';
import { LangSwitch } from './LangSwitch';

// Shared theme transition curve — every var-bound color/bg uses it so the
// dark↔light switch animates as one coordinated frame, not a checkerboard snap.
const THEME_TR =
  'background-color 320ms cubic-bezier(.23,1,.32,1),' +
  'background 320ms cubic-bezier(.23,1,.32,1),' +
  'border-color 320ms cubic-bezier(.23,1,.32,1),' +
  'color 320ms cubic-bezier(.23,1,.32,1)';

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 48,
  padding: '0 14px 0 44px',
  background: 'var(--tavil-card)',
  color: 'var(--tavil-text)',
  border: '1px solid var(--tavil-border)',
  borderRadius: 12,
  fontSize: 15,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  transition: THEME_TR,
};

const labelStyle: React.CSSProperties = {
  fontSize: 12.5,
  color: 'var(--tavil-muted)',
  marginBottom: 6,
  fontWeight: 500,
  display: 'block',
  transition: THEME_TR,
};

interface Props {
  onLoginResult: (data: AuthOut) => void;
  onRegister?: () => void;
  onForgot: () => void;
  isDarkMode: boolean;
}

export function LoginScreen({ onLoginResult, onRegister, onForgot, isDarkMode }: Props) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiLogin(email.trim().toLowerCase(), password);
      data.remember = remember;
      onLoginResult(data);
    } catch (err: any) {
      setError(err.message ?? 'Error d\'autenticació.');
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
        padding: '20px 24px 32px',
        boxSizing: 'border-box',
        transition: THEME_TR,
      }}
    >
      {/* Top row: logo + lang */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 60 }}>
        {/* 36×36 mahogany "T" logo tile */}
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'var(--tavil-accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: 18,
          fontFamily: '"Instrument Serif", serif',
          letterSpacing: '-0.02em',
          flexShrink: 0,
          transition: THEME_TR,
        }}>
          T
        </div>
        <LangSwitch />
      </div>

      {/* Eyebrow + H1 + subtitle */}
      <div style={{ marginBottom: 36 }}>
        <div style={{
          fontSize: 10.5, color: 'var(--tavil-accent)', fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 12,
        }}>
          PORTAL INTERN
        </div>
        {/* Logo crossfade: both imgs absolute in a fixed-size slot so the
            wordmark anchors at the exact same pixel in both modes, regardless
            of the underlying SVG's viewBox or intrinsic aspect ratio. */}
        <div style={{
          position: 'relative',
          width: 160,
          height: 40,
          marginBottom: 8,
        }}>
          <img
            src={`${process.env.PUBLIC_URL}/assets/images/tavilNet.svg`}
            alt={t('auth.loginTitle')}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'contain',
              objectPosition: 'left center',
              opacity: isDarkMode ? 0 : 1,
              transition: 'opacity 320ms cubic-bezier(.23,1,.32,1)',
            }}
          />
          <img
            src={`${process.env.PUBLIC_URL}/assets/images/TAVILhub.svg?v=3`}
            alt=""
            aria-hidden="true"
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'contain',
              objectPosition: 'left center',
              opacity: isDarkMode ? 1 : 0,
              transition: 'opacity 320ms cubic-bezier(.23,1,.32,1)',
            }}
          />
        </div>
        <p style={{
          fontSize: 15, color: 'var(--tavil-muted)', margin: 0, lineHeight: 1.4,
          transition: THEME_TR,
        }}>
          {t('auth.loginSubtitle')}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', marginBottom: 16 }}>
        {/* Email */}
        <div style={{ marginBottom: 14 }}>
          <span style={labelStyle}>{t('auth.email')}</span>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Mail size={16} style={{ position: 'absolute', left: 14, color: 'var(--tavil-faint)', pointerEvents: 'none', transition: THEME_TR }} />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="nom.cognom@tavil.net"
              required
              autoComplete="email"
              inputMode="email"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Password */}
        <div style={{ marginBottom: 8 }}>
          <span style={labelStyle}>{t('auth.password')}</span>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Lock size={16} style={{ position: 'absolute', left: 14, color: 'var(--tavil-faint)', pointerEvents: 'none', transition: THEME_TR }} />
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              style={{ ...inputStyle, padding: '0 44px' }}
            />
            <button
              type="button"
              onClick={() => setShowPass(v => !v)}
              aria-label={showPass ? 'Amaga contrasenya' : 'Mostra contrasenya'}
              style={{
                position: 'absolute', right: 14,
                color: 'var(--tavil-faint)',
                background: 'none', border: 'none',
                cursor: 'pointer', display: 'flex', padding: 0,
                transition: THEME_TR,
              }}
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Forgot + remember row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--tavil-muted)', cursor: 'pointer', transition: THEME_TR }}>
            <input
              type="checkbox"
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
              style={{ accentColor: 'var(--tavil-accent)', width: 15, height: 15 }}
            />
            {t('auth.rememberMe')}
          </label>
          <button
            type="button"
            onClick={onForgot}
            style={{
              background: 'none', border: 'none', color: 'var(--tavil-accent)',
              fontSize: 13, cursor: 'pointer', padding: 0, fontFamily: 'inherit',
            }}
          >
            {t('auth.forgotPassword')}
          </button>
        </div>

        {error && (
          <p style={{ fontSize: 13, color: 'var(--tavil-accent)', margin: '0 0 12px', textAlign: 'center' }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            height: 48,
            borderRadius: 12,
            border: 'none',
            background: 'var(--tavil-accent)',
            color: '#fff',
            fontSize: 15,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: `opacity 160ms, ${THEME_TR}`,
            fontFamily: 'inherit',
          }}
        >
          {loading ? t('common.loading') : t('auth.login')}
        </button>
      </form>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Register prompt — only if self-registration enabled */}
      {onRegister && (
        <div style={{ textAlign: 'center', fontSize: 13.5, color: 'var(--tavil-muted)', marginBottom: 12, transition: THEME_TR }}>
          {t('auth.noAccount')}{' '}
          <button
            onClick={onRegister}
            style={{
              background: 'none', border: 'none', color: 'var(--tavil-accent)',
              fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
              padding: 0, fontFamily: 'inherit',
            }}
          >
            {t('auth.createAccount')}
          </button>
        </div>
      )}

      {/* Footer */}
      <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--tavil-faint)', letterSpacing: '0.02em', transition: THEME_TR }}>
        TAVIL · v2026.4 · support@tavil.com
      </div>
    </div>
  );
}
