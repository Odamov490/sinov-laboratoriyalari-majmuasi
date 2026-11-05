import React, { useEffect, useState } from 'react';
import { ArrowUp, ArrowDown, GripVertical, Trash2, Plus, Undo2 } from 'lucide-react';
import { Modal } from '../../../components/Modal.jsx';
import { adminTestJournal } from '../../../services/adminApi';
import { useToast } from '../../../context/ToastContext.jsx';
import { COLUMNS, CUSTOM_TYPES, resolveColumns, layoutLabel } from './journalColumns.jsx';
import { tr, currentLang, ADMIN_LANGS } from '../../../i18n/tr.js';

const ctx = { brandLabel: tr('Marka') };

const BUILTIN = new Map(COLUMNS.map((c) => [c.key, c]));
const defaultLabel = (key) => BUILTIN.get(key)?.label(ctx) || key;

const toRows = (layout) =>
  resolveColumns(layout, true).map((c) => ({
    key: c.key,
    label: c.custom ? c.label() : c.label(ctx),
    hidden: c.hidden,
    custom: Boolean(c.custom),
    type: c.type,
  }));

// Saqlangan sozlamadagi o'chirilgan asosiy ustunlar (qaytarish uchun).
const toRemoved = (layout) =>
  (layout || [])
    .filter((e) => e.removed && !e.custom && BUILTIN.has(e.key))
    .map((e) => ({ key: e.key, label: layoutLabel(e) || defaultLabel(e.key) }));

// Saqlangan til nomlari + shu tilda tahrirlangan nom. Eski tilsiz `label`
// (asosiy ustunda) o'zbekcha nomga ko'chiriladi. Asosiy ustun nomi standart
// (lug'atdagi) bilan bir xil bo'lsa — shu til uchun saqlanmaydi.
function mergeLabels(orig, lang, text, isDefault) {
  const labels = { ...(orig?.labels || {}) };
  if (orig && !orig.custom && orig.label && !labels.uz) labels.uz = orig.label;
  if (text !== undefined) {
    if (isDefault) delete labels[lang];
    else labels[lang] = text;
  }
  return Object.keys(labels).length ? labels : undefined;
}

const newKey = () => `c_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

// SUPER_ADMIN-only editor of the shared journal layout: drag (or arrows) to
// reorder, untick to hide, add/rename/remove extra columns.
export default function ColumnSettingsModal({ open, layout, onClose, onSaved }) {
  const { showToast } = useToast();
  const [rows, setRows] = useState([]);
  const [removed, setRemoved] = useState([]);
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState('text');
  const [dragIndex, setDragIndex] = useState(null);
  const [saving, setSaving] = useState(false);
  const lang = currentLang();
  const langLabel = ADMIN_LANGS.find((l) => l.code === lang)?.label || lang;

  useEffect(() => {
    if (open) {
      setRows(toRows(layout));
      setRemoved(toRemoved(layout));
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

  // Asosiy ustun o'chirilsa — pastdagi ro'yxatdan qaytarish mumkin; qo'shimcha
  // ustun butunlay olib tashlanadi (yozuvlardagi qiymatlari bazada qoladi).
  const removeRow = (row) => {
    setRows((rs) => rs.filter((x) => x.key !== row.key));
    if (!row.custom)
      setRemoved((rm) => [
        ...rm,
        {
          key: row.key,
          label: row.label,
        },
      ]);
  };

  const restoreRow = (item) => {
    setRemoved((rm) => rm.filter((x) => x.key !== item.key));
    setRows((rs) => [...rs, { key: item.key, label: item.label, hidden: false, custom: false }]);
  };

  const save = async () => {
    if (rows.some((r) => !r.label.trim())) {
      showToast(tr('Ustun nomini kiriting.'), 'error');
      return;
    }
    setSaving(true);
    try {
      // Nom faqat joriy interfeys tili uchun yoziladi; boshqa tillardagi nomlar saqlanib qoladi.
      const orig = new Map((layout || []).map((e) => [e.key, e]));
      const withLabels = (entry, labels) => (labels ? { ...entry, labels } : entry);
      const columns = [
        ...rows.map((r) => {
          const text = r.label.trim();
          const prev = orig.get(r.key);
          if (r.custom) {
            const labels = mergeLabels(prev, lang, text, false);
            const base = lang === 'uz' || !prev?.label ? text : prev.label;
            return withLabels({ key: r.key, hidden: r.hidden, custom: true, label: base, type: r.type }, labels);
          }
          return withLabels({ key: r.key, hidden: r.hidden }, mergeLabels(prev, lang, text, text === defaultLabel(r.key)));
        }),
        ...removed.map((x) => withLabels({ key: x.key, removed: true }, mergeLabels(orig.get(x.key), lang))),
      ];
      const res = await adminTestJournal.saveLayout(columns);
      showToast(tr('Ustunlar saqlandi.'), 'success');
      onSaved(res.columns);
    } catch (err) {
      showToast(err?.response?.data?.error || tr('Saqlashda xatolik yuz berdi.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={tr('Jadval ustunlari')} size="lg">
      <p className="mb-3 text-sm text-slate-500">
        {tr(
          "Ustunni sudrab yoki strelkalar bilan joyini o'zgartiring, belgini olib tashlab yashiring, nomini to'g'ridan-to'g'ri tahrirlang yoki keraksizini o'chiring. Sozlama barcha foydalanuvchilar uchun bir xil. Jadval va Excel eksporti shu tartibda bo'ladi.",
        )}
      </p>
      <p className="mb-3 rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-800">
        {tr(
          "Nomlar hozirgi interfeys tili uchun saqlanadi: {0}. Boshqa tildagi nomni kiritish uchun yuqoridagi til tanlagichdan tilni almashtiring va shu oynada qayta nomlang. Nomi berilmagan tilda asosiy ustunlar standart tarjimasi bilan ko'rinadi.",
          langLabel
        )}
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
              aria-label={tr("{0} ko'rinadi", r.label)}
            />
            <input
              value={r.label}
              onChange={(e) => patch(r.key, { label: e.target.value })}
              className="input-field !py-1 text-sm flex-1 min-w-0"
              aria-label={tr('Ustun nomi')}
              title={!r.custom && r.label.trim() !== defaultLabel(r.key) ? tr('Asl nomi: {0}', defaultLabel(r.key)) : undefined}
            />
            {r.custom && (
              <select
                value={r.type}
                onChange={(e) => patch(r.key, { type: e.target.value })}
                className="input-field !w-auto !py-1 text-xs"
                aria-label={tr('Ustun turi')}
              >
                {Object.entries(CUSTOM_TYPES).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            )}
            <button
              type="button"
              onClick={() => move(i, i - 1)}
              disabled={i === 0}
              className="p-1 text-slate-400 hover:text-ink disabled:opacity-30"
              aria-label={tr('Yuqoriga')}
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => move(i, i + 1)}
              disabled={i === rows.length - 1}
              className="p-1 text-slate-400 hover:text-ink disabled:opacity-30"
              aria-label={tr('Pastga')}
            >
              <ArrowDown className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => removeRow(r)}
              className="p-1 text-red-500 hover:text-red-700"
              aria-label={tr("Ustunni o'chirish")}
              title={tr("Ustunni o'chirish (yozuvlardagi qiymatlar bazada qoladi)")}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>

      {removed.length > 0 && (
        <div className="mt-4 rounded-lg bg-bg-light p-3">
          <p className="mb-2 text-sm font-medium text-ink">{tr("O'chirilgan ustunlar ({0})", removed.length)}</p>
          <ul className="flex flex-wrap gap-2">
            {removed.map((x) => (
              <li
                key={x.key}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1 text-xs text-slate-600"
              >
                {x.label}
                <button
                  type="button"
                  onClick={() => restoreRow(x)}
                  className="inline-flex items-center gap-0.5 font-medium text-primary hover:underline"
                >
                  <Undo2 className="h-3 w-3" /> {tr('Qaytarish')}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 rounded-lg border border-dashed border-border p-3">
        <p className="mb-2 text-sm font-medium text-ink">{tr("Yangi ustun qo'shish")}</p>
        <div className="flex flex-wrap gap-2">
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addColumn()}
            placeholder={tr('Ustun nomi, masalan: Sinov boshlangan sana')}
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
            <Plus className="h-4 w-4" /> {tr("Qo'shish")}
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-400">{tr('Yangi ustun qiymati yozuv oynasidagi "Qo\'shimcha ustunlar" bo\'limida kiritiladi.')}</p>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary">
            {tr('Bekor qilish')}
          </button>
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? tr('Saqlanmoqda...') : tr('Saqlash')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
