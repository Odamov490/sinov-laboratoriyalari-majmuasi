import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Search, Camera, ImageUp, RefreshCw, ScanLine, X } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { adminSamples, adminResource } from '../../services/adminApi';
import { useToast } from '../../context/ToastContext.jsx';
import SampleStatusBadge from '../../components/samples/SampleStatusBadge.jsx';
import SampleActionPanel from '../../components/samples/SampleActionPanel.jsx';
import { tr, locName } from '../../i18n/tr.js';
import { extractSampleCode } from '../../utils/sampleQr.js';

const READER_ID = 'qr-reader';
const FILE_READER_ID = 'qr-file-reader';

// Muvaffaqiyatli skanerlashda qisqa signal + tebranish (telefonda).
function scanFeedback() {
  try {
    navigator.vibrate?.(120);
  } catch {
    /* qo'llab-quvvatlanmaydi */
  }
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 1100;
    gain.gain.value = 0.08;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
    osc.onended = () => ctx.close().catch(() => {});
  } catch {
    /* ovoz shart emas */
  }
}

async function stopInstance(qr) {
  if (!qr) return;
  try {
    if (qr.isScanning) await qr.stop();
    qr.clear();
  } catch {
    /* allaqachon to'xtagan */
  }
}

function cameraErrorText(err) {
  if (typeof window !== 'undefined' && !window.isSecureContext) {
    return tr('Kamera faqat xavfsiz (https://) ulanishda ishlaydi.');
  }
  const name = err?.name || '';
  const msg = String(err?.message || err || '');
  if (name === 'NotAllowedError' || /permission|denied|notallowed/i.test(msg)) {
    return tr("Kameraga ruxsat berilmadi. Brauzer manzil satridagi kamera belgisidan ruxsat bering va qayta urinib ko'ring.");
  }
  if (name === 'NotFoundError' || /not ?found|no camera|requested device/i.test(msg)) {
    return tr('Kamera topilmadi. Kodni qo\'lda kiriting yoki QR rasmini yuklang.');
  }
  if (name === 'NotReadableError' || /in use|could not start|notreadable/i.test(msg)) {
    return tr('Kamera boshqa dastur tomonidan band. Uni yopib, qayta urinib ko\'ring.');
  }
  return tr('Kamerani ishga tushirib bo\'lmadi.');
}

export default function AdminScanner() {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sample, setSample] = useState(null);
  const [labs, setLabs] = useState([]);
  const [busy, setBusy] = useState(false);

  const [manualCode, setManualCode] = useState('');
  const [lookupBusy, setLookupBusy] = useState(false);
  const [notFound, setNotFound] = useState('');

  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [cameras, setCameras] = useState([]);
  const [cameraIdx, setCameraIdx] = useState(-1); // -1: orqa kamera (facingMode)

  const qrRef = useRef(null);
  const handlingRef = useRef(false);
  const inputRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    adminResource('laboratories')
      .list({ pageSize: 200 })
      .then((d) => setLabs(d.items))
      .catch(() => setLabs([]));
  }, []);

  const lookupSample = useCallback(
    async (input) => {
      const code = extractSampleCode(input);
      if (!code) return;
      setManualCode(code);
      setNotFound('');
      setLookupBusy(true);
      try {
        const found = await adminSamples.getByCode(code);
        setSample(found);
        setManualCode('');
      } catch {
        setNotFound(code);
        showToast(tr('Namuna topilmadi. Kodni qayta tekshiring.'), 'error');
      } finally {
        setLookupBusy(false);
        handlingRef.current = false;
      }
    },
    [showToast]
  );

  // Telefon kamerasi bilan skanerlangan havola: /admin/skanerlash?code=...
  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) return;
    lookupSample(code);
    setSearchParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const stopCamera = useCallback(async () => {
    const qr = qrRef.current;
    qrRef.current = null;
    await stopInstance(qr);
  }, []);

  // Kamera: ochilganda avtomatik ishga tushadi, QR topilganda o'zi to'xtaydi.
  useEffect(() => {
    if (!cameraOpen) return undefined;
    let cancelled = false;
    let qr = null;
    setCameraError('');
    setCameraStarting(true);

    (async () => {
      try {
        if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
          throw new Error('insecure');
        }
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');
        if (cancelled) return;
        qr = new Html5Qrcode(READER_ID, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });
        qrRef.current = qr;
        const source = cameraIdx >= 0 && cameras[cameraIdx] ? cameras[cameraIdx].id : { facingMode: 'environment' };
        await qr.start(
          source,
          {
            fps: 12,
            qrbox: (w, h) => {
              const s = Math.max(160, Math.floor(Math.min(w, h) * 0.8));
              return { width: s, height: s };
            },
            aspectRatio: 1,
          },
          (decodedText) => {
            if (handlingRef.current) return;
            handlingRef.current = true;
            scanFeedback();
            setCameraOpen(false);
            lookupSample(decodedText);
          },
          () => {}
        );
        if (cancelled) {
          stopInstance(qr);
          return;
        }
        if (!cameras.length) {
          Html5Qrcode.getCameras()
            .then((list) => !cancelled && setCameras(list || []))
            .catch(() => {});
        }
      } catch (err) {
        if (!cancelled) setCameraError(cameraErrorText(err));
      } finally {
        if (!cancelled) setCameraStarting(false);
      }
    })();

    return () => {
      cancelled = true;
      if (qrRef.current === qr) qrRef.current = null;
      stopInstance(qr);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraOpen, cameraIdx]);

  const switchCamera = () => {
    if (cameras.length < 2) return;
    setCameraIdx((i) => (i + 1) % cameras.length);
  };

  // Kamera bo'lmasa: QR rasmini (surat/skrinshot) yuklab o'qish.
  const scanImage = async (file) => {
    if (!file) return;
    try {
      setCameraOpen(false);
      await stopCamera();
      const { Html5Qrcode } = await import('html5-qrcode');
      const reader = new Html5Qrcode(FILE_READER_ID, { verbose: false });
      try {
        const text = await reader.scanFile(file, false);
        scanFeedback();
        await lookupSample(text);
      } finally {
        reader.clear();
      }
    } catch {
      showToast(tr('Rasmda QR kod topilmadi.'), 'error');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const reset = (openCamera = false) => {
    setSample(null);
    setManualCode('');
    setNotFound('');
    handlingRef.current = false;
    if (openCamera) setCameraOpen(true);
    else setTimeout(() => inputRef.current?.focus(), 0);
  };

  const doAction = async (action, { toLabId, notes }) => {
    setBusy(true);
    try {
      const updated = await adminSamples.action(sample.id, { action, toLabId, notes });
      showToast(tr('Amal bajarildi.'), 'success');
      setSample(updated);
    } catch (err) {
      showToast(err?.response?.data?.error || tr('Xatolik yuz berdi.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-2">{tr('Namunani skanerlash / qidirish')}</h1>
      <p className="text-sm text-slate-500 mb-6">
        {tr('Namuna kodini (masalan')} <span className="font-mono">SMP-2026-00001</span>{tr(") qo'lda kiriting, yoki kamera orqali QR kodni skanerlang.")}
      </p>

      <div id={FILE_READER_ID} className="hidden" />

      {!sample ? (
        <div className="card p-6 max-w-md space-y-5">
          <div>
            <label htmlFor="sample-code" className="block text-sm font-medium text-ink mb-1.5">{tr('Namuna kodi')}</label>
            <div className="flex gap-2">
              <input
                id="sample-code"
                ref={inputRef}
                autoFocus
                autoComplete="off"
                value={manualCode}
                onChange={(e) => {
                  setManualCode(e.target.value);
                  setNotFound('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && lookupSample(manualCode)}
                placeholder="SMP-2026-00001"
                className="input-field font-mono"
              />
              <button
                onClick={() => lookupSample(manualCode)}
                disabled={lookupBusy || !manualCode.trim()}
                className="btn-primary !px-4"
                aria-label={tr('Qidirish')}
              >
                {lookupBusy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </button>
            </div>
            {notFound ? (
              <p className="mt-1.5 text-xs text-red-600">{tr('{0} kodli namuna topilmadi.', notFound)}</p>
            ) : (
              <p className="mt-1.5 text-xs text-slate-400">{tr('USB skaner bilan ham ishlaydi: kursorni shu maydonga qo\'yib, yorliqni skanerlang.')}</p>
            )}
          </div>

          <div className="text-center text-xs text-slate-400">{tr('yoki')}</div>

          {!cameraOpen ? (
            <div className="space-y-2">
              <button onClick={() => setCameraOpen(true)} className="btn-secondary w-full">
                <Camera className="h-4 w-4" /> {tr('Kamera orqali skanerlash')}
              </button>
              <button onClick={() => fileRef.current?.click()} className="w-full text-sm text-slate-500 hover:text-primary inline-flex items-center justify-center gap-1.5">
                <ImageUp className="h-4 w-4" /> {tr('QR rasmini yuklash')}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => scanImage(e.target.files?.[0])} />
              {cameraError && <p className="text-xs text-red-600 text-center">{cameraError}</p>}
            </div>
          ) : (
            <div>
              <div className="relative overflow-hidden rounded-xl bg-slate-900 min-h-[260px]">
                <div id={READER_ID} className="w-full [&_video]:!w-full" />
                {cameraStarting && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-white/80">
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    {tr('Kamera ishga tushirilmoqda...')}
                  </div>
                )}
                {cameraError && (
                  <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-white">
                    {cameraError}
                  </div>
                )}
              </div>
              {!cameraError && !cameraStarting && (
                <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-slate-500">
                  <ScanLine className="h-3.5 w-3.5" /> {tr('QR kodni ramka ichiga keltiring — u avtomatik o\'qiladi.')}
                </p>
              )}
              <div className="mt-3 flex items-center justify-between gap-3">
                <button onClick={() => setCameraOpen(false)} className="text-sm text-slate-500 hover:text-primary inline-flex items-center gap-1">
                  <X className="h-4 w-4" /> {tr('Kamerani yopish')}
                </button>
                {cameras.length > 1 && (
                  <button onClick={switchCamera} className="text-sm text-slate-500 hover:text-primary inline-flex items-center gap-1">
                    <RefreshCw className="h-4 w-4" /> {tr('Kamerani almashtirish')}
                  </button>
                )}
              </div>
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
            {tr('Hozirgi joyi:')} <span className="font-medium text-ink">{locName(sample.currentLab) || '—'}</span>
          </p>
          <p className="text-sm text-slate-500">
            {tr('Kelib chiqishi:')} <span className="font-medium text-ink">{locName(sample.originLab)}</span>
          </p>

          <div className="mt-6">
            <SampleActionPanel sample={sample} labs={labs} onAction={doAction} busy={busy} />
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-5 pt-4 border-t border-border">
            <Link to={`/admin/namunalar/${sample.id}`} className="text-sm font-medium text-primary hover:underline">
              {tr('Batafsil sahifasini ochish')}
            </Link>
            <button onClick={() => reset(true)} className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1">
              <Camera className="h-4 w-4" /> {tr('Keyingi namunani skanerlash')}
            </button>
            <button onClick={() => reset(false)} className="text-sm text-slate-500 hover:text-primary">
              {tr('← Boshqa namunani qidirish')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
