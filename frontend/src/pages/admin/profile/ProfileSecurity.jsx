import React, { useCallback, useEffect, useState } from 'react';
import { Eye, EyeOff, KeyRound, Laptop, LogOut, Info, ShieldAlert } from 'lucide-react';
import { adminProfile } from '../../../services/adminApi';
import { passwordProblem } from '../../../components/admin/ChangePasswordForm.jsx';
import { Loading, EmptyState } from '../../../components/StateViews.jsx';
import { Modal } from '../../../components/Modal.jsx';
import { apiErr, fmtDateTime } from './ProfileGeneral.jsx';

const DAY = 24 * 60 * 60 * 1000;

// 0..4: uzunlik, harf/raqam/belgi turlari.
function strength(p) {
  if (!p) return 0;
  let s = 0;
  if (p.length >= 10) s += 1;
  if (p.length >= 14) s += 1;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s += 1;
  if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) s += 1;
  return passwordProblem(p) ? Math.min(s, 1) : Math.max(s, 1);
}
const STRENGTH = [
  ['', 'bg-slate-200'],
  ['Zaif', 'bg-red-500'],
  ["O'rtacha", 'bg-amber-500'],
  ['Yaxshi', 'bg-sky-500'],
  ['Kuchli', 'bg-emerald-500'],
];

function PasswordInput({ value, onChange, show, label, autoComplete }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-ink">{label}</span>
      <input type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} required className="input-field" autoComplete={autoComplete} />
    </label>
  );
}

function PasswordCard({ profile, onChange, toast, onSessionsChanged }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [signOutOthers, setSignOutOthers] = useState(true);
  const [saving, setSaving] = useState(false);

  const problem = next ? passwordProblem(next) || (next === current ? 'Yangi parol joriy paroldan farq qilishi kerak.' : null) : null;
  const mismatch = confirm && next !== confirm;
  const score = strength(next);
  const stale = !profile.passwordChangedAt || Date.now() - new Date(profile.passwordChangedAt).getTime() > 180 * DAY;

  const submit = async (e) => {
    e.preventDefault();
    if (problem || mismatch || !current || !next) return;
    setSaving(true);
    try {
      const r = await adminProfile.changePassword(current, next, signOutOthers);
      setCurrent('');
      setNext('');
      setConfirm('');
      toast(r.signedOutOthers ? `Parol almashtirildi. ${r.signedOutOthers} ta boshqa qurilmadan chiqarildi.` : 'Parol almashtirildi.', 'success');
      onChange();
      onSessionsChanged();
    } catch (err) {
      toast(apiErr(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="card space-y-4 p-6">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-semibold text-ink">
          <KeyRound className="h-4 w-4 text-primary" /> Parolni almashtirish
        </p>
        <span className="text-xs text-slate-400">Oxirgi marta: {profile.passwordChangedAt ? fmtDateTime(profile.passwordChangedAt) : "ma'lum emas"}</span>
      </div>
      {stale && (
        <p className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
          <Info className="h-4 w-4 shrink-0" /> Parolingiz 180 kundan beri almashtirilmagan. Xavfsizlik uchun yangilab qo'yishni tavsiya qilamiz.
        </p>
      )}
      <PasswordInput label="Joriy parol" value={current} onChange={setCurrent} show={show} autoComplete="current-password" />
      <div>
        <PasswordInput label="Yangi parol" value={next} onChange={setNext} show={show} autoComplete="new-password" />
        {next && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex flex-1 gap-1">
              {[1, 2, 3, 4].map((i) => (
                <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= score ? STRENGTH[score][1] : 'bg-slate-200'}`} />
              ))}
            </div>
            <span className="w-16 text-right text-xs text-slate-500">{STRENGTH[score][0]}</span>
          </div>
        )}
        <p className={`mt-1 text-xs ${problem ? 'text-red-600' : 'text-slate-400'}`}>{problem || "Kamida 10 belgi, harf va raqam bo'lishi kerak."}</p>
      </div>
      <div>
        <PasswordInput label="Yangi parolni tasdiqlash" value={confirm} onChange={setConfirm} show={show} autoComplete="new-password" />
        {mismatch && <p className="mt-1 text-xs text-red-600">Parollar bir xil emas.</p>}
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <button type="button" onClick={() => setShow((v) => !v)} className="inline-flex items-center gap-1.5 text-slate-600 hover:text-primary">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} {show ? 'Yashirish' : "Ko'rsatish"}
        </button>
        <label className="inline-flex items-center gap-2 text-slate-600">
          <input type="checkbox" checked={signOutOthers} onChange={(e) => setSignOutOthers(e.target.checked)} className="h-4 w-4" />
          Boshqa qurilmalardan chiqarish
        </label>
      </div>
      <button type="submit" disabled={saving || Boolean(problem) || mismatch || !current || !next} className="btn-primary !py-2">
        {saving ? 'Saqlanmoqda…' : 'Parolni almashtirish'}
      </button>
    </form>
  );
}

export default function ProfileSecurity({ profile, onChange, toast }) {
  const [sessions, setSessions] = useState(null);
  const [logins, setLogins] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const loadSessions = useCallback(() => {
    adminProfile
      .sessions()
      .then(setSessions)
      .catch(() => setSessions({ items: [] }));
  }, []);
  useEffect(() => {
    loadSessions();
    adminProfile
      .logins()
      .then(setLogins)
      .catch(() => setLogins({ items: [], failedLast30Days: 0 }));
  }, [loadSessions]);

  const revoke = async (s) => {
    try {
      await adminProfile.revokeSession(s.id);
      toast(`${s.device} — qurilmadan chiqarildi.`, 'success');
      loadSessions();
    } catch (err) {
      toast(apiErr(err), 'error');
    }
  };
  const revokeOthers = async () => {
    try {
      const r = await adminProfile.revokeOthers();
      toast(`${r.revoked} ta qurilmadan chiqarildi.`, 'success');
      loadSessions();
    } catch (err) {
      toast(apiErr(err), 'error');
    }
  };

  const others = sessions?.items.filter((s) => !s.current) || [];

  return (
    <div className="space-y-5">
      <PasswordCard profile={profile} onChange={onChange} toast={toast} onSessionsChanged={loadSessions} />

      <div className="card p-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Laptop className="h-4 w-4 text-primary" /> Faol qurilmalar
          </p>
          {others.length > 0 && (
            <button type="button" onClick={() => setConfirm({ all: true })} className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:underline">
              <LogOut className="h-4 w-4" /> Boshqa hammasidan chiqish
            </button>
          )}
        </div>
        {!sessions ? (
          <Loading />
        ) : sessions.items.length === 0 ? (
          <EmptyState message="Faol qurilma yo'q." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-3">Qurilma</th>
                  <th className="py-2 pr-3">IP</th>
                  <th className="py-2 pr-3">Kirgan</th>
                  <th className="py-2 pr-3">Oxirgi faollik</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sessions.items.map((s) => (
                  <tr key={s.id}>
                    <td className="py-2.5 pr-3 font-medium text-ink">
                      {s.device}
                      {s.current && <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">shu qurilma</span>}
                    </td>
                    <td className="py-2.5 pr-3 font-mono text-xs text-slate-500">{s.ip || '—'}</td>
                    <td className="py-2.5 pr-3 text-slate-500">{fmtDateTime(s.createdAt)}</td>
                    <td className="py-2.5 pr-3 text-slate-500">{fmtDateTime(s.lastUsedAt)}</td>
                    <td className="py-2.5 text-right">
                      {!s.current && (
                        <button type="button" onClick={() => setConfirm(s)} className="text-sm font-medium text-red-600 hover:underline">
                          Chiqarish
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 flex items-start gap-2 text-xs text-slate-500">
          <Info className="h-4 w-4 shrink-0" /> Chiqarilgan qurilma keyingi yangilanishda tizimdan chiqadi; ochiq sahifa ko'pi bilan {sessions?.accessTokenMinutes || 15} daqiqa ishlashda davom etishi mumkin.
        </p>
      </div>

      <div className="card p-6">
        <p className="mb-3 text-sm font-semibold text-ink">Oxirgi kirishlar</p>
        {logins?.failedLast30Days > 0 && (
          <p className="mb-3 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <ShieldAlert className="h-4 w-4 shrink-0" /> Oxirgi 30 kunda {logins.failedLast30Days} ta muvaffaqiyatsiz urinish bo'lgan. Bu siz bo'lmasangiz, parolni almashtiring.
          </p>
        )}
        {!logins ? (
          <Loading />
        ) : logins.items.length === 0 ? (
          <EmptyState message="Kirishlar tarixi hali yo'q." />
        ) : (
          <ul className="divide-y divide-border text-sm">
            {logins.items.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="text-ink">{l.device}</span>
                <span className="text-slate-500">
                  <span className="mr-3 font-mono text-xs">{l.ip || '—'}</span>
                  {fmtDateTime(l.at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal open={Boolean(confirm)} onClose={() => setConfirm(null)} title="Qurilmadan chiqarish" size="sm">
        <p className="text-sm text-slate-600">
          {confirm?.all ? 'Shu qurilmadan tashqari barcha qurilmalardan chiqarilasiz.' : `${confirm?.device || ''} qurilmasidan chiqarilasiz.`}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={() => setConfirm(null)} className="btn-secondary !py-2">
            Bekor qilish
          </button>
          <button
            type="button"
            onClick={() => {
              const c = confirm;
              setConfirm(null);
              if (c.all) revokeOthers();
              else revoke(c);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            <LogOut className="h-4 w-4" /> Chiqarish
          </button>
        </div>
      </Modal>
    </div>
  );
}
