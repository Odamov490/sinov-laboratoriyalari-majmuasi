import React, { useState } from 'react';
import { Lock, Moon, BellRing, Send, Save } from 'lucide-react';
import { adminProfile } from '../../../services/adminApi';
import { EVENT_LABELS, browserPermission, requestBrowserPermission, testNotification } from '../../../utils/notifyPrefs';
import { apiErr } from './ProfileGeneral.jsx';

const CHANNELS = [
  ['inApp', 'Sayt ichida'],
  ['browser', 'Brauzer'],
  ['sound', 'Ovoz'],
];

export default function ProfileNotifications({ profile, onChange, toast }) {
  const [notifications, setNotifications] = useState(profile.preferences.notifications);
  const [quiet, setQuiet] = useState(profile.preferences.quietHours);
  const [saving, setSaving] = useState(false);
  const [permission, setPermission] = useState(browserPermission());
  const mandatory = profile.mandatoryInApp || [];

  const toggle = (event, ch) => {
    if (ch === 'inApp' && mandatory.includes(event)) return;
    setNotifications((n) => ({ ...n, [event]: { ...n[event], [ch]: !n[event][ch] } }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const next = await adminProfile.update({ preferences: { notifications, quietHours: quiet } });
      setNotifications(next.preferences.notifications);
      setQuiet(next.preferences.quietHours);
      onChange(next);
      toast('Bildirishnoma sozlamalari saqlandi.', 'success');
    } catch (err) {
      toast(apiErr(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const enableBrowser = async () => {
    const r = await requestBrowserPermission();
    setPermission(r);
    if (r === 'denied') toast("Brauzer bildirishnomalarni bloklagan. Manzil satridagi qulf belgisidan ruxsat bering.", 'error');
    if (r === 'granted') toast('Brauzer bildirishnomalari yoqildi.', 'success');
  };

  return (
    <div className="space-y-5">
      <div className="card p-6">
        <p className="mb-3 text-sm font-semibold text-ink">Qaysi voqealar haqida xabar berilsin</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-3">Voqea</th>
                {CHANNELS.map(([k, l]) => (
                  <th key={k} className="w-24 py-2 text-center">
                    {l}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {profile.notificationEvents.map((event) => (
                <tr key={event}>
                  <td className="py-2.5 pr-3 text-ink">{EVENT_LABELS[event] || event}</td>
                  {CHANNELS.map(([ch]) => {
                    const locked = ch === 'inApp' && mandatory.includes(event);
                    return (
                      <td key={ch} className="py-2.5 text-center">
                        {locked ? (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-400" title="Muhim voqea: sayt ichidagi bildirishnoma o'chirilmaydi">
                            <input type="checkbox" checked disabled className="h-4 w-4" aria-label="Majburiy" />
                            <Lock className="h-3.5 w-3.5" />
                          </span>
                        ) : (
                          <input
                            type="checkbox"
                            checked={Boolean(notifications[event]?.[ch])}
                            onChange={() => toggle(event, ch)}
                            className="h-4 w-4"
                            aria-label={`${EVENT_LABELS[event]}: ${ch}`}
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 flex items-start gap-1.5 text-xs text-slate-500">
          <Lock className="h-3.5 w-3.5 shrink-0" /> Vazifa tayinlanishi va muddati haqidagi xabarlar muhim — ular sayt ichida har doim ko'rsatiladi. Chat xabarlari o'z hisoblagichiga ega; ular uchun "Sayt ichida" ustuni ta'sir qilmaydi.
        </p>
      </div>

      <div className="card space-y-3 p-6">
        <label className="flex items-center gap-2 text-sm font-semibold text-ink">
          <input type="checkbox" checked={quiet.enabled} onChange={(e) => setQuiet({ ...quiet, enabled: e.target.checked })} className="h-4 w-4" />
          <Moon className="h-4 w-4 text-primary" /> Tinch soatlar
        </label>
        <div className={`flex flex-wrap items-center gap-2 text-sm ${quiet.enabled ? '' : 'opacity-50'}`}>
          <input type="time" value={quiet.from} disabled={!quiet.enabled} onChange={(e) => setQuiet({ ...quiet, from: e.target.value })} className="input-field !w-auto !py-1.5" />
          <span>—</span>
          <input type="time" value={quiet.to} disabled={!quiet.enabled} onChange={(e) => setQuiet({ ...quiet, to: e.target.value })} className="input-field !w-auto !py-1.5" />
        </div>
        <p className="text-xs text-slate-500">Bu vaqtda ovoz va brauzer bildirishnomalari chiqmaydi (sayt ichidagilar saqlanadi).</p>
      </div>

      <div className="card space-y-3 p-6">
        <p className="flex items-center gap-2 text-sm font-semibold text-ink">
          <BellRing className="h-4 w-4 text-primary" /> Brauzer bildirishnomalari
        </p>
        <p className="text-sm text-slate-600">
          Holati:{' '}
          <span className="font-medium">
            {permission === 'granted' ? 'yoqilgan' : permission === 'denied' ? 'brauzerda bloklangan' : permission === 'unsupported' ? 'brauzer qo\'llamaydi' : "hali ruxsat so'ralmagan"}
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          {permission !== 'granted' && permission !== 'unsupported' && (
            <button type="button" onClick={enableBrowser} className="btn-secondary !py-2">
              <BellRing className="h-4 w-4" /> Brauzer bildirishnomalarini yoqish
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (!testNotification()) toast('Faqat ovoz chiqdi: brauzer bildirishnomasiga ruxsat berilmagan.', 'info');
            }}
            className="btn-secondary !py-2"
          >
            <Send className="h-4 w-4" /> Sinov xabari yuborish
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={save} disabled={saving} className="btn-primary !py-2">
          <Save className="h-4 w-4" /> {saving ? 'Saqlanmoqda…' : 'Saqlash'}
        </button>
      </div>
    </div>
  );
}
