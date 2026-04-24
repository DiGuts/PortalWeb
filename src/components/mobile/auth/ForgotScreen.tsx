import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Mail } from 'lucide-react';
import { LangSwitch } from './LangSwitch';

interface Props {
  onBack: () => void;
  isDarkMode: boolean;
}

export function ForgotScreen({ onBack, isDarkMode }: Props) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const canSubmit = email.includes('@');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    // In production wire to apiRequestPasswordReset(email)
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    setSent(true);
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
        padding: '10px 24px 32px',
        boxSizing: 'border-box',
      }}
    >
      {/* Top: back + lang */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
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

      {/* State A — entry form */}
      {!sent && (
        <>
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 10.5, color: '#bf211e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 12 }}>
              RECUPERACIÓ
            </div>
            <h1 style={{
              fontFamily: '"Instrument Serif", "Times New Roman", serif',
              fontSize: 32, fontWeight: 400, lineHeight: 1.06, margin: '0 0 10px',
              letterSpacing: '-0.02em', color: 'var(--tavil-text)',
            }}>
              {t('auth.forgotTitle')}
            </h1>
            <p style={{ fontSize: 14, color: 'var(--tavil-muted)', margin: 0, lineHeight: 1.45 }}>
              {t('auth.forgotSubtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div style={{ marginBottom: 24 }}>
              <span style={{ fontSize: 12.5, color: 'var(--tavil-muted)', marginBottom: 6, fontWeight: 500, display: 'block' }}>
                {t('auth.email')}
              </span>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Mail size={16} style={{ position: 'absolute', left: 14, color: 'var(--tavil-faint)', pointerEvents: 'none' }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="nom.cognom@tavil.net"
                  autoComplete="email"
                  inputMode="email"
                  style={{
                    width: '100%', height: 48,
                    padding: '0 14px 0 44px',
                    background: 'var(--tavil-card)',
                    color: 'var(--tavil-text)',
                    border: '1px solid var(--tavil-border)',
                    borderRadius: 12, fontSize: 15,
                    outline: 'none', boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !canSubmit}
              style={{
                height: 48, borderRadius: 12, border: 'none',
                background: '#bf211e', color: '#fff',
                fontSize: 15, fontWeight: 600,
                cursor: (loading || !canSubmit) ? 'not-allowed' : 'pointer',
                opacity: (loading || !canSubmit) ? 0.6 : 1,
                transition: 'opacity 160ms',
                fontFamily: 'inherit',
              }}
            >
              {loading ? t('common.loading') : t('auth.forgotBtn')}
            </button>
          </form>
        </>
      )}

      {/* State B — sent confirmation */}
      {sent && (
        <>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 20 }}>
            {/* Icon badge */}
            <div style={{
              width: 72, height: 72, borderRadius: 36,
              background: '#fbe4e3',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Mail size={28} style={{ color: '#bf211e' }} />
            </div>

            <div>
              <h1 style={{
                fontFamily: '"Instrument Serif", "Times New Roman", serif',
                fontSize: 28, fontWeight: 400, lineHeight: 1.1, margin: '0 0 12px',
                letterSpacing: '-0.02em', color: 'var(--tavil-text)',
              }}>
                {t('auth.forgotSentTitle')}
              </h1>
              <p style={{ fontSize: 14, color: 'var(--tavil-muted)', margin: 0, lineHeight: 1.5, maxWidth: 260 }}>
                {t('auth.forgotSentBody', { email })}
              </p>
            </div>
          </div>

          <button
            onClick={onBack}
            style={{
              height: 48, borderRadius: 12, border: 'none',
              background: '#bf211e', color: '#fff',
              fontSize: 15, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {t('auth.backToLogin')}
          </button>
        </>
      )}
    </div>
  );
}
