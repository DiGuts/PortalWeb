import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ca from './locales/ca.json';
import es from './locales/es.json';
import en from './locales/en.json';

const savedLang = localStorage.getItem('tavil_lang') ?? 'ca';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ca: { translation: ca },
      es: { translation: es },
      en: { translation: en },
    },
    lng: savedLang,
    fallbackLng: 'ca',
    interpolation: { escapeValue: false },
  });

i18n.on('languageChanged', (lng) => {
  try { localStorage.setItem('tavil_lang', lng); } catch {}
});

export default i18n;
