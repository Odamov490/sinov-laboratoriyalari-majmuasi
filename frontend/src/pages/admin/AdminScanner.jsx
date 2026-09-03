import React, { useEffect, useRef, useState } from 'react';
import { ArrowRightLeft, PackageCheck, PackageX, CheckCircle2 } from 'lucide-react';
import { adminSamples, adminResource } from '../../services/adminApi';
import { Select } from '../../components/UI.jsx';
import { useToast } from '../../context/ToastContext.jsx';

const STATUS_LABELS = {
  LABORATORIYADA: 'Laboratoriyada',
  TASHILMOQDA: 'Tashilmoqda',
  YAKUNLANDI: 'Yakunlandi',
};

export default function AdminScanner() {
  const { showToast } = useToast();
  const [sample, setSample] = useState(null);
  const [labs, setLabs] = useState([]);
  const [destLabId, setDestLabId] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [scannerActive, setScannerActive] = useState(true);
  const scannerRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    adminResource('laboratories')
      .list({ pageSize: 200 })
      .then((d) => setLabs(d.items))
      .catch(() => setLabs([]));
  }, []);

  useEffect(() => {
    if (!scannerActive) return undefined;

    let cancelled = false;
    import('html5-qrcode').then(({ Html5QrcodeScanner }) => {
      if (cancelled || !scannerRef.current) return;
      const scanner = new Html5QrcodeScanner('qr-reader', { fps: 10, qrbox: 240 }, false);
      instanceRef.current = scanner;
      scanner.render(
        (decodedText) => {
          scanner.pause();
          setScannerActive(false);
          lookupSample(decodedText.trim());
        },
        () => {}
      );
    });

    return () => {
      cancelled = true;
      if (instanceRef.current) {
        instanceRef.current.clear().catch(() => {});
        instanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scannerActive]);

  const lookupSample = async (code) => {
    try {
      const found = await adminSamples.getByCode(code);
      setSample(found);
      setDestLabId('');
      setNotes('');
    } catch {
      showToast('Namuna topilmadi. Kodni qayta tekshiring.', 'error');
      setScannerActive(true);
    }
  };

  const reset = () => {
    setSample(null);
    setDestLabId('');
    setNotes('');
    setScannerActive(true);
  };

  const doAction = async (action) => {
    if ((action === 'CHIQARISH' || action === 'QABUL_QILISH') && !destLabId) {
      showToast('Laboratoriyani tanlang.', 'error');
      return;
    }
    setBusy(true);
    try {
      const updated = await adminSamples.action(sample.id, { action, toLabId: destLabId || undefined, notes });
      showToast('Amal bajarildi.', 'success');
      setSample(updated);
    } catch (err) {
      showToast(err?.response?.data?.error || 'Xatolik yuz berdi.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-2">Namunani skanerlash</h1>
      <p className="text-sm text-slate-500 mb-6">
        QR kodni kamera oldida ushlab turing. Aniqlangach, namuna holatiga mos amallar ko'rsatiladi.
      </p>

      {!sample ? (
        <div className="card p-4 max-w-md">
          <div id="qr-reader" ref={scannerRef} />
        </div>
      ) : (
        <div className="card p-6 max-w-lg">
          <p className="font-mono text-primary font-bold">{sample.code}</p>
          <h2 className="text-lg font-bold text-ink mt-1">{sample.productName}</h2>
          <p className="text-sm text-slate-500 mt-1">
            Holat: <span className="font-semibold text-ink">{STATUS_LABELS[sample.status]}</span>
          </p>
          <p className="text-sm text-slate-500">
            Hozirgi joyi: <span className="font-medium text-ink">{sample.currentLab?.nameUz || '—'}</span>
          </p>
          <p className="text-sm text-slate-500">
            Kelib chiqishi: <span className="font-medium text-ink">{sample.originLab?.nameUz}</span>
          </p>

          <div className="mt-6 space-y-4">
            {sample.status === 'LABORATORIYADA' && (
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Qaysi laboratoriyaga jo'natilmoqda?</label>
                <Select
                  value={destLabId}
                  onChange={setDestLabId}
                  placeholder="Laboratoriyani tanlang"
                  options={labs.filter((l) => l.id !== sample.currentLabId).map((l) => ({ value: l.id, label: l.nameUz }))}
                />
              </div>
            )}
            {sample.status === 'TASHILMOQDA' && (
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Qaysi laboratoriya qabul qilmoqda?</label>
                <Select
                  value={destLabId}
                  onChange={setDestLabId}
                  placeholder="Laboratoriyani tanlang"
                  options={labs.map((l) => ({ value: l.id, label: l.nameUz }))}
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Izoh (ixtiyoriy)</label>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} className="input-field" />
            </div>

            <div className="flex flex-wrap gap-3">
              {sample.status === 'LABORATORIYADA' && (
                <>
                  <button onClick={() => doAction('CHIQARISH')} disabled={busy} className="btn-primary">
                    <ArrowRightLeft className="h-4 w-4" /> Chiqarish
                  </button>
                  <button onClick={() => doAction('YAKUNLASH')} disabled={busy} className="btn-secondary">
                    <CheckCircle2 className="h-4 w-4" /> Yakunlash
                  </button>
                </>
              )}
              {sample.status === 'TASHILMOQDA' && (
                <button onClick={() => doAction('QABUL_QILISH')} disabled={busy} className="btn-primary">
                  <PackageCheck className="h-4 w-4" /> Qabul qilish
                </button>
              )}
              {sample.status === 'YAKUNLANDI' && (
                <p className="text-sm text-emerald-600 font-medium flex items-center gap-2">
                  <PackageX className="h-4 w-4" /> Ushbu namuna bo'yicha ish yakunlangan.
                </p>
              )}
            </div>

            <button onClick={reset} className="text-sm text-slate-500 hover:text-primary mt-2">
              ← Boshqa namunani skanerlash
            </button>
          </div>
        </div>
      )}
    </div>
  );
}