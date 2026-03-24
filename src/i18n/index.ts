import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import en from './locales/en.json';
import es from './locales/es.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import zh from './locales/zh.json';

const SUPPORTED_LANGUAGES = ['ja', 'en', 'zh', 'ko', 'es'] as const;

function detectLanguage(): string {
  try {
    const locales = Localization.getLocales();
    if (locales && locales.length > 0) {
      const code = locales[0].languageCode ?? '';
      if ((SUPPORTED_LANGUAGES as readonly string[]).includes(code)) {
        return code;
      }
    }
  } catch {
    // expo-localization が使えない場合は Intl で fallback
    try {
      const locale = Intl.DateTimeFormat().resolvedOptions().locale;
      const code = locale.split('-')[0];
      if ((SUPPORTED_LANGUAGES as readonly string[]).includes(code)) {
        return code;
      }
    } catch {
      // ignore
    }
  }
  return 'ja';
}

i18n.use(initReactI18next).init({
  resources: {
    ja: { translation: ja },
    en: { translation: en },
    zh: { translation: zh },
    ko: { translation: ko },
    es: { translation: es },
  },
  lng: detectLanguage(),
  fallbackLng: 'ja',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
