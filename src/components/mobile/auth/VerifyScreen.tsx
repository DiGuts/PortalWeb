import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import { apiVerifyEmail, apiResendVerification, AuthOut } from '../../../api';
import { LangSwitch } from './LangSwitch';

const CODE_LEN = 8;

interface Props {
  email: string;
  onBack: () => void;
  onVerified: (data: AuthOut) => void;
  isDarkMode: boolean;
}

export function VerifyScreen({ email, onBack, onVerified, isDarkMode }: Props) {
  const { t } = useTranslation();
  const [slots, setSlots] = useState<string[]>(Array(CODE_LEN).fill(''));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const slotRefs = useRef<(HTMLInputElement | null)[]>([]);

  const complete = slots.every(s => s !== '');
  const code = slots.join('');

  const setSlot = (i: number, v: string) => {
    const char = v.toUpperCase().replace(/[^0-9A-F]/g, '').slice(-1);
    const next = [...slots];
    next[i] = char;
    setSlots(next);
    if (char && i < CODE_LEN - 1) slotRefs.current[i + 1]?.focus();
  };

  const onKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !slots[i] && i > 0) {
      const next = [...slots]; next[i - 1] = ''; setSlots(next);
      slotRefs.current[i - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && i > 0) slotRefs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < CODE_LEN - 1) slotRefs.current[i + 1]?.focus();
  };

  const onPaste = (e: React.ClipboardEvent) => {
    const txt = (e.clipboardData?.getData('text') || '').toUpperCase().replace(/[^0-9A-F]/g, '').slice(0, CODE_LEN);
    if (!txt) return;
    e.preventDefault();
    const next = Array(CODE_LEN).fill('');
    for (let i = 0; i < txt.length; i++) next[i] = txt[i];
    setSlots(next);
    slotRefs.current[Math.min(txt.length, CODE_LEN - 1)]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complete) return;
    setError('');
    setLoading(true);
    try {
      const data = await apiVerifyEmail(email, code);
      onVerified(data);
    } catch (err: any) {
      setError(err.message ?? 'Codi invàlid o caducat.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResent(false);
    try {
      await apiResendVerification(email);
      setResent(true);
    } catch {}
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

      {/* Step indicator — both filled */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
        <div style={{ flex: 1, height: 3, borderRadius: 2, background: '#bf211e' }} />
        <div style={{ flex: 1, height: 3, borderRadius: 2, background: '#bf211e' }} />
      </div>

      {/* Heading */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10.5, color: '#bf211e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10 }}>
          PAS 2 DE 2
        </div>
        <h1 style={{
          fontFamily: '"Instrument Serif", "Times New Roman", serif',
          fontSize: 34, fontWeight: 400, lineHeight: 1.04, margin: '0 0 10px',
          letterSpacing: '-0.02em', color: 'var(--tavil-text)',
        }}>
          {t('auth.verify')}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--tavil-muted)', margin: 0, lineHeight: 1.45 }}>
          {t('auth.verifySub')}{' '}
          <span style={{ color: 'var(--tavil-text)', fontWeight: 500 }}>{email || 'nom.cognom@tavil.net'}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Code label */}
        <div style={{ fontSize: 13, color: 'var(--tavil-muted)', marginBottom: 10, fontWeight: 500 }}>
          {t('auth.codeLabel')}
        </div>

        {/* 8 slots */}
        <div
          role="group"
          aria-label={t('auth.codeLabel')}
          style={{ display: 'flex', gap: 4, justifyContent: 'space-between', marginBottom: 8 }}
          onPaste={onPaste}
        >
          {slots.map((c, i) => (
            <input
              key={i}
              ref={el => { slotRefs.current[i] = el; }}
              value={c}
              onChange={e => setSlot(i, e.target.value)}
              onKeyDown={e => onKeyDown(i, e)}
              maxLength={1}
              inputMode="text"
              autoCapitalize="characters"
              aria-label={`Caràcter ${i + 1} de 8`}
              style={{
                flex: '1 1 0',
                minWidth: 0,
                height: 50,
                textAlign: 'center',
                fontFamily: '"JetBrains Mono", "Courier New", monospace',
                fontSize: 18,
                fontWeight: 500,
                color: 'var(--tavil-text)',
                background: 'var(--tavil-card)',
                border: `1px solid ${c ? '#bf211e' : 'var(--tavil-border)'}`,
                borderRadius: 10,
                outline: 'none',
                padding: 0,
                transition: 'border-color 160ms, box-shadow 160ms',
                textTransform: 'uppercase',
                boxShadow: c ? '0 0 0 3px rgba(191,33,30,0.12)' : 'none',
              }}
            />
          ))}
        </div>

        {/* Format hint */}
        <div style={{
          fontSize: 11.5, color: 'var(--tavil-faint)', marginBottom: 20,
          fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.04em',
        }}>
          Format: 8 car. hex · ex. E2A76B29
        </div>

        {/* Resend */}
        <div style={{ fontSize: 13, color: 'var(--tavil-muted)', marginBottom: 24 }}>
          No l'has rebut?{' '}
          <button
            type="button"
            onClick={handleResend}
            style={{ background: 'none', border: 'none', color: '#bf211e', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
          >
            {t('auth.resend')}
          </button>
          {resent && <span style={{ display: 'block', fontSize: 11.5, color: '#3f7a52', marginTop: 4 }}>{t('auth.resentConfirm')}</span>}
        </div>

        {error && <p style={{ fontSize: 13, color: '#bf211e', margin: '0 0 12px', textAlign: 'center' }}>{error}</p>}

        <div style={{ flex: 1 }} />

        <button
          type="submit"
          disabled={loading || !complete}
          style={{
            width: '100%', height: 50, borderRadius: 14, border: 'none',
            background: '#bf211e', color: '#fff',
            fontSize: 15, fontWeight: 600,
            cursor: (loading || !complete) ? 'not-allowed' : 'pointer',
            opacity: (loading || !complete) ? 0.6 : 1,
            transition: 'opacity 160ms',
            fontFamily: 'inherit',
          }}
        >
          {loading ? t('common.loading') : t('auth.login')}
        </button>
      </form>
    </div>
  );
}
