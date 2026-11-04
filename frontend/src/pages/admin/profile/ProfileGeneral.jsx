import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Trash2, Copy, Save, ListChecks, AlertTriangle, CheckCircle2, Bell, ExternalLink, MessageSquareWarning } from 'lucide-react';
import Avatar from '../../../components/Avatar.jsx';
import { Modal } from '../../../components/Modal.jsx';
import { adminProfile } from '../../../services/adminApi';
import { roleLabel } from '../../../utils/roles';
import { tr, dateLocale, trServer } from '../../../i18n/tr.js';

export const apiErr = (err) => err?.response?.data?.error || tr('Xatolik yuz berdi.');
export const fmtDateTime = (v) => (v ? new Date(v).toLocaleString(dateLocale(), { dateStyle: 'medium', timeStyle: 'short' }) : '—');
const fmtDate = (v) => (v ? new Date(v).toLocaleDateString(dateLocale(), { dateStyle: 'medium' }) : '—');

// Rasmni klientda kvadratga kesish (markazdan) va 512 px ga siqish.
async function squareJpeg(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error(tr("Rasmni o'qib bo'lmadi.")));
      i.src = url;
    });
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const out = Math.min(512, side);
    const canvas = document.createElement('canvas');
    canvas.width = out;
    canvas.height = out;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, out, out);
    ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, out, out);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.88));
    return new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function Row({ label, children }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2.5 text-sm last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-ink">{children || '—'}</span>
    </div>
  );
}

function Stat({ to, icon: Icon, label, value, tone = 'text-primary' }) {
  return (
    <Link to={to} className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-bg-light">
      <Icon className={`h-5 w-5 shrink-0 ${tone}`} />
      <span className="min-w-0 flex-1 text-sm text-slate-600">{label}</span>
      <span className={`text-lg font-bold ${tone}`}>{value}</span>
    </Link>
  );
}

export default function ProfileGeneral({ profile, onChange, toast }) {
  const [phone, setPhone] = useState(profile.phone || '');
  const [telegram, setTelegram] = useState(profile.telegram || '');
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState(null);
  const [correction, setCorrection] = useState(false);
  const [message, setMessage] = useState('');
  const fileInput = useRef(null);

  useEffect(() => {
    adminProfile
      .summary()
      .then(setSummary)
      .catch(() => setSummary(null));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const next = await adminProfile.update({ phone: phone.trim() || null, telegram: telegram.trim() || null });
      setPhone(next.phone || '');
      setTelegram(next.telegram || '');
      onChange(next);
      toast(tr('Saqlandi.'), 'success');
    } catch (err) {
      toast(apiErr(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const upload = async (file) => {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return toast(tr('Faqat JPG, PNG yoki WEBP rasm.'), 'error');
    if (file.size > 15 * 1024 * 1024) return toast(tr('Rasm juda katta.'), 'error');
    setBusy(true);
    try {
      const prepared = await squareJpeg(file);
      if (prepared.size > 2 * 1024 * 1024) throw new Error(tr('Rasm 2 MB dan katta.'));
      onChange(await adminProfile.uploadAvatar(prepared));
      toast(tr('Rasm yangilandi.'), 'success');
    } catch (err) {
      toast(err?.response ? apiErr(err) : err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const removeAvatar = async () => {
    setBusy(true);
    try {
      onChange(await adminProfile.deleteAvatar());
      toast(tr("Rasm o'chirildi."), 'success');
    } catch (err) {
      toast(apiErr(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const copyLogin = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      toast(tr('Login nusxalandi.'), 'success');
    } catch {
      toast(tr("Nusxalab bo'lmadi."), 'error');
    }
  };

  const sendCorrection = async () => {
    try {
      await adminProfile.correctionRequest(message.trim());
      toast(tr("So'rov administratorga yuborildi."), 'success');
      setCorrection(false);
      setMessage('');
    } catch (err) {
      toast(apiErr(err), 'error');
    }
  };

  const { completeness } = profile;
  const dirty = (phone || '') !== (profile.phone || '') || (telegram || '') !== (profile.telegram || '');

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-1">
        <div className="card flex flex-col items-center p-6 text-center">
          <Avatar name={profile.fullName} src={profile.avatarUrl} seed={profile.id} size="xl" />
          <p className="mt-3 text-lg font-semibold text-ink">{profile.fullName}</p>
          <p className="text-sm text-slate-500">{profile.position || roleLabel(profile.role)}</p>
          <span className="mt-2 rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary">{roleLabel(profile.role)}</span>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button type="button" disabled={busy} onClick={() => fileInput.current?.click()} className="btn-primary !px-4 !py-2">
              <Camera className="h-4 w-4" /> {busy ? tr('Yuklanmoqda…') : tr('Rasm yuklash')}
            </button>
            {profile.avatarUrl && (
              <button type="button" disabled={busy} onClick={removeAvatar} className="btn-secondary !px-4 !py-2">
                <Trash2 className="h-4 w-4" /> {tr("O'chirish")}
              </button>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-400">{tr('JPG, PNG yoki WEBP. Kvadratga kesiladi (512 px).')}</p>
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files[0];
              e.target.value = '';
              upload(f);
            }}
          />
        </div>

        <div className="card p-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-ink">{tr("Profil to'liqligi")}</p>
            <span className="text-sm font-bold text-primary">{completeness.percent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-bg-light">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${completeness.percent}%` }} />
          </div>
          {completeness.missing.length ? (
            <p className="mt-2 text-xs text-slate-500">{tr('Yetishmaydi:')} {completeness.missing.map((m) => trServer(m.label)).join(', ')}</p>
          ) : (
            <p className="mt-2 flex items-center gap-1 text-xs text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" /> {tr("Profil to'liq")}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-5 lg:col-span-2">
        <div className="card p-6">
          <Row label={tr('F.I.Sh.')}>{profile.fullName}</Row>
          <Row label={tr('Lavozim')}>{profile.position}</Row>
          <Row label={tr('Laboratoriya')}>{profile.labName}</Row>
          <Row label={tr('Rol')}>{roleLabel(profile.role)}</Row>
          <Row label={tr('Login')}>
            <span className="inline-flex items-center gap-2">
              <span className="font-mono text-xs">{profile.email}</span>
              <button type="button" onClick={copyLogin} className="rounded p-1 text-slate-400 hover:text-primary" title={tr('Nusxalash')}>
                <Copy className="h-3.5 w-3.5" />
              </button>
            </span>
          </Row>
          <Row label={tr('Hisob yaratilgan')}>{fmtDate(profile.createdAt)}</Row>
          <Row label={tr('Oxirgi kirish')}>{fmtDateTime(profile.lastLoginAt)}</Row>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            {profile.canRequestCorrection && (
              <button type="button" onClick={() => setCorrection(true)} className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                <MessageSquareWarning className="h-4 w-4" /> {tr("F.I.Sh. yoki lavozimda xato bormi? Tuzatishni so'rash")}
              </button>
            )}
            {profile.staffCard && (
              <a href={profile.staffCard.publicUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary">
                <ExternalLink className="h-4 w-4" /> {tr('Saytdagi mutaxassis sahifasi')}
              </a>
            )}
          </div>
        </div>

        <form onSubmit={save} className="card space-y-4 p-6">
          <p className="text-sm font-semibold text-ink">{tr('Kontaktlar')}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-ink">{tr('Telefon')}</span>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 123 45 67" inputMode="tel" maxLength={30} className="input-field" />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-ink">Telegram</span>
              <input value={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder="@username" maxLength={40} className="input-field" />
            </label>
          </div>
          <button type="submit" disabled={saving || !dirty} className="btn-primary !py-2">
            <Save className="h-4 w-4" /> {saving ? tr('Saqlanmoqda…') : tr('Saqlash')}
          </button>
        </form>

        <div className="card p-6">
          <p className="mb-3 text-sm font-semibold text-ink">{tr('Mening xulosam')}</p>
          {summary ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Stat to="/admin/vazifalar" icon={ListChecks} label={tr('Ochiq vazifalar')} value={summary.tasks.open} />
              <Stat to="/admin/vazifalar" icon={AlertTriangle} label={tr("Muddati o'tgan")} value={summary.tasks.overdue} tone={summary.tasks.overdue ? 'text-red-600' : 'text-slate-400'} />
              <Stat to="/admin/vazifalar" icon={CheckCircle2} label={tr('Shu oy bajarilgan')} value={summary.tasks.doneThisMonth} tone="text-emerald-600" />
              <Stat to="/admin/mening-profilim?tab=faoliyat" icon={Bell} label={tr("O'qilmagan bildirishnomalar")} value={summary.notifications.unread} tone="text-amber-600" />
            </div>
          ) : (
            <p className="text-sm text-slate-400">{tr("Xulosani yuklab bo'lmadi.")}</p>
          )}
        </div>
      </div>

      <Modal open={correction} onClose={() => setCorrection(false)} title={tr("Ma'lumotni tuzatish so'rovi")} size="md">
        <p className="mb-3 text-sm text-slate-600">{tr("F.I.Sh., lavozim yoki laboratoriyani faqat administrator o'zgartiradi. Nima noto'g'ri ekanini va to'g'risini yozing — administratorga vazifa bo'lib boradi.")}</p>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} maxLength={2000} className="input-field" placeholder={tr("Masalan: lavozimim «katta muhandis» bo'lishi kerak.")} />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={() => setCorrection(false)} className="btn-secondary !py-2">
            {tr('Bekor qilish')}
          </button>
          <button type="button" disabled={message.trim().length < 5} onClick={sendCorrection} className="btn-primary !py-2">
            {tr('Yuborish')}
          </button>
        </div>
      </Modal>
    </div>
  );
}
