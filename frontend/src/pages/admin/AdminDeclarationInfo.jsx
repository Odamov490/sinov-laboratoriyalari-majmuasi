import React, { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { adminInfoPage, uploadFiles } from '../../services/adminApi';
import { Loading } from '../../components/StateViews.jsx';
import { useToast } from '../../context/ToastContext.jsx';

const SLUG = 'deklaratsiya-va-sertifikat';

const LANGS = [
  { code: 'Uz', label: "O'zbekcha" },
  { code: 'Ru', label: 'Русский' },
  { code: 'En', label: 'English' },
];

const RESOLUTION_DOCS = [
  { field: 'document502Url', label: 'Qaror №502 (PDF)' },
  { field: 'document43Url', label: 'Qaror №43 (PDF)' },
];

export default function AdminDeclarationInfo() {
  const { showToast } = useToast();
  const [values, setValues] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState(null);

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

  const handleFileChange = async (field, fileList) => {
    if (!fileList?.length) return;
    setUploadingField(field);
    try {
      const res = await uploadFiles(fileList);
      setValues((v) => ({ ...v, [field]: res.files[0].url }));
      showToast('Fayl yuklandi. Saqlashni unutmang.', 'success');
    } catch {
      showToast('Fayl yuklashda xatolik.', 'error');
    } finally {
      setUploadingField(null);
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

        <div className="card p-6 space-y-4">
          <p className="text-sm font-semibold text-primary">Rasmiy hujjatlar (502 va 43-son qarorlar)</p>
          {RESOLUTION_DOCS.map((doc) => (
            <div key={doc.field}>
              <label className="block text-sm font-medium text-ink mb-1.5">{doc.label}</label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileChange(doc.field, e.target.files)}
                  className="text-sm"
                />
                {uploadingField === doc.field && (
                  <span className="text-xs text-primary">Yuklanmoqda...</span>
                )}
              </div>
              {values[doc.field] && uploadingField !== doc.field && (
                <a
                  href={values[doc.field]}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <FileText className="h-3.5 w-3.5" /> Joriy fayl: {values[doc.field].split('/').pop()}
                </a>
              )}
            </div>
          ))}
        </div>

        <button onClick={save} disabled={saving || !!uploadingField} className="btn-primary w-full">
          {uploadingField ? 'Fayl yuklanmoqda...' : saving ? 'Saqlanmoqda...' : 'Saqlash'}
        </button>
      </div>
    </div>
  );
}
