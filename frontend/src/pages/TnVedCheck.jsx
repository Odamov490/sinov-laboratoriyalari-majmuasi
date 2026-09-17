import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Info, Loader2, ChevronDown, ShieldQuestion, FileSearch } from 'lucide-react';
import SEO from '../components/SEO.jsx';
import { Breadcrumb } from '../components/UI.jsx';
import { checkTnVedRegulation, getInfoPage } from '../services/publicApi';

// Standard TN VED / FEACN codes are 10 digits; a "no requirement found"
// conclusion is only trustworthy once the full code is in — a 4-6 digit
// heading prefix that currently finds nothing could still resolve to a
// match once the remaining digits narrow it into a listed sub-range.
const FULL_CODE_LENGTH = 10;

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
function RegulationNotice({ tone, icon: Icon, title, chips, detail, note, linkHref, linkLabel, caveat }) {
  const { t } = useTranslation();
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
                  {expanded ? t('common.collapseText') : t('common.showFullText')}
                </button>
              )}
            </div>
          )}

          {caveat?.length > 0 && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-[11px] leading-relaxed text-amber-800">
              <ShieldQuestion className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
              <p>
                <span className="font-semibold">{t('tnvedCheck.caveatTitle')}.</span> {t('tnvedCheck.caveatPrefix')} («
                {caveat.join('», «')}»), {t('tnvedCheck.caveatSuffix')}
              </p>
            </div>
          )}

          {note && <p className={`mt-3 pt-3 border-t text-[11px] leading-relaxed ${c.note}`}>{note}</p>}

          {linkHref && (
            <a
              href={linkHref}
              target="_blank"
              rel="noreferrer"
              className={`mt-2 inline-flex items-center gap-1 text-[11px] font-semibold underline underline-offset-2 ${c.link}`}
            >
              {linkLabel}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TnVedCheck() {
  const { t } = useTranslation();
  const [tnQuery, setTnQuery] = useState('');
  const [infoPage, setInfoPage] = useState(null);

  // --- TN VED conformity-regulation lookup (mandatory cert / declaration) ---
  const [tnRegulation, setTnRegulation] = useState(null); // { matches, hasMandatoryCert, hasDeclaration } | null
  const [tnChecking, setTnChecking] = useState(false);

  useEffect(() => {
    getInfoPage('deklaratsiya-va-sertifikat').then(setInfoPage).catch(() => setInfoPage(null));
  }, []);

  // Approximate conformity-requirement check (see backend parseTnVedRanges),
  // fired automatically as the code is typed. A changed code always clears
  // the previous result first, so a stale banner never lingers on top of a
  // code it no longer matches.
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

  const codeDigits = tnQuery.replace(/\D/g, '');
  const isFullCode = codeDigits.length >= FULL_CODE_LENGTH;
  const mandatoryMatches = tnRegulation?.matches?.filter((m) => m.category === 'SERTIFIKAT') || [];
  const declarationMatches = tnRegulation?.matches?.filter((m) => m.category === 'DEKLARATSIYA') || [];
  // Only declare "nothing required" once the full code is in — a shorter
  // prefix that currently finds nothing may still resolve to a match once
  // the rest of the digits are typed (see FULL_CODE_LENGTH above).
  const checkedNoMatch =
    !tnChecking && tnRegulation && isFullCode && mandatoryMatches.length === 0 && declarationMatches.length === 0;

  const legalDisclaimer = t('tnvedCheck.disclaimer');

  return (
    <div className="section container-page max-w-2xl">
      <SEO title={t('nav.tnvedCheck')} description={t('tnvedCheck.subtitle')} />
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

        {/* TN VED conformity-requirement notices — approximate, HS-heading-level
            match; a code can fall under both a certificate and a declaration
            requirement at once (different product descriptions under the
            same heading), so every match is shown, not just one. */}
        {mandatoryMatches.map((match) => (
          <RegulationNotice
            key={`cert-${match.item}`}
            tone="red"
            icon={AlertTriangle}
            title={t('tnvedCheck.mandatoryTitle')}
            chips={[
              `${t('tnvedCheck.decisionLabel')} №${match.decision}`,
              `${t('tnvedCheck.itemLabel')} №${match.item}`,
            ]}
            detail={match.nameUz}
            note={`${t('tnvedCheck.mandatoryNotice')} ${legalDisclaimer}`}
            caveat={match.qualitativeExceptions}
          />
        ))}

        {declarationMatches.map((match) => (
          <RegulationNotice
            key={`decl-${match.item}`}
            tone="emerald"
            icon={Info}
            title={t('tnvedCheck.declarationTitle')}
            chips={[
              `${t('tnvedCheck.decisionLabel')} №${match.decision}`,
              `${t('tnvedCheck.itemLabel')} №${match.item}`,
            ]}
            detail={match.nameUz}
            note={legalDisclaimer}
            caveat={match.qualitativeExceptions}
          />
        ))}

        {checkedNoMatch && (
          <RegulationNotice
            tone="amber"
            icon={AlertTriangle}
            title={t('tnvedCheck.noMatchTitle')}
            note={`${t('tnvedCheck.noMatchSuggestion')} ${legalDisclaimer}`}
            linkHref={infoPage?.document43Url || undefined}
            linkLabel={t('tnvedCheck.viewResolution43')}
          />
        )}

        {/* Extra reference info about the code itself (TIF TN 2017->2022
            version lookup) — shown alongside the "not required" result so
            the user isn't left with just a negative answer. */}
        {checkedNoMatch && tnRegulation?.codeVersion && (
          <CodeVersionNotice info={tnRegulation.codeVersion} />
        )}

        {/* Situational exemptions from mandatory conformity assessment —
            these depend on the import circumstances, not the product's TN
            VED code, so they can't be checked automatically and are shown
            as reference information regardless of what code is entered. */}
        <GeneralExceptions />
      </div>
    </div>
  );
}

// TIF TN 2017->2022 code-version reference (resolution 733) — informational
// only, separate from the cert/declaration requirement above.
function CodeVersionNotice({ info }) {
  const { t } = useTranslation();

  if (info.status === 'current') {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
        <div className="flex items-start gap-3">
          <FileSearch className="h-5 w-5 mt-0.5 shrink-0 text-slate-500" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">{t('tnvedCheck.codeVersionCurrentTitle')}</p>
            <p className="mt-1 text-xs text-slate-600">
              <span className="font-mono font-semibold text-primary">{info.display}</span>
              {info.nameUz && <> — {info.nameUz}</>}
            </p>
            <p className="mt-2 text-[11px] text-slate-400">{t('tnvedCheck.codeVersionSource')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (info.status === 'converted') {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
        <div className="flex items-start gap-3">
          <FileSearch className="h-5 w-5 mt-0.5 shrink-0 text-slate-500" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">{t('tnvedCheck.codeVersionConvertedTitle')}</p>
            <p className="mt-1 text-xs text-slate-600">
              <span className="font-mono">{info.oldDisplay}</span> (2017) — {t('tnvedCheck.codeVersionConvertedText')}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {info.newCodes.map((c) => (
                <span
                  key={c.digits}
                  className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-mono font-semibold text-primary"
                >
                  {c.display}
                </span>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-slate-400">{t('tnvedCheck.codeVersionSource')}</p>
          </div>
        </div>
      </div>
    );
  }

  // status === 'unchanged'
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
      <div className="flex items-start gap-3">
        <FileSearch className="h-5 w-5 mt-0.5 shrink-0 text-slate-500" />
        <p className="text-sm text-slate-600">{t('tnvedCheck.codeVersionUnchangedTitle')}</p>
      </div>
    </div>
  );
}

function GeneralExceptions() {
  const { t } = useTranslation();
  const exceptions = t('tnvedCheck.generalExceptions', { returnObjects: true });

  return (
    <details className="card p-5 group">
      <summary className="cursor-pointer font-medium text-ink list-none flex justify-between items-center gap-3">
        <span className="flex items-center gap-2.5">
          <ShieldQuestion className="h-4 w-4 shrink-0 text-primary" />
          {t('tnvedCheck.generalExceptionsToggle')}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
      </summary>

      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-sm text-slate-600 leading-relaxed">{t('tnvedCheck.generalExceptionsIntro')}</p>
        <ol className="mt-3 space-y-2 list-decimal pl-5 text-sm text-ink">
          {Array.isArray(exceptions) &&
            exceptions.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {item}
              </li>
            ))}
        </ol>
        <p className="mt-4 pt-3 border-t border-border text-xs text-slate-500 leading-relaxed">
          {t('tnvedCheck.generalExceptionsNote')}
        </p>
      </div>
    </details>
  );
}
