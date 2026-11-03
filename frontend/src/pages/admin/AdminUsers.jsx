import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, KeyRound, UserPlus, Copy, Download, Printer, AlertTriangle, Lock, MessageCircle, MessageCircleOff } from 'lucide-react';
import { adminUsers, adminResource, adminAccounts } from '../../services/adminApi';
import { Loading, EmptyState, ErrorState } from '../../components/StateViews.jsx';
import { Modal, ConfirmDialog } from '../../components/Modal.jsx';
import { Select, SearchBar } from '../../components/UI.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { passwordProblem } from '../../components/admin/ChangePasswordForm.jsx';
import { ROLE_LABELS, roleLabel } from '../../utils/roles';

const ROLES = ['SUPER_ADMIN', 'MANAGER', 'EDITOR', 'STAFF'].map((value) => ({ value, label: ROLE_LABELS[value] }));
// Mutaxassislardan ommaviy yaratishda Super admin berilmaydi.
const BULK_ROLES = ['STAFF', 'EDITOR', 'MANAGER'].map((value) => ({ value, label: ROLE_LABELS[value] }));
const ACTIVE_OPTIONS = [
  { value: 'active', label: 'Faol' },
  { value: 'inactive', label: 'Faol emas' },
];
const ROW_STATUS = {
  ok: { label: 'Tayyor', color: 'bg-emerald-100 text-emerald-700' },
  review: { label: 'Tekshiring', color: 'bg-amber-100 text-amber-700' },
  error: { label: 'Xato', color: 'bg-red-100 text-red-700' },
  skipped: { label: "O'tkazildi", color: 'bg-slate-100 text-slate-500' },
};

const apiError = (err) => {
  const d = err?.response?.data;
  return d?.details?.[0]?.message || d?.error || 'Xatolik yuz berdi.';
};
const formatDateTime = (v) => (v ? new Date(v).toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' }) : '—');
const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const loginUrl = () => `${window.location.origin}/admin/login`;

// ---------- one-time credentials (create / reset) ----------

function CredentialsDialog({ result, onClose }) {
  const { showToast } = useToast();
  if (!result) return null;
  const rows = result.items;

  const asText = () =>
    rows.map((r) => `${r.fullName}${r.laboratoryName ? ` (${r.laboratoryName})` : ''}\nLogin: ${r.email}\nParol: ${r.password}`).join('\n\n') +
    `\n\nKirish manzili: ${loginUrl()}`;

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(asText());
      showToast('Nusxa olindi.', 'success');
    } catch {
      showToast("Nusxa olib bo'lmadi — ma'lumotlarni qo'lda belgilang.", 'error');
    }
  };

  const downloadCsv = () => {
    const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [['F.I.Sh.', 'Laboratoriya', 'Login', 'Vaqtinchalik parol'], ...rows.map((r) => [r.fullName, r.laboratoryName, r.email, r.password])];
    const csv = '﻿' + lines.map((l) => l.map(cell).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `hisoblar-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Har bir xodimga kesib beriladigan alohida varaqcha.
  const print = () => {
    const w = window.open('', '_blank', 'width=800,height=900');
    if (!w) {
      showToast("Chop etish oynasi bloklandi — brauzerda qalqib chiquvchi oynalarga ruxsat bering.", 'error');
      return;
    }
    const slips = rows
      .map(
        (r) => `<div class="slip">
  <h2>${escapeHtml(r.fullName)}</h2>
  ${r.laboratoryName ? `<p class="lab">${escapeHtml(r.laboratoryName)}</p>` : ''}
  <table>
    <tr><td>Sayt</td><td><b>${escapeHtml(loginUrl())}</b></td></tr>
    <tr><td>Login</td><td><b class="mono">${escapeHtml(r.email)}</b></td></tr>
    <tr><td>Vaqtinchalik parol</td><td><b class="mono">${escapeHtml(r.password)}</b></td></tr>
  </table>
  <p class="hint">Kirishda faqat ism yozsangiz ham bo'ladi (masalan: <b>${escapeHtml(r.email.split('@')[0])}</b>). Birinchi kirishda parolni almashtirasiz.</p>
</div>`
      )
      .join('');
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Kirish ma'lumotlari</title>
<style>
body{font-family:Arial,sans-serif;margin:16px;color:#111}
.slip{border:1px dashed #555;padding:14px 18px;margin-bottom:14px;page-break-inside:avoid}
h2{margin:0 0 2px;font-size:17px}.lab{margin:0 0 8px;color:#555;font-size:13px}
table{border-collapse:collapse;font-size:14px}td{padding:3px 12px 3px 0;vertical-align:top}
.mono{font-family:Consolas,monospace;font-size:15px;letter-spacing:.5px}.hint{margin:8px 0 0;font-size:12px;color:#444}
</style></head><body>${slips}<script>window.onload=function(){window.print()}<\/script></body></html>`);
    w.document.close();
  };

  return (
    <Modal open onClose={onClose} title={result.title} size="xl">
      <div className="space-y-4">
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          Parollar oyna yopilgach qayta ko'rinmaydi. Hozir nusxa oling, yuklab oling yoki chop eting.
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={copyAll} className="btn-secondary !py-2">
            <Copy className="h-4 w-4" /> Hammasini nusxalash
          </button>
          <button onClick={downloadCsv} className="btn-secondary !py-2">
            <Download className="h-4 w-4" /> CSV yuklab olish
          </button>
          <button onClick={print} className="btn-secondary !py-2">
            <Printer className="h-4 w-4" /> Chop etish
          </button>
        </div>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-bg-light text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">F.I.Sh.</th>
                <th className="px-3 py-2">Laboratoriya</th>
                <th className="px-3 py-2">Login</th>
                <th className="px-3 py-2">Vaqtinchalik parol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <tr key={r.email}>
                  <td className="px-3 py-2 font-medium text-ink">{r.fullName}</td>
                  <td className="px-3 py-2 text-slate-500">{r.laboratoryName || '—'}</td>
                  <td className="px-3 py-2 font-mono">{r.email}</td>
                  <td className="px-3 py-2 font-mono font-semibold">{r.password}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {result.notCreated?.length > 0 && (
          <div className="text-sm text-slate-600">
            <p className="font-medium text-ink">Yaratilmaganlar ({result.notCreated.length}):</p>
            <ul className="mt-1 list-disc pl-5">
              {result.notCreated.map((r) => (
                <li key={r.staffId}>
                  {r.fullName || r.staffId} — {r.message}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex justify-end">
          <button onClick={onClose} className="btn-primary">
            Yopish
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ---------- accounts from specialists ----------

function FromStaffDialog({ open, onClose, onCreated }) {
  const { showToast } = useToast();
  const [staff, setStaff] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [labFilter, setLabFilter] = useState('');
  const [role, setRole] = useState('STAFF');
  const [rows, setRows] = useState(null); // dry-run natijasi
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStaff(null);
    setRows(null);
    setRole('STAFF');
    setLabFilter('');
    adminAccounts
      .staffWithoutAccount()
      .then((r) => {
        setStaff(r.items);
        setSelected(new Set(r.items.map((s) => s.id)));
      })
      .catch((err) => {
        showToast(apiError(err), 'error');
        setStaff([]);
      });
  }, [open, showToast]);

  const labs = useMemo(() => {
    const m = new Map();
    (staff || []).forEach((s) => m.set(s.laboratoryId || '', s.laboratoryName || 'Laboratoriyasiz'));
    return [...m].map(([value, label]) => ({ value: value || '__none', label }));
  }, [staff]);

  const visible = (staff || []).filter((s) => !labFilter || (labFilter === '__none' ? !s.laboratoryId : s.laboratoryId === labFilter));
  const allVisibleSelected = visible.length > 0 && visible.every((s) => selected.has(s.id));

  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      visible.forEach((s) => (allVisibleSelected ? next.delete(s.id) : next.add(s.id)));
      return next;
    });

  const dryRun = async (items) => {
    setBusy(true);
    try {
      const r = await adminAccounts.fromStaff({ items, role, dryRun: true });
      setRows(r.rows);
    } catch (err) {
      showToast(apiError(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const itemsFromRows = () => rows.filter((r) => r.status !== 'skipped').map((r) => ({ staffId: r.staffId, email: r.email || null }));

  const create = async () => {
    setBusy(true);
    try {
      const r = await adminAccounts.fromStaff({ items: itemsFromRows(), role, dryRun: false });
      onCreated({ title: `Yaratilgan hisoblar (${r.created.length})`, items: r.created, notCreated: r.notCreated });
    } catch (err) {
      showToast(apiError(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const okCount = rows?.filter((r) => r.status === 'ok').length || 0;
  const problemCount = rows?.filter((r) => r.status === 'review' || r.status === 'error').length || 0;

  return (
    <Modal open={open} onClose={onClose} title="Mutaxassislardan hisob yaratish" size="xl">
      {staff === null ? (
        <Loading />
      ) : staff.length === 0 ? (
        <EmptyState message="Hisobi yo'q faol mutaxassis qolmadi." />
      ) : !rows ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Beriladigan rol</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="input-field">
                {BULK_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Laboratoriya</label>
              <Select value={labFilter} onChange={setLabFilter} options={labs} placeholder="Barchasi" />
            </div>
          </div>
          <div className="max-h-[45vh] overflow-y-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-bg-light text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="w-10 px-3 py-2">
                    <input type="checkbox" checked={allVisibleSelected} onChange={toggleAll} className="h-4 w-4" aria-label="Hammasini tanlash" />
                  </th>
                  <th className="px-3 py-2">F.I.Sh.</th>
                  <th className="px-3 py-2">Lavozim</th>
                  <th className="px-3 py-2">Laboratoriya</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visible.map((s) => (
                  <tr key={s.id} onClick={() => toggle(s.id)} className="cursor-pointer hover:bg-bg-light">
                    <td className="px-3 py-2">
                      <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)} onClick={(e) => e.stopPropagation()} className="h-4 w-4" />
                    </td>
                    <td className="px-3 py-2 font-medium text-ink">{s.fullName}</td>
                    <td className="px-3 py-2 text-slate-500">{s.position}</td>
                    <td className="px-3 py-2 text-slate-500">{s.laboratoryName || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">Tanlangan: {selected.size}</p>
            <button
              onClick={() => dryRun([...selected].map((staffId) => ({ staffId })))}
              disabled={busy || selected.size === 0}
              className="btn-primary"
            >
              {busy ? 'Tekshirilmoqda...' : "Loginlarni ko'rish"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Taklif qilingan loginlarni tekshiring va kerak bo'lsa o'zgartiring (faqat ism yozsangiz, @-qismi avtomatik qo'shiladi). Bu manzillar haqiqiy pochta
            emas — faqat kirish nomi.
          </p>
          <div className="max-h-[50vh] overflow-y-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-bg-light text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">F.I.Sh.</th>
                  <th className="px-3 py-2">Laboratoriya</th>
                  <th className="px-3 py-2">Login</th>
                  <th className="px-3 py-2">Holat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r, i) => (
                  <tr key={r.staffId} className={r.status === 'error' || r.status === 'review' ? 'bg-amber-50/50' : ''}>
                    <td className="px-3 py-2 font-medium text-ink">{r.fullName}</td>
                    <td className="px-3 py-2 text-slate-500">{r.laboratoryName || '—'}</td>
                    <td className="px-3 py-2">
                      {r.status === 'skipped' ? (
                        '—'
                      ) : (
                        <input
                          value={r.email || ''}
                          onChange={(e) => setRows((list) => list.map((x, j) => (j === i ? { ...x, email: e.target.value } : x)))}
                          className="input-field !py-1.5 font-mono"
                          placeholder="ism@slm.uz"
                        />
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROW_STATUS[r.status].color}`}>{ROW_STATUS[r.status].label}</span>
                      {r.message && <p className="mt-1 text-xs text-slate-500">{r.message}</p>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setRows(null)} className="btn-secondary !py-2">
                Orqaga
              </button>
              <button onClick={() => dryRun(itemsFromRows())} disabled={busy} className="btn-secondary !py-2">
                Qayta tekshirish
              </button>
            </div>
            <div className="flex items-center gap-3">
              {problemCount > 0 && <span className="text-xs text-amber-700">{problemCount} ta qator yaratilmaydi</span>}
              <button onClick={create} disabled={busy || okCount === 0} className="btn-primary">
                {busy ? 'Yaratilmoqda...' : `${okCount} ta hisob yaratish (${roleLabel(role)})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ---------- page ----------

const EMPTY_CREATE = { fullName: '', email: '', password: '', role: 'STAFF', labId: '' };

export default function AdminUsers() {
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [labs, setLabs] = useState([]);

  const [q, setQ] = useState('');
  const [labFilter, setLabFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [showNoAccount, setShowNoAccount] = useState(false);
  const [noAccount, setNoAccount] = useState(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ fullName: '', role: 'STAFF', isActive: true, password: '', labId: '' });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmReset, setConfirmReset] = useState(null);
  const [fromStaffOpen, setFromStaffOpen] = useState(false);
  const [credentials, setCredentials] = useState(null);

  const load = () => {
    setError(false);
    adminUsers.list().then(setData).catch(() => setError(true));
  };
  const loadNoAccount = () =>
    adminAccounts
      .staffWithoutAccount()
      .then((r) => setNoAccount(r.items))
      .catch(() => setNoAccount([]));

  useEffect(load, []);
  useEffect(() => {
    adminResource('laboratories')
      .list({ pageSize: 200 })
      .then((d) => setLabs(d.items))
      .catch(() => setLabs([]));
  }, []);
  useEffect(() => {
    if (showNoAccount) loadNoAccount();
  }, [showNoAccount]);

  const labOptions = labs.map((l) => ({ value: l.id, label: l.nameUz }));

  const users = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (data?.items || []).filter(
      (u) =>
        (!s || u.fullName.toLowerCase().includes(s) || u.email.toLowerCase().includes(s)) &&
        (!labFilter || u.effectiveLabId === labFilter) &&
        (!roleFilter || u.role === roleFilter) &&
        (!activeFilter || (activeFilter === 'active') === u.isActive)
    );
  }, [data, q, labFilter, roleFilter, activeFilter]);

  const noAccountRows = (noAccount || []).filter(
    (s) => (!labFilter || s.laboratoryId === labFilter) && (!q.trim() || s.fullName.toLowerCase().includes(q.trim().toLowerCase()))
  );

  const createPwProblem = createForm.password ? passwordProblem(createForm.password) : null;
  const editPwProblem = editForm.password ? passwordProblem(editForm.password) : null;

  const createUser = async () => {
    setSaving(true);
    try {
      const payload = { ...createForm, labId: createForm.role === 'SUPER_ADMIN' ? null : createForm.labId || null };
      await adminUsers.create(payload);
      showToast('Foydalanuvchi yaratildi.', 'success');
      setCreateOpen(false);
      load();
    } catch (err) {
      showToast(apiError(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setEditForm({ fullName: user.fullName, role: user.role, isActive: user.isActive, password: '', labId: user.labId || '' });
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const payload = {
        fullName: editForm.fullName,
        role: editForm.role,
        isActive: editForm.isActive,
        labId: editForm.role === 'SUPER_ADMIN' ? null : editForm.labId || null,
      };
      if (editForm.password) payload.password = editForm.password;
      await adminUsers.update(editingUser.id, payload);
      showToast('Yangilandi.', 'success');
      setEditingUser(null);
      load();
    } catch (err) {
      showToast(apiError(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    try {
      await adminUsers.remove(id);
      showToast("O'chirildi.", 'success');
      load();
    } catch (err) {
      showToast(apiError(err), 'error');
    }
  };

  const resetPassword = async (user) => {
    try {
      const r = await adminAccounts.resetPassword(user.id);
      setCredentials({ title: 'Yangi vaqtinchalik parol', items: [r] });
      load();
    } catch (err) {
      showToast(apiError(err), 'error');
    }
  };

  const labSelect = (form, setForm) =>
    form.role !== 'SUPER_ADMIN' && (
      <div>
        <label className="block text-sm font-medium text-ink mb-1.5">Laboratoriya</label>
        <Select value={form.labId} onChange={(v) => setForm({ ...form, labId: v })} placeholder="Mutaxassis kartasidagi / tanlanmagan" options={labOptions} />
      </div>
    );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-ink">Foydalanuvchilar</h1>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFromStaffOpen(true)} className="btn-secondary !py-2.5">
            <UserPlus className="h-4 w-4" /> Mutaxassislardan hisob yaratish
          </button>
          <button
            onClick={() => {
              setCreateForm(EMPTY_CREATE);
              setCreateOpen(true);
            }}
            className="btn-primary !py-2.5"
          >
            <Plus className="h-4 w-4" /> Qo'shish
          </button>
        </div>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <SearchBar value={q} onChange={setQ} placeholder="Ism yoki login bo'yicha qidirish..." />
        </div>
        <Select value={labFilter} onChange={setLabFilter} options={labOptions} placeholder="Barcha laboratoriyalar" />
        {!showNoAccount && <Select value={roleFilter} onChange={setRoleFilter} options={ROLES} placeholder="Barcha rollar" />}
        {!showNoAccount && <Select value={activeFilter} onChange={setActiveFilter} options={ACTIVE_OPTIONS} placeholder="Faol va nofaol" />}
      </div>
      <label className="mb-4 inline-flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" checked={showNoAccount} onChange={(e) => setShowNoAccount(e.target.checked)} className="h-4 w-4 rounded border-border" />
        Hisobsiz mutaxassislar
      </label>

      <div className="card overflow-x-auto">
        {showNoAccount ? (
          noAccount === null ? (
            <Loading />
          ) : noAccountRows.length === 0 ? (
            <EmptyState message="Hisobi yo'q faol mutaxassis yo'q." />
          ) : (
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="bg-bg-light text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">F.I.Sh.</th>
                  <th className="px-4 py-3">Lavozim</th>
                  <th className="px-4 py-3">Laboratoriya</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {noAccountRows.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3 font-medium text-ink">{s.fullName}</td>
                    <td className="px-4 py-3 text-slate-500">{s.position}</td>
                    <td className="px-4 py-3 text-slate-500">{s.laboratoryName || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : error ? (
          <div className="p-6">
            <ErrorState onRetry={load} />
          </div>
        ) : data === null ? (
          <Loading />
        ) : users.length === 0 ? (
          <EmptyState />
        ) : (
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="bg-bg-light text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">F.I.Sh.</th>
                <th className="px-4 py-3">Login</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Laboratoriya</th>
                <th className="px-4 py-3">Lavozim</th>
                <th className="px-4 py-3">Oxirgi kirish</th>
                <th className="px-4 py-3">Holat</th>
                <th className="px-4 py-3">Chat</th>
                <th className="px-4 py-3 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-medium text-ink">{u.fullName}</td>
                  <td className="px-4 py-3 font-mono text-xs">{u.email}</td>
                  <td className="px-4 py-3">{roleLabel(u.role)}</td>
                  <td className="px-4 py-3 text-slate-500">{u.labName || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{u.position || '—'}</td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDateTime(u.lastLoginAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold ${u.isActive ? 'text-emerald-600' : 'text-red-500'}`}>{u.isActive ? 'Faol' : 'Faol emas'}</span>
                    {u.locked && (
                      <span className="ml-1 inline-flex items-center gap-0.5 text-xs text-amber-600" title="Ko'p noto'g'ri urinish — 15 daqiqaga bloklangan">
                        <Lock className="h-3 w-3" /> bloklangan
                      </span>
                    )}
                    {u.mustChangePassword && <p className="text-[11px] text-slate-400">parol almashtirilmagan</p>}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={async () => {
                        try {
                          await adminUsers.update(u.id, { chatEnabled: u.chatEnabled === false });
                          load();
                        } catch {
                          showToast("Chat holatini o'zgartirib bo'lmadi.", 'error');
                        }
                      }}
                      className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium ${u.chatEnabled === false ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-700'}`}
                      title={u.chatEnabled === false ? 'Chatni yoqish' : "Chatni o'chirish"}
                    >
                      {u.chatEnabled === false ? <MessageCircleOff className="h-3.5 w-3.5" /> : <MessageCircle className="h-3.5 w-3.5" />}
                      {u.chatEnabled === false ? "O'chirilgan" : 'Yoqilgan'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setConfirmReset(u)} className="p-2 rounded-lg hover:bg-bg-light text-amber-600" title="Parolni tiklash">
                        <KeyRound className="h-4 w-4" />
                      </button>
                      <button onClick={() => openEdit(u)} className="p-2 rounded-lg hover:bg-bg-light text-primary" title="Tahrirlash">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => setConfirmDelete(u.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500" title="O'chirish">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Yangi foydalanuvchi" size="sm">
        <div className="space-y-4">
          <input placeholder="F.I.Sh." value={createForm.fullName} onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })} className="input-field" />
          <div>
            <input
              placeholder="ism@slm.uz"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              className="input-field"
              autoComplete="off"
            />
            <p className="mt-1 text-xs text-slate-400">Login — haqiqiy pochta emas. Faqat ism yozsangiz, @-qismi avtomatik qo'shiladi.</p>
          </div>
          <div>
            <input
              placeholder="Parol"
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              className="input-field"
              autoComplete="new-password"
            />
            <p className={`mt-1 text-xs ${createPwProblem ? 'text-red-600' : 'text-slate-400'}`}>{createPwProblem || "Kamida 10 belgi, harf va raqam bo'lishi kerak."}</p>
          </div>
          <Select value={createForm.role} onChange={(v) => setCreateForm({ ...createForm, role: v || 'STAFF' })} placeholder="Rol" options={ROLES} />
          {labSelect(createForm, setCreateForm)}
          <button onClick={createUser} disabled={saving || Boolean(createPwProblem) || !createForm.password} className="btn-primary w-full">
            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </Modal>

      <Modal open={!!editingUser} onClose={() => setEditingUser(null)} title="Foydalanuvchini tahrirlash" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Login: <span className="font-mono text-ink">{editingUser?.email}</span>
            {editingUser?.position ? ` · ${editingUser.position}` : ''}
          </p>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">F.I.Sh.</label>
            <input value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Rol</label>
            <Select value={editForm.role} onChange={(v) => setEditForm({ ...editForm, role: v || editForm.role })} placeholder="Rol" options={ROLES} />
          </div>
          {labSelect(editForm, setEditForm)}
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={editForm.isActive}
              onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-border text-primary"
            />
            Faol
          </label>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Yangi parol (ixtiyoriy)</label>
            <input
              type="password"
              value={editForm.password}
              onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
              className="input-field"
              placeholder="Bo'sh qoldirsangiz o'zgarmaydi"
              autoComplete="new-password"
            />
            {editPwProblem && <p className="mt-1 text-xs text-red-600">{editPwProblem}</p>}
            <p className="mt-1 text-xs text-slate-400">Xodimga vaqtinchalik parol berish uchun «Parolni tiklash» tugmasidan foydalaning.</p>
          </div>
          <button onClick={saveEdit} disabled={saving || Boolean(editPwProblem)} className="btn-primary w-full">
            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </Modal>

      <FromStaffDialog
        open={fromStaffOpen}
        onClose={() => setFromStaffOpen(false)}
        onCreated={(result) => {
          setFromStaffOpen(false);
          setCredentials(result);
          load();
          if (showNoAccount) loadNoAccount();
        }}
      />

      <CredentialsDialog result={credentials} onClose={() => setCredentials(null)} />

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => remove(confirmDelete)}
        message="Ushbu foydalanuvchini o'chirmoqchimisiz?"
      />

      <Modal open={!!confirmReset} onClose={() => setConfirmReset(null)} title="Parolni tiklash" size="sm">
        <p className="text-sm text-slate-600">
          <b>{confirmReset?.fullName}</b> uchun yangi vaqtinchalik parol yaratiladi. Eski parol ishlamay qoladi, xodim birinchi kirishda parolni almashtiradi.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => setConfirmReset(null)} className="btn-secondary">
            Bekor qilish
          </button>
          <button
            onClick={() => {
              const u = confirmReset;
              setConfirmReset(null);
              resetPassword(u);
            }}
            className="btn-primary"
          >
            Parolni tiklash
          </button>
        </div>
      </Modal>
    </div>
  );
}
