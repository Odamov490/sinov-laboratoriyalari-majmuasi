import React, { useState } from 'react';
import { Save, Star, Home, Rows3, ListOrdered } from 'lucide-react';
import { adminProfile } from '../../../services/adminApi';
import { apiErr } from './ProfileGeneral.jsx';
import { tr, trServer } from '../../../i18n/tr.js';

// Variantlar serverdan (profile.menuOptions) — faqat shu rolga ruxsat
// etilgan bo'limlar; server ham qayta tekshiradi.
export default function ProfileSettings({ profile, onChange, toast }) {
  const prefs = profile.preferences;
  const options = profile.menuOptions;
  const [landingPage, setLandingPage] = useState(prefs.landingPage || '');
  const [favorites, setFavorites] = useState(prefs.favorites);
  const [density, setDensity] = useState(prefs.density);
  const [pageSize, setPageSize] = useState(prefs.pageSize);
  const [saving, setSaving] = useState(false);

  const toggleFav = (key) =>
    setFavorites((f) => (f.includes(key) ? f.filter((k) => k !== key) : f.length >= 6 ? f : [...f, key]));

  const save = async () => {
    setSaving(true);
    try {
      const next = await adminProfile.update({ preferences: { landingPage: landingPage || null, favorites, density, pageSize } });
      onChange(next);
      toast(tr('Sozlamalar saqlandi.'), 'success');
    } catch (err) {
      toast(apiErr(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="card p-6">
        <label className="block text-sm">
          <span className="mb-1.5 flex items-center gap-2 font-semibold text-ink">
            <Home className="h-4 w-4 text-primary" /> {tr('Kirgandan keyin ochiladigan sahifa')}
          </span>
          <select value={landingPage} onChange={(e) => setLandingPage(e.target.value)} className="input-field sm:max-w-sm">
            <option value="">{tr('Dashboard (sukut)')}</option>
            {options
              .filter((o) => o.key !== 'dashboard')
              .map((o) => (
                <option key={o.key} value={o.key}>
                  {trServer(o.label)}
                </option>
              ))}
          </select>
        </label>
      </div>

      <div className="card p-6">
        <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-ink">
          <Star className="h-4 w-4 text-primary" /> {tr("Sevimli bo'limlar")}
        </p>
        <p className="mb-3 text-xs text-slate-500">{tr("Yon menyuning tepasida va Dashboard'da tezkor havola bo'lib chiqadi. Ko'pi bilan 6 ta (")}{favorites.length}/6).</p>
        <div className="flex flex-wrap gap-2">
          {options.map((o) => {
            const on = favorites.includes(o.key);
            const full = !on && favorites.length >= 6;
            return (
              <button
                key={o.key}
                type="button"
                disabled={full}
                onClick={() => toggleFav(o.key)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors disabled:opacity-40 ${
                  on ? 'border-primary bg-primary text-white' : 'border-border text-slate-600 hover:bg-bg-light'
                }`}
                aria-pressed={on}
              >
                <Star className={`h-3.5 w-3.5 ${on ? 'fill-current' : ''}`} /> {trServer(o.label)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="card grid gap-5 p-6 sm:grid-cols-2">
        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
            <Rows3 className="h-4 w-4 text-primary" /> {tr("Ko'rinish zichligi")}
          </p>
          <div className="inline-flex rounded-lg bg-bg-light p-1">
            {[
              ['normal', tr('Oddiy')],
              ['compact', tr('Ixcham')],
            ].map(([k, l]) => (
              <button key={k} type="button" onClick={() => setDensity(k)} className={`rounded-md px-4 py-1.5 text-sm font-medium ${density === k ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
            <ListOrdered className="h-4 w-4 text-primary" /> {tr('Jadvallarda sahifadagi qatorlar')}
          </p>
          <div className="inline-flex rounded-lg bg-bg-light p-1">
            {[15, 50, 100].map((n) => (
              <button key={n} type="button" onClick={() => setPageSize(n)} className={`rounded-md px-4 py-1.5 text-sm font-medium ${pageSize === n ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}>
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={save} disabled={saving} className="btn-primary !py-2">
          <Save className="h-4 w-4" /> {saving ? tr('Saqlanmoqda…') : tr('Saqlash')}
        </button>
      </div>
    </div>
  );
}
