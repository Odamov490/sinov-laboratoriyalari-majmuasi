// "Hisobot qoidasi" for the test journal (sinovlar jurnali) — one place, used
// by the import check and the summary API so both always agree.
//
// Default rule: BEKOR_QILINDI and NAMUNA_TAQDIM_ETILMADI rows count neither
// samples nor amount; every other row counts
// sampleCount - cancelledSampleCount samples and its full amount.
// includeCancelled=true drops the exclusion (cancelled samples still subtract).

const EXCLUDED_RESULTS = ['BEKOR_QILINDI', 'NAMUNA_TAQDIM_ETILMADI'];

const isExcluded = (record, includeCancelled = false) =>
  !includeCancelled && EXCLUDED_RESULTS.includes(record.result);

function reportSamples(record, includeCancelled = false) {
  if (isExcluded(record, includeCancelled)) return 0;
  return Math.max((record.sampleCount || 0) - (record.cancelledSampleCount || 0), 0);
}

function reportAmount(record, includeCancelled = false) {
  if (isExcluded(record, includeCancelled)) return 0;
  return Number(record.amount || 0);
}

const toDateStr = (value) => {
  if (!value) return null;
  return typeof value === 'string' ? value.slice(0, 10) : value.toISOString().slice(0, 10);
};

// Month a record belongs to in the report: sample received date, else act date.
function reportMonth(record) {
  const date = toDateStr(record.sampleReceivedDate) || toDateStr(record.actDate);
  return date ? date.slice(0, 7) : null;
}

// Aggregates records (with productType/certificationBody relations) into the
// summary report: totals plus breakdowns by month, product type, customer and
// result. Pure, so the import check and the API compute identical numbers.
function buildSummary(records, includeCancelled = false) {
  const bucket = () => ({ records: 0, samples: 0, amount: 0 });
  const add = (map, key, extra, s, a) => {
    if (!map.has(key)) map.set(key, { ...extra, ...bucket() });
    const b = map.get(key);
    b.records += 1;
    b.samples += s;
    b.amount += a;
  };

  const totals = bucket();
  const byMonth = new Map();
  const byProductType = new Map();
  const byBody = new Map();
  const byResult = new Map();

  records.forEach((r) => {
    const s = reportSamples(r, includeCancelled);
    const a = reportAmount(r, includeCancelled);
    totals.records += 1;
    totals.samples += s;
    totals.amount += a;
    const month = reportMonth(r);
    add(byMonth, month || '—', { month }, s, a);
    // Grouped like the journal's sheets: noise tests (of refrigerators) are
    // their own "Shovqin" line rather than part of their product type.
    if ((r.directions || []).includes('SHOVQIN')) {
      add(byProductType, 'shovqin', { id: 'shovqin', name: 'Shovqin' }, s, a);
    } else {
      const pt = r.productType || {};
      add(byProductType, pt.id || 'none', { id: pt.id || null, name: pt.nameUz || '—' }, s, a);
    }
    const body = r.certificationBody;
    add(byBody, body ? body.id : 'none', { id: body?.id || null, name: body?.name || '—' }, s, a);
    add(byResult, r.result, { result: r.result }, s, a);
  });

  const count = (result) => byResult.get(result)?.records || 0;
  // Shares are over rows with a final verdict (mos / mos emas / qisman).
  const conclusive = count('MOS') + count('MOS_EMAS') + count('QISMAN_MOS_EMAS');
  const round = (row) => ({ ...row, amount: Math.round(row.amount * 100) / 100 });
  const sorted = (map, cmp) => [...map.values()].sort(cmp).map(round);

  return {
    totals: {
      ...round(totals),
      conformShare: conclusive ? count('MOS') / conclusive : null,
      nonconformShare: conclusive ? (count('MOS_EMAS') + count('QISMAN_MOS_EMAS')) / conclusive : null,
    },
    byMonth: sorted(byMonth, (a, b) => String(a.month).localeCompare(String(b.month))),
    byProductType: sorted(byProductType, (a, b) => b.samples - a.samples),
    byCertificationBody: sorted(byBody, (a, b) => b.samples - a.samples || b.records - a.records),
    byResult: sorted(byResult, (a, b) => b.records - a.records),
  };
}

module.exports = { EXCLUDED_RESULTS, reportSamples, reportAmount, reportMonth, buildSummary };
