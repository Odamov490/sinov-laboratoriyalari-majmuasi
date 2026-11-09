import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Link2, Link2Off, PlugZap, RefreshCw, ShieldCheck, Info } from 'lucide-react';
import { adminTris } from '../../../services/adminApi';
import { useAuth } from '../../../context/AuthContext.jsx';
import { Loading, ErrorState } from '../../../components/StateViews.jsx';
import { Modal } from '../../../components/Modal.jsx';
import { apiErr, fmtDateTime } from './ProfileGeneral.jsx';
import { tr } from '../../../i18n/tr.js';

// Holat belgisi: Bog'langan / Muddati tugagan / Xato / Bog'lanmagan / Sozlanmagan.
export function trisBadge(st) {
  if (!st.configured) return { label: tr('Sozlanmagan'), cls: 'bg-slate-100 text-slate-600' };
  if (st.status === 'ACTIVE') return { label: tr("Bog'langan"), cls: 'bg-emerald-100 text-emerald-700' };
  if (st.status === 'EXPIRED') return { label: tr('Muddati tugagan'), cls: 'bg-amber-100 text-amber-800' };
  if (st.status === 'ERROR' || st.status === 'REVOKED') return { label: tr('Xato'), cls: 'bg-red-100 text-red-700' };
  return { label: tr("Bog'lanmagan"), cls: 'bg-slate-100 text-slate-600' };
}

export const STATUS_LABELS = {
  ACTIVE: tr("Bog'langan"),
  EXPIRED: tr('Muddati tugagan'),
  REVOKED: tr('Bekor qilingan'),
  ERROR: tr('Xato'),
};

// "Ulanishni tekshirish" natijasi — oddiy tilda.
export function testMessage(r) {
  if (r.ok) return { type: 'success', text: tr('Ulanish ishlayapti (tris javob berdi: {0}).', r.status) };
  const codes = {
    PING_NOT_CONFIGURED: tr("Tekshiruv yo'li sozlanmagan (TRIS_API_PING_PATH). Ulanish saqlangan, lekin tekshirib bo'lmaydi."),
    RECONNECT_REQUIRED: tr("Ulanish muddati tugagan. Qayta bog'lang."),
    NOT_CONNECTED: tr("Tris hisobi bog'lanmagan."),
    UNAUTHORIZED: tr("Tris so'rovni rad etdi (ruxsat yo'q)."),
    RATE_LIMITED: tr("Tris hozir juda ko'p so'rov olmoqda. Birozdan so'ng urinib ko'ring."),
    TIMEOUT: tr('Tris javob bermadi (vaqt tugadi).'),
    UPSTREAM_ERROR: tr('Tris bilan aloqada xatolik.'),
    INVALID_RESPONSE: tr("Tris'dan noto'g'ri javob keldi."),
  };
  if (codes[r.code]) return { type: r.code === 'PING_NOT_CONFIGURED' ? 'info' : 'error', text: codes[r.code] };
  return { type: 'error', text: r.status ? tr('Tris javob berdi: {0}.', r.status) : tr('Tris bilan aloqada xatolik.') };
}

// Callback'dan qaytgandagi sabab kodlari (?tris=xato&sabab=...).
const RETURN_REASONS = {
  rad: tr("Tris sahifasida ruxsat berilmadi."),
  state: tr("Bog'lash havolasi eskirgan yoki boshqa brauzerda ochilgan. Qaytadan urinib ko'ring."),
  provayder: tr('Tris xatolik qaytardi.'),
  token: tr("Tris'dan token olib bo'lmadi."),
  userinfo: tr("Tris hisobi ma'lumotlarini olib bo'lmadi."),
  band: tr("Bu tris hisobi boshqa SLM foydalanuvchisiga bog'langan."),
  hisob: tr("Hisobingiz bog'lash uchun tayyor emas (vaqtinchalik parol yoki faol emas)."),
  sozlanmagan: tr('Tris integratsiyasi sozlanmagan.'),
  ichki: tr('Serverda xatolik yuz berdi.'),
};

function TrisCard({ toast }) {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [st, setSt] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const [result, setResult] = useState(null);
  const handled = useRef(false);

  const load = useCallback(() => {
    setError(null);
    adminTris
      .status()
      .then(setSt)
      .catch((err) => setError(apiErr(err)));
  }, []);
  useEffect(load, [load]);

  // Tris'dan qaytish: xabar ko'rsatiladi va URL tozalanadi.
  useEffect(() => {
    if (handled.current) return;
    const ret = params.get('tris');
    if (!ret) return;
    handled.current = true;
    if (ret === 'ok') toast(tr("Tris hisobi muvaffaqiyatli bog'landi."), 'success');
    else toast(RETURN_REASONS[params.get('sabab')] || tr("Tris bilan bog'lab bo'lmadi."), 'error');
    setParams({ tab: 'integratsiyalar' }, { replace: true });
  }, [params, setParams, toast]);

  const connect = async () => {
    setBusy('connect');
    try {
      const { url } = await adminTris.connect();
      window.location.assign(url);
    } catch (err) {
      toast(apiErr(err), 'error');
      setBusy(null);
    }
  };

  const test = async () => {
    setBusy('test');
    setResult(null);
    try {
      setResult(testMessage(await adminTris.test()));
      load();
    } catch (err) {
      setResult({ type: 'error', text: apiErr(err) });
    } finally {
      setBusy(null);
    }
  };

  const disconnect = async () => {
    setBusy('disconnect');
    try {
      await adminTris.disconnect();
      toast(tr("Tris ulanishi uzildi."), 'success');
      setConfirm(false);
      setResult(null);
      load();
    } catch (err) {
      toast(apiErr(err), 'error');
    } finally {
      setBusy(null);
    }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!st) return <Loading />;

  const badge = trisBadge(st);
  const linked = Boolean(st.status);
  const expired = st.status && st.status !== 'ACTIVE';

  return (
    <div className="card space-y-4 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-base font-semibold text-ink">
            <PlugZap className="h-5 w-5 text-primary" /> Tris
          </p>
          <p className="mt-0.5 text-sm text-slate-500">{tr('Raqamli laboratoriya tizimi (labaratoriya.tris.uz) bilan ulanish.')}</p>
        </div>
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badge.cls}`}>{badge.label}</span>
      </div>

      {!st.configured ? (
        <div className="flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p>{tr("Tris bilan ulanish hali yoqilmagan: administrator tris tomonidan berilgan ulanish sozlamalarini serverga kiritmagan. Sozlanganidan keyin bu yerda bog'lash tugmasi ishlaydi.")}</p>
            {user?.role === 'SUPER_ADMIN' && st.missing?.length > 0 && (
              <p className="mt-2 text-xs text-slate-500">
                {tr('Yetishmayotgan sozlamalar:')} <span className="font-mono">{st.missing.join(', ')}</span>
              </p>
            )}
          </div>
        </div>
      ) : (
        linked && (
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-slate-500">{tr('Tris foydalanuvchisi')}</dt>
              <dd className="font-medium text-ink">{st.trisDisplayName || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">{tr("Bog'langan sana")}</dt>
              <dd className="text-ink">{fmtDateTime(st.connectedAt)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">{tr('Oxirgi ishlatilgan')}</dt>
              <dd className="text-ink">{fmtDateTime(st.lastUsedAt)}</dd>
            </div>
          </dl>
        )
      )}

      {expired && st.configured && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{tr("Tris ulanishi uzilgan yoki muddati tugagan. Davom etish uchun qayta bog'lang.")}</p>
      )}

      {result && (
        <p
          className={`rounded-lg p-3 text-sm ${
            result.type === 'success' ? 'bg-emerald-50 text-emerald-800' : result.type === 'info' ? 'bg-sky-50 text-sky-800' : 'bg-red-50 text-red-700'
          }`}
        >
          {result.text}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {(!linked || expired) && (
          <button type="button" onClick={connect} disabled={!st.configured || busy} className="btn-primary inline-flex items-center gap-2 disabled:opacity-50">
            <Link2 className="h-4 w-4" /> {expired ? tr("Qayta bog'lash") : tr("Tris bilan bog'lash")}
          </button>
        )}
        {linked && st.status === 'ACTIVE' && (
          <button type="button" onClick={test} disabled={busy} className="btn-secondary inline-flex items-center gap-2 disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${busy === 'test' ? 'animate-spin' : ''}`} /> {tr('Ulanishni tekshirish')}
          </button>
        )}
        {linked && (
          <button
            type="button"
            onClick={() => setConfirm(true)}
            disabled={busy}
            className="btn-secondary inline-flex items-center gap-2 text-red-600 disabled:opacity-50"
          >
            <Link2Off className="h-4 w-4" /> {tr('Uzish')}
          </button>
        )}
      </div>
      <p className="flex items-start gap-2 text-xs text-slate-500">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
        {tr("Tris'ga o'zingiz kirasiz, parolingiz SLM'ga berilmaydi. Istalgan vaqt uzishingiz mumkin.")}
      </p>

      <Modal open={confirm} onClose={() => setConfirm(false)} title={tr('Tris ulanishini uzish')} size="sm">
        <p className="text-sm text-slate-600">{tr("Ulanish uzilsa, SLM tris'dagi ma'lumotlaringizdan foydalana olmaydi. Keyin istalgan vaqt qayta bog'lashingiz mumkin.")}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={() => setConfirm(false)} className="btn-secondary">
            {tr('Bekor qilish')}
          </button>
          <button type="button" onClick={disconnect} disabled={busy === 'disconnect'} className="btn-primary !bg-red-600 hover:!bg-red-700 disabled:opacity-50">
            {tr('Uzish')}
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default function ProfileIntegrations({ toast }) {
  return (
    <div className="space-y-4">
      <TrisCard toast={toast} />
    </div>
  );
}
