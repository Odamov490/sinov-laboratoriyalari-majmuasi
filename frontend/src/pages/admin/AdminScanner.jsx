import React, { useEffect, useRef, useState } from 'react';
import { Search, Camera } from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminSamples, adminResource } from '../../services/adminApi';
import { useToast } from '../../context/ToastContext.jsx';
import SampleStatusBadge from '../../components/samples/SampleStatusBadge.jsx';
import SampleActionPanel from '../../components/samples/SampleActionPanel.jsx';

export default function AdminScanner() {
  const { showToast } = useToast();
  const [sample, setSample] = useState(null);
  const [labs, setLabs] = useState([]);
  const [busy, setBusy] = useState(false);

  const [manualCode, setManualCode] = useState('');
  const [lookupBusy, setLookupBusy] = useState(false);

  const [cameraOpen, setCameraOpen] = useState(false);
  const scannerRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    adminResource('laboratories')
      .list({ pageSize: 200 })
      .then((d) => setLabs(d.items))
      .catch(() => setLabs([]));
  }, []);

  useEffect(() => {
    if (!cameraOpen) return undefined;

    let cancelled = false;
    import('html5-qrcode').then(({ Html5QrcodeScanner }) => {
      if (cancelled || !scannerRef.current) return;
      const scanner = new Html5QrcodeScanner('qr-reader', { fps: 10, qrbox: 240 }, false);
      instanceRef.current = scanner;
      scanner.render(
        (decodedText) => {
          scanner.pause();
          setCameraOpen(false);
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
  }, [cameraOpen]);

  const lookupSample = async (code) => {
    if (!code) return;
    setLookupBusy(true);
    try {
      const found = await adminSamples.getByCode(code);
      setSample(found);
      setManualCode('');
    } catch {
      showToast('Namuna topilmadi. Kodni qayta tekshiring.', 'error');
    } finally {
      setLookupBusy(false);
    }
  };

  const reset = () => {
    setSample(null);
    setManualCode('');
  };

  const doAction = async (action, { toLabId, notes }) => {
    setBusy(true);
    try {
      const updated = await adminSamples.action(sample.id, { action, toLabId, notes });
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
      <h1 className="text-2xl font-bold text-ink mb-2">Namunani skanerlash / qidirish</h1>
      <p className="text-sm text-slate-500 mb-6">
        Namuna kodini (masalan <span className="font-mono">SMP-2026-00001</span>) qo'lda kiriting, yoki
        kamera orqali QR kodni skanerlang.
      </p>

      {!sample ? (
        <div className="card p-6 max-w-md space-y-5">
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Namuna kodi</label>
            <div className="flex gap-2">
              <input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && lookupSample(manualCode.trim())}
                placeholder="SMP-2026-00001"
                className="input-field font-mono"
              />
              <button
                onClick={() => lookupSample(manualCode.trim())}
                disabled={lookupBusy || !manualCode.trim()}
                className="btn-primary !px-4"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-slate-400">yoki</div>

          {!cameraOpen ? (
            <button onClick={() => setCameraOpen(true)} className="btn-secondary w-full">
              <Camera className="h-4 w-4" /> Kamera orqali skanerlash
            </button>
          ) : (
            <div>
              <div id="qr-reader" ref={scannerRef} />
              <button onClick={() => setCameraOpen(false)} className="text-sm text-slate-500 hover:text-primary mt-3">
                Kamerani yopish
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="card p-6 max-w-lg">
          <div className="flex items-start justify-between gap-3 mb-1">
            <p className="font-mono text-primary font-bold">{sample.code}</p>
            <SampleStatusBadge status={sample.status} />
          </div>
          <h2 className="text-lg font-bold text-ink">{sample.productName}</h2>
          <p className="text-sm text-slate-500 mt-1">
            Hozirgi joyi: <span className="font-medium text-ink">{sample.currentLab?.nameUz || '—'}</span>
          </p>
          <p className="text-sm text-slate-500">
            Kelib chiqishi: <span className="font-medium text-ink">{sample.originLab?.nameUz}</span>
          </p>

          <div className="mt-6">
            <SampleActionPanel sample={sample} labs={labs} onAction={doAction} busy={busy} />
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-5 pt-4 border-t border-border">
            <Link to={`/admin/namunalar/${sample.id}`} className="text-sm font-medium text-primary hover:underline">
              Batafsil sahifasini ochish
            </Link>
            <button onClick={reset} className="text-sm text-slate-500 hover:text-primary">
              ← Boshqa namunani qidirish
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
