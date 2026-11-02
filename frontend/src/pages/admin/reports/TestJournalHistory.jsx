import React, { useEffect, useState } from 'react';
import { History, Loader2 } from 'lucide-react';
import { adminTestJournal } from '../../../services/adminApi';
import {
  FIELD_LABELS,
  RESULT_LABELS,
  DIRECTION_SHORT,
  PAYMENT_LABELS,
  CANCELLED_BY_LABELS,
  formatDate,
  formatMoney,
} from './journalConstants';
import { resolveColumns } from './journalColumns.jsx';

const ACTION_LABELS = { CREATE: "qo'shdi", UPDATE: "o'zgartirdi", DELETE: "o'chirdi" };
const DATE_FIELDS = ['actDate', 'sampleReceivedDate', 'protocolDate', 'contractDate'];

const formatDateTime = (value) => {
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// Human-readable value of one changed field (ids resolved via dictionaries).
function formatValue(field, value, dictionaries) {
  if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) return '—';
  const nameById = (list, key) => list.find((i) => i.id === value)?.[key] || value;
  switch (field) {
    case 'productTypeId':
      return nameById(dictionaries.productTypes, 'nameUz');
    case 'certificationBodyId':
      return nameById(dictionaries.bodies, 'name');
    case 'locationId':
      return nameById(dictionaries.locations, 'nameUz');
    case 'result':
      return RESULT_LABELS[value] || value;
    case 'paymentStatus':
      return PAYMENT_LABELS[value] || value;
    case 'cancelledBy':
      return CANCELLED_BY_LABELS[value] || value;
    case 'directions':
      return value.map((d) => DIRECTION_SHORT[d] || d).join('+');
    case 'amount':
      return `${formatMoney(value)} so'm`;
    default:
      if (DATE_FIELDS.includes(field)) return formatDate(value);
      if (typeof value === 'boolean') return value ? 'ha' : "yo'q";
      if (Array.isArray(value)) return value.join('; ');
      return String(value);
  }
}

// "O'zgarishlar tarixi" block of the record dialog: who added/changed/deleted
// the record and when, with before → after for each changed field.
export default function TestJournalHistory({ recordId, dictionaries }) {
  // Extra columns are logged as "customFields.<key>"; label them by the layout.
  const customLabels = Object.fromEntries(
    resolveColumns(dictionaries.layout)
      .filter((c) => c.custom)
      .map((c) => [`customFields.${c.key}`, c.label()])
  );
  const fieldLabel = (field) =>
    FIELD_LABELS[field] || customLabels[field] || (field.startsWith('customFields.') ? "O'chirilgan qo'shimcha ustun" : field);
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setData(null);
    setError(false);
    adminTestJournal
      .history(recordId)
      .then(setData)
      .catch(() => setError(true));
  }, [recordId]);

  return (
    <div className="mt-6 border-t border-border pt-4">
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
        <History className="h-4 w-4 text-slate-400" /> O'zgarishlar tarixi
      </p>
      {error ? (
        <p className="text-xs text-red-500">Tarixni yuklab bo'lmadi.</p>
      ) : !data ? (
        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
      ) : (
        <ul className="space-y-2 text-xs text-slate-600">
          {data.items.map((e) => (
            <li key={e.id}>
              <span className="text-slate-400">{formatDateTime(e.createdAt)}</span>{' '}
              <span className="font-medium text-ink">{e.userName || "Noma'lum foydalanuvchi"}</span> {ACTION_LABELS[e.action]}
              {e.changes && (
                <ul className="mt-0.5 pl-4 list-disc">
                  {Object.entries(e.changes).map(([field, { from, to }]) => (
                    <li key={field}>
                      {fieldLabel(field)}: {formatValue(field, from, dictionaries)} →{' '}
                      <span className="text-ink">{formatValue(field, to, dictionaries)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
          {data.importedFromExcel && (
            <li>
              <span className="text-slate-400">{formatDateTime(data.importedAt)}</span> Excel jurnalidan import qilingan
            </li>
          )}
          {!data.items.length && !data.importedFromExcel && <li>Tarix yo'q.</li>}
        </ul>
      )}
    </div>
  );
}
