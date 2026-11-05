import React, { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { HardDrive, Save, AlertTriangle, Search } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useToast } from '../../../context/ToastContext.jsx';
import { Loading } from '../../../components/StateViews.jsx';
import apiClient from '../../../api/client';
import chatApi, { apiError } from '../../../chat/chatApi';
import { formatSize } from '../../../chat/format';
import { roleLabel } from '../../../utils/roles';
import { tr } from '../../../i18n/tr.js';

// /admin/chat-sozlamalari (SUPER_ADMIN): cheklovlar, disk, foydalanuvchilar.
const FIELDS = [
  ['maxImageMB', tr('Rasm hajmi (MB)'), 1, 100],
  ['maxVideoMB', tr('Video hajmi (MB)'), 1, 95],
  ['maxAudioMB', tr('Audio hajmi (MB)'), 1, 95],
  ['maxFileMB', tr('Fayl hajmi (MB)'), 1, 95],
  ['maxVoiceSeconds', tr('Ovozli xabar (soniya)'), 10, 1800],
  ['maxVideoNoteSeconds', tr('Video xabar (soniya)'), 5, 120],
  ['editWindowMinutes', tr('Tahrirlash muddati (daqiqa)'), 0, 525600],
  ['deleteForAllWindowMinutes', tr("Hamma uchun o'chirish muddati (daqiqa)"), 0, 525600],
  ['mediaRetentionDays', tr('Media saqlash muddati (kun, 0 = cheksiz)'), 0, 3650],
];
const KIND = { IMAGE: tr('Rasmlar'), VIDEO: tr('Videolar'), AUDIO: tr('Ovoz/audio'), FILE: tr('Fayllar') };

export default function AdminChatSettings({ embedded = false }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState(null);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user.role !== 'SUPER_ADMIN') return;
    chatApi.settings().then(setForm).catch((e) => showToast(apiError(e), 'error'));
    chatApi.stats().then(setStats).catch(() => {});
    apiClient
      .get('/admin/users')
      .then((r) => setUsers(r.data.items || []))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(
    () => users.filter((u) => u.isActive && (!q || u.fullName.toLowerCase().includes(q.toLowerCase()) || u.email.includes(q.toLowerCase()))),
    [users, q]
  );

  if (user.role !== 'SUPER_ADMIN') return <Navigate to="/admin/dashboard" replace />;
  if (!form) return <Loading />;

  const save = async () => {
    setSaving(true);
    try {
      const data = Object.fromEntries(FIELDS.map(([k]) => [k, Number(form[k])]));
      data.whoCanCreateGroups = form.whoCanCreateGroups;
      data.chatEnabled = Boolean(form.chatEnabled);
      setForm({ ...form, ...(await chatApi.updateSettings(data)) });
      showToast(tr('Saqlandi.'), 'success');
    } catch (err) {
      showToast(apiError(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleUser = async (u) => {
    try {
      const r = await apiClient.put(`/admin/users/${u.id}`, { chatEnabled: !u.chatEnabled });
      setUsers((list) => list.map((x) => (x.id === u.id ? { ...x, chatEnabled: r.data.chatEnabled } : x)));
    } catch (err) {
      showToast(apiError(err), 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        {!embedded && <h1 className="text-2xl font-bold text-ink">{tr('Chat sozlamalari')}</h1>}
        <p className="text-sm text-slate-500">{tr("Cheklovlar, disk hajmi va foydalanuvchilar uchun chatni yoqish/o'chirish.")}</p>
      </div>

      <div className="card p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FIELDS.map(([k, label, min, max]) => (
            <label key={k} className="block text-sm">
              <span className="mb-1 block font-medium text-ink">{label}</span>
              <input type="number" min={min} max={max} value={form[k] ?? ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="input-field" />
            </label>
          ))}
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink">{tr('Guruh yaratish')}</span>
            <select value={form.whoCanCreateGroups} onChange={(e) => setForm({ ...form, whoCanCreateGroups: e.target.value })} className="input-field">
              <option value="ALL">{tr('Hamma xodimlar')}</option>
              <option value="MANAGERS">{tr('Faqat rahbariyat (Super admin, Menejer)')}</option>
            </select>
          </label>
          <label className="flex items-center gap-2 self-end text-sm font-medium text-ink">
            <input type="checkbox" checked={Boolean(form.chatEnabled)} onChange={(e) => setForm({ ...form, chatEnabled: e.target.checked })} className="h-4 w-4" />
            {tr("Chat yoqilgan (o'chirilsa — faqat Super admin kira oladi)")}
          </label>
        </div>
        <p className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {tr("Media saqlash muddati belgilansa, eski xabarlarning faqat FAYLLARI har kuni 03:30 da o'chiriladi (\"Fayl muddati tugagan\"); xabar matni hech qachon avtomatik o'chirilmaydi. Cloudflare bitta so'rovni 100 MB bilan cheklaydi.")}
        </p>
        <div className="mt-4 flex justify-end">
          <button type="button" onClick={save} disabled={saving} className="btn-primary !py-2">
            <Save className="h-4 w-4" /> {tr('Saqlash')}
          </button>
        </div>
      </div>

      <div className="card p-6">
        <p className="mb-3 flex items-center gap-2 font-semibold text-ink">
          <HardDrive className="h-5 w-5 text-primary" /> {tr('Disk')}
        </p>
        {!stats ? (
          <Loading />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-bg-light p-3">
              <p className="text-xs text-slate-500">{tr('Jami (chat-media volume)')}</p>
              <p className="text-lg font-bold text-ink">{formatSize(stats.disk.total)}</p>
              <p className="text-xs text-slate-500">{stats.disk.files} {tr('ta fayl')}</p>
            </div>
            {stats.byKind.map((k) => (
              <div key={k.kind} className="rounded-lg bg-bg-light p-3">
                <p className="text-xs text-slate-500">{KIND[k.kind]}</p>
                <p className="text-lg font-bold text-ink">{formatSize(k.size)}</p>
                <p className="text-xs text-slate-500">{tr('{0} ta fayl', k.count)}</p>
              </div>
            ))}
            <div className="rounded-lg bg-bg-light p-3">
              <p className="text-xs text-slate-500">{tr('Yuborilmagan (24 soatda tozalanadi)')}</p>
              <p className="text-lg font-bold text-ink">{formatSize(stats.pending.size)}</p>
              <p className="text-xs text-slate-500">{tr('{0} ta fayl', stats.pending.count)}</p>
            </div>
            <div className="rounded-lg bg-bg-light p-3">
              <p className="text-xs text-slate-500">{tr('Xabarlar / muddati tugagan fayllar')}</p>
              <p className="text-lg font-bold text-ink">{stats.messagesCount}</p>
              <p className="text-xs text-slate-500">{stats.expiredCount} {tr('ta fayl muddati tugagan')}</p>
            </div>
          </div>
        )}
        <p className="mt-3 text-xs text-slate-500">{tr("Eslatma: zaxira nusxaga ma'lumotlar bazasi bilan birga")} <code className="rounded bg-bg-light px-1">slm_chat_media</code> {tr("volume'ini ham kiriting.")}</p>
      </div>

      <div className="card p-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="font-semibold text-ink">{tr('Foydalanuvchilar')}</p>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tr('Qidirish')} className="input-field !py-2 !pl-9" />
          </div>
        </div>
        <div className="max-h-[50vh] divide-y divide-border overflow-y-auto">
          {filtered.map((u) => (
            <div key={u.id} className="flex items-center gap-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{u.fullName}</p>
                <p className="truncate text-xs text-slate-500">{[roleLabel(u.role), u.labName].filter(Boolean).join(' · ')}</p>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={u.chatEnabled !== false} onChange={() => toggleUser(u)} disabled={u.id === user.id} className="h-4 w-4" />
                {u.chatEnabled !== false ? tr('Chat yoqilgan') : tr("Chat o'chirilgan")}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
