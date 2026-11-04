import React from 'react';
import { Globe } from 'lucide-react';
import { ADMIN_LANGS, currentLang, changeAdminLanguage, tr } from '../../i18n/tr.js';

// Admin panel tili (uz/ru/en). Tanlov ommaviy sayt bilan umumiy (slm_lang);
// o'zgartirilganda sahifa qayta yuklanadi — qarang: i18n/tr.js.
export default function LanguageSwitcher({ className = '' }) {
  const lang = currentLang();
  return (
    <label className={`relative inline-flex items-center ${className}`.trim()}>
      <span className="sr-only">{tr('Til')}</span>
      <Globe className="pointer-events-none absolute left-2 h-4 w-4 text-slate-400" aria-hidden="true" />
      <select
        value={lang}
        onChange={(e) => changeAdminLanguage(e.target.value)}
        className="cursor-pointer appearance-none rounded-lg border border-border bg-white py-1.5 pl-7 pr-2 text-xs font-semibold text-slate-600 hover:border-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        title={tr('Til')}
      >
        {ADMIN_LANGS.map((l) => (
          <option key={l.code} value={l.code}>
            {l.short} — {l.label}
          </option>
        ))}
      </select>
    </label>
  );
}
