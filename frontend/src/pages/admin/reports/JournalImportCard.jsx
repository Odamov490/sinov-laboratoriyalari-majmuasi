import React, { useState } from 'react';
import { Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { adminTestJournal } from '../../../services/adminApi';
import { formatMoney } from './journalConstants';

// Imports the Excel journal (prepared as sinovlar-jurnali-2026.json) from the
// admin panel: choosing the file runs a dry-run check first, and only a file
// that passes it can be imported. Re-importing never duplicates rows.
export default function JournalImportCard() {
  const [fileName, setFileName] = useState('');
  const [payload, setPayload] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | checking | checked | importing | done | error
  const [check, setCheck] = useState(null);
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState([]);

  const fail = (message, list = []) => {
    setStatus('error');
    setErrors([message, ...list]);
  };

  const onFile = async (file) => {
    if (!file) return;
    setFileName(file.name);
    setCheck(null);
    setResult(null);
    setErrors([]);
    let data;
    try {
      data = JSON.parse(await file.text());
    } catch {
      setPayload(null);
      fail("Fayl JSON formatida emas. sinovlar-jurnali-2026.json faylini tanlang.");
      return;
    }
    setPayload(data);
    setStatus('checking');
    try {
      setCheck(await adminTestJournal.importJournal(data, { dryRun: true }));
      setStatus('checked');
    } catch (err) {
      fail(err?.response?.data?.error || 'Faylni tekshirishda xatolik.', err?.response?.data?.errors || []);
    }
  };

  const runImport = async () => {
    setStatus('importing');
    try {
      setResult(await adminTestJournal.importJournal(payload));
      setStatus('done');
    } catch (err) {
      fail(err?.response?.data?.error || 'Importda xatolik yuz berdi.', err?.response?.data?.errors || []);
    }
  };

  const summary = result?.summary || check?.summary;

  return (
    <div className="card p-5">
      <h2 className="text-lg font-bold text-ink">Excel jurnalidan import</h2>
      <p className="mt-1 text-sm text-slate-500">
        Excel jurnalidan tayyorlangan <span className="font-mono">sinovlar-jurnali-2026.json</span> faylini tanlang. Avval fayl tekshiriladi,
        keyin import qilinadi. Qayta import qilsangiz, bor yozuvlar takrorlanmaydi va o'zgartirilmaydi.
      </p>

      <label className="mt-4 inline-flex cursor-pointer items-center gap-2 btn-secondary !py-2">
        <Upload className="h-4 w-4" /> {fileName || 'JSON faylni tanlash'}
        <input
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(e) => {
            onFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </label>

      {(status === 'checking' || status === 'importing') && (
        <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> {status === 'checking' ? 'Fayl tekshirilmoqda...' : 'Import qilinmoqda...'}
        </p>
      )}

      {status === 'error' && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <p className="flex items-center gap-2 font-semibold">
            <AlertCircle className="h-4 w-4" /> {errors[0]}
          </p>
          {errors.length > 1 && (
            <ul className="mt-1 list-disc pl-6 text-xs">
              {errors.slice(1).map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {summary && status !== 'error' && (
        <div className="mt-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            {status === 'done'
              ? `Import tugadi: ${result.created} ta yangi yozuv qo'shildi, ${result.skipped} tasi bazada bor edi.`
              : "Fayl tekshiruvdan o'tdi."}
          </p>
          <p className="mt-1 text-sm text-ink">
            {summary.records} ta yozuv · {summary.samples} ta namuna · {formatMoney(summary.amount)} so'm · tekshirish kerak: {summary.needsReview}
          </p>
          <table className="mt-2 text-xs text-slate-600">
            <tbody>
              {Object.entries(summary.bySheet || {}).map(([sheet, v]) => (
                <tr key={sheet}>
                  <td className="pr-4">{sheet}</td>
                  <td className="pr-4 text-right tabular-nums">{v.records} ta yozuv</td>
                  <td className="text-right tabular-nums">{v.samples} ta namuna</td>
                </tr>
              ))}
            </tbody>
          </table>
          {result?.warnings?.length > 0 && (
            <ul className="mt-2 list-disc pl-6 text-xs text-amber-700">
              {result.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}
          {status === 'checked' && (
            <button onClick={runImport} className="btn-primary mt-4">
              Import qilish
            </button>
          )}
        </div>
      )}
    </div>
  );
}
