import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { tr } from '../../../i18n/tr.js';

// Jurnal jadvalidagi katakni joyida tahrirlash.
//   edit = { type: 'text'|'int'|'money'|'date'|'time'|'select', get(r), options?(ctx, r),
//            required?, list?: 'executors'|'brands' }
// Bosilganda tahrirlash maydoni ochiladi (sana — kalendar bilan); Enter yoki
// boshqa joyga bosish — saqlash, Esc — bekor qilish; ro'yxat tanlanganda darhol saqlanadi.

const field =
  'w-full min-w-[6rem] rounded border border-primary bg-white px-1 py-0.5 text-[13px] text-ink shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30';

// Kiritilgan matn -> API qiymati. undefined = noto'g'ri (saqlanmaydi).
function toValue(type, raw, required, emptyAs) {
  const s = String(raw ?? '').trim();
  if (s === '') return required ? undefined : emptyAs !== undefined ? emptyAs : null;
  if (type === 'int') {
    const n = Number(s.replace(/\s/g, ''));
    return Number.isInteger(n) && n >= 0 ? n : undefined;
  }
  if (type === 'money') {
    const n = Number(s.replace(/\s/g, '').replace(',', '.'));
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  }
  return s;
}

export default function EditableCell({ edit, record, ctx, display, saving, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef(null);
  const doneRef = useRef(false); // bitta tahrirlash bir marta saqlanadi (change + blur takrorlanmasin)
  const original = edit.get(record);
  const originalText = original === null || original === undefined ? '' : String(original);

  useEffect(() => {
    if (!editing) return;
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    if (edit.type === 'date') {
      // Kalendarni darhol ochish (brauzer qo'llasa).
      try {
        el.showPicker?.();
      } catch {
        /* qo'llab-quvvatlanmaydi */
      }
    } else if (el.select && edit.type !== 'select') {
      el.select();
    }
  }, [editing, edit.type]);

  const start = (e) => {
    e.stopPropagation();
    if (saving) return;
    setDraft(originalText);
    doneRef.current = false;
    setEditing(true);
  };

  const commit = (value = draft) => {
    if (doneRef.current) return;
    doneRef.current = true;
    setEditing(false);
    if (String(value ?? '') === originalText) return;
    const parsed = toValue(edit.type, value, edit.required, edit.emptyAs);
    if (parsed === undefined) {
      ctx.notify?.(edit.required ? tr("Bu maydon bo'sh bo'lmasligi kerak.") : tr("Qiymat noto'g'ri."));
      return;
    }
    onSave(parsed);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      doneRef.current = true;
      setEditing(false);
    }
  };

  if (saving) {
    return (
      <span className="inline-flex items-center gap-1 text-slate-400">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> {display}
      </span>
    );
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={start}
        title={tr('Tahrirlash uchun bosing')}
        className="block min-h-[1.5rem] w-full cursor-text rounded px-1 text-inherit hover:bg-white/70 hover:ring-1 hover:ring-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40"
        style={{ textAlign: 'inherit' }}
      >
        {display === '' || display === null || display === undefined ? <span className="text-slate-300">—</span> : display}
      </button>
    );
  }

  const common = {
    ref: inputRef,
    onClick: (e) => e.stopPropagation(),
    onKeyDown,
    className: field,
  };

  if (edit.type === 'select') {
    const options = edit.options(ctx, record);
    return (
      <select
        {...common}
        value={draft}
        onChange={(e) => commit(e.target.value)}
        onBlur={() => setEditing(false)}
        className={`${field} cursor-pointer`}
        style={{ minWidth: `${Math.max(8, ...options.map((o) => String(o.label).length)) + 4}ch` }}
      >
        {!edit.required && <option value="">—</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }

  const listId = edit.list ? `journal-${edit.list}` : undefined;
  return (
    <input
      {...common}
      type={edit.type === 'date' ? 'date' : 'text'}
      inputMode={edit.type === 'int' ? 'numeric' : edit.type === 'money' ? 'decimal' : undefined}
      placeholder={edit.type === 'time' ? '14:30' : undefined}
      list={listId}
      value={draft}
      onChange={(e) => {
        const v = e.target.value;
        setDraft(v);
        // Sana: kalendardan tanlanishi (yoki yil to'liq yozilishi) bilan darhol saqlanadi.
        // Tab sana ichidagi kun/oy/yil orasida yuradi, shuning uchun blur'ni kutmaymiz.
        if (edit.type === 'date' && /^(19|20)\d\d-\d\d-\d\d$/.test(v)) commit(v);
      }}
      onBlur={() => commit()}
    />
  );
}
