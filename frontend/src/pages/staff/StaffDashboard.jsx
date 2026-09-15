import React, { useEffect, useState } from 'react';
import { User, Mail, Phone, Briefcase, Award, Camera, Clock } from 'lucide-react';
import { useStaffAuth } from '../../context/StaffAuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { updateStaffMe, uploadStaffPhoto, getStaffMyActivity } from '../../services/staffApi';
import { Loading } from '../../components/StateViews.jsx';

const ACTION_LABELS = {
  LOGIN: 'Tizimga kirish',
  LOGIN_FAILED: "Muvaffaqiyatsiz kirish urinishi",
  PROFILE_UPDATE: 'Profil yangilandi',
};

function formatDateTime(d) {
  return new Date(d).toLocaleString('uz-UZ', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function StaffDashboard() {
  const { staff, setStaff } = useStaffAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    email: staff.email || '',
    phone: staff.phone || '',
    specialization: staff.specialization || '',
    experienceYears: staff.experienceYears ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [activity, setActivity] = useState(null);

  useEffect(() => {
    getStaffMyActivity().then(setActivity).catch(() => setActivity([]));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateStaffMe({
        ...form,
        experienceYears: form.experienceYears === '' ? null : Number(form.experienceYears),
      });
      setStaff(updated);
      showToast('Profil saqlandi.', 'success');
    } catch {
      showToast('Xatolik yuz berdi.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const onPhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const res = await uploadStaffPhoto(file);
      const updated = await updateStaffMe({ photo: res.url });
      setStaff(updated);
      showToast('Rasm yangilandi.', 'success');
    } catch {
      showToast('Rasm yuklashda xatolik.', 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="card p-6 flex items-center gap-5">
        <div className="relative shrink-0">
          {staff.photo ? (
            <img src={staff.photo} alt="" className="h-20 w-20 rounded-full object-cover border border-border" />
          ) : (
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-9 w-9" />
            </span>
          )}
          <label className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white cursor-pointer border-2 border-white">
            <Camera className="h-3.5 w-3.5" />
            <input type="file" accept="image/*" className="hidden" onChange={onPhotoChange} disabled={uploadingPhoto} />
          </label>
        </div>
        <div>
          <h1 className="text-xl font-bold text-ink">{staff.fullName}</h1>
          <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1">
            <Briefcase className="h-3.5 w-3.5" /> {staff.position}
            {staff.laboratory && <span> — {staff.laboratory.nameUz}</span>}
          </p>
          {staff.experienceYears != null && (
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
              <Award className="h-3.5 w-3.5" /> {staff.experienceYears} yillik tajriba
            </p>
          )}
        </div>
      </div>

      <form onSubmit={save} className="card p-6 space-y-4">
        <p className="text-sm font-semibold text-ink">Profilni tahrirlash</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5 flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" /> Telefon
            </label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+998"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Mutaxassisligi</label>
            <input
              value={form.specialization}
              onChange={(e) => setForm({ ...form, specialization: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Tajriba (yil)</label>
            <input
              type="number"
              min={0}
              value={form.experienceYears}
              onChange={(e) => setForm({ ...form, experienceYears: e.target.value })}
              className="input-field"
            />
          </div>
        </div>
        <p className="text-xs text-slate-400">
          Ism, lavozim va boshqa rasmiy ma'lumotlarni faqat administrator o'zgartira oladi.
        </p>
        <button type="submit" disabled={saving} className="btn-primary w-full sm:w-auto">
          {saving ? 'Saqlanmoqda...' : 'Saqlash'}
        </button>
      </form>

      <div className="card p-6">
        <p className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4" /> Mening faoliyatim
        </p>
        {activity === null ? (
          <Loading />
        ) : activity.length === 0 ? (
          <p className="text-sm text-slate-500">Ma'lumot topilmadi.</p>
        ) : (
          <div className="space-y-2">
            {activity.map((a) => (
              <div key={a.id} className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0">
                <span className="text-ink font-medium">{ACTION_LABELS[a.action] || a.action}</span>
                <span className="text-slate-400 text-xs">{formatDateTime(a.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
