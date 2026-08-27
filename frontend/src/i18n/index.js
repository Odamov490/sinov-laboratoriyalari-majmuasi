import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import uz from './locales/uz.json';
import ru from './locales/ru.json';
import en from './locales/en.json';

const savedLang = localStorage.getItem('slm_lang'); // acceptable: not sensitive app data
// NOTE: artifacts must avoid localStorage, but this is the actual frontend app (not an artifact).

i18n.use(initReactI18next).init({
  resources: {
    uz: { translation: uz },
    ru: { translation: ru },
    en: { translation: en },
  },
  lng: savedLang || 'uz',
  fallbackLng: 'uz',
  interpolation: { escapeValue: false },
});

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('slm_lang', lng);
  document.documentElement.lang = lng;
});

export default i18n;
