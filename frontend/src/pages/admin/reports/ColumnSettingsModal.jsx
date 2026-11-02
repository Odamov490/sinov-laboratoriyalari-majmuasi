import React, { useEffect, useState } from 'react';
import { ArrowUp, ArrowDown, GripVertical, Trash2, Plus, RotateCcw } from 'lucide-react';
import { Modal } from '../../../components/Modal.jsx';
import { adminTestJournal } from '../../../services/adminApi';
import { useToast } from '../../../context/ToastContext.jsx';
import { COLUMNS, CUSTOM_TYPES, resolveColumns } from './journalColumns.jsx';

const ctx = { brandLabel: 'Marka' };

const toRows = (layout) =>
  resolveColumns(layout, true).map((c) => ({
    key: c.key,
    label: c.custom ? c.label() : c.label(ctx),
    hidden: c.hidden,
    custom: Boolean(c.custom),
    type: c.type,
  }));

const newKey = () => `c_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

// SUPER_ADMIN-only editor of the shared journal layout: drag (or arrows) to
// reorder, untick to hide, add/rename/remove extra columns.
export default function ColumnSettingsModal({ open, layout, onClose, onSaved }) {
  const { showToast } = useToast();
  const [rows, setRows] = useState([]);
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState('text');
  const [dragIndex, setDragIndex] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setRows(toRows(layout));
      setNewLabel('');
      setNewType('text');
    }
  }, [open, layout]);

  const move = (from, to) => {
    if (to < 0 || to >= rows.length || from === to) return;
    setRows((rs) => {
      const next = [...rs];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const patch = (key, changes) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...changes } : r)));

  const addColumn = () => {
    const label = newLabel.trim();
    if (!label) return;
    setRows((rs) => [...rs, { key: newKey(), label, hidden: false, custom: true, type: newType }]);
    setNewLabel('');
  };

  // Built-in columns back to the code order, all visible; extra columns kept at the end.
  const reset = () => {
    const custom = rows.filter((r) => r.custom);
    setRows([...toRows(null), ...custom.map((r) => ({ ...r, hidden: false }))]);
  };

  const save = async () => {
    if (rows.some((r) => r.custom && !r.label.trim())) {
      showToast("Qo'shimcha ustun nomini kiriting.", 'error');
      return;
    }
    setSaving(true);
    try {
      const columns = rows.map((r) =>
        r.custom
          ? { key: r.key, hidden: r.hidden, custom: true, label: r.label.trim(), type: r.type }
          : { key: r.key, hidden: r.hidden }
      );
      const res = await adminTestJournal.saveLayout(columns);
      showToast('Ustunlar saqlandi.', 'success');
      onSaved(res.columns);
    } catch (err) {
      showToast(err?.response?.data?.error || 'Saqlashda xatolik yuz berdi.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const builtinCount = COLUMNS.length;

  return (
    <Modal open={open} onClose={onClose} title="Jadval ustunlari" size="lg">
      <p className="mb-3 text-sm text-slate-500">
        Ustunni sudrab yoki strelkalar bilan joyini o'zgartiring, belgini olib tashlab yashiring. Sozlama barcha foydalanuvchilar uchun
        bir xil. Jadval va Excel eksporti shu tartibda bo'ladi.
      </p>

      <ul className="space-y-1">
        {rows.map((r, i) => (
          <li
            key={r.key}
            draggable
            onDragStart={() => setDragIndex(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragIndex !== null) move(dragIndex, i);
              setDragIndex(null);
            }}
            onDragEnd={() => setDragIndex(null)}
            className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-sm ${
              dragIndex === i ? 'border-primary bg-primary/5' : 'border-border bg-white'
            } ${r.hidden ? 'opacity-60' : ''}`}
          >
            <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-slate-400" aria-hidden="true" />
            <input
              type="checkbox"
              checked={!r.hidden}
              onChange={(e) => patch(r.key, { hidden: !e.target.checked })}
              className="h-4 w-4 shrink-0 rounded border-border text-primary"
              aria-label={`${r.label} ko'rinadi`}
            />
            {r.custom ? (
              <>
                <input
                  value={r.label}
                  onChange={(e) => patch(r.key, { label: e.target.value })}
                  className="input-field !py-1 text-sm flex-1 min-w-0"
                  aria-label="Ustun nomi"
                />
                <select
                  value={r.type}
                  onChange={(e) => patch(r.key, { type: e.target.value })}
                  className="input-field !w-auto !py-1 text-xs"
                  aria-label="Ustun turi"
                >
                  {Object.entries(CUSTOM_TYPES).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <span className="flex-1 min-w-0 truncate text-ink" title={r.label}>
                {r.label}
              </span>
            )}
            <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} className="p-1 text-slate-400 hover:text-ink disabled:opacity-30" aria-label="Yuqoriga">
              <ArrowUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => move(i, i + 1)}
              disabled={i === rows.length - 1}
              className="p-1 text-slate-400 hover:text-ink disabled:opacity-30"
              aria-label="Pastga"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
            {r.custom ? (
              <button
                type="button"
                onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
                className="p-1 text-red-500 hover:text-red-700"
                aria-label="Ustunni o'chirish"
                title="Ustunni o'chirish (yozuvlardagi qiymatlar bazada qoladi)"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ) : (
              <span className="w-6" />
            )}
          </li>
        ))}
      </ul>

      <div className="mt-4 rounded-lg border border-dashed border-border p-3">
        <p className="mb-2 text-sm font-medium text-ink">Yangi ustun qo'shish</p>
        <div className="flex flex-wrap gap-2">
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addColumn()}
            placeholder="Ustun nomi, masalan: Sinov boshlangan sana"
            className="input-field !py-1.5 text-sm flex-1 min-w-[200px]"
          />
          <select value={newType} onChange={(e) => setNewType(e.target.value)} className="input-field !w-auto !py-1.5 text-sm">
            {Object.entries(CUSTOM_TYPES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button type="button" onClick={addColumn} disabled={!newLabel.trim()} className="btn-secondary !py-1.5">
            <Plus className="h-4 w-4" /> Qo'shish
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-400">Yangi ustun qiymati yozuv oynasidagi "Qo'shimcha ustunlar" bo'limida kiritiladi.</p>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={reset} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-ink">
          <RotateCcw className="h-3.5 w-3.5" /> Standart tartib ({builtinCount} ta asosiy ustun)
        </button>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary">
            Bekor qilish
          </button>
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
