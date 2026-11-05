import React, { useEffect, useState } from 'react';
import { AlertTriangle, Trash2, Copy } from 'lucide-react';
import { Modal, ConfirmDialog } from '../../../components/Modal.jsx';
import { adminTestJournal } from '../../../services/adminApi';
import { useToast } from '../../../context/ToastContext.jsx';
import TestJournalHistory from './TestJournalHistory.jsx';
import { resultOptions, directionOptions, defaultDirections, PAYMENT_LABELS, CANCELLED_BY_LABELS } from './journalConstants';
import { tr } from '../../../i18n/tr.js';

const EMPTY = {
  journalYear: new Date().getFullYear(),
  productTypeId: '',
  certificationBodyId: '',
  actNo: '',
  actDate: '',
  executorName: '',
  sampleReceivedDate: '',
  sampleReceivedTime: '',
  sampleCount: '',
  cancelledSampleCount: 0,
  weightNote: '',
  protocolDate: '',
  directions: [],
  result: 'KUTILMOQDA',
  nonconformingCount: '',
  cancelledBy: '',
  brand: '',
  locationId: '',
  isRepeat: false,
  contractNo: '',
  contractDate: '',
  amount: '',
  paymentStatus: '',
  notes: '',
  needsReview: false,
  customFields: {},
};

// Fields reset when a row is copied into a new one: the copy shares the act,
// customer, product and dates, but its outcome is still to come.
const COPY_RESET = {
  protocolDate: '',
  result: 'KUTILMOQDA',
  nonconformingCount: '',
  cancelledBy: '',
  cancelledSampleCount: 0,
  amount: '',
  paymentStatus: '',
  notes: '',
  needsReview: false,
};

function toForm(record) {
  const form = { ...EMPTY, directions: [] };
  Object.keys(EMPTY).forEach((k) => {
    if (record[k] !== undefined && record[k] !== null) form[k] = record[k];
  });
  form.productTypeId = record.productTypeId || '';
  form.certificationBodyId = record.certificationBodyId || '';
  form.locationId = record.locationId || '';
  form.notes = (record.notes || []).join('\n');
  form.customFields = { ...(record.customFields || {}) };
  return form;
}

function toPayload(form, showFinance, customColumns) {
  const num = (v) => (v === '' || v === null || v === undefined ? null : Number(v));
  const str = (v) => (v === '' || v === undefined ? null : String(v).trim() || null);
  const payload = {
    journalYear: Number(form.journalYear),
    productTypeId: form.productTypeId,
    certificationBodyId: form.certificationBodyId || null,
    actNo: str(form.actNo),
    actDate: form.actDate || null,
    executorName: str(form.executorName),
    sampleReceivedDate: form.sampleReceivedDate || null,
    sampleReceivedTime: str(form.sampleReceivedTime),
    sampleCount: num(form.sampleCount),
    cancelledSampleCount: num(form.cancelledSampleCount) || 0,
    weightNote: str(form.weightNote),
    protocolDate: form.protocolDate || null,
    directions: form.directions,
    result: form.result,
    nonconformingCount: num(form.nonconformingCount),
    cancelledBy: form.cancelledBy || null,
    brand: str(form.brand),
    locationId: form.locationId || null,
    isRepeat: Boolean(form.isRepeat),
    notes: String(form.notes || '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean),
    needsReview: Boolean(form.needsReview),
    // Extra columns: numbers stored as numbers, empty values dropped
    // server-side. Values of columns no longer in the layout are kept as is.
    customFields: {
      ...(form.customFields || {}),
      ...Object.fromEntries(
        customColumns.map((c) => {
          const v = form.customFields?.[c.key];
          if (v === '' || v === undefined || v === null) return [c.key, null];
          return [c.key, c.type === 'number' ? Number(v) : String(v)];
        })
      ),
    },
  };
  if (showFinance) {
    payload.contractNo = str(form.contractNo);
    payload.contractDate = form.contractDate || null;
    payload.amount = num(form.amount);
    payload.paymentStatus = form.paymentStatus || null;
  }
  return payload;
}

function Field({ label, children, full }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label className="block text-sm font-medium text-ink mb-1.5">{label}</label>
      {children}
    </div>
  );
}

// Create/edit dialog for one journal row. `record` null = new row;
// `copyFrom` prefills a new row from an existing one ("Nusxa olish").
export default function TestJournalRecordModal({
  open,
  record,
  copyFrom,
  dictionaries,
  showFinance,
  customColumns = [],
  onClose,
  onSaved,
  onCopy,
}) {
  const { showToast } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (record) setForm(toForm(record));
    else if (copyFrom) setForm({ ...toForm(copyFrom), ...COPY_RESET });
    else setForm({ ...EMPTY, directions: defaultDirections() });
  }, [open, record, copyFrom]);

  const set = (name, value) => setForm((f) => ({ ...f, [name]: value }));
  const toggleDirection = (value) =>
    setForm((f) => ({
      ...f,
      directions: f.directions.includes(value) ? f.directions.filter((d) => d !== value) : [...f.directions, value],
    }));

  const save = async () => {
    if (!form.productTypeId) {
      showToast(tr('Mahsulot turini tanlang.'), 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = toPayload(form, showFinance, customColumns);
      if (record) await adminTestJournal.update(record.id, payload);
      else await adminTestJournal.create(payload);
      showToast(record ? tr('Yangilandi.') : tr("Qo'shildi."), 'success');
      onSaved();
    } catch (err) {
      showToast(err?.response?.data?.error || tr('Saqlashda xatolik yuz berdi.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      await adminTestJournal.remove(record.id);
      showToast(tr("O'chirildi."), 'success');
      onSaved();
    } catch {
      showToast(tr("O'chirishda xatolik."), 'error');
    }
  };

  const input = (name, type = 'text', extra = {}) => (
    <input type={type} className="input-field" value={form[name] ?? ''} onChange={(e) => set(name, e.target.value)} {...extra} />
  );
  const select = (name, options, placeholder = '—') => (
    <select className="input-field" value={form[name] ?? ''} onChange={(e) => set(name, e.target.value)}>
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );

  const toOptions = (items, labelKey) => items.map((i) => ({ value: i.id, label: i[labelKey] }));

  return (
    <>
      <datalist id="journal-executors">
        {(dictionaries.suggestions?.executors || []).map((v) => (
          <option key={v} value={v} />
        ))}
      </datalist>
      <datalist id="journal-brands">
        {(dictionaries.suggestions?.brands || []).map((v) => (
          <option key={v} value={v} />
        ))}
      </datalist>
      <Modal
        open={open}
        onClose={onClose}
        title={record ? tr('Yozuvni tahrirlash{0}', record.actNo ? ` — ${record.actNo}` : '') : copyFrom ? tr('Yangi yozuv (nusxa)') : tr('Yangi yozuv')}
        size="xl"
      >
        {record?.needsReview && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">{tr('Tekshirish kerak')}</p>
              <ul className="list-disc pl-4">
                {(record.reviewReasons || []).map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={tr('Mahsulot turi *')}>{select('productTypeId', toOptions(dictionaries.productTypes, 'nameUz'), tr('Tanlang'))}</Field>
          <Field label={tr('Buyurtmachi')}>{select('certificationBodyId', toOptions(dictionaries.bodies, 'name'))}</Field>
          <Field label={tr('Akt ID')}>{input('actNo')}</Field>
          <Field label={tr('Akt sanasi')}>{input('actDate', 'date')}</Field>
          <Field label={tr('Ijrochi')}>{input('executorName', 'text', { list: 'journal-executors', autoComplete: 'off' })}</Field>
          <Field label={tr('Jurnal yili')}>{input('journalYear', 'number', { min: 2000, max: 2100 })}</Field>
          <Field label={tr('Namuna kelgan sana')}>{input('sampleReceivedDate', 'date')}</Field>
          <Field label={tr('Namuna kelgan vaqt')}>{input('sampleReceivedTime', 'text', { placeholder: 'masalan 14:30' })}</Field>
          <Field label={tr('Namunalar soni')}>{input('sampleCount', 'number', { min: 0 })}</Field>
          <Field label={tr('Shundan bekor qilingan')}>{input('cancelledSampleCount', 'number', { min: 0 })}</Field>
          <Field label={tr('Bayonnoma sanasi')}>{input('protocolDate', 'date')}</Field>
          <Field label={tr("Og'irlik (kir yuvish mashinasi)")}>{input('weightNote', 'text', { placeholder: tr('masalan 7, 8 kg') })}</Field>

          <Field label={tr("Yo'nalishlar")} full>
            <div className="flex flex-wrap gap-3">
              {directionOptions(form.directions).map((d) => (
                <label key={d.value} className="flex items-center gap-2 text-sm text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.directions.includes(d.value)}
                    onChange={() => toggleDirection(d.value)}
                    className="h-4 w-4 rounded border-border text-primary"
                  />
                  {d.label}
                </label>
              ))}
            </div>
          </Field>

          <Field label={tr('Natija')}>
            {select(
              'result',
              resultOptions(form.result),
              tr('Tanlang')
            )}
          </Field>
          <Field label={tr('Nomuvofiq namunalar soni')}>{input('nonconformingCount', 'number', { min: 0 })}</Field>
          <Field label={tr('Bekor qilgan tomon')}>
            {select(
              'cancelledBy',
              Object.entries(CANCELLED_BY_LABELS).map(([value, label]) => ({ value, label }))
            )}
          </Field>
          <Field label={tr('Marka')}>{input('brand', 'text', { list: 'journal-brands', autoComplete: 'off' })}</Field>
          <Field label={tr('Joy')}>{select('locationId', toOptions(dictionaries.locations, 'nameUz'))}</Field>
          <Field label={tr('Takroriy sinov')}>
            <label className="flex items-center gap-2 text-sm text-ink cursor-pointer h-10">
              <input
                type="checkbox"
                checked={!!form.isRepeat}
                onChange={(e) => set('isRepeat', e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary"
              />
              {tr('Ha, takroriy (povtor)')}
            </label>
          </Field>

          {showFinance && (
            <>
              <Field label={tr('Shartnoma raqami')}>{input('contractNo')}</Field>
              <Field label={tr('Shartnoma sanasi')}>{input('contractDate', 'date')}</Field>
              <Field label={tr("Summa (so'm)")}>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className="input-field"
                  value={form.amount ?? ''}
                  onChange={(e) => set('amount', e.target.value)}
                />
              </Field>
              <Field label={tr("To'lov")}>
                {select(
                  'paymentStatus',
                  Object.entries(PAYMENT_LABELS).map(([value, label]) => ({ value, label })),
                  tr('Kuzatilmagan')
                )}
              </Field>
            </>
          )}

          {customColumns.length > 0 && (
            <>
              <p className="sm:col-span-2 mt-2 border-t border-border pt-3 text-sm font-semibold text-ink">{tr("Qo'shimcha ustunlar")}</p>
              {customColumns.map((c) => (
                <Field key={c.key} label={c.label()}>
                  <input
                    type={c.type === 'number' ? 'number' : c.type === 'date' ? 'date' : 'text'}
                    className="input-field"
                    value={form.customFields?.[c.key] ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, customFields: { ...f.customFields, [c.key]: e.target.value } }))}
                  />
                </Field>
              ))}
            </>
          )}

          <Field label={tr('Izohlar (har biri yangi qatorda)')} full>
            <textarea rows={3} className="input-field resize-none" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </Field>
          <Field label={tr('Tekshiruv')} full>
            <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
              <input
                type="checkbox"
                checked={!!form.needsReview}
                onChange={(e) => set('needsReview', e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary"
              />
              {tr('Tekshirish kerak (belgini olib tashlasangiz, sabablar ham tozalanadi)')}
            </label>
          </Field>
        </div>

        {record && <TestJournalHistory recordId={record.id} dictionaries={dictionaries} />}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4">
            {record && (
              <button onClick={() => setConfirmDelete(true)} className="inline-flex items-center gap-1.5 text-sm text-red-600 hover:underline">
                <Trash2 className="h-4 w-4" /> {tr("O'chirish")}
              </button>
            )}
            {record && onCopy && (
              <button
                onClick={() => onCopy(record)}
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                title={tr("Shu akt bo'yicha yangi qator ochish (masalan, shovqin sinovi uchun)")}
              >
                <Copy className="h-4 w-4" /> {tr('Nusxa olib yangi yozuv')}
              </button>
            )}
          </div>
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

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={remove}
        message={tr("Ushbu jurnal yozuvini o'chirmoqchimisiz?")}
      />
    </>
  );
}
