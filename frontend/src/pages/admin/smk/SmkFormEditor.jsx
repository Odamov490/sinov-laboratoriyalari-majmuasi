import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  X, Save, Plus, Trash2, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, AlignLeft, AlignCenter, AlignRight, AlignJustify, Bold,
  IndentIncrease, Columns2, PanelLeft, PanelRight, RectangleHorizontal, RectangleVertical, Table2, Heading, Pilcrow, Signature,
  Stamp, Sigma, ArrowUpToLine, ArrowDownToLine, FileText, Minus, Maximize2, PencilLine, ScanEye, Rows3, Columns3, Type,
  TextCursorInput, MousePointerClick,
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext.jsx';
import { adminSmk } from '../../../services/adminApi';
import { tr } from '../../../i18n/tr.js';
import { normalizeHeader, buildDocumentHtml, useFormLogo, BLOCK_PRESETS, groupBlocks, COL } from './smkDocument.js';

// SMK formasi muharriri — Word uslubida: tepada lenta (ribbon) tablari, o'rtada
// A4 varaq. Matnlar to'g'ridan-to'g'ri varaq ustida yoziladi; tanlangan element
// (blok, ustun, rekvizit, Итого qatori) uchun amallar lentada chiqadi.
// "Natija" ko'rinishi — Word/PDF'ga chiqadigan hujjatning aynan o'zi.

export const FIELD_TYPES = [
  { value: 'text', label: tr('Matn') },
  { value: 'textarea', label: tr('Uzun matn') },
  { value: 'number', label: tr('Raqam') },
  { value: 'money', label: tr('Pul (summa)') },
  { value: 'date', label: tr('Sana') },
  { value: 'select', label: tr("Ro'yxatdan tanlash") },
  { value: 'checkbox', label: tr("Ha / Yo'q") },
  { value: 'staff', label: tr('Xodim') },
];
const typeLabel = (t) => FIELD_TYPES.find((x) => x.value === t)?.label || t;
const NUMERIC = ['number', 'money'];

// Ustun kaliti bir marta beriladi va o'zgarmaydi (yozuvlardagi qiymat shu kalit bilan saqlanadi).
const newKey = (fields) => {
  let key;
  do key = `f${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
  while (fields.some((f) => f.key === key));
  return key;
};
const moveIn = (list, i, d) => {
  const j = i + d;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
};
const PREVIEW_LAB = { nameUz: '«Laboratoriya nomi»', nameRu: '«Название лаборатории»', nameEn: '«Laboratory name»', slug: 'lab' };
const EMPTY_BLOCK = { text: '', align: 'left', bold: false, size: 'normal', indent: false, position: 'before', layout: 'full' };
const PRESET_ICONS = { approve: Stamp, agreeApprove: Columns2, title: Heading, paragraph: Pilcrow, signatures: Signature };

const DOC_FONT = "'Times New Roman', Times, serif";
const PAGE_PAD = 40;
const CELL = { border: '1px solid #000' };

// ---------------- Lenta (ribbon) elementlari ----------------

function RGroup({ label, children, testId }) {
  return (
    <div className="flex shrink-0 flex-col border-r border-slate-200 px-3 last:border-r-0" data-testid={testId}>
      <div className="flex min-h-[56px] flex-1 items-center gap-1">{children}</div>
      <div className="pt-1 text-center text-[10px] font-medium uppercase tracking-wider text-slate-400">{label}</div>
    </div>
  );
}

// Katta tugma: ikonka ustida, nomi pastida.
function RBig({ icon: Icon, label, onClick, disabled, active, testId, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title || label}
      data-testid={testId}
      aria-pressed={active}
      className={`flex w-[74px] flex-col items-center gap-1 rounded-md px-1 py-1.5 text-center text-[11px] leading-tight transition disabled:cursor-not-allowed disabled:opacity-35 ${
        active ? 'bg-primary/10 text-primary ring-1 ring-primary/30' : 'text-slate-700 hover:bg-slate-100'
      }`}
    >
      <Icon className={`h-5 w-5 ${active ? 'text-primary' : 'text-primary/80'}`} />
      <span className="line-clamp-2">{label}</span>
    </button>
  );
}

// Kichik tugma (ikonka, ixtiyoriy nom).
function RBtn({ icon: Icon, label, onClick, disabled, active, title, testId, danger, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title || label}
      aria-label={title || label}
      aria-pressed={active}
      data-testid={testId}
      className={`inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-35 ${
        active
          ? 'bg-primary text-white shadow-sm'
          : danger
            ? 'text-red-600 hover:bg-red-50'
            : 'text-slate-700 hover:bg-slate-100'
      }`}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {label}
      {children}
    </button>
  );
}

function Switch({ checked, onChange, label, testId }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-ink" data-testid={testId}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="relative h-5 w-9 shrink-0 cursor-pointer appearance-none rounded-full bg-slate-300 transition before:absolute before:left-0.5 before:top-0.5 before:h-4 before:w-4 before:rounded-full before:bg-white before:shadow before:transition before:content-[''] checked:bg-primary checked:before:translate-x-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/40"
      />
      {label}
    </label>
  );
}

function Hint({ children }) {
  return (
    <div className="flex max-w-[260px] items-center gap-2 px-2 text-xs leading-snug text-slate-400">
      <MousePointerClick className="h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

// ---------------- Varaq elementlari ----------------

// O'zi cho'ziladigan matn maydoni — varaqdagi matn bilan bir xil shriftda.
function AutoText({ value, onChange, onFocus, style, placeholder, singleLine, focusMe, onFocused, testId }) {
  const ref = useRef(null);
  const fit = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${el.scrollHeight}px`;
  }, []);
  useLayoutEffect(fit, [value, style?.fontSize, style?.fontWeight, style?.textIndent, fit]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fit]);
  useEffect(() => {
    if (focusMe && ref.current) {
      ref.current.focus();
      onFocused?.();
    }
  }, [focusMe, onFocused]);
  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      data-testid={testId}
      placeholder={placeholder}
      spellCheck={false}
      onFocus={onFocus}
      onChange={(e) => onChange(singleLine ? e.target.value.replace(/\n/g, ' ') : e.target.value)}
      onKeyDown={singleLine ? (e) => e.key === 'Enter' && e.preventDefault() : undefined}
      className="block w-full resize-none overflow-hidden border-0 bg-transparent p-0 text-black outline-none placeholder:italic placeholder:text-slate-300 focus:ring-0"
      style={{ fontFamily: DOC_FONT, lineHeight: 1.35, ...style }}
    />
  );
}

// A4 varaq: masshtab bilan; tashqi o'lcham masshtabga moslanadi.
function Paper({ scale, pageW, landscape, children, onBackground }) {
  const ref = useRef(null);
  const [h, setH] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    setH(el.offsetHeight);
    const ro = new ResizeObserver(() => setH(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div className="mx-auto" style={{ width: pageW * scale, height: h * scale }}>
      <div
        ref={ref}
        onMouseDown={(e) => e.target === e.currentTarget && onBackground?.()}
        className="origin-top-left bg-white shadow-[0_6px_28px_rgba(15,23,42,0.14)] ring-1 ring-black/5"
        style={{ width: pageW, padding: PAGE_PAD, minHeight: landscape ? pageW / 1.414 : pageW * 1.414, transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}

// ---------------- Muharrir ----------------

export default function SmkFormEditor({ initial, onClose, onSaved }) {
  const { showToast } = useToast();
  const [form, setForm] = useState(() => ({
    ...initial,
    description: initial.description || '',
    header: normalizeHeader(initial.header),
    fields: (initial.fields || []).map((f) => ({ ...f, optionsText: (f.options || []).join('\n') })),
  }));
  const snapshot = useRef(null);
  if (snapshot.current === null) snapshot.current = JSON.stringify(form);
  const dirty = JSON.stringify(form) !== snapshot.current;

  const [tab, setTab] = useState('home');
  const [sel, setSel] = useState(null); // { t: 'block'|'col'|'meta'|'org'|'footer', i }
  const [focusReq, setFocusReq] = useState(null);
  const [view, setView] = useState('edit'); // edit | result
  const [zoom, setZoom] = useState('fit');
  const [saving, setSaving] = useState(false);
  const logo = useFormLogo();

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const setHeader = (patch) => setForm((p) => ({ ...p, header: { ...p.header, ...patch } }));
  const { orgLines, meta, orientation } = form.header;
  const blocks = form.header.blocks || [];
  const footer = form.header.footer || [];
  const fields = form.fields;
  const hasTable = form.header.table !== false;
  const numericFields = fields.filter((f) => NUMERIC.includes(f.type));
  const setBlocks = (next) => setHeader({ blocks: next });
  const setBlock = (i, patch) => setBlocks(blocks.map((b, j) => (j === i ? { ...b, ...patch } : b)));
  const setFooter = (next) => setHeader({ footer: next });
  const setFooterRow = (i, patch) => setFooter(footer.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const setField = (i, patch) => setForm((p) => ({ ...p, fields: p.fields.map((f, j) => (j === i ? { ...f, ...patch } : f)) }));
  const isSel = (t, i) => sel?.t === t && sel.i === i;
  const select = (t, i) => {
    setSel({ t, i });
    if (t === 'col' || t === 'footer') setTab('table');
    else if (tab === 'table' || tab === 'page') setTab('home');
  };
  const clearFocusReq = useCallback(() => setFocusReq(null), []);

  // --- Bloklar ---
  const selBlock = sel?.t === 'block' ? blocks[sel.i] : null;
  const neighbor = (i, dir) => {
    for (let j = i + dir; j >= 0 && j < blocks.length; j += dir) if (blocks[j].position === blocks[i].position) return j;
    return -1;
  };
  const moveBlock = (i, dir) => {
    const j = neighbor(i, dir);
    if (j < 0) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    setBlocks(next);
    setSel({ t: 'block', i: j });
  };
  // adopt — bo'sh blok tanlangan blok joyini (oldin/keyin) oladi; namunalar o'z joyida qoladi
  // ("Imzolar" — jadvaldan keyin), tanlangan blok bilan bir joyda bo'lsa — undan keyin qo'yiladi.
  const insertBlocks = (items, position, adopt = false) => {
    const add = items.map((x) => ({ ...EMPTY_BLOCK, ...x, ...(position ? { position } : {}) }));
    let at = blocks.length;
    const cur = sel?.t === 'block' ? blocks[sel.i] : null;
    if (cur && !position && (adopt || add[0].position === cur.position)) {
      // Tanlangan blokdan keyin; yonma-yon juftlik bo'linmaydi (chap blok tanlangan bo'lsa — o'ngidan keyin).
      const next = blocks[sel.i + 1];
      at = cur.layout === 'left' && next?.layout === 'right' ? sel.i + 2 : sel.i + 1;
      add.forEach((x) => (x.position = cur.position));
    }
    const n = [...blocks];
    n.splice(at, 0, ...add);
    setBlocks(n);
    setSel({ t: 'block', i: at });
    setFocusReq(`block-${at}`);
    setView('edit');
    setTab('home');
  };

  // --- Ustunlar ---
  const addField = () => {
    const key = newKey(fields);
    const at = sel?.t === 'col' ? sel.i + 1 : fields.length;
    const n = [...fields];
    n.splice(at, 0, { key, label: '', type: 'text', required: false, optionsText: '' });
    set('fields', n);
    setSel({ t: 'col', i: at });
    setFocusReq(`col-${key}`);
    setView('edit');
    setTab('table');
  };
  const selCol = sel?.t === 'col' ? fields[sel.i] : null;
  const selFooter = sel?.t === 'footer' ? footer[sel.i] : null;

  const addFooter = () => {
    setFooter([...footer, { label: 'Итого:', labelSpan: Math.min(2, fields.length + 1), sums: numericFields.map((f) => f.key) }]);
    setSel({ t: 'footer', i: footer.length });
    setView('edit');
    setTab('table');
  };
  const addOrg = () => {
    setHeader({ orgLines: [...orgLines, ''] });
    setSel({ t: 'org', i: orgLines.length });
    setFocusReq(`org-${orgLines.length}`);
    setView('edit');
  };
  const addMeta = () => {
    setHeader({ meta: [...meta, { label: '', value: '' }] });
    setSel({ t: 'meta', i: meta.length });
    setFocusReq(`meta-${meta.length}`);
    setView('edit');
  };

  // Tanlangan element uchun tartib amallari (yuqoriga/pastga/o'chirish).
  const ops = (() => {
    if (!sel) return null;
    const i = sel.i;
    switch (sel.t) {
      case 'block':
        return {
          name: tr('Matn bloki'),
          up: neighbor(i, -1) >= 0 && (() => moveBlock(i, -1)),
          down: neighbor(i, 1) >= 0 && (() => moveBlock(i, 1)),
          del: () => setBlocks(blocks.filter((_, j) => j !== i)),
        };
      case 'org':
        return {
          name: tr('Markaziy qator'),
          up: i > 0 && (() => (setHeader({ orgLines: moveIn(orgLines, i, -1) }), setSel({ t: 'org', i: i - 1 }))),
          down: i < orgLines.length - 1 && (() => (setHeader({ orgLines: moveIn(orgLines, i, 1) }), setSel({ t: 'org', i: i + 1 }))),
          del: () => setHeader({ orgLines: orgLines.filter((_, j) => j !== i) }),
        };
      case 'meta':
        return {
          name: tr('Rekvizit'),
          up: i > 0 && (() => (setHeader({ meta: moveIn(meta, i, -1) }), setSel({ t: 'meta', i: i - 1 }))),
          down: i < meta.length - 1 && (() => (setHeader({ meta: moveIn(meta, i, 1) }), setSel({ t: 'meta', i: i + 1 }))),
          del: () => setHeader({ meta: meta.filter((_, j) => j !== i) }),
        };
      case 'col':
        return {
          name: tr('Ustun'),
          horizontal: true,
          up: i > 0 && (() => (set('fields', moveIn(fields, i, -1)), setSel({ t: 'col', i: i - 1 }))),
          down: i < fields.length - 1 && (() => (set('fields', moveIn(fields, i, 1)), setSel({ t: 'col', i: i + 1 }))),
          del: () => set('fields', fields.filter((_, j) => j !== i)),
        };
      case 'footer':
        return {
          name: tr('Итого qatori'),
          up: i > 0 && (() => (setFooter(moveIn(footer, i, -1)), setSel({ t: 'footer', i: i - 1 }))),
          down: i < footer.length - 1 && (() => (setFooter(moveIn(footer, i, 1)), setSel({ t: 'footer', i: i + 1 }))),
          del: () => setFooter(footer.filter((_, j) => j !== i)),
        };
      default:
        return null;
    }
  })();
  const removeSelected = () => {
    ops?.del();
    setSel(null);
  };

  // --- Saqlash / yopish ---
  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const payload = {
        code: form.code,
        title: form.title,
        description: form.description,
        header: form.header,
        order: Number(form.order) || 0,
        isActive: form.isActive,
        fields: fields.map(({ optionsText, ...f }) => ({
          key: f.key,
          label: f.label,
          type: f.type,
          required: !!f.required,
          ...(f.type === 'select' ? { options: (optionsText || '').split('\n').map((s) => s.trim()).filter(Boolean) } : {}),
        })),
      };
      if (initial.id) await adminSmk.updateForm(initial.id, payload);
      else await adminSmk.createForm(payload);
      showToast(tr('Saqlandi.'), 'success');
      onSaved();
    } catch (err) {
      showToast(err?.response?.data?.error || tr('Xatolik yuz berdi.'), 'error');
    } finally {
      setSaving(false);
    }
  };
  const tryClose = () => {
    if (!dirty || window.confirm(tr("Saqlanmagan o'zgarishlar bor. Oyna yopilsinmi?"))) onClose();
  };
  const keys = useRef({});
  keys.current = { save, tryClose };
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        keys.current.save();
      } else if (e.key === 'Escape') keys.current.tryClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // --- Masshtab ---
  const canvasRef = useRef(null);
  const [canvasW, setCanvasW] = useState(900);
  useLayoutEffect(() => {
    const el = canvasRef.current;
    const m = () => setCanvasW(el.clientWidth);
    m();
    const ro = new ResizeObserver(m);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const landscape = orientation === 'landscape';
  const pageW = (landscape ? 1100 : 760) + PAGE_PAD * 2;
  const fitScale = Math.max(0.3, Math.min(1, (canvasW - 48) / pageW));
  const scale = zoom === 'fit' ? fitScale : zoom;
  const setZoomPct = (pct) => setZoom(Math.max(0.3, Math.min(2, Math.round(pct) / 100)));

  // "Natija" — Word/PDF'ga chiqadigan hujjat (tokenlar almashtirilgan).
  const resultHtml = useMemo(
    () =>
      view === 'result'
        ? buildDocumentHtml({
            form: { ...form, title: form.title || tr('Forma nomi'), fields: fields.map((f) => ({ ...f, label: f.label || '…' })) },
            lab: PREVIEW_LAB,
            rows: [],
            blankRows: 2,
            logo,
          }).html
        : '',
    [view, form, fields, logo]
  );

  // ---------------- Varaqni chizish ----------------
  const selRing = (on) => (on ? 'bg-sky-50 outline outline-2 outline-sky-400' : 'hover:outline hover:outline-1 hover:outline-sky-200');

  const blockEl = (b) => {
    const i = b._i;
    const on = isSel('block', i);
    return (
      <div
        key={`b${i}`}
        data-testid="smk-doc-block"
        onMouseDown={() => select('block', i)}
        className={`relative cursor-text rounded-[2px] transition ${selRing(on)}`}
        style={{ margin: '10px 0' }}
      >
        <AutoText
          value={b.text}
          onChange={(v) => setBlock(i, { text: v })}
          onFocus={() => select('block', i)}
          focusMe={focusReq === `block-${i}`}
          onFocused={clearFocusReq}
          placeholder={tr('Matn yozing…')}
          style={{
            fontSize: b.size === 'large' ? '13pt' : '11pt',
            fontWeight: b.bold ? 'bold' : 'normal',
            textAlign: b.align,
            textIndent: b.indent ? '1.25cm' : 0,
          }}
        />
        {on && (
          <span className="pointer-events-none absolute -top-5 left-0 rounded-t bg-sky-400 px-1.5 py-0.5 text-[10px] font-medium text-white">
            {b.position === 'after' ? tr('Jadvaldan keyin') : tr('Jadvaldan oldin')}
            {b.layout !== 'full' && ` · ${b.layout === 'left' ? tr('Chap yarmi') : tr("O'ng yarmi")}`}
          </span>
        )}
      </div>
    );
  };

  const blocksArea = (position) => {
    const list = blocks.map((b, i) => ({ ...b, layout: b.layout || 'full', _i: i })).filter((b) => b.position === position);
    if (!list.length)
      return (
        <button
          type="button"
          data-testid={`smk-ghost-${position}`}
          onClick={() => insertBlocks([{ ...EMPTY_BLOCK }], position)}
          className="my-2 flex w-full items-center justify-center gap-1.5 rounded border border-dashed border-transparent py-1.5 text-xs text-slate-300 transition hover:border-sky-300 hover:text-sky-500"
        >
          <Plus className="h-3.5 w-3.5" /> {position === 'after' ? tr('Jadvaldan keyin matn') : tr('Matn bloki qo\'shish')}
        </button>
      );
    return groupBlocks(list).map((g, k) =>
      g.full ? (
        blockEl(g.full)
      ) : (
        <div key={`p${position}${k}`} className="flex" style={{ gap: 24 }}>
          <div className="w-1/2 min-w-0">{g.left ? blockEl(g.left) : null}</div>
          <div className="w-1/2 min-w-0">{g.right ? blockEl(g.right) : null}</div>
        </div>
      )
    );
  };

  const n = Math.max(1, meta.length);
  const headerTable = (
    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', marginBottom: 10 }} data-testid="smk-doc-header">
      <colgroup>
        <col style={{ width: logo.width + 14 }} />
        <col />
        {meta.length > 0 && (
          <>
            <col style={{ width: COL.metaLabel }} />
            <col style={{ width: COL.metaValue }} />
          </>
        )}
      </colgroup>
      <tbody>
        {Array.from({ length: n }, (_, r) => (
          <tr key={r}>
            {r === 0 && (
              <td rowSpan={n} style={{ ...CELL, padding: 6, textAlign: 'center', verticalAlign: 'middle' }}>
                <img src={logo.src} width={logo.width} height={logo.height} alt="" style={{ display: 'inline-block', width: logo.width, height: logo.height, maxWidth: 'none' }} />
              </td>
            )}
            {r === 0 && (
              <td rowSpan={n} style={{ ...CELL, padding: '6px 10px', verticalAlign: 'middle' }}>
                {orgLines.map((l, i) => (
                  <div key={i} className={`rounded-[2px] ${selRing(isSel('org', i))}`} onMouseDown={() => select('org', i)}>
                    <AutoText
                      singleLine
                      testId="smk-doc-org"
                      value={l}
                      onChange={(v) => setHeader({ orgLines: orgLines.map((x, j) => (j === i ? v : x)) })}
                      onFocus={() => select('org', i)}
                      focusMe={focusReq === `org-${i}`}
                      onFocused={clearFocusReq}
                      placeholder={tr('Tashkilot nomi')}
                      style={{ fontWeight: 'bold', fontSize: '10.5pt', textAlign: 'center' }}
                    />
                  </div>
                ))}
                <div style={{ marginTop: orgLines.length ? 6 : 0 }} onMouseDown={() => setSel(null)}>
                  <AutoText
                    testId="smk-doc-title"
                    value={form.title}
                    onChange={(v) => set('title', v.replace(/\n/g, ' '))}
                    placeholder={tr('Forma nomi')}
                    style={{ fontWeight: 'bold', fontSize: '13pt', textAlign: 'center' }}
                  />
                </div>
              </td>
            )}
            {meta[r] &&
              ['label', 'value'].map((k) => (
                <td
                  key={k}
                  onMouseDown={() => select('meta', r)}
                  style={{ ...CELL, padding: '3px 6px', verticalAlign: 'middle', background: isSel('meta', r) ? '#e0f2fe' : undefined }}
                >
                  <AutoText
                    singleLine
                    testId={`smk-doc-meta-${k}`}
                    value={meta[r][k]}
                    onChange={(v) => setHeader({ meta: meta.map((x, j) => (j === r ? { ...x, [k]: v } : x)) })}
                    onFocus={() => select('meta', r)}
                    focusMe={k === 'label' && focusReq === `meta-${r}`}
                    onFocused={clearFocusReq}
                    placeholder={k === 'label' ? tr('Nomi') : tr('Qiymati')}
                    style={{ fontSize: '9.5pt' }}
                  />
                </td>
              ))}
          </tr>
        ))}
      </tbody>
    </table>
  );

  const th = { ...CELL, padding: '5px 6px', background: '#f0f0f0', verticalAlign: 'middle' };
  const td = { ...CELL, padding: '4px 6px', verticalAlign: 'top', height: 26 };
  const dataTable = hasTable ? (
    <div className="relative">
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }} data-testid="smk-doc-table">
        <colgroup>
          <col style={{ width: COL.num }} />
          {fields.length ? fields.map((f) => <col key={f.key} />) : <col />}
        </colgroup>
        <thead>
          <tr>
            <th style={{ ...th, fontFamily: DOC_FONT, fontSize: '10pt' }}>№</th>
            {fields.map((f, i) => (
              <th key={f.key} style={{ ...th, background: isSel('col', i) ? '#bae6fd' : '#f0f0f0' }} onMouseDown={() => select('col', i)}>
                <AutoText
                  testId="smk-doc-col"
                  value={f.label}
                  onChange={(v) => setField(i, { label: v.replace(/\n/g, ' ') })}
                  onFocus={() => select('col', i)}
                  focusMe={focusReq === `col-${f.key}`}
                  onFocused={clearFocusReq}
                  placeholder={tr('Ustun nomi')}
                  style={{ fontWeight: 'bold', fontSize: '10pt', textAlign: 'center' }}
                />
              </th>
            ))}
            {fields.length === 0 && (
              <th style={th}>
                <button type="button" onClick={addField} className="text-xs font-normal italic text-sky-500 hover:underline">
                  + {tr("Ustun qo'shish")}
                </button>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {[0, 1].map((r) => (
            <tr key={r}>
              <td style={td} />
              {fields.map((f, i) => (
                <td key={f.key} style={{ ...td, background: isSel('col', i) ? '#f0f9ff' : undefined }} onMouseDown={() => select('col', i)}>
                  {r === 0 && <span className="select-none text-[11px] italic text-slate-300">{typeLabel(f.type)}{f.required ? ' *' : ''}</span>}
                </td>
              ))}
              {fields.length === 0 && <td style={td} />}
            </tr>
          ))}
          {footer.map((fr, k) => {
            const span = Math.min(fields.length + 1, Math.max(1, Number(fr.labelSpan) || 1));
            const rest = fields.slice(span - 1);
            return (
              <tr key={`f${k}`} onMouseDown={() => select('footer', k)} data-testid="smk-doc-footer" style={{ background: isSel('footer', k) ? '#e0f2fe' : undefined }}>
                <td colSpan={span} style={{ ...td, verticalAlign: 'middle' }}>
                  <AutoText
                    singleLine
                    value={fr.label}
                    onChange={(v) => setFooterRow(k, { label: v })}
                    onFocus={() => select('footer', k)}
                    placeholder="Итого:"
                    style={{ fontWeight: 'bold', fontSize: '10pt' }}
                  />
                </td>
                {rest.map((f) => (
                  <td key={f.key} style={{ ...td, verticalAlign: 'middle', textAlign: 'center' }}>
                    {NUMERIC.includes(f.type) && (fr.sums || []).includes(f.key) && <span className="font-serif font-bold text-sky-600">Σ</span>}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      <button
        type="button"
        onClick={addField}
        title={tr("Ustun qo'shish")}
        className="absolute -right-7 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-sky-500 text-white opacity-60 shadow transition hover:opacity-100"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  ) : (
    <div className="my-3 select-none rounded border border-dashed border-slate-200 py-2 text-center text-xs italic text-slate-300" data-testid="smk-doc-notable">
      {tr("Jadvalsiz forma (jadval o'chirilgan)")}
    </div>
  );

  // ---------------- Lenta ----------------
  const blockGroups = (
    <>
      <RGroup label={tr('Shrift')}>
        <RBtn icon={Bold} title={tr('Qalin')} active={!!selBlock?.bold} disabled={!selBlock} onClick={() => setBlock(sel.i, { bold: !selBlock.bold })} testId="rb-bold" />
        <RBtn icon={Type} label="A+" title={tr('Katta shrift')} active={selBlock?.size === 'large'} disabled={!selBlock} onClick={() => setBlock(sel.i, { size: selBlock.size === 'large' ? 'normal' : 'large' })} testId="rb-size" />
      </RGroup>
      <RGroup label={tr('Xatboshi')}>
        <div className="flex flex-col gap-0.5">
          <div className="flex">
            {[
              ['left', AlignLeft, tr('Chapga')],
              ['center', AlignCenter, tr('Markazga')],
              ['right', AlignRight, tr("O'ngga")],
              ['justify', AlignJustify, tr('Ikki tomonga')],
            ].map(([v, Icon, t]) => (
              <RBtn key={v} icon={Icon} title={t} active={selBlock?.align === v} disabled={!selBlock} onClick={() => setBlock(sel.i, { align: v })} testId={`rb-align-${v}`} />
            ))}
          </div>
          <RBtn icon={IndentIncrease} label={tr('Xatboshi')} active={!!selBlock?.indent} disabled={!selBlock} onClick={() => setBlock(sel.i, { indent: !selBlock.indent })} testId="rb-indent" />
        </div>
      </RGroup>
      <RGroup label={tr('Kenglik')}>
        <RBig icon={RectangleHorizontal} label={tr("To'liq kenglik")} active={selBlock && (selBlock.layout || 'full') === 'full'} disabled={!selBlock} onClick={() => setBlock(sel.i, { layout: 'full' })} testId="rb-layout-full" />
        <RBig icon={PanelLeft} label={tr('Chap yarmi')} active={selBlock?.layout === 'left'} disabled={!selBlock} onClick={() => setBlock(sel.i, { layout: 'left' })} testId="rb-layout-left" />
        <RBig icon={PanelRight} label={tr("O'ng yarmi")} active={selBlock?.layout === 'right'} disabled={!selBlock} onClick={() => setBlock(sel.i, { layout: 'right' })} testId="rb-layout-right" />
      </RGroup>
      <RGroup label={tr('Joyi')}>
        <div className="flex flex-col gap-0.5">
          <RBtn icon={ArrowUpToLine} label={tr('Jadvaldan oldin')} active={selBlock?.position === 'before'} disabled={!selBlock} onClick={() => setBlock(sel.i, { position: 'before' })} testId="rb-pos-before" />
          <RBtn icon={ArrowDownToLine} label={tr('Jadvaldan keyin')} active={selBlock?.position === 'after'} disabled={!selBlock} onClick={() => setBlock(sel.i, { position: 'after' })} testId="rb-pos-after" />
        </div>
      </RGroup>
    </>
  );

  const orderGroup = (
    <RGroup label={ops ? ops.name : tr('Tartib')}>
      <div className="flex flex-col gap-0.5">
        <div className="flex">
          <RBtn icon={ops?.horizontal ? ArrowLeft : ArrowUp} title={ops?.horizontal ? tr('Chapga') : tr('Yuqoriga')} disabled={!ops?.up} onClick={() => ops.up()} testId="rb-up" />
          <RBtn icon={ops?.horizontal ? ArrowRight : ArrowDown} title={ops?.horizontal ? tr("O'ngga") : tr('Pastga')} disabled={!ops?.down} onClick={() => ops.down()} testId="rb-down" />
        </div>
        <RBtn icon={Trash2} label={tr("O'chirish")} danger disabled={!ops} onClick={removeSelected} testId="rb-delete" />
      </div>
    </RGroup>
  );

  const ribbon = {
    home: (
      <>
        {blockGroups}
        {orderGroup}
        {!selBlock && <Hint>{tr('Formatlash uchun varaqdagi matn blokini bosing.')}</Hint>}
      </>
    ),
    insert: (
      <>
        <RGroup label={tr('Matn bloklari')}>
          {BLOCK_PRESETS().map((p) => (
            <RBig key={p.key} icon={PRESET_ICONS[p.key] || Pilcrow} label={p.label} onClick={() => insertBlocks(p.blocks || [p.block])} testId={`rb-preset-${p.key}`} />
          ))}
          <RBig icon={TextCursorInput} label={tr("Bo'sh blok")} onClick={() => insertBlocks([{ ...EMPTY_BLOCK }], null, true)} testId="rb-preset-empty" />
        </RGroup>
        <RGroup label={tr('Shapka')}>
          <RBig icon={Rows3} label={tr('Markaziy qator')} onClick={addOrg} disabled={orgLines.length >= 6} testId="rb-add-org" />
          <RBig icon={FileText} label={tr('Rekvizit')} onClick={addMeta} disabled={meta.length >= 8} testId="rb-add-meta" />
        </RGroup>
        <RGroup label={tr('Jadval')}>
          <RBig icon={Columns3} label={tr('Ustun')} onClick={addField} disabled={!hasTable} testId="rb-add-col" />
          <RBig icon={Sigma} label={tr('Итого qatori')} onClick={addFooter} disabled={!hasTable || footer.length >= 5} testId="rb-add-footer" />
        </RGroup>
      </>
    ),
    table: (
      <>
        <RGroup label={tr('Jadval')}>
          <Switch testId="smk-table-toggle" checked={hasTable} onChange={(v) => (setHeader({ table: v }), v || setSel(null))} label={tr('Jadval bor')} />
        </RGroup>
        <RGroup label={tr("Qo'shish")}>
          <RBig icon={Columns3} label={tr('Ustun')} onClick={addField} disabled={!hasTable} testId="rb-add-col2" />
          <RBig icon={Sigma} label={tr('Итого qatori')} onClick={addFooter} disabled={!hasTable || footer.length >= 5} testId="rb-add-footer2" />
        </RGroup>
        {selCol && (
          <RGroup label={`${tr('Ustun')}: ${selCol.label || '…'}`} testId="rb-col-group">
            <div className="flex flex-col gap-1">
              <select className="h-8 rounded-md border border-border bg-white px-2 text-xs" value={selCol.type} onChange={(e) => setField(sel.i, { type: e.target.value })} data-testid="rb-col-type">
                {FIELD_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <label className="flex items-center gap-1.5 text-xs text-slate-600">
                <input type="checkbox" checked={!!selCol.required} onChange={(e) => setField(sel.i, { required: e.target.checked })} className="h-4 w-4 rounded border-border text-primary" data-testid="rb-col-required" />
                {tr('Majburiy')}
              </label>
            </div>
            {selCol.type === 'select' && (
              <textarea
                rows={3}
                className="h-[60px] w-48 resize-none rounded-md border border-border p-1.5 text-xs"
                placeholder={tr('Variantlar — har biri yangi qatorda')}
                value={selCol.optionsText || ''}
                onChange={(e) => setField(sel.i, { optionsText: e.target.value })}
                data-testid="rb-col-options"
              />
            )}
          </RGroup>
        )}
        {selFooter && (
          <RGroup label={tr('Итого qatori')} testId="rb-footer-group">
            <div className="flex flex-col gap-1 text-xs text-slate-600">
              <label className="flex items-center gap-1.5">
                {tr('Birlashtirilgan kataklar')}
                <select
                  className="h-7 rounded-md border border-border bg-white px-1.5 text-xs"
                  value={Math.min(selFooter.labelSpan || 1, fields.length + 1)}
                  onChange={(e) => setFooterRow(sel.i, { labelSpan: Number(e.target.value) })}
                  data-testid="rb-footer-span"
                >
                  {Array.from({ length: fields.length + 1 }, (_, k) => k + 1).map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </label>
              {numericFields.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1">
                  <span>{tr("Yig'indi:")}</span>
                  {numericFields.map((f) => {
                    const on = (selFooter.sums || []).includes(f.key);
                    return (
                      <button
                        key={f.key}
                        type="button"
                        data-testid="rb-footer-sum"
                        aria-pressed={on}
                        onClick={() => setFooterRow(sel.i, { sums: on ? selFooter.sums.filter((k) => k !== f.key) : [...(selFooter.sums || []), f.key] })}
                        className={`rounded-full border px-2 py-0.5 text-[11px] ${on ? 'border-primary bg-primary text-white' : 'border-border bg-white text-slate-600'}`}
                      >
                        Σ {f.label || '…'}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <span className="max-w-[220px] text-[11px] text-slate-400">{tr("Yig'indi uchun ustun turi \"Raqam\" yoki \"Pul (summa)\" bo'lishi kerak.")}</span>
              )}
            </div>
          </RGroup>
        )}
        {(selCol || selFooter) && orderGroup}
        {!selCol && !selFooter && hasTable && <Hint>{tr('Ustun sozlamalari uchun jadval sarlavhasidagi katakni bosing.')}</Hint>}
      </>
    ),
    page: (
      <>
        <RGroup label={tr("Yo'nalish")}>
          <RBig icon={RectangleVertical} label={tr('Kitob (tik)')} active={!landscape} onClick={() => setHeader({ orientation: 'portrait' })} testId="rb-portrait" />
          <RBig icon={RectangleHorizontal} label={tr('Albom (yotiq)')} active={landscape} onClick={() => setHeader({ orientation: 'landscape' })} testId="rb-landscape" />
        </RGroup>
        <RGroup label={tr('Forma')}>
          <div className="flex flex-col gap-1.5">
            <Switch testId="smk-active-toggle" checked={!!form.isActive} onChange={(v) => set('isActive', v)} label={tr('Faol')} />
            <label className="flex items-center gap-1.5 text-xs text-slate-600">
              {tr('Tartib raqami')}
              <input type="number" className="h-7 w-16 rounded-md border border-border px-1.5 text-xs" value={form.order} onChange={(e) => set('order', e.target.value)} />
            </label>
          </div>
        </RGroup>
        <RGroup label={tr('Tavsif / ko\'rsatma')}>
          <textarea
            rows={3}
            className="h-[60px] w-72 resize-none rounded-md border border-border p-1.5 text-xs"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder={tr('Xodimlar uchun qisqa ko\'rsatma (hujjatga chiqmaydi)')}
          />
        </RGroup>
        <RGroup label={tr("Ko'rinish")}>
          <RBig icon={PencilLine} label={tr('Tahrirlash')} active={view === 'edit'} onClick={() => setView('edit')} />
          <RBig icon={ScanEye} label={tr('Natija')} active={view === 'result'} onClick={() => (setView('result'), setSel(null))} testId="rb-view-result" />
        </RGroup>
      </>
    ),
  };

  const TABS = [
    { key: 'home', label: tr('Bosh sahifa') },
    { key: 'insert', label: tr("Qo'shish") },
    { key: 'table', label: tr('Jadval') },
    { key: 'page', label: tr('Sahifa') },
  ];

  return (
    <div
      className="fixed inset-0 z-[120] flex flex-col bg-[#e9ecf0]"
      role="dialog"
      aria-modal="true"
      aria-label={initial.id ? tr('Formani tahrirlash') : tr('Yangi forma')}
      data-testid="smk-editor"
    >
      {/* --- Sarlavha paneli --- */}
      <div className="flex flex-wrap items-center gap-2 bg-primary px-3 py-2 text-white">
        <FileText className="h-5 w-5 shrink-0 text-accent" />
        <span className="hidden text-sm font-semibold md:inline">{initial.id ? tr('Formani tahrirlash') : tr('Yangi forma')}</span>
        <input
          className="h-8 w-36 rounded-md border border-white/20 bg-white/10 px-2.5 text-sm font-semibold text-white placeholder-white/50 outline-none focus:border-white/60 focus:bg-white/15"
          placeholder="F-01"
          aria-label={tr('Kod')}
          title={tr('Kod')}
          value={form.code}
          onChange={(e) => set('code', e.target.value)}
          data-testid="smk-code"
        />
        <input
          className="h-8 min-w-[200px] flex-1 rounded-md border border-white/20 bg-white/10 px-2.5 text-sm text-white placeholder-white/50 outline-none focus:border-white/60 focus:bg-white/15"
          placeholder={`${tr('Nomi')} *`}
          aria-label={tr('Nomi')}
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          data-testid="smk-title"
        />
        {dirty && <span className="hidden text-xs text-white/60 lg:inline">● {tr('Saqlanmagan')}</span>}
        <button type="button" onClick={tryClose} className="h-8 rounded-md px-3 text-sm text-white/85 hover:bg-white/10">
          {tr('Bekor qilish')}
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          title="Ctrl+S"
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-white px-3.5 text-sm font-semibold text-primary shadow hover:bg-accent hover:text-white disabled:opacity-60"
        >
          <Save className="h-4 w-4" /> {saving ? tr('Saqlanmoqda...') : tr('Saqlash')}
        </button>
        <button type="button" onClick={tryClose} className="rounded-md p-1.5 text-white/70 hover:bg-white/10" title={tr('Yopish')}>
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* --- Lenta --- */}
      <div className="border-b border-slate-300 bg-white shadow-sm">
        <div className="flex gap-1 border-b border-slate-200 bg-[#f6f7f9] px-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              data-testid={`smk-rtab-${t.key}`}
              className={`relative -mb-px px-4 py-2 text-[13px] font-medium transition ${
                tab === t.key ? 'rounded-t-md border border-b-white border-slate-200 bg-white text-primary' : 'text-slate-600 hover:text-primary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex min-h-[86px] items-stretch overflow-x-auto px-1 py-1.5" data-testid="smk-ribbon">
          {ribbon[tab]}
        </div>
      </div>

      {/* --- Varaq --- */}
      <div
        ref={canvasRef}
        className="min-h-0 flex-1 overflow-auto px-6 py-8"
        onMouseDown={(e) => e.target === e.currentTarget && setSel(null)}
        data-testid="smk-canvas"
      >
        {view === 'edit' ? (
          <Paper scale={scale} pageW={pageW} landscape={landscape} onBackground={() => setSel(null)}>
            <div style={{ fontFamily: DOC_FONT, color: '#000' }} data-testid="smk-doc">
              {headerTable}
              {blocksArea('before')}
              {dataTable}
              {hasTable ? <div style={{ marginTop: 12 }}>{blocksArea('after')}</div> : blocksArea('after')}
            </div>
          </Paper>
        ) : (
          <Paper scale={scale} pageW={pageW} landscape={landscape}>
            {/* HTML smkDocument.buildDocumentHtml ichida esc() bilan tozalangan. */}
            <div data-testid="smk-preview" className="text-black" dangerouslySetInnerHTML={{ __html: resultHtml }} />
          </Paper>
        )}
      </div>

      {/* --- Holat qatori --- */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-300 bg-[#f6f7f9] px-3 py-1 text-[11px] text-slate-500">
        <span>{landscape ? tr('Albom (yotiq)') : tr('Kitob (tik)')}</span>
        <span>{tr('Matn bloklari')}: {blocks.length}</span>
        <span>{hasTable ? `${tr('Ustunlar')}: ${fields.length}` : tr('Jadvalsiz')}</span>
        <span className="hidden sm:inline">Ctrl+S — {tr('Saqlash')}</span>
        <div className="ml-auto flex items-center gap-1">
          <button type="button" onClick={() => setView('edit')} title={tr('Tahrirlash')} className={`rounded p-1 ${view === 'edit' ? 'bg-slate-200 text-primary' : 'hover:bg-slate-200'}`}>
            <PencilLine className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => (setView('result'), setSel(null))}
            title={tr('Natija')}
            data-testid="smk-view-result"
            className={`rounded p-1 ${view === 'result' ? 'bg-slate-200 text-primary' : 'hover:bg-slate-200'}`}
          >
            <ScanEye className="h-3.5 w-3.5" />
          </button>
          <span className="mx-1 h-4 w-px bg-slate-300" />
          <button type="button" onClick={() => setZoomPct(scale * 100 - 10)} className="rounded p-1 hover:bg-slate-200" title="−">
            <Minus className="h-3.5 w-3.5" />
          </button>
          <input
            type="range"
            min={30}
            max={200}
            value={Math.round(scale * 100)}
            onChange={(e) => setZoomPct(Number(e.target.value))}
            className="h-1 w-24 accent-primary"
            aria-label={tr('Masshtab')}
          />
          <button type="button" onClick={() => setZoomPct(scale * 100 + 10)} className="rounded p-1 hover:bg-slate-200" title="+">
            <Plus className="h-3.5 w-3.5" />
          </button>
          <span className="w-9 text-right tabular-nums">{Math.round(scale * 100)}%</span>
          <button type="button" onClick={() => setZoom('fit')} className={`rounded p-1 ${zoom === 'fit' ? 'text-primary' : 'hover:bg-slate-200'}`} title={tr('Oynaga moslash')}>
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
