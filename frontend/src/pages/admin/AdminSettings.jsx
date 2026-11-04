import React, { useEffect, useState } from 'react';
import { getSettings } from '../../services/publicApi';
import { updateSettings } from '../../services/adminApi';
import { Loading } from '../../components/StateViews.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { tr } from '../../i18n/tr.js';

const FIELDS = [
  { key: 'org_name', label: tr('Tashkilot nomi') },
  { key: 'phone', label: tr('Telefon') },
  { key: 'email', label: 'Email' },
  { key: 'address', label: tr('Manzil') },
  { key: 'working_hours', label: tr('Ish vaqti') },
  { key: 'telegram', label: tr('Telegram havolasi') },
  { key: 'instagram', label: tr('Instagram havolasi') },
];

export default function AdminSettings() {
  const { showToast } = useToast();
  const [values, setValues] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettings().then(setValues).catch(() => setValues({}));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await updateSettings(values);
      showToast(tr('Sozlamalar saqlandi.'), 'success');
    } catch {
      showToast(tr('Xatolik yuz berdi.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!values) return <Loading />;

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-ink mb-6">{tr('Sozlamalar')}</h1>
      <div className="card p-6 space-y-4">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className="block text-sm font-medium text-ink mb-1.5">{f.label}</label>
            <input
              value={values[f.key] || ''}
              onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
              className="input-field"
            />
          </div>
        ))}
        <button onClick={save} disabled={saving} className="btn-primary w-full">
          {saving ? tr('Saqlanmoqda...') : tr('Saqlash')}
        </button>
      </div>
    </div>
  );
}
