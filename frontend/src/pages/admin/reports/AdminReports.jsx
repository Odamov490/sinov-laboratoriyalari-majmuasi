import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookOpen, PieChart, ListTree } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.jsx';
import { adminResource, adminTestJournal } from '../../../services/adminApi';
import { Loading, ErrorState } from '../../../components/StateViews.jsx';
import AdminCrudPage from '../AdminCrudPage.jsx';
import TestJournalTab from './TestJournalTab.jsx';
import TestJournalSummaryTab from './TestJournalSummaryTab.jsx';
import JournalImportCard from './JournalImportCard.jsx';
import { FINANCE_ROLES, formatMoney, formatDate } from './journalConstants';
import { tr } from '../../../i18n/tr.js';

const activeColumn = { key: 'isActive', label: tr('Faol'), render: (i) => (i.isActive ? tr('Ha') : tr("Yo'q")) };

const PRICE_CONFIG = {
  path: 'test-journal-prices',
  title: tr('Narxlar (bir namuna uchun)'),
  searchable: false,
  columns: [
    { key: 'productType', label: tr('Mahsulot turi'), render: (i) => i.productType?.nameUz || '—' },
    { key: 'direction', label: tr('Sinov turi'), render: (i) => (i.direction === 'SHOVQIN' ? tr('Shovqin') : tr('Asosiy (BZ/EMM/EE)')) },
    { key: 'unitPrice', label: tr("Narx, so'm"), render: (i) => formatMoney(i.unitPrice) },
    { key: 'validFrom', label: tr('Amal qiladi'), render: (i) => tr('{0} dan', formatDate(i.validFrom)) },
    { key: 'note', label: tr('Izoh'), render: (i) => i.note || '—' },
  ],
  fields: [
    {
      name: 'productTypeId',
      label: tr('Mahsulot turi'),
      type: 'async-select',
      optionsResource: 'test-product-types',
      optionsLabel: (item) => item.nameUz,
      required: true,
    },
    {
      name: 'direction',
      label: tr("Sinov turi (bo'sh = asosiy BZ/EMM/EE)"),
      type: 'select',
      options: [{ value: 'SHOVQIN', label: tr('Shovqin') }],
    },
    { name: 'unitPrice', label: tr("Bir namuna narxi, so'm"), type: 'number', required: true },
    { name: 'validFrom', label: tr('Qaysi sanadan amal qiladi'), type: 'date', required: true },
    { name: 'note', label: tr('Izoh (masalan: 8 kg gacha)'), fullWidth: true },
  ],
};

const DICTIONARY_CONFIGS = [
  {
    path: 'test-product-types',
    title: tr('Mahsulot turlari'),
    searchable: false,
    columns: [{ key: 'code', label: tr('Kod') }, { key: 'nameUz', label: tr('Nomi') }, activeColumn],
    fields: [
      { name: 'code', label: tr('Kod (masalan MUZLATKICH)'), required: true },
      { name: 'nameUz', label: tr('Nomi'), required: true },
      { name: 'isActive', label: tr('Faol'), type: 'checkbox', default: true },
    ],
  },
  {
    path: 'test-locations',
    title: tr('Sinov joylari'),
    searchable: false,
    columns: [{ key: 'code', label: tr('Kod') }, { key: 'nameUz', label: tr('Nomi') }, activeColumn],
    fields: [
      { name: 'code', label: tr('Kod (masalan PSKENT)'), required: true },
      { name: 'nameUz', label: tr('Nomi'), required: true },
      { name: 'isActive', label: tr('Faol'), type: 'checkbox', default: true },
    ],
  },
  {
    path: 'certification-bodies',
    title: tr('Buyurtmachilar (sertifikatlashtirish idoralari)'),
    columns: [
      { key: 'name', label: tr('Nomi') },
      { key: 'aliases', label: tr('Boshqa yozilishlari'), render: (i) => (i.aliases || []).join(', ') || '—' },
      activeColumn,
    ],
    fields: [
      { name: 'name', label: tr('Nomi'), required: true, fullWidth: true },
      { name: 'isActive', label: tr('Faol'), type: 'checkbox', default: true },
    ],
  },
];

const TABS = [
  { key: 'jurnal', label: tr('Jurnal'), icon: BookOpen },
  { key: 'hisobot', label: tr('Umumiy hisobot'), icon: PieChart },
  { key: 'spravochniklar', label: tr('Spravochniklar'), icon: ListTree, superAdminOnly: true },
];

const listAll = (path) =>
  adminResource(path)
    .list({ pageSize: 500 })
    .then((d) => d.items || []);

// /admin/hisobot — test journal (sinovlar jurnali), its summary report and
// reference lists. Money fields are shown to FINANCE_ROLES only (the API
// strips them for other roles; the UI just doesn't render them).
export default function AdminReports() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const showFinance = FINANCE_ROLES.includes(user?.role);
  const [searchParams, setSearchParams] = useSearchParams();
  const tabs = TABS.filter((t) => !t.superAdminOnly || isSuperAdmin);
  const tab = tabs.some((t) => t.key === searchParams.get('tab')) ? searchParams.get('tab') : 'jurnal';

  const [dictionaries, setDictionaries] = useState(null);
  const [dictError, setDictError] = useState(false);

  // Reloaded whenever the journal/report tab is opened, so edits made in the
  // Spravochniklar tab show up in the filters right away.
  const loadDictionaries = () => {
    setDictError(false);
    Promise.all([
      listAll('test-product-types'),
      listAll('test-locations'),
      listAll('certification-bodies'),
      listAll('test-journal-prices'),
      adminTestJournal.suggestions(),
      adminTestJournal.layout(),
    ])
      .then(([productTypes, locations, bodies, prices, suggestions, layout]) =>
        setDictionaries({ productTypes, locations, bodies, prices, suggestions, layout: layout.columns })
      )
      .catch(() => setDictError(true));
  };

  // New executor names/brands typed into a record become suggestions at once.
  const reloadSuggestions = () => {
    adminTestJournal
      .suggestions()
      .then((suggestions) => setDictionaries((d) => (d ? { ...d, suggestions } : d)))
      .catch(() => {});
  };

  useEffect(() => {
    if (tab !== 'spravochniklar') loadDictionaries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-ink">{tr('Hisobot')}</h1>
        <p className="text-sm text-slate-500">{tr('Sinovlar jurnali va umumiy hisobot')}</p>
      </div>

      <div className="mb-5 flex flex-wrap gap-2 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setSearchParams(t.key === 'jurnal' ? {} : { tab: t.key })}
            className={`-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t.key ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-ink'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'spravochniklar' ? (
        <div className="space-y-10">
          <JournalImportCard />
          {[PRICE_CONFIG, ...DICTIONARY_CONFIGS].map((config) => (
            <AdminCrudPage key={config.path} config={config} />
          ))}
        </div>
      ) : dictError ? (
        <div className="card p-6">
          <ErrorState onRetry={loadDictionaries} />
        </div>
      ) : !dictionaries ? (
        <Loading />
      ) : tab === 'hisobot' ? (
        <TestJournalSummaryTab showFinance={showFinance} />
      ) : (
        <TestJournalTab
          dictionaries={dictionaries}
          showFinance={showFinance}
          canEditLayout={isSuperAdmin}
          onLayoutChange={(columns) => setDictionaries((d) => ({ ...d, layout: columns }))}
          onRecordsChanged={reloadSuggestions}
        />
      )}
    </div>
  );
}
