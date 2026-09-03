import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Upload, FileText, User } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { adminSamples, uploadFiles } from '../../services/adminApi';
import { Loading, ErrorState } from '../../components/StateViews.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDate } from '../../utils/localize';

const STATUS_LABELS = {
  LABORATORIYADA: 'Laboratoriyada',
  TASHILMOQDA: 'Tashilmoqda',
  YAKUNLANDI: 'Yakunlandi',
};

const ACTION_LABELS = {
  REGISTRATSIYA: "Ro'yxatga olindi",
  CHIQARISH: 'Chiqarildi',
  QABUL_QILISH: 'Qabul qilindi',
  YAKUNLASH: 'Yakunlandi',
};

export default function AdminSampleDetail() {
  const { id } = useParams();
  const { showToast } = useToast();
  const [sample, setSample] = useState(null);
  const [error, setError] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingReport, setUploadingReport] = useState(false);

  const load = () => {
    setError(false);
    adminSamples.get(id).then(setSample).catch(() => setError(true));
  };

  useEffect(load, [id]);

  const handleAttach = async (field, fileList, setUploading) => {
    if (!fileList?.length) return;
    setUploading(true);
    try {
      const res = await uploadFiles(fileList);
      await adminSamples.attach(id, { field, url: res.files[0].url });
      showToast('Fayl biriktirildi.', 'success');
      load();
    } catch {
      showToast('Xatolik yuz berdi.', 'error');
    } finally {
      setUploading(false);
    }
  };

  if (error) return <ErrorState onRetry={load} />;
  if (!sample) return <Loading />;

  return (
    <div>
      <Link to="/admin/namunalar" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary mb-4">
        <ArrowLeft className="h-4 w-4" /> Namunalar ro'yxatiga qaytish
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <p className="font-mono text-primary font-bold text-lg">{sample.code}</p>
          <h1 className="text-2xl font-bold text-ink">{sample.productName}</h1>
          <p className="text-sm text-slate-500 mt-1">
            Holat: <span className="font-semibold text-ink">{STATUS_LABELS[sample.status]}</span>
          </p>
        </div>
        <div className="card p-3">
          <QRCodeSVG value={sample.code} size={80} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-5">
            <h2 className="font-semibold text-ink mb-3">Umumiy ma'lumot</h2>
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-slate-500">Kelib chiqishi</dt>
              <dd className="text-ink font-medium">{sample.originLab?.nameUz}</dd>
              <dt className="text-slate-500">Hozirgi joyi</dt>
              <dd className="text-ink font-medium">{sample.currentLab?.nameUz || '—'}</dd>
              <dt className="text-slate-500">Kutilayotgan muddat</dt>
              <dd className="text-ink font-medium">{sample.dueDate ? formatDate(sample.dueDate) : '—'}</dd>
              <dt className="text-slate-500">Ro'yxatga olingan sana</dt>
              <dd className="text-ink font-medium">{formatDate(sample.createdAt)}</dd>
              {sample.description && (
                <>
                  <dt className="text-slate-500">Izoh</dt>
                  <dd className="text-ink font-medium">{sample.description}</dd>
                </>
              )}
            </dl>
          </div>

          <div className="card p-5">
            <h2 className="font-semibold text-ink mb-3">Harakat tarixi</h2>
            {sample.movements.length === 0 ? (
              <p className="text-sm text-slate-400">Hali harakat qayd etilmagan.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-border">
                      <th className="py-2 pr-4">Sana</th>
                      <th className="py-2 pr-4">Amal</th>
                      <th className="py-2 pr-4">Kimdan</th>
                      <th className="py-2 pr-4">Kimga</th>
                      <th className="py-2 pr-4">Bajardi</th>
                      <th className="py-2">Izoh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sample.movements.map((m) => (
                      <tr key={m.id}>
                        <td className="py-2 pr-4 text-slate-500 whitespace-nowrap">{formatDate(m.createdAt)}</td>
                        <td className="py-2 pr-4 font-medium text-ink">{ACTION_LABELS[m.action]}</td>
                        <td className="py-2 pr-4 text-slate-600">{m.fromLab?.nameUz || '—'}</td>
                        <td className="py-2 pr-4 text-slate-600">{m.toLab?.nameUz || '—'}</td>
                        <td className="py-2 pr-4 text-slate-600">{m.performedByName || '—'}</td>
                        <td className="py-2 text-slate-500">{m.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {sample.application && (
            <div className="card p-5">
              <h2 className="font-semibold text-ink mb-3 flex items-center gap-2">
                <User className="h-4 w-4 text-primary" /> Bog'langan ariza
              </h2>
              <p className="text-sm text-ink font-medium">{sample.application.fullName}</p>
              <p className="text-sm text-slate-500">{sample.application.phone}</p>
              {sample.application.service && (
                <p className="text-sm text-slate-500 mt-1">
                  Xizmat: {sample.application.service.nameUz}
                </p>
              )}
            </div>
          )}

          <div className="card p-5">
            <h2 className="font-semibold text-ink mb-3">Namuna rasmi</h2>
            {sample.photoUrl && (
              <img src={sample.photoUrl} alt="" className="w-full rounded-lg border border-border mb-3" />
            )}
            <label className="btn-secondary w-full cursor-pointer justify-center">
              <Upload className="h-4 w-4" />
              {uploadingPhoto ? 'Yuklanmoqda...' : sample.photoUrl ? 'Rasmni almashtirish' : 'Rasm yuklash'}
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(e) => handleAttach('photoUrl', e.target.files, setUploadingPhoto)}
              />
            </label>
          </div>

          <div className="card p-5">
            <h2 className="font-semibold text-ink mb-3">Yakuniy hujjat / protokol</h2>
            {sample.reportUrl && (
              <a
                href={sample.reportUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline mb-3"
              >
                <FileText className="h-4 w-4" /> Hujjatni ko'rish
              </a>
            )}
            <label className="btn-secondary w-full cursor-pointer justify-center">
              <Upload className="h-4 w-4" />
              {uploadingReport ? 'Yuklanmoqda...' : sample.reportUrl ? 'Hujjatni almashtirish' : 'Hujjat yuklash'}
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => handleAttach('reportUrl', e.target.files, setUploadingReport)}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}