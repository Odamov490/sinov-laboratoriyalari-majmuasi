import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Plus, Pencil, Trash2, ArrowLeft } from 'lucide-react';
import { useToast } from '../../context/ToastContext.jsx';
import { adminSmk } from '../../services/adminApi';
import { Loading, EmptyState, ErrorState } from '../../components/StateViews.jsx';
import { ConfirmDialog } from '../../components/Modal.jsx';
import { tr } from '../../i18n/tr.js';
import { DEFAULT_HEADER } from './smk/smkDocument.js';
import SmkFormEditor from './smk/SmkFormEditor.jsx';

export { FIELD_TYPES } from './smk/SmkFormEditor.jsx';

// SMK formalar kutubxonasi (SUPER_ADMIN). Har bir forma — o'z shapkasi, matn
// bloklari va (ixtiyoriy) jadvaldan iborat; logo hammasida bir xil. Fayl
// yuklanmaydi — tayyor hujjat Word/PDF'ga tizimda chiqariladi. Tahrirlash —
// Word uslubidagi muharrirda (smk/SmkFormEditor.jsx).

const emptyForm = () => ({ code: '', title: '', description: '', fields: [], header: DEFAULT_HEADER(), order: 0, isActive: true });

export default function AdminSmkForms() {
  const { user } = useAuth();
  if (user.role !== 'SUPER_ADMIN') return <Navigate to="/admin/sifat" replace />;
  return <FormsLibrary />;
}

function FormsLibrary() {
  const { showToast } = useToast();
  const [items, setItems] = useState(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null); // {id?, ...form}
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = useCallback(() => {
    setError(false);
    adminSmk
      .listForms()
      .then((d) => setItems(d.items || []))
      .catch(() => setError(true));
  }, []);
  useEffect(load, [load]);

  const q = query.trim().toLowerCase();
  const visible = useMemo(() => (items || []).filter((f) => !q || `${f.code} ${f.title}`.toLowerCase().includes(q)), [items, q]);

  const remove = async (id) => {
    try {
      await adminSmk.removeForm(id);
      showToast(tr("O'chirildi."), 'success');
      load();
    } catch (err) {
      showToast(err?.response?.data?.error || tr('Xatolik yuz berdi.'), 'error');
    }
  };

  if (error) return <ErrorState onRetry={load} />;
  if (items === null) return <Loading />;

  return (
    <div>
      <Link to="/admin/sifat" className="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> {tr('Sifat menejmenti: laboratoriyalar')}
      </Link>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">{tr('Formalar kutubxonasi')}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {tr('Bu yerda yaratilgan formalarni har bir laboratoriya Sifat bo\'limida o\'ziga tanlab oladi.')}
          </p>
        </div>
        <button onClick={() => setEditing(emptyForm())} className="btn-primary !py-2.5">
          <Plus className="h-4 w-4" /> {tr('Yangi forma')}
        </button>
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={tr('Forma qidirish')}
        className="input-field mb-4 !w-full sm:!w-80"
      />

      <div className="card overflow-x-auto">
        {items.length === 0 ? (
          <EmptyState message={tr("Formalar kutubxonasi hozircha bo'sh.")} />
        ) : (
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="bg-bg-light text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">{tr('Kod')}</th>
                <th className="px-4 py-3">{tr('Nomi')}</th>
                <th className="px-4 py-3">{tr('Ustunlar')}</th>
                <th className="px-4 py-3">{tr('Laboratoriyalar')}</th>
                <th className="px-4 py-3">{tr('Yozuvlar')}</th>
                <th className="px-4 py-3">{tr('Holati')}</th>
                <th className="px-4 py-3 text-right">{tr('Amallar')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visible.map((f) => (
                <tr key={f.id} className="hover:bg-bg-light/60">
                  <td className="px-4 py-3 font-semibold text-slate-600">{f.code}</td>
                  <td className="max-w-[360px] px-4 py-3 text-ink">{f.title}</td>
                  <td className="px-4 py-3">{(f.fields || []).length}</td>
                  <td className="px-4 py-3">{f.labCount}</td>
                  <td className="px-4 py-3">{f.entryCount}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                        f.isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-500'
                      }`}
                    >
                      {f.isActive ? tr('Faol') : tr('Nofaol')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setEditing({ ...emptyForm(), ...f })} className="rounded-lg p-2 text-primary hover:bg-bg-light" title={tr('Tahrirlash')}>
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => setConfirmDelete(f)} className="rounded-lg p-2 text-red-500 hover:bg-red-50" title={tr("O'chirish")}>
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

      {editing && (
        <SmkFormEditor
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => remove(confirmDelete.id)}
        message={
          confirmDelete?.entryCount > 0
            ? tr(
                "\"{0}\" formasi va uning {1} ta to'ldirilgan yozuvi butunlay o'chiriladi. Bu amalni qaytarib bo'lmaydi. Davom etasizmi?",
                `${confirmDelete.code} ${confirmDelete.title}`,
                confirmDelete.entryCount
              )
            : tr('"{0}" formasini o\'chirasizmi?', confirmDelete ? `${confirmDelete.code} ${confirmDelete.title}` : '')
        }
      />
    </div>
  );
}
