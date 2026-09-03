import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Upload, FileText, User } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { adminSamples, uploadFiles, adminResource } from '../../services/adminApi';
import { Loading, ErrorState } from '../../components/StateViews.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDate } from '../../utils/localize';
import SampleStatusBadge from '../../components/samples/SampleStatusBadge.jsx';
import SampleActionPanel from '../../components/samples/SampleActionPanel.jsx';
import { ACTION_LABELS } from '../../components/samples/sampleConstants';

export default function AdminSampleDetail() {
  const { id } = useParams();
  const { showToast } = useToast();
  const [sample, setSample] = useState(null);
  const [error, setError] = useState(false);
  const [labs, setLabs] = useState([]);
  const [actionBusy, setActionBusy] = useState(false);
  const [flash, setFlash] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingReport, setUploadingReport] = useState(false);

  const load = () => {
    setError(false);
    adminSamples.get(id).then(setSample).catch(() => setError(true));
  };

  useEffect(load, [id]);
  useEffect(() => {
    adminResource('laboratories')
      .list({ pageSize: 200 })
      .then((d) => setLabs(d.items))
      .catch(() => setLabs([]));
  }, []);

  const doAction = async (action, { toLabId, notes }) => {
    setActionBusy(true);
    try {
      await adminSamples.action(id, { action, toLabId, notes });
      showToast('Amal bajarildi.', 'success');
      setFlash(true);
      setTimeout(() => setFlash(false), 1600);
      load();
    } catch (err) {
      showToast(err?.response?.data?.error || 'Xatolik yuz berdi.', 'error');
    } finally {
      setActionBusy(false);
    }
  };

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
    <div className="max-w-3xl">
      <Link to="/admin/namunalar" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary mb-4">
        <ArrowLeft className="h-4 w-4" /> Namunalar ro'yxatiga qaytish
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <p className="font-mono text-primary font-bold text-lg">{sample.code}</p>
          <h1 className="text-2xl font-bold text-ink">{sample.productName}</h1>
        </div>
        <div className="card p-3">
          <QRCodeSVG value={sample.code} size={80} />
        </div>
      </div>

      <div className={`card p-5 mb-6 transition-colors ${flash ? 'flash-success' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-ink">Joriy holat</h2>
          <SampleStatusBadge status={sample.status} />
        </div>
        <SampleActionPanel sample={sample} labs={labs} onAction={doAction} busy={actionBusy} />
      </div>

      <div className="card p-5 mb-6">
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

      <div className="card p-5 mb-6">
        <h2 className="font-semibold text-ink mb-4">Harakat tarixi</h2>
        {sample.movements.length === 0 ? (
          <p className="text-sm text-slate-400">Hali harakat qayd etilmagan.</p>
        ) : (
          <div>
            {sample.movements.map((m, idx) => (
              <div
                key={m.id}
                className={`relative pl-6 ml-1.5 ${
                  idx === sample.movements.length - 1 ? 'border-transparent' : 'border-l border-border'
                } pb-5 last:pb-0`}
              >
                <span className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-white" />
                <p className="text-xs text-slate-400">{formatDate(m.createdAt)}</p>
                <p className="text-sm font-semibold text-ink">{ACTION_LABELS[m.action] || m.action}</p>
                <p className="text-xs text-slate-500">
                  {m.fromLab?.nameUz || '—'} → {m.toLab?.nameUz || '—'} · {m.performedByName || '—'}
                </p>
                {m.notes && <p className="text-xs text-slate-500 mt-0.5 italic">"{m.notes}"</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {sample.application && (
        <div className="card p-5 mb-6">
          <h2 className="font-semibold text-ink mb-3 flex items-center gap-2">
            <User className="h-4 w-4 text-primary" /> Bog'langan ariza
          </h2>
          <p className="text-sm text-ink font-medium">{sample.application.fullName}</p>
          <p className="text-sm text-slate-500">{sample.application.phone}</p>
          {sample.application.service && (
            <p className="text-sm text-slate-500 mt-1">Xizmat: {sample.application.service.nameUz}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
  );
}
