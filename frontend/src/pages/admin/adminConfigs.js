// Central configuration for each admin CRUD resource: columns for the
// table view and fields for the create/edit form. Consumed by AdminCrudPage.
//
// Relation fields (laboratory, service, category, standard) use type
// 'async-select': a dropdown populated from another admin resource, so the
// user picks a name instead of typing a raw UUID by hand.
//
// This is a plain .js file (not .jsx), so column `render` functions that
// need markup use React.createElement instead of JSX syntax.
import React from 'react';
import { Link } from 'react-router-dom';
import { tr, locName, dateLocale } from '../../i18n/tr.js';

export const laboratoryConfig = {
  path: 'laboratories',
  title: tr('Laboratoriyalar'),
  columns: [
    { key: 'nameUz', label: tr('Nomi (UZ)') },
    { key: 'slug', label: 'Slug' },
    { key: 'order', label: tr('Tartib') },
    { key: 'isActive', label: tr('Faol'), render: (i) => (i.isActive ? tr('Ha') : tr("Yo'q")) },
  ],
  fields: [
    { name: 'slug', label: 'Slug', required: true },
    { name: 'nameUz', label: tr('Nomi (UZ)'), required: true },
    { name: 'nameRu', label: tr('Nomi (RU)'), required: true },
    { name: 'nameEn', label: tr('Nomi (EN)'), required: true },
    { name: 'descriptionUz', label: tr('Tavsif (UZ)'), type: 'textarea', fullWidth: true },
    { name: 'descriptionRu', label: tr('Tavsif (RU)'), type: 'textarea', fullWidth: true },
    { name: 'descriptionEn', label: tr('Tavsif (EN)'), type: 'textarea', fullWidth: true },
    { name: 'aboutUz', label: tr('Batafsil (UZ)'), type: 'textarea', fullWidth: true },
    { name: 'accreditationScope', label: tr('Akkreditatsiya sohasi'), type: 'textarea', fullWidth: true },
    { name: 'coverImage', label: tr('Rasm'), type: 'file' },
    { name: 'order', label: tr('Tartib'), type: 'number' },
    { name: 'isActive', label: tr('Faol'), type: 'checkbox' },
  ],
};

export const serviceConfig = {
  path: 'services',
  title: tr('Xizmatlar'),
  columns: [
    { key: 'nameUz', label: tr('Nomi') },
    { key: 'slug', label: 'Slug' },
    { key: 'testType', label: tr('Sinov turi') },
    { key: 'isActive', label: tr('Faol'), render: (i) => (i.isActive ? tr('Ha') : tr("Yo'q")) },
  ],
  fields: [
    { name: 'slug', label: 'Slug', required: true },
    { name: 'nameUz', label: tr('Nomi (UZ)'), required: true },
    { name: 'nameRu', label: tr('Nomi (RU)'), required: true },
    { name: 'nameEn', label: tr('Nomi (EN)'), required: true },
    {
      name: 'laboratoryId',
      label: tr('Laboratoriya'),
      type: 'async-select',
      optionsResource: 'laboratories',
      optionsLabel: (item) => locName(item),
    },
    {
      name: 'standardId',
      label: tr('Standart'),
      type: 'async-select',
      optionsResource: 'standards',
      optionsLabel: (item) => `${item.code} — ${locName(item)}`,
    },
    {
      name: 'categoryId',
      label: tr('Xizmat kategoriyasi'),
      type: 'async-select',
      optionsResource: 'service-categories',
      optionsLabel: (item) => locName(item),
    },
    { name: 'testObject', label: tr('Sinov obyekti') },
    { name: 'testType', label: tr('Sinov turi') },
    { name: 'durationDays', label: tr('Muddat (kun)'), type: 'number' },
    { name: 'descriptionUz', label: tr('Tavsif (UZ)'), type: 'textarea', fullWidth: true },
    { name: 'descriptionRu', label: tr('Tavsif (RU)'), type: 'textarea', fullWidth: true },
    { name: 'descriptionEn', label: tr('Tavsif (EN)'), type: 'textarea', fullWidth: true },
    { name: 'isActive', label: tr('Faol'), type: 'checkbox' },
  ],
};

export const standardConfig = {
  path: 'standards',
  title: tr('Standartlar'),
  columns: [
    { key: 'code', label: tr('Kod') },
    { key: 'nameUz', label: tr('Nomi') },
    { key: 'category', label: tr('Kategoriya') },
  ],
  fields: [
    { name: 'code', label: tr('Kod'), required: true },
    { name: 'category', label: tr('Kategoriya (O‘z DSt, IEC, ISO, GOST, EN, CISPR...)'), required: true },
    { name: 'nameUz', label: tr('Nomi (UZ)'), required: true },
    { name: 'nameRu', label: tr('Nomi (RU)'), required: true },
    { name: 'nameEn', label: tr('Nomi (EN)'), required: true },
    { name: 'scopeUz', label: tr('Scope (UZ)'), type: 'textarea', fullWidth: true },
    {
      name: 'laboratoryId',
      label: tr('Laboratoriya'),
      type: 'async-select',
      optionsResource: 'laboratories',
      optionsLabel: (item) => locName(item),
    },
    { name: 'documentUrl', label: tr('Hujjat'), type: 'file' },
  ],
};

export const newsConfig = {
  path: 'news',
  title: tr('Yangiliklar'),
  columns: [
    { key: 'titleUz', label: tr('Sarlavha') },
    { key: 'isPublished', label: tr('Chop etilgan'), render: (i) => (i.isPublished ? tr('Ha') : tr("Yo'q")) },
  ],
  fields: [
    { name: 'slug', label: 'Slug', required: true },
    { name: 'titleUz', label: tr('Sarlavha (UZ)'), required: true },
    { name: 'titleRu', label: tr('Sarlavha (RU)'), required: true },
    { name: 'titleEn', label: tr('Sarlavha (EN)'), required: true },
    { name: 'descriptionUz', label: tr('Qisqa tavsif (UZ)'), type: 'textarea', fullWidth: true },
    { name: 'descriptionRu', label: tr('Qisqa tavsif (RU)'), type: 'textarea', fullWidth: true },
    { name: 'descriptionEn', label: tr('Qisqa tavsif (EN)'), type: 'textarea', fullWidth: true },
    { name: 'contentUz', label: tr('Batafsil matn (UZ)'), type: 'textarea', fullWidth: true, rows: 8 },
    { name: 'contentRu', label: tr('Batafsil matn (RU)'), type: 'textarea', fullWidth: true, rows: 8 },
    { name: 'contentEn', label: tr('Batafsil matn (EN)'), type: 'textarea', fullWidth: true, rows: 8 },
    { name: 'image', label: tr('Rasmlar (bir nechtasini tanlash mumkin)'), type: 'multi-file', fullWidth: true },
    {
      name: 'categoryId',
      label: tr('Kategoriya'),
      type: 'async-select',
      optionsResource: 'news-categories',
      optionsLabel: (item) => locName(item),
    },
    { name: 'seoTitle', label: 'SEO Title' },
    { name: 'seoDescription', label: 'SEO Description' },
    { name: 'isPublished', label: tr('Chop etish'), type: 'checkbox' },
  ],
};

export const documentConfig = {
  path: 'documents',
  title: tr('Hujjatlar'),
  columns: [
    { key: 'titleUz', label: tr('Nomi') },
  ],
  fields: [
    { name: 'titleUz', label: tr('Nomi (UZ)'), required: true },
    { name: 'titleRu', label: tr('Nomi (RU)'), required: true },
    { name: 'titleEn', label: tr('Nomi (EN)'), required: true },
    { name: 'fileUrl', label: tr('Fayl'), type: 'file', required: true },
    {
      name: 'categoryId',
      label: tr('Kategoriya'),
      type: 'async-select',
      optionsResource: 'document-categories',
      optionsLabel: (item) => locName(item),
    },
  ],
};

// Mutaxassisga bog'langan login (parol va boshqa maxfiy maydonlarsiz).
const formatLastLogin = (v) => (v ? new Date(v).toLocaleString(dateLocale(), { dateStyle: 'short', timeStyle: 'short' }) : tr('hali kirmagan'));

function staffAccountCell(i) {
  if (i.isActive === false) return React.createElement('span', { className: 'text-xs text-red-500' }, tr('Nofaol'));
  if (!i.account) return React.createElement('span', { className: 'text-xs text-slate-400' }, tr("Hisob yo'q"));
  return React.createElement(
    'span',
    { className: `font-mono text-xs ${i.account.isActive ? 'text-ink' : 'text-red-500 line-through'}` },
    i.account.email
  );
}

function staffAccountInfo(item) {
  const a = item?.account;
  const text = !item
    ? tr('Hisob «Foydalanuvchilar → Mutaxassislardan hisob yaratish» orqali ochiladi.')
    : !a
      ? tr("Hisob yo'q. «Foydalanuvchilar → Mutaxassislardan hisob yaratish» orqali yarating.")
      : tr('Login: {0} · {1} · Oxirgi kirish: {2}{3}', a.email, a.isActive ? tr('faol') : tr('nofaol'), formatLastLogin(a.lastLoginAt), a.mustChangePassword ? (' ' + tr('· parol hali almashtirilmagan')) : '');
  return React.createElement('p', { className: 'rounded-lg bg-bg-light px-3 py-2 text-sm text-slate-600' }, text);
}

export const staffConfig = {
  path: 'staff',
  title: tr('Mutaxassislar'),
  columns: [
    { key: 'fullName', label: tr('F.I.Sh.') },
    { key: 'position', label: tr('Lavozim') },
    { key: 'employeeCode', label: tr('Kod'), render: (i) => i.employeeCode || '—' },
    { key: 'laboratory', label: tr('Laboratoriya'), render: (i) => locName(i.laboratory) || '—' },
    { key: 'account', label: tr('Tizim hisobi'), render: staffAccountCell },
  ],
  fields: [
    { name: 'account', label: tr('Tizim hisobi'), type: 'info', fullWidth: true, render: staffAccountInfo },
    {
      name: 'isActive',
      label: tr("Faol (o'chirilsa, bog'langan hisob ham nofaol bo'ladi)"),
      type: 'checkbox',
      default: true,
    },
    { name: 'fullName', label: tr('F.I.Sh.'), required: true },
    { name: 'position', label: tr('Lavozim'), required: true },
    { name: 'specialization', label: tr('Mutaxassislik') },
    { name: 'experienceYears', label: tr('Tajriba (yil)'), type: 'number' },
    { name: 'email', label: 'Email' },
    { name: 'phone', label: tr('Telefon') },
    { name: 'photo', label: tr('Rasm'), type: 'file' },
    {
      name: 'laboratoryId',
      label: tr('Laboratoriya'),
      type: 'async-select',
      optionsResource: 'laboratories',
      optionsLabel: (item) => locName(item),
    },
    { name: 'order', label: tr('Tartib'), type: 'number' },
    { name: 'staffNumber', label: tr('Tabel raqami'), type: 'number' },
    { name: 'employeeCode', label: tr('Kod') },
    { name: 'hireDate', label: tr('Ishga kirgan sana'), type: 'date' },
    { name: 'birthDate', label: tr("Tug'ilgan sana"), type: 'date' },
    { name: 'passportSeries', label: tr('Pasport seriyasi') },
    { name: 'passportNumber', label: tr('Pasport raqami') },
    { name: 'pinfl', label: tr('JSHSHIR (PINFL)') },
    { name: 'address', label: tr('Manzil'), fullWidth: true },
    { name: 'notes', label: tr('Izoh'), type: 'textarea', fullWidth: true },
  ],
  birthdayPin: { dateField: 'birthDate', limit: 3 },
  exportable: true,
  exportTitle: tr("Mutaxassislar ro'yxati — Sinov Laboratoriyalari Majmuasi"),
  exportWidth: 1900,
  exportColumns: [
    { key: 'staffNumber', label: tr('Tabel №') },
    { key: 'employeeCode', label: tr('Kod') },
    { key: 'fullName', label: tr('F.I.Sh.') },
    { key: 'position', label: tr('Lavozim') },
    { key: 'specialization', label: tr('Mutaxassislik') },
    { key: 'laboratory', label: tr('Laboratoriya'), get: (i) => locName(i.laboratory) || '—' },
    { key: 'experienceYears', label: tr('Tajriba (yil)'), get: (i) => i.experienceYears ?? '—' },
    { key: 'birthDate', label: tr("Tug'ilgan sana"), get: (i) => (i.birthDate ? String(i.birthDate).slice(0, 10) : '—') },
    { key: 'hireDate', label: tr('Ishga kirgan sana'), get: (i) => (i.hireDate ? String(i.hireDate).slice(0, 10) : '—') },
    {
      key: 'passport',
      label: tr('Pasport seriya/raqami'),
      get: (i) => (i.passportSeries || i.passportNumber ? `${i.passportSeries || ''} ${i.passportNumber || ''}`.trim() : '—'),
    },
    { key: 'pinfl', label: tr('JSHSHIR (PINFL)'), get: (i) => i.pinfl || '—' },
    { key: 'address', label: tr('Manzil'), get: (i) => i.address || '—' },
    { key: 'phone', label: tr('Telefon') },
    { key: 'email', label: 'Email' },
    { key: 'notes', label: tr('Izoh') },
  ],
};

export const equipmentConfig = {
  path: 'equipment',
  title: tr('Uskunalar'),
  columns: [
    { key: 'name', label: tr('Nomi') },
    { key: 'manufacturer', label: tr('Ishlab chiqaruvchi') },
  ],
  fields: [
    { name: 'slug', label: 'Slug', required: true },
    { name: 'name', label: tr('Nomi'), required: true },
    { name: 'manufacturer', label: tr('Ishlab chiqaruvchi') },
    { name: 'model', label: 'Model' },
    { name: 'specifications', label: tr('Texnik xususiyatlari'), type: 'textarea', fullWidth: true },
    { name: 'application', label: tr('Qo‘llanilishi'), type: 'textarea', fullWidth: true },
    { name: 'photo', label: tr('Rasm'), type: 'file' },
    {
      name: 'laboratoryId',
      label: tr('Laboratoriya'),
      type: 'async-select',
      optionsResource: 'laboratories',
      optionsLabel: (item) => locName(item),
    },
  ],
};

function isVideoFile(url) {
  return /\.(mp4|webm)$/i.test(url || '');
}

export const galleryConfig = {
  path: 'gallery',
  title: tr('Galereya'),
  columns: [
    {
      key: 'imageUrl',
      label: tr("Oldindan ko'rish"),
      render: (i) =>
        isVideoFile(i.imageUrl)
          ? React.createElement('video', {
              src: i.imageUrl,
              className: 'h-12 w-12 object-cover rounded-lg border border-border',
              muted: true,
            })
          : React.createElement('img', {
              src: i.imageUrl,
              alt: '',
              className: 'h-12 w-12 object-cover rounded-lg border border-border',
            }),
    },
    { key: 'title', label: tr('Nomi'), render: (i) => i.title || '—' },
    { key: 'category', label: tr('Kategoriya'), render: (i) => locName(i.category) || '—' },
    { key: 'laboratory', label: tr('Laboratoriya'), render: (i) => locName(i.laboratory) || '—' },
    { key: 'createdAt', label: tr('Sana'), render: (i) => new Date(i.createdAt).toLocaleDateString(dateLocale()) },
  ],
  bulkUpload: {
    fileField: 'imageUrl',
    titleField: 'title',
    sharedFieldNames: ['categoryId', 'laboratoryId'],
  },
  fields: [
    { name: 'title', label: tr('Nomi') },
    { name: 'imageUrl', label: tr('Rasm'), type: 'file', required: true },
    {
      name: 'categoryId',
      label: tr('Kategoriya'),
      type: 'async-select',
      optionsResource: 'gallery-categories',
      optionsLabel: (item) => locName(item),
    },
    {
      name: 'laboratoryId',
      label: tr('Laboratoriya'),
      type: 'async-select',
      optionsResource: 'laboratories',
      optionsLabel: (item) => locName(item),
    },
  ],
};

export const faqConfig = {
  path: 'faq',
  title: 'FAQ',
  columns: [{ key: 'questionUz', label: tr('Savol') }],
  fields: [
    { name: 'questionUz', label: tr('Savol (UZ)'), required: true, type: 'textarea', fullWidth: true },
    { name: 'questionRu', label: tr('Savol (RU)'), required: true, type: 'textarea', fullWidth: true },
    { name: 'questionEn', label: tr('Savol (EN)'), required: true, type: 'textarea', fullWidth: true },
    { name: 'answerUz', label: tr('Javob (UZ)'), required: true, type: 'textarea', fullWidth: true },
    { name: 'answerRu', label: tr('Javob (RU)'), required: true, type: 'textarea', fullWidth: true },
    { name: 'answerEn', label: tr('Javob (EN)'), required: true, type: 'textarea', fullWidth: true },
    { name: 'order', label: tr('Tartib'), type: 'number' },
    { name: 'isActive', label: tr('Faol'), type: 'checkbox' },
  ],
};

export const accreditationConfig = {
  path: 'accreditation',
  title: tr('Akkreditatsiya'),
  columns: [
    { key: 'certificateNumber', label: tr('Guvohnoma raqami') },
    { key: 'standardCode', label: tr('Standart') },
  ],
  searchable: false,
  fields: [
    { name: 'certificateNumber', label: tr('Guvohnoma raqami'), required: true },
    { name: 'standardCode', label: tr('Standart kodi'), required: true },
    { name: 'scopeUz', label: tr('Scope (UZ)'), type: 'textarea', fullWidth: true },
    { name: 'scopeRu', label: tr('Scope (RU)'), type: 'textarea', fullWidth: true },
    { name: 'scopeEn', label: tr('Scope (EN)'), type: 'textarea', fullWidth: true },
    { name: 'documentUrl', label: tr('Guvohnoma (PDF)'), type: 'file' },
    {
      name: 'scopeUrl',
      label: tr('Akkreditatsiya doirasi havolasi (akkred.uz)'),
      type: 'url',
      fullWidth: true,
      placeholder: 'https://api-e.akkred.uz/media/file/pdf/...',
    },
    { name: 'issuedAt', label: tr('Berilgan sana'), type: 'date' },
    { name: 'validUntil', label: tr('Amal qilish muddati'), type: 'date' },
  ],
};

export const tnVedRegulationConfig = {
  path: 'tnved-reglament',
  title: tr('TN VED reglament'),
  fields: [
    { name: 'item', label: tr('Band raqami'), required: true },
    { name: 'nameUz', label: tr('Mahsulot nomi'), type: 'textarea', fullWidth: true, required: true },
    { name: 'tnVedRaw', label: tr("TN VED kodi/oralig'i"), type: 'textarea', fullWidth: true, required: true },
    {
      name: 'category',
      label: tr('Talab turi'),
      type: 'select',
      required: true,
      options: [
        { value: 'SERTIFIKAT', label: tr('Majburiy sertifikat') },
        { value: 'DEKLARATSIYA', label: tr('Deklaratsiya') },
      ],
    },
    { name: 'decision', label: tr('Qaror raqami (43)'), required: true },
  ],
  columns: [
    { key: 'item', label: tr('Band') },
    { key: 'nameUz', label: tr('Mahsulot nomi') },
    { key: 'tnVedRaw', label: 'TN VED' },
    { key: 'category', label: tr('Talab'), render: (i) => (i.category === 'SERTIFIKAT' ? tr('Sertifikat') : tr('Deklaratsiya')) },
    { key: 'decision', label: tr('Qaror') },
  ],
};

export const testIndicatorConfig = {
  path: 'test-indicators',
  title: tr("Ko'rsatkichlar hovuzi"),
  columns: [
    { key: 'positionCode', label: tr('Pozitsiya kodi'), render: (i) => i.positionCode || '—' },
    { key: 'nameUz', label: tr('Nomi') },
    { key: 'standardCode', label: tr('Standart kodi'), render: (i) => i.standardCode || '—' },
    { key: 'laboratory', label: tr('Laboratoriya'), render: (i) => locName(i.laboratory) || '—' },
    { key: 'unit', label: tr("O'lchov birligi"), render: (i) => i.unit || '—' },
  ],
  fields: [
    { name: 'positionCode', label: tr('Pozitsiya kodi') },
    { name: 'nameUz', label: tr('Nomi (UZ)'), required: true, fullWidth: true },
    { name: 'nameRu', label: tr('Nomi (RU)'), required: true, fullWidth: true },
    { name: 'nameEn', label: tr('Nomi (EN)'), required: true, fullWidth: true },
    { name: 'standardCode', label: tr('Standart kodi') },
    { name: 'unit', label: tr("O'lchov birligi") },
    {
      name: 'laboratoryId',
      label: tr('Laboratoriya'),
      type: 'async-select',
      optionsResource: 'laboratories',
      optionsLabel: (item) => locName(item),
    },
    { name: 'method', label: tr('Sinov usuli'), type: 'textarea', fullWidth: true },
  ],
};

export const productConfig = {
  path: 'products',
  title: tr('Mahsulotlar (sinov dasturlari)'),
  columns: [
    { key: 'nameUz', label: tr('Nomi') },
    { key: 'slug', label: 'Slug' },
    { key: 'laboratory', label: tr('Laboratoriya'), render: (i) => locName(i.laboratory) || '—' },
    { key: 'isActive', label: tr('Faol'), render: (i) => (i.isActive ? tr('Ha') : tr("Yo'q")) },
    {
      key: 'builder',
      label: tr('Konstruktor'),
      render: (i) =>
        React.createElement(
          Link,
          { to: `/admin/sinov-dasturlari/${i.id}`, className: 'text-primary font-medium hover:underline' },
          tr('Konstruktor')
        ),
    },
  ],
  fields: [
    { name: 'slug', label: 'Slug', required: true },
    { name: 'nameUz', label: tr('Nomi (UZ)'), required: true },
    { name: 'nameRu', label: tr('Nomi (RU)'), required: true },
    { name: 'nameEn', label: tr('Nomi (EN)'), required: true },
    {
      name: 'laboratoryId',
      label: tr('Laboratoriya'),
      type: 'async-select',
      optionsResource: 'laboratories',
      optionsLabel: (item) => locName(item),
    },
    { name: 'descriptionUz', label: tr('Tavsif (UZ)'), type: 'textarea', fullWidth: true },
    { name: 'isActive', label: tr('Faol'), type: 'checkbox' },
  ],
};

// ===== SMK (Sifat Menejmenti Kompleksi, ISO/IEC 17025) — FAZA 1 =====

function statusBadge(status, styles, labels) {
  return React.createElement(
    'span',
    {
      className: `inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        styles[status] || 'bg-slate-50 text-slate-600 border-slate-200'
      }`,
    },
    labels[status] || status
  );
}

const NC_SOURCE_LABELS = {
  AUDIT: 'Audit',
  SHIKOYAT: tr('Shikoyat'),
  ICHKI_KUZATUV: tr('Ichki kuzatuv'),
  NAMUNA_MUAMMOSI: tr('Namuna muammosi'),
};

const NC_STATUS_LABELS = {
  OCHIQ: tr('Ochiq'),
  JARAYONDA: tr('Jarayonda'),
  YOPILDI: tr('Yopildi'),
  TASDIQLANDI: tr('Tasdiqlandi'),
};

const NC_STATUS_STYLES = {
  OCHIQ: 'bg-red-50 text-red-700 border-red-200',
  JARAYONDA: 'bg-amber-50 text-amber-700 border-amber-200',
  YOPILDI: 'bg-blue-50 text-blue-700 border-blue-200',
  TASDIQLANDI: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export const nonConformanceConfig = {
  path: 'smk/nonconformances',
  title: tr('Nomuvofiqliklar (CAPA)'),
  columns: [
    { key: 'code', label: tr('Kod') },
    { key: 'source', label: tr('Manba'), render: (i) => NC_SOURCE_LABELS[i.source] || i.source },
    { key: 'description', label: tr('Tavsif') },
    { key: 'responsibleUser', label: tr("Mas'ul"), render: (i) => i.responsibleUser?.fullName || '—' },
    { key: 'dueDate', label: tr('Muddat'), render: (i) => (i.dueDate ? String(i.dueDate).slice(0, 10) : '—') },
    { key: 'status', label: tr('Holati'), render: (i) => statusBadge(i.status, NC_STATUS_STYLES, NC_STATUS_LABELS) },
  ],
  fields: [
    {
      name: 'source',
      label: tr('Manba'),
      type: 'select',
      required: true,
      options: [
        { value: 'AUDIT', label: 'Audit' },
        { value: 'SHIKOYAT', label: tr('Shikoyat') },
        { value: 'ICHKI_KUZATUV', label: tr('Ichki kuzatuv') },
        { value: 'NAMUNA_MUAMMOSI', label: tr('Namuna muammosi') },
      ],
    },
    { name: 'description', label: tr('Tavsif'), type: 'textarea', fullWidth: true, required: true },
    { name: 'detectedDate', label: tr('Aniqlangan sana'), type: 'date', required: true },
    {
      name: 'responsibleUserId',
      label: tr("Mas'ul xodim"),
      type: 'async-select',
      optionsResource: 'users',
      optionsLabel: (item) => item.fullName,
    },
    { name: 'rootCauseAnalysis', label: tr('Ildiz sabab tahlili'), type: 'textarea', fullWidth: true },
    { name: 'correctiveAction', label: tr("To'g'rilash chorasi"), type: 'textarea', fullWidth: true },
    { name: 'dueDate', label: tr('Bajarish muddati'), type: 'date' },
    { name: 'closedDate', label: tr('Yopilgan sana'), type: 'date' },
    {
      name: 'status',
      label: tr('Holati'),
      type: 'select',
      default: 'OCHIQ',
      options: [
        { value: 'OCHIQ', label: tr('Ochiq') },
        { value: 'JARAYONDA', label: tr('Jarayonda') },
        { value: 'YOPILDI', label: tr('Yopildi') },
        { value: 'TASDIQLANDI', label: tr('Tasdiqlandi') },
      ],
    },
  ],
};

const COMPLAINT_STATUS_LABELS = {
  QABUL_QILINDI: tr('Qabul qilindi'),
  TEKSHIRILMOQDA: tr('Tekshirilmoqda'),
  HAL_QILINDI: tr('Hal qilindi'),
};

const COMPLAINT_STATUS_STYLES = {
  QABUL_QILINDI: 'bg-blue-50 text-blue-700 border-blue-200',
  TEKSHIRILMOQDA: 'bg-amber-50 text-amber-700 border-amber-200',
  HAL_QILINDI: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export const complaintConfig = {
  path: 'smk/complaints',
  title: tr('Sifat shikoyatlari'),
  columns: [
    { key: 'code', label: tr('Kod') },
    { key: 'fullName', label: tr('Mijoz') },
    { key: 'receivedDate', label: tr('Qabul qilingan sana'), render: (i) => (i.receivedDate ? String(i.receivedDate).slice(0, 10) : '—') },
    { key: 'responsibleUser', label: tr("Mas'ul"), render: (i) => i.responsibleUser?.fullName || '—' },
    {
      key: 'status',
      label: tr('Holati'),
      render: (i) => statusBadge(i.status, COMPLAINT_STATUS_STYLES, COMPLAINT_STATUS_LABELS),
    },
  ],
  fields: [
    { name: 'fullName', label: tr('Mijoz F.I.Sh. / tashkilot'), required: true },
    { name: 'phone', label: tr('Telefon') },
    { name: 'email', label: 'Email' },
    {
      name: 'relatedApplicationId',
      label: tr("Bog'liq ariza (ixtiyoriy)"),
      type: 'async-select',
      optionsResource: 'applications',
      optionsLabel: (item) => `${item.applicationNumber} — ${item.productName}`,
    },
    { name: 'description', label: tr('Shikoyat tavsifi'), type: 'textarea', fullWidth: true, required: true },
    { name: 'receivedDate', label: tr('Qabul qilingan sana'), type: 'date', required: true },
    { name: 'investigationNotes', label: tr('Tekshiruv izohlari'), type: 'textarea', fullWidth: true },
    { name: 'resolution', label: tr('Yechim'), type: 'textarea', fullWidth: true },
    {
      name: 'responsibleUserId',
      label: tr("Mas'ul xodim"),
      type: 'async-select',
      optionsResource: 'users',
      optionsLabel: (item) => item.fullName,
    },
    {
      name: 'status',
      label: tr('Holati'),
      type: 'select',
      default: 'QABUL_QILINDI',
      options: [
        { value: 'QABUL_QILINDI', label: tr('Qabul qilindi') },
        { value: 'TEKSHIRILMOQDA', label: tr('Tekshirilmoqda') },
        { value: 'HAL_QILINDI', label: tr('Hal qilindi') },
      ],
    },
  ],
};

// ===== SMK — FAZA 2: Hujjat boshqaruvi =====

const SMK_DOC_CATEGORY_LABELS = {
  PROTSEDURA: tr('Protsedura'),
  KORSATMA: tr("Ko'rsatma"),
  FORMA: tr('Forma'),
  JURNAL: tr('Jurnal'),
};

const SMK_DOC_STATUS_LABELS = { AMALDA: tr('Amalda'), QORALAMA: tr('Qoralama'), BEKOR_QILINGAN: tr('Bekor qilingan') };
const SMK_DOC_STATUS_STYLES = {
  AMALDA: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  QORALAMA: 'bg-slate-50 text-slate-600 border-slate-200',
  BEKOR_QILINGAN: 'bg-red-50 text-red-700 border-red-200',
};

export const smkDocumentConfig = {
  path: 'smk/documents',
  title: tr('SMK Hujjatlar'),
  columns: [
    { key: 'code', label: tr('Kod') },
    { key: 'titleUz', label: tr('Nomi') },
    { key: 'category', label: tr('Turi'), render: (i) => SMK_DOC_CATEGORY_LABELS[i.category] || i.category },
    { key: 'ownerUser', label: tr('Egasi'), render: (i) => i.ownerUser?.fullName || '—' },
    { key: 'status', label: tr('Holati'), render: (i) => statusBadge(i.status, SMK_DOC_STATUS_STYLES, SMK_DOC_STATUS_LABELS) },
  ],
  fields: [
    { name: 'code', label: tr('Kod (masalan SMK-P-01)'), required: true },
    { name: 'titleUz', label: tr('Nomi (UZ)'), required: true, fullWidth: true },
    { name: 'titleRu', label: tr('Nomi (RU)'), required: true, fullWidth: true },
    { name: 'titleEn', label: tr('Nomi (EN)'), required: true, fullWidth: true },
    {
      name: 'category',
      label: tr('Turi'),
      type: 'select',
      required: true,
      options: [
        { value: 'PROTSEDURA', label: tr('Protsedura') },
        { value: 'KORSATMA', label: tr("Ko'rsatma") },
        { value: 'FORMA', label: tr('Forma') },
        { value: 'JURNAL', label: tr('Jurnal') },
      ],
    },
    {
      name: 'ownerUserId',
      label: tr('Egasi'),
      type: 'async-select',
      optionsResource: 'users',
      optionsLabel: (item) => item.fullName,
    },
    {
      name: 'status',
      label: tr('Holati'),
      type: 'select',
      default: 'QORALAMA',
      options: [
        { value: 'AMALDA', label: tr('Amalda') },
        { value: 'QORALAMA', label: tr('Qoralama') },
        { value: 'BEKOR_QILINGAN', label: tr('Bekor qilingan') },
      ],
    },
  ],
};

// ===== SMK — FAZA 3: Auditlar =====

const AUDIT_STATUS_LABELS = { REJALASHTIRILGAN: tr('Rejalashtirilgan'), OTKAZILDI: tr("O'tkazildi"), YAKUNLANDI: tr('Yakunlandi') };
const AUDIT_STATUS_STYLES = {
  REJALASHTIRILGAN: 'bg-slate-50 text-slate-600 border-slate-200',
  OTKAZILDI: 'bg-amber-50 text-amber-700 border-amber-200',
  YAKUNLANDI: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export const internalAuditConfig = {
  path: 'smk/audits',
  title: tr('Ichki auditlar'),
  columns: [
    { key: 'plannedDate', label: tr('Rejalashtirilgan sana'), render: (i) => String(i.plannedDate).slice(0, 10) },
    { key: 'laboratory', label: tr('Laboratoriya'), render: (i) => locName(i.laboratory) || '—' },
    { key: 'auditorUser', label: tr('Auditor'), render: (i) => i.auditorUser?.fullName || '—' },
    { key: 'status', label: tr('Holati'), render: (i) => statusBadge(i.status, AUDIT_STATUS_STYLES, AUDIT_STATUS_LABELS) },
  ],
  fields: [
    { name: 'plannedDate', label: tr('Rejalashtirilgan sana'), type: 'date', required: true },
    { name: 'actualDate', label: tr("O'tkazilgan sana"), type: 'date' },
    {
      name: 'laboratoryId',
      label: tr('Laboratoriya'),
      type: 'async-select',
      optionsResource: 'laboratories',
      optionsLabel: (item) => locName(item),
    },
    {
      name: 'auditorUserId',
      label: tr('Auditor'),
      type: 'async-select',
      optionsResource: 'users',
      optionsLabel: (item) => item.fullName,
    },
    {
      name: 'status',
      label: tr('Holati'),
      type: 'select',
      default: 'REJALASHTIRILGAN',
      options: [
        { value: 'REJALASHTIRILGAN', label: tr('Rejalashtirilgan') },
        { value: 'OTKAZILDI', label: tr("O'tkazildi") },
        { value: 'YAKUNLANDI', label: tr('Yakunlandi') },
      ],
    },
    { name: 'summary', label: tr('Xulosa'), type: 'textarea', fullWidth: true },
  ],
};

// ===== SMK — FAZA 4: Texnik yadro =====

export const calibrationRecordConfig = {
  path: 'smk/calibration',
  title: tr('Uskunalar kalibrlash reestri'),
  columns: [
    { key: 'equipment', label: tr('Uskuna'), render: (i) => i.equipment?.name || '—' },
    { key: 'calibrationDate', label: tr('Kalibrlangan sana'), render: (i) => String(i.calibrationDate).slice(0, 10) },
    { key: 'nextDueDate', label: tr('Keyingi muddat'), render: (i) => String(i.nextDueDate).slice(0, 10) },
    {
      key: 'status',
      label: tr('Holati'),
      render: (i) =>
        new Date(i.nextDueDate) < new Date()
          ? statusBadge('MUDDATI_OTGAN', { MUDDATI_OTGAN: 'bg-red-50 text-red-700 border-red-200' }, { MUDDATI_OTGAN: tr("Muddati o'tgan") })
          : statusBadge('AMALDA', { AMALDA: 'bg-emerald-50 text-emerald-700 border-emerald-200' }, { AMALDA: tr('Amalda') }),
    },
  ],
  fields: [
    {
      name: 'equipmentId',
      label: tr('Uskuna'),
      type: 'async-select',
      required: true,
      optionsResource: 'equipment',
      optionsLabel: (item) => item.name,
    },
    { name: 'calibrationDate', label: tr('Kalibrlangan sana'), type: 'date', required: true },
    { name: 'nextDueDate', label: tr('Keyingi kalibrlash muddati'), type: 'date', required: true },
    { name: 'certificateUrl', label: tr('Sertifikat'), type: 'file' },
    { name: 'performedBy', label: tr('Kim bajardi') },
  ],
};

export const trainingRecordConfig = {
  path: 'smk/training',
  title: tr('Xodimlar malakasi / treninglar'),
  columns: [
    { key: 'user', label: tr('Xodim'), render: (i) => i.user?.fullName || '—' },
    { key: 'trainingTitle', label: tr('Trening nomi') },
    { key: 'trainingDate', label: tr('Sana'), render: (i) => String(i.trainingDate).slice(0, 10) },
    { key: 'expiryDate', label: tr('Amal qilish muddati'), render: (i) => (i.expiryDate ? String(i.expiryDate).slice(0, 10) : '—') },
  ],
  fields: [
    {
      name: 'userId',
      label: tr('Xodim'),
      type: 'async-select',
      required: true,
      optionsResource: 'users',
      optionsLabel: (item) => item.fullName,
    },
    { name: 'trainingTitle', label: tr('Trening nomi'), required: true, fullWidth: true },
    { name: 'trainingDate', label: tr('Sana'), type: 'date', required: true },
    { name: 'provider', label: tr("Ta'minlovchi tashkilot") },
    { name: 'certificateUrl', label: tr('Sertifikat'), type: 'file' },
    { name: 'expiryDate', label: tr('Amal qilish muddati'), type: 'date' },
  ],
};

export const qualityControlRecordConfig = {
  path: 'smk/qc',
  title: tr('Ichki sifat nazorati (QC)'),
  columns: [
    { key: 'laboratory', label: tr('Laboratoriya'), render: (i) => locName(i.laboratory) || '—' },
    { key: 'testType', label: tr('Sinov turi') },
    { key: 'controlDate', label: tr('Sana'), render: (i) => String(i.controlDate).slice(0, 10) },
    { key: 'withinLimits', label: tr("Me'yor ichida"), render: (i) => (i.withinLimits ? tr('Ha') : tr("Yo'q")) },
  ],
  fields: [
    {
      name: 'laboratoryId',
      label: tr('Laboratoriya'),
      type: 'async-select',
      optionsResource: 'laboratories',
      optionsLabel: (item) => locName(item),
    },
    { name: 'testType', label: tr('Sinov turi'), required: true },
    { name: 'controlDate', label: tr('Sana'), type: 'date', required: true },
    { name: 'expectedValue', label: tr('Kutilgan qiymat') },
    { name: 'actualValue', label: tr('Haqiqiy qiymat') },
    { name: 'deviation', label: tr('Chetlanish') },
    { name: 'withinLimits', label: tr("Me'yor ichida"), type: 'checkbox' },
    { name: 'notes', label: tr('Izoh'), type: 'textarea', fullWidth: true },
  ],
};

const PT_RESULT_LABELS = { QONIQARLI: tr('Qoniqarli'), QONIQARSIZ: tr('Qoniqarsiz'), OGOHLANTIRISH: tr('Ogohlantirish') };
const PT_RESULT_STYLES = {
  QONIQARLI: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  QONIQARSIZ: 'bg-red-50 text-red-700 border-red-200',
  OGOHLANTIRISH: 'bg-amber-50 text-amber-700 border-amber-200',
};

export const proficiencyTestConfig = {
  path: 'smk/proficiency-tests',
  title: tr('Malakaviy sinovlar (PT)'),
  columns: [
    { key: 'testProgram', label: tr('Dastur') },
    { key: 'providerName', label: tr("Ta'minlovchi") },
    { key: 'testDate', label: tr('Sana'), render: (i) => String(i.testDate).slice(0, 10) },
    { key: 'resultStatus', label: tr('Natija'), render: (i) => statusBadge(i.resultStatus, PT_RESULT_STYLES, PT_RESULT_LABELS) },
  ],
  fields: [
    {
      name: 'laboratoryId',
      label: tr('Laboratoriya'),
      type: 'async-select',
      optionsResource: 'laboratories',
      optionsLabel: (item) => locName(item),
    },
    { name: 'testProgram', label: tr('Dastur nomi'), required: true },
    { name: 'providerName', label: tr("Ta'minlovchi tashkilot"), required: true },
    { name: 'testDate', label: tr('Sana'), type: 'date', required: true },
    {
      name: 'resultStatus',
      label: tr('Natija'),
      type: 'select',
      required: true,
      options: [
        { value: 'QONIQARLI', label: tr('Qoniqarli') },
        { value: 'QONIQARSIZ', label: tr('Qoniqarsiz') },
        { value: 'OGOHLANTIRISH', label: tr('Ogohlantirish') },
      ],
    },
    { name: 'reportUrl', label: tr('Hisobot'), type: 'file' },
  ],
};

export const measurementUncertaintyConfig = {
  path: 'smk/uncertainty',
  title: tr("O'lchov noaniqligi"),
  columns: [
    { key: 'service', label: tr('Xizmat / usul'), render: (i) => locName(i.service) || i.testMethodName || '—' },
    { key: 'uncertaintyValue', label: tr('Qiymat') },
    { key: 'unit', label: tr('Birlik') },
  ],
  fields: [
    {
      name: 'serviceId',
      label: tr('Xizmat (ixtiyoriy)'),
      type: 'async-select',
      optionsResource: 'services',
      optionsLabel: (item) => locName(item),
    },
    { name: 'testMethodName', label: tr('Sinov usuli nomi (xizmat tanlanmasa)') },
    { name: 'uncertaintyValue', label: tr('Noaniqlik qiymati'), required: true },
    { name: 'unit', label: tr('Birlik') },
    { name: 'calculationMethod', label: tr('Hisoblash usuli'), type: 'textarea', fullWidth: true },
    { name: 'documentUrl', label: tr('Hujjat'), type: 'file' },
  ],
};

// ===== SMK — FAZA 6: Strategik =====

const RISK_STATUS_LABELS = { FAOL: tr('Faol'), NAZORAT_OSTIDA: tr('Nazorat ostida'), YOPILDI: tr('Yopildi') };
const RISK_STATUS_STYLES = {
  FAOL: 'bg-red-50 text-red-700 border-red-200',
  NAZORAT_OSTIDA: 'bg-amber-50 text-amber-700 border-amber-200',
  YOPILDI: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export const riskItemConfig = {
  path: 'smk/risks',
  title: tr('Risklar reestri'),
  columns: [
    { key: 'description', label: tr('Tavsif') },
    { key: 'category', label: tr('Kategoriya') },
    { key: 'riskScore', label: tr('Risk bahosi'), render: (i) => `${i.likelihood} × ${i.impact} = ${i.riskScore}` },
    { key: 'status', label: tr('Holati'), render: (i) => statusBadge(i.status, RISK_STATUS_STYLES, RISK_STATUS_LABELS) },
  ],
  fields: [
    { name: 'description', label: tr('Tavsif'), type: 'textarea', fullWidth: true, required: true },
    { name: 'category', label: tr('Kategoriya') },
    { name: 'likelihood', label: tr('Ehtimollik (1-5)'), type: 'number', required: true },
    { name: 'impact', label: tr("Ta'sir darajasi (1-5)"), type: 'number', required: true },
    { name: 'mitigationPlan', label: tr('Kamaytirish rejasi'), type: 'textarea', fullWidth: true },
    {
      name: 'ownerUserId',
      label: tr("Mas'ul"),
      type: 'async-select',
      optionsResource: 'users',
      optionsLabel: (item) => item.fullName,
    },
    {
      name: 'status',
      label: tr('Holati'),
      type: 'select',
      default: 'FAOL',
      options: [
        { value: 'FAOL', label: tr('Faol') },
        { value: 'NAZORAT_OSTIDA', label: tr('Nazorat ostida') },
        { value: 'YOPILDI', label: tr('Yopildi') },
      ],
    },
  ],
};

export const contactMessageConfig = {
  path: 'contact-messages',
  title: tr('Murojaatlar'),
  columns: [
    { key: 'fullName', label: tr('F.I.Sh.') },
    { key: 'phone', label: tr('Telefon') },
    { key: 'email', label: 'Email' },
    { key: 'message', label: tr('Xabar') },
    { key: 'isRead', label: tr("O'qilgan"), render: (i) => (i.isRead ? tr('Ha') : tr("Yo'q")) },
  ],
  fields: [
    { name: 'fullName', label: tr('F.I.Sh.'), required: true },
    { name: 'phone', label: tr('Telefon') },
    { name: 'email', label: 'Email' },
    { name: 'message', label: tr('Xabar'), type: 'textarea', fullWidth: true, required: true },
    { name: 'isRead', label: tr("O'qilgan"), type: 'checkbox' },
  ],
};