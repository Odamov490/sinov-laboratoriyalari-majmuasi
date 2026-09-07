import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Info, Loader2 } from 'lucide-react';
import { Breadcrumb } from '../components/UI.jsx';
import { checkTnVedRegulation } from '../services/publicApi';

const NOTICE_TONES = {
  red: {
    box: 'bg-red-50 border-red-200',
    icon: 'text-red-600',
    title: 'text-red-900',
    chip: 'bg-red-100 text-red-700',
    detailBox: 'bg-white border-red-200',
    detailText: 'text-red-800',
    note: 'border-red-200 text-red-700',
    link: 'text-red-700',
  },
  emerald: {
    box: 'bg-emerald-50 border-emerald-200',
    icon: 'text-emerald-600',
    title: 'text-emerald-900',
    chip: 'bg-emerald-100 text-emerald-700',
    detailBox: 'bg-white border-emerald-200',
    detailText: 'text-emerald-800',
    note: 'border-emerald-200 text-emerald-700',
    link: 'text-emerald-700',
  },
  amber: {
    box: 'bg-amber-50 border-amber-200',
    icon: 'text-amber-600',
    title: 'text-amber-900',
    chip: 'bg-amber-100 text-amber-700',
    detailBox: 'bg-white border-amber-200',
    detailText: 'text-amber-800',
    note: 'border-amber-200 text-amber-700',
    link: 'text-amber-700',
  },
};

const DETAIL_PREVIEW_LENGTH = 220;

// Renders one TN VED conformity-check result: a headline, the resolution/band
// reference as chips, the (often very long) legal item description in its
// own collapsible box, and a muted disclaimer footnote — shared layout for
// all three outcomes (mandatory cert / declaration / nothing found).
function RegulationNotice({ tone, icon: Icon, title, chips, detail, note }) {
  const [expanded, setExpanded] = useState(false);
  const c = NOTICE_TONES[tone];
  const isLong = detail && detail.length > DETAIL_PREVIEW_LENGTH;
  const shownDetail = isLong && !expanded ? `${detail.slice(0, DETAIL_PREVIEW_LENGTH)}…` : detail;

  return (
    <div className={`rounded-xl border px-4 py-4 ${c.box}`}>
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${c.icon}`} />
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-semibold ${c.title}`}>{title}</p>

          {chips?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {chips.map((chip) => (
                <span key={chip} className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${c.chip}`}>
                  {chip}
                </span>
              ))}
            </div>
          )}

          {detail && (
            <div className={`mt-3 rounded-lg border px-3.5 py-3 text-xs leading-relaxed ${c.detailBox} ${c.detailText}`}>
              {shownDetail}
              {isLong && (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className={`block mt-2 text-[11px] font-semibold underline underline-offset-2 ${c.link}`}
                >
                  {expanded ? 'Qisqartirish' : "To'liq matnni ko'rsatish"}
                </button>
              )}
            </div>
          )}

          {note && <p className={`mt-3 pt-3 border-t text-[11px] leading-relaxed ${c.note}`}>{note}</p>}
        </div>
      </div>
    </div>
  );
}

export default function TnVedCheck() {
  const { t } = useTranslation();
  const [tnQuery, setTnQuery] = useState('');

  // --- TN VED conformity-regulation lookup (mandatory cert / declaration) ---
  const [tnRegulation, setTnRegulation] = useState(null); // { matches, hasMandatoryCert, hasDeclaration } | null
  const [tnChecking, setTnChecking] = useState(false);

  // Approximate conformity-requirement check (4-digit HS heading match only
  // — see backend parseTnVedRanges), fired automatically as the code is
  // typed. A changed code always clears the previous result first, so a
  // stale banner never lingers on top of a code it no longer matches.
  useEffect(() => {
    const code = tnQuery.replace(/\D/g, '');
    setTnRegulation(null);
    if (code.length < 4) {
      setTnChecking(false);
      return undefined;
    }
    setTnChecking(true);
    const handle = setTimeout(() => {
      checkTnVedRegulation(code)
        .then(setTnRegulation)
        .catch(() => setTnRegulation(null))
        .finally(() => setTnChecking(false));
    }, 450);
    return () => clearTimeout(handle);
  }, [tnQuery]);

  const mandatoryMatch = tnRegulation?.matches?.find((m) => m.category === 'SERTIFIKAT');
  const declarationMatch = !mandatoryMatch && tnRegulation?.matches?.find((m) => m.category === 'DEKLARATSIYA');
  const checkedNoMatch = !tnChecking && tnRegulation && !mandatoryMatch && !declarationMatch;

  const legalDisclaimer =
    "Aniq talab mahsulotning to'liq tavsifi va amaldagi qonunchilikka muvofiq belgilanadi. Yakuniy ma'lumot uchun mutaxassislarimiz bilan bog'laning.";

  return (
    <div className="section container-page max-w-2xl">
      <Breadcrumb items={[{ label: t('nav.tnvedCheck') }]} />
      <h1 className="mt-4 text-3xl font-extrabold text-primary">{t('tnvedCheck.title')}</h1>
      <p className="mt-2 text-sm text-slate-500">{t('tnvedCheck.subtitle')}</p>

      <div className="mt-8 space-y-5">
        {/* TN VED code + conformity-requirement check */}
        <div className="card p-6">
          <label className="block text-sm font-medium text-ink mb-1.5">{t('tnvedCheck.label')}</label>
          <input
            value={tnQuery}
            onChange={(e) => setTnQuery(e.target.value)}
            placeholder={t('tnvedCheck.placeholder')}
            className="input-field"
          />

          {tnChecking && (
            <p className="mt-3 pt-3 border-t border-border text-xs text-slate-400 flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t('tnvedCheck.checking')}
            </p>
          )}
        </div>

        {/* TN VED conformity-requirement notice — approximate, HS-heading-level match */}
        {mandatoryMatch && (
          <RegulationNotice
            tone="red"
            icon={AlertTriangle}
            title="Diqqat! Majburiy muvofiqlik sertifikati talab qilinadi"
            chips={[`${mandatoryMatch.decision}-son qaror`, `${mandatoryMatch.item}-band`]}
            detail={mandatoryMatch.nameUz}
            note={`Ushbu TN VED kodi bo'yicha ariza onlayn tizim orqali qabul qilinmaydi. ${legalDisclaimer}`}
          />
        )}

        {!mandatoryMatch && declarationMatch && (
          <RegulationNotice
            tone="emerald"
            icon={Info}
            title="Muvofiqlik deklaratsiyasi rasmiylashtirilishi tavsiya etiladi"
            chips={[`${declarationMatch.decision}-son qaror`, `${declarationMatch.item}-band`]}
            detail={declarationMatch.nameUz}
            note={legalDisclaimer}
          />
        )}

        {checkedNoMatch && (
          <RegulationNotice
            tone="amber"
            icon={AlertTriangle}
            title="Maxsus muvofiqlik talabi (sertifikat yoki deklaratsiya) topilmadi"
            note={legalDisclaimer}
          />
        )}
      </div>
    </div>
  );
}
