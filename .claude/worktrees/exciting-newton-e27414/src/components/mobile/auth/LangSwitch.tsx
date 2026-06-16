import React from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../../../i18n';

export function LangSwitch() {
  const { i18n: hook } = useTranslation();
  const active = hook.language.slice(0, 2) as 'ca' | 'es' | 'en';

  const setLang = (l: 'ca' | 'es' | 'en') => {
    i18n.changeLanguage(l);
    localStorage.setItem('tavil_lang', l);
  };

  return (
    <div style={{
      display: 'inline-flex',
      background: 'var(--tavil-card)',
      border: '1px solid var(--tavil-border)',
      borderRadius: 999,
      padding: 3,
    }}>
      {(['ca', 'es', 'en'] as const).map(l => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-label={l.toUpperCase()}
          style={{
            padding: '5px 10px',
            fontSize: 11,
            fontWeight: 600,
            background: active === l ? 'var(--tavil-text)' : 'transparent',
            color: active === l ? 'var(--tavil-bg)' : 'var(--tavil-muted)',
            border: 'none',
            borderRadius: 999,
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontFamily: 'inherit',
            transition: 'all 200ms',
          }}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
