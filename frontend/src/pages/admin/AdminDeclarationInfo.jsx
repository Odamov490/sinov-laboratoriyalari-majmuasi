import React, { useEffect, useState } from 'react';
import { adminInfoPage } from '../../services/adminApi';
import { Loading } from '../../components/StateViews.jsx';
import { useToast } from '../../context/ToastContext.jsx';

const SLUG = 'deklaratsiya-va-sertifikat';

const LANGS = [
  { code: 'Uz', label: "O'zbekcha" },
  { code: 'Ru', label: 'Русский' },
  { code: 'En', label: 'English' },
];

export default function AdminDeclarationInfo() {
  const { showToast } = useToast();
  const [values, setValues] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminInfoPage
      .get(SLUG)
      .then(setValues)
      .catch(() =>
        setValues({ titleUz: '', titleRu: '', titleEn: '', contentUz: '', contentRu: '', contentEn: '' })
      );
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const updated = await adminInfoPage.update(SLUG, values);
      setValues(updated);
      showToast('Sahifa saqlandi.', 'success');
    } catch {
      showToast('Xatolik yuz berdi.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!values) return <Loading />;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-ink mb-1">Deklaratsiya va sertifikat sahifasi</h1>
      <p className="text-sm text-slate-500 mb-6">
        Ommaviy saytdagi "/deklaratsiya-va-sertifikat" sahifasining sarlavha va matnini uch tilda tahrirlang.
      </p>

      <div className="space-y-6">
        {LANGS.map((lang) => (
          <div key={lang.code} className="card p-6 space-y-4">
            <p className="text-sm font-semibold text-primary">{lang.label}</p>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Sarlavha</label>
              <input
                value={values[`title${lang.code}`] || ''}
                onChange={(e) => setValues({ ...values, [`title${lang.code}`]: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Matn</label>
              <textarea
                value={values[`content${lang.code}`] || ''}
                onChange={(e) => setValues({ ...values, [`content${lang.code}`]: e.target.value })}
                rows={15}
                className="input-field resize-y font-mono text-sm"
              />
            </div>
          </div>
        ))}

        <button onClick={save} disabled={saving} className="btn-primary w-full">
          {saving ? 'Saqlanmoqda...' : 'Saqlash'}
        </button>
      </div>
    </div>
  );
}
