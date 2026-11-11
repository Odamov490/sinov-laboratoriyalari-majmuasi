import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FlaskConical, Search, ChevronRight, FileText, ListPlus, Library } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { adminSmk } from '../../services/adminApi';
import { Loading, EmptyState, ErrorState } from '../../components/StateViews.jsx';
import { Modal } from '../../components/Modal.jsx';
import { tr, locName } from '../../i18n/tr.js';

// Sifat bo'limi: har bir laboratoriya — kanban ustuni, ichida u tanlagan SMK
// formalari (bosilganda /admin/sifat/<lab>/<formId> — yozuvlar ochiladi).
// Ustundagi "Formalarni tanlash" — kutubxonadan kerakli formalarni biriktirish.
export default function AdminSifat() {
  const { user } = useAuth();
  const [labs, setLabs] = useState(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [picking, setPicking] = useState(null); // lab

  const load = useCallback(() => {
    setError(false);
    adminSmk
      .board()
      .then((d) => setLabs(d.labs || []))
      .catch(() => setError(true));
  }, []);
  useEffect(load, [load]);

  const q = query.trim().toLowerCase();
  const match = useCallback((f) => !q || `${f.code} ${f.title}`.toLowerCase().includes(q), [q]);

  if (error) return <ErrorState onRetry={load} />;
  if (labs === null) return <Loading />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">{tr('Sifat menejmenti: laboratoriyalar')}</h1>
          <p className="mt-1 text-sm text-slate-500">{tr('Har bir laboratoriya o\'ziga kerakli SMK formalarini tanlaydi va to\'ldiradi.')}</p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          {user.role === 'SUPER_ADMIN' && (
            <Link to="/admin/sifat-formalar" className="btn-secondary !py-2.5">
              <Library className="h-4 w-4" /> {tr('Formalar kutubxonasi')}
            </Link>
          )}
          <label className="relative block w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tr('Forma qidirish')}
              className="input-field w-full !pl-9"
            />
          </label>
        </div>
      </div>

      {labs.length === 0 ? (
        <EmptyState message={tr('Laboratoriya topilmadi.')} />
      ) : (
        <div className="-mx-1 flex items-start gap-4 overflow-x-auto px-1 pb-4">
          {labs.map((lab) => {
            const forms = lab.forms.filter(match);
            return (
              <section key={lab.id} className="flex w-72 shrink-0 flex-col rounded-xl border border-border bg-slate-50">
                <header className="rounded-t-xl border-b border-border bg-white px-4 py-3">
                  <div className="flex items-start gap-2">
                    <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <h2 className="flex-1 text-sm font-semibold leading-snug text-ink">{locName(lab)}</h2>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{lab.forms.length}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPicking(lab)}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                  >
                    <ListPlus className="h-3.5 w-3.5" /> {tr('Formalarni tanlash')}
                  </button>
                </header>
                <div className="flex flex-col gap-2 p-3">
                  {forms.map((f) => (
                    <Link
                      key={f.id}
                      to={`/admin/sifat/${lab.slug}/${f.id}`}
                      className="group flex items-center gap-3 rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink shadow-sm transition hover:border-primary/40 hover:shadow"
                    >
                      <FileText className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-primary" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[11px] font-semibold text-slate-400">{f.code}</span>
                        <span className="block leading-snug">{f.title}</span>
                      </span>
                      {f.entryCount > 0 && (
                        <span className="rounded-full bg-slate-100 px-1.5 text-[11px] font-medium text-slate-500">{f.entryCount}</span>
                      )}
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-primary" />
                    </Link>
                  ))}
                  {lab.forms.length === 0 ? (
                    <p className="px-1 py-3 text-center text-xs text-slate-400">{tr('Hali forma tanlanmagan.')}</p>
                  ) : (
                    forms.length === 0 && <p className="px-1 py-2 text-xs text-slate-400">—</p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {picking && <FormPicker lab={picking} onClose={() => setPicking(null)} onSaved={load} />}
    </div>
  );
}

// Kutubxonadagi faol formalardan laboratoriya uchun keraklilarini belgilash.
function FormPicker({ lab, onClose, onSaved }) {
  const { showToast } = useToast();
  const [forms, setForms] = useState(null);
  const [selected, setSelected] = useState(() => new Set(lab.forms.map((f) => f.id)));
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminSmk
      .listForms({ active: 'true' })
      .then((d) => setForms(d.items || []))
      .catch(() => setForms([]));
  }, []);

  const q = query.trim().toLowerCase();
  const visible = useMemo(() => (forms || []).filter((f) => !q || `${f.code} ${f.title}`.toLowerCase().includes(q)), [forms, q]);
  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const save = async () => {
    setSaving(true);
    try {
      await adminSmk.setLabForms(lab.id, [...selected]);
      showToast(tr('Formalar saqlandi.'), 'success');
      onSaved();
      onClose();
    } catch (err) {
      showToast(err?.response?.data?.error || tr('Xatolik yuz berdi.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={`${tr('Formalarni tanlash')} — ${locName(lab)}`} size="lg">
      {forms === null ? (
        <Loading />
      ) : forms.length === 0 ? (
        <EmptyState message={tr("Formalar kutubxonasi hozircha bo'sh.")} />
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tr('Forma qidirish')}
              className="input-field !w-full sm:!w-64"
            />
            <span className="text-sm text-slate-500">{tr('Tanlangan: {0}', selected.size)}</span>
          </div>
          <div className="max-h-[50vh] space-y-1 overflow-y-auto rounded-lg border border-border p-2">
            {visible.map((f) => (
              <label key={f.id} className="flex cursor-pointer items-start gap-3 rounded px-2 py-2 text-sm hover:bg-bg-light">
                <input
                  type="checkbox"
                  checked={selected.has(f.id)}
                  onChange={() => toggle(f.id)}
                  className="mt-0.5 h-4 w-4 rounded border-border text-primary"
                />
                <span>
                  <span className="mr-2 font-semibold text-slate-500">{f.code}</span>
                  <span className="text-ink">{f.title}</span>
                </span>
              </label>
            ))}
            {visible.length === 0 && <p className="px-2 py-2 text-sm text-slate-400">—</p>}
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {tr("Forma olib tashlansa ham, uning to'ldirilgan yozuvlari o'chmaydi — qayta tanlansa yana ko'rinadi.")}
          </p>
        </>
      )}
      <div className="mt-5 flex justify-end gap-3">
        <button onClick={onClose} className="btn-secondary">{tr('Bekor qilish')}</button>
        <button onClick={save} disabled={saving || forms === null} className="btn-primary">
          {saving ? tr('Saqlanmoqda...') : tr('Saqlash')}
        </button>
      </div>
    </Modal>
  );
}
