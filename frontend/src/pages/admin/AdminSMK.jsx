import React from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import AdminCrudPage from './AdminCrudPage.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  nonConformanceConfig,
  complaintConfig,
  smkDocumentConfig,
  smkDocumentVersionConfig,
  internalAuditConfig,
  auditFindingConfig,
  calibrationRecordConfig,
  trainingRecordConfig,
  qualityControlRecordConfig,
  proficiencyTestConfig,
  measurementUncertaintyConfig,
  methodValidationConfig,
  impartialityDeclarationConfig,
  supplierEvaluationConfig,
  subcontractorConfig,
  environmentLogConfig,
  documentAcknowledgmentConfig,
  managementReviewConfig,
  riskItemConfig,
  qualityObjectiveConfig,
  improvementSuggestionConfig,
  retentionPolicyConfig,
} from './adminConfigs.js';

// All 20 SMK sub-modules live on one page, grouped by the phase they were
// built in, switched via a pill tab bar instead of 20 separate sidebar
// entries/routes. Each tab still has its own URL (/admin/smk/:slug) so
// links stay bookmarkable and the browser back button works as expected.
const SMK_GROUPS = [
  {
    phase: '1-faza — Muammo boshqaruvi',
    tabs: [
      { slug: 'nomuvofiqliklar', label: 'Nomuvofiqliklar (CAPA)', config: nonConformanceConfig, roles: ['SUPER_ADMIN', 'MANAGER'] },
      { slug: 'shikoyatlar', label: 'Sifat shikoyatlari', config: complaintConfig, roles: ['SUPER_ADMIN', 'MANAGER'] },
    ],
  },
  {
    phase: '2-faza — Hujjat boshqaruvi',
    tabs: [
      { slug: 'hujjatlar', label: 'SMK Hujjatlar', config: smkDocumentConfig, roles: ['SUPER_ADMIN', 'MANAGER'] },
      { slug: 'hujjat-versiyalari', label: 'Hujjat versiyalari', config: smkDocumentVersionConfig, roles: ['SUPER_ADMIN', 'MANAGER'] },
    ],
  },
  {
    phase: '3-faza — Auditlar',
    tabs: [
      { slug: 'auditlar', label: 'Ichki auditlar', config: internalAuditConfig, roles: ['SUPER_ADMIN'] },
      { slug: 'audit-topilmalari', label: 'Audit topilmalari', config: auditFindingConfig, roles: ['SUPER_ADMIN'] },
    ],
  },
  {
    phase: '4-faza — Texnik yadro',
    tabs: [
      { slug: 'kalibrlash', label: 'Uskunalar kalibrlash', config: calibrationRecordConfig, roles: ['SUPER_ADMIN', 'MANAGER'] },
      { slug: 'treninglar', label: 'Xodimlar treningi', config: trainingRecordConfig, roles: ['SUPER_ADMIN', 'MANAGER'] },
      { slug: 'qc', label: 'Ichki sifat nazorati', config: qualityControlRecordConfig, roles: ['SUPER_ADMIN', 'MANAGER'] },
      { slug: 'malakaviy-sinovlar', label: 'Malakaviy sinovlar', config: proficiencyTestConfig, roles: ['SUPER_ADMIN'] },
      { slug: 'olchov-noaniqligi', label: "O'lchov noaniqligi", config: measurementUncertaintyConfig, roles: ['SUPER_ADMIN'] },
      { slug: 'metodika', label: 'Metodikani tasdiqlash', config: methodValidationConfig, roles: ['SUPER_ADMIN'] },
    ],
  },
  {
    phase: '5-faza — Tashkiliy',
    tabs: [
      { slug: 'xolislik', label: 'Xolislik deklaratsiyasi', config: impartialityDeclarationConfig, roles: ['SUPER_ADMIN'] },
      { slug: 'taminotchilar', label: "Ta'minotchilarni baholash", config: supplierEvaluationConfig, roles: ['SUPER_ADMIN'] },
      { slug: 'subpudratchilar', label: 'Subpudratchilar', config: subcontractorConfig, roles: ['SUPER_ADMIN'] },
      { slug: 'muhit-monitoring', label: 'Muhit sharoitlari', config: environmentLogConfig, roles: ['SUPER_ADMIN', 'MANAGER'] },
      { slug: 'tanishtirish', label: 'Hujjat bilan tanishtirish', config: documentAcknowledgmentConfig, roles: ['SUPER_ADMIN'] },
    ],
  },
  {
    phase: '6-faza — Strategik',
    tabs: [
      { slug: 'boshqaruv-sharhi', label: 'Boshqaruv sharhi', config: managementReviewConfig, roles: ['SUPER_ADMIN'] },
      { slug: 'risklar', label: 'Risklar reestri', config: riskItemConfig, roles: ['SUPER_ADMIN'] },
      { slug: 'maqsadlar', label: 'Sifat maqsadlari (KPI)', config: qualityObjectiveConfig, roles: ['SUPER_ADMIN'] },
      { slug: 'takliflar', label: 'Yaxshilash takliflari', config: improvementSuggestionConfig, roles: ['SUPER_ADMIN', 'MANAGER'] },
      { slug: 'arxiv-siyosati', label: 'Arxiv/saqlash siyosati', config: retentionPolicyConfig, roles: ['SUPER_ADMIN'] },
    ],
  },
];

export default function AdminSMK() {
  const { module } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const visibleGroups = SMK_GROUPS.map((g) => ({
    ...g,
    tabs: g.tabs.filter((t) => t.roles.includes(user?.role)),
  })).filter((g) => g.tabs.length > 0);

  const visibleTabs = visibleGroups.flatMap((g) => g.tabs);
  const active = visibleTabs.find((t) => t.slug === module);

  if (!active) {
    return visibleTabs.length ? <Navigate to={`/admin/smk/${visibleTabs[0].slug}`} replace /> : null;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-1">SMK — Sifat Menejmenti Kompleksi</h1>
      <p className="text-sm text-slate-500 mb-5">ISO/IEC 17025 talablariga mos sifat boshqaruv tizimi</p>

      <div className="mb-6 space-y-3">
        {visibleGroups.map((g) => (
          <div key={g.phase}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5">{g.phase}</p>
            <div className="flex flex-wrap gap-2">
              {g.tabs.map((t) => (
                <button
                  key={t.slug}
                  type="button"
                  onClick={() => navigate(`/admin/smk/${t.slug}`)}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium border transition-colors ${
                    t.slug === module
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-slate-600 border-border hover:bg-bg-light'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* `key` forces a remount on tab switch — AdminCrudPage keeps its own
          list/search/pagination state in useState, which otherwise would
          carry over (e.g. stale search query or page number) from the
          previously active module. */}
      <AdminCrudPage key={active.slug} config={active.config} />
    </div>
  );
}
