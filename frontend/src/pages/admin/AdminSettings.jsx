import React, { useEffect, useState } from 'react';
import { getSettings } from '../../services/publicApi';
import { updateSettings } from '../../services/adminApi';
import { Loading } from '../../components/StateViews.jsx';
import { useToast } from '../../context/ToastContext.jsx';

const FIELDS = [
  { key: 'org_name', label: 'Tashkilot nomi' },
  { key: 'phone', label: 'Telefon' },
  { key: 'email', label: 'Email' },
  { key: 'address', label: 'Manzil' },
  { key: 'working_hours', label: 'Ish vaqti' },
  { key: 'telegram', label: 'Telegram havolasi' },
  { key: 'instagram', label: 'Instagram havolasi' },
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
      showToast('Sozlamalar saqlandi.', 'success');
    } catch {
      showToast('Xatolik yuz berdi.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!values) return <Loading />;

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-ink mb-6">Sozlamalar</h1>
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
          {saving ? 'Saqlanmoqda...' : 'Saqlash'}
        </button>
      </div>
    </div>
  );
}
