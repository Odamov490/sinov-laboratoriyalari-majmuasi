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

export const laboratoryConfig = {
  path: 'laboratories',
  title: 'Laboratoriyalar',
  columns: [
    { key: 'nameUz', label: 'Nomi (UZ)' },
    { key: 'slug', label: 'Slug' },
    { key: 'order', label: 'Tartib' },
    { key: 'isActive', label: 'Faol', render: (i) => (i.isActive ? 'Ha' : "Yo'q") },
  ],
  fields: [
    { name: 'slug', label: 'Slug', required: true },
    { name: 'nameUz', label: 'Nomi (UZ)', required: true },
    { name: 'nameRu', label: 'Nomi (RU)', required: true },
    { name: 'nameEn', label: 'Nomi (EN)', required: true },
    { name: 'descriptionUz', label: 'Tavsif (UZ)', type: 'textarea', fullWidth: true },
    { name: 'descriptionRu', label: 'Tavsif (RU)', type: 'textarea', fullWidth: true },
    { name: 'descriptionEn', label: 'Tavsif (EN)', type: 'textarea', fullWidth: true },
    { name: 'aboutUz', label: 'Batafsil (UZ)', type: 'textarea', fullWidth: true },
    { name: 'accreditationScope', label: 'Akkreditatsiya sohasi', type: 'textarea', fullWidth: true },
    { name: 'coverImage', label: 'Rasm', type: 'file' },
    { name: 'order', label: 'Tartib', type: 'number' },
    { name: 'isActive', label: 'Faol', type: 'checkbox' },
  ],
};

export const serviceConfig = {
  path: 'services',
  title: 'Xizmatlar',
  columns: [
    { key: 'nameUz', label: 'Nomi' },
    { key: 'slug', label: 'Slug' },
    { key: 'testType', label: 'Sinov turi' },
    { key: 'isActive', label: 'Faol', render: (i) => (i.isActive ? 'Ha' : "Yo'q") },
  ],
  fields: [
    { name: 'slug', label: 'Slug', required: true },
    { name: 'nameUz', label: 'Nomi (UZ)', required: true },
    { name: 'nameRu', label: 'Nomi (RU)', required: true },
    { name: 'nameEn', label: 'Nomi (EN)', required: true },
    {
      name: 'laboratoryId',
      label: 'Laboratoriya',
      type: 'async-select',
      optionsResource: 'laboratories',
      optionsLabel: (item) => item.nameUz,
    },
    {
      name: 'standardId',
      label: 'Standart',
      type: 'async-select',
      optionsResource: 'standards',
      optionsLabel: (item) => `${item.code} — ${item.nameUz}`,
    },
    {
      name: 'categoryId',
      label: 'Xizmat kategoriyasi',
      type: 'async-select',
      optionsResource: 'service-categories',
      optionsLabel: (item) => item.nameUz,
    },
    { name: 'testObject', label: 'Sinov obyekti' },
    { name: 'testType', label: 'Sinov turi' },
    { name: 'durationDays', label: 'Muddat (kun)', type: 'number' },
    { name: 'descriptionUz', label: 'Tavsif (UZ)', type: 'textarea', fullWidth: true },
    { name: 'descriptionRu', label: 'Tavsif (RU)', type: 'textarea', fullWidth: true },
    { name: 'descriptionEn', label: 'Tavsif (EN)', type: 'textarea', fullWidth: true },
    { name: 'isActive', label: 'Faol', type: 'checkbox' },
  ],
};

export const standardConfig = {
  path: 'standards',
  title: 'Standartlar',
  columns: [
    { key: 'code', label: 'Kod' },
    { key: 'nameUz', label: 'Nomi' },
    { key: 'category', label: 'Kategoriya' },
  ],
  fields: [
    { name: 'code', label: 'Kod', required: true },
    { name: 'category', label: 'Kategoriya (O‘z DSt, IEC, ISO, GOST, EN, CISPR...)', required: true },
    { name: 'nameUz', label: 'Nomi (UZ)', required: true },
    { name: 'nameRu', label: 'Nomi (RU)', required: true },
    { name: 'nameEn', label: 'Nomi (EN)', required: true },
    { name: 'scopeUz', label: 'Scope (UZ)', type: 'textarea', fullWidth: true },
    {
      name: 'laboratoryId',
      label: 'Laboratoriya',
      type: 'async-select',
      optionsResource: 'laboratories',
      optionsLabel: (item) => item.nameUz,
    },
    { name: 'documentUrl', label: 'Hujjat', type: 'file' },
  ],
};

export const newsConfig = {
  path: 'news',
  title: 'Yangiliklar',
  columns: [
    { key: 'titleUz', label: 'Sarlavha' },
    { key: 'isPublished', label: 'Chop etilgan', render: (i) => (i.isPublished ? 'Ha' : "Yo'q") },
  ],
  fields: [
    { name: 'slug', label: 'Slug', required: true },
    { name: 'titleUz', label: 'Sarlavha (UZ)', required: true },
    { name: 'titleRu', label: 'Sarlavha (RU)', required: true },
    { name: 'titleEn', label: 'Sarlavha (EN)', required: true },
    { name: 'descriptionUz', label: 'Qisqa tavsif (UZ)', type: 'textarea', fullWidth: true },
    { name: 'descriptionRu', label: 'Qisqa tavsif (RU)', type: 'textarea', fullWidth: true },
    { name: 'descriptionEn', label: 'Qisqa tavsif (EN)', type: 'textarea', fullWidth: true },
    { name: 'contentUz', label: 'Batafsil matn (UZ)', type: 'textarea', fullWidth: true, rows: 8 },
    { name: 'contentRu', label: 'Batafsil matn (RU)', type: 'textarea', fullWidth: true, rows: 8 },
    { name: 'contentEn', label: 'Batafsil matn (EN)', type: 'textarea', fullWidth: true, rows: 8 },
    { name: 'image', label: 'Rasmlar (bir nechtasini tanlash mumkin)', type: 'multi-file', fullWidth: true },
    {
      name: 'categoryId',
      label: 'Kategoriya',
      type: 'async-select',
      optionsResource: 'news-categories',
      optionsLabel: (item) => item.nameUz,
    },
    { name: 'seoTitle', label: 'SEO Title' },
    { name: 'seoDescription', label: 'SEO Description' },
    { name: 'isPublished', label: 'Chop etish', type: 'checkbox' },
  ],
};

export const documentConfig = {
  path: 'documents',
  title: 'Hujjatlar',
  columns: [
    { key: 'titleUz', label: 'Nomi' },
  ],
  fields: [
    { name: 'titleUz', label: 'Nomi (UZ)', required: true },
    { name: 'titleRu', label: 'Nomi (RU)', required: true },
    { name: 'titleEn', label: 'Nomi (EN)', required: true },
    { name: 'fileUrl', label: 'Fayl', type: 'file', required: true },
    {
      name: 'categoryId',
      label: 'Kategoriya',
      type: 'async-select',
      optionsResource: 'document-categories',
      optionsLabel: (item) => item.nameUz,
    },
  ],
};

export const staffConfig = {
  path: 'staff',
  title: 'Mutaxassislar',
  columns: [
    { key: 'fullName', label: 'F.I.Sh.' },
    { key: 'position', label: 'Lavozim' },
    { key: 'employeeCode', label: 'Kod', render: (i) => i.employeeCode || '—' },
    { key: 'laboratory', label: 'Laboratoriya', render: (i) => i.laboratory?.nameUz || '—' },
  ],
  fields: [
    { name: 'fullName', label: 'F.I.Sh.', required: true },
    { name: 'position', label: 'Lavozim', required: true },
    { name: 'specialization', label: 'Mutaxassislik' },
    { name: 'experienceYears', label: 'Tajriba (yil)', type: 'number' },
    { name: 'email', label: 'Email' },
    { name: 'phone', label: 'Telefon' },
    { name: 'photo', label: 'Rasm', type: 'file' },
    {
      name: 'laboratoryId',
      label: 'Laboratoriya',
      type: 'async-select',
      optionsResource: 'laboratories',
      optionsLabel: (item) => item.nameUz,
    },
    { name: 'order', label: 'Tartib', type: 'number' },
    { name: 'staffNumber', label: 'Tabel raqami', type: 'number' },
    { name: 'employeeCode', label: 'Kod' },
    { name: 'hireDate', label: 'Ishga kirgan sana', type: 'date' },
    { name: 'birthDate', label: "Tug'ilgan sana", type: 'date' },
    { name: 'passportSeries', label: 'Pasport seriyasi' },
    { name: 'passportNumber', label: 'Pasport raqami' },
    { name: 'pinfl', label: 'JSHSHIR (PINFL)' },
    { name: 'address', label: 'Manzil', fullWidth: true },
    { name: 'notes', label: 'Izoh', type: 'textarea', fullWidth: true },
  ],
  birthdayPin: { dateField: 'birthDate', limit: 3 },
  exportable: true,
  exportTitle: "Mutaxassislar ro'yxati — Sinov Laboratoriyalari Majmuasi",
  exportWidth: 1900,
  exportColumns: [
    { key: 'staffNumber', label: 'Tabel №' },
    { key: 'employeeCode', label: 'Kod' },
    { key: 'fullName', label: 'F.I.Sh.' },
    { key: 'position', label: 'Lavozim' },
    { key: 'specialization', label: 'Mutaxassislik' },
    { key: 'laboratory', label: 'Laboratoriya', get: (i) => i.laboratory?.nameUz || '—' },
    { key: 'experienceYears', label: 'Tajriba (yil)', get: (i) => i.experienceYears ?? '—' },
    { key: 'birthDate', label: "Tug'ilgan sana", get: (i) => (i.birthDate ? String(i.birthDate).slice(0, 10) : '—') },
    { key: 'hireDate', label: 'Ishga kirgan sana', get: (i) => (i.hireDate ? String(i.hireDate).slice(0, 10) : '—') },
    {
      key: 'passport',
      label: 'Pasport seriya/raqami',
      get: (i) => (i.passportSeries || i.passportNumber ? `${i.passportSeries || ''} ${i.passportNumber || ''}`.trim() : '—'),
    },
    { key: 'pinfl', label: 'JSHSHIR (PINFL)', get: (i) => i.pinfl || '—' },
    { key: 'address', label: 'Manzil', get: (i) => i.address || '—' },
    { key: 'phone', label: 'Telefon' },
    { key: 'email', label: 'Email' },
    { key: 'notes', label: 'Izoh' },
  ],
};

export const equipmentConfig = {
  path: 'equipment',
  title: 'Uskunalar',
  columns: [
    { key: 'name', label: 'Nomi' },
    { key: 'manufacturer', label: 'Ishlab chiqaruvchi' },
  ],
  fields: [
    { name: 'slug', label: 'Slug', required: true },
    { name: 'name', label: 'Nomi', required: true },
    { name: 'manufacturer', label: 'Ishlab chiqaruvchi' },
    { name: 'model', label: 'Model' },
    { name: 'specifications', label: 'Texnik xususiyatlari', type: 'textarea', fullWidth: true },
    { name: 'application', label: 'Qo‘llanilishi', type: 'textarea', fullWidth: true },
    { name: 'photo', label: 'Rasm', type: 'file' },
    {
      name: 'laboratoryId',
      label: 'Laboratoriya',
      type: 'async-select',
      optionsResource: 'laboratories',
      optionsLabel: (item) => item.nameUz,
    },
  ],
};

function isVideoFile(url) {
  return /\.(mp4|webm)$/i.test(url || '');
}

export const galleryConfig = {
  path: 'gallery',
  title: 'Galereya',
  columns: [
    {
      key: 'imageUrl',
      label: 'Oldindan ko\'rish',
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
    { key: 'title', label: 'Nomi', render: (i) => i.title || '—' },
    { key: 'category', label: 'Kategoriya', render: (i) => i.category?.nameUz || '—' },
    { key: 'laboratory', label: 'Laboratoriya', render: (i) => i.laboratory?.nameUz || '—' },
    { key: 'createdAt', label: 'Sana', render: (i) => new Date(i.createdAt).toLocaleDateString('uz-UZ') },
  ],
  bulkUpload: {
    fileField: 'imageUrl',
    titleField: 'title',
    sharedFieldNames: ['categoryId', 'laboratoryId'],
  },
  fields: [
    { name: 'title', label: 'Nomi' },
    { name: 'imageUrl', label: 'Rasm', type: 'file', required: true },
    {
      name: 'categoryId',
      label: 'Kategoriya',
      type: 'async-select',
      optionsResource: 'gallery-categories',
      optionsLabel: (item) => item.nameUz,
    },
    {
      name: 'laboratoryId',
      label: 'Laboratoriya',
      type: 'async-select',
      optionsResource: 'laboratories',
      optionsLabel: (item) => item.nameUz,
    },
  ],
};

export const faqConfig = {
  path: 'faq',
  title: 'FAQ',
  columns: [{ key: 'questionUz', label: 'Savol' }],
  fields: [
    { name: 'questionUz', label: 'Savol (UZ)', required: true, type: 'textarea', fullWidth: true },
    { name: 'questionRu', label: 'Savol (RU)', required: true, type: 'textarea', fullWidth: true },
    { name: 'questionEn', label: 'Savol (EN)', required: true, type: 'textarea', fullWidth: true },
    { name: 'answerUz', label: 'Javob (UZ)', required: true, type: 'textarea', fullWidth: true },
    { name: 'answerRu', label: 'Javob (RU)', required: true, type: 'textarea', fullWidth: true },
    { name: 'answerEn', label: 'Javob (EN)', required: true, type: 'textarea', fullWidth: true },
    { name: 'order', label: 'Tartib', type: 'number' },
    { name: 'isActive', label: 'Faol', type: 'checkbox' },
  ],
};

export const accreditationConfig = {
  path: 'accreditation',
  title: 'Akkreditatsiya',
  columns: [
    { key: 'certificateNumber', label: 'Guvohnoma raqami' },
    { key: 'standardCode', label: 'Standart' },
  ],
  searchable: false,
  fields: [
    { name: 'certificateNumber', label: 'Guvohnoma raqami', required: true },
    { name: 'standardCode', label: 'Standart kodi', required: true },
    { name: 'scopeUz', label: 'Scope (UZ)', type: 'textarea', fullWidth: true },
    { name: 'scopeRu', label: 'Scope (RU)', type: 'textarea', fullWidth: true },
    { name: 'scopeEn', label: 'Scope (EN)', type: 'textarea', fullWidth: true },
    { name: 'documentUrl', label: 'Guvohnoma (PDF)', type: 'file' },
    {
      name: 'scopeUrl',
      label: "Akkreditatsiya doirasi havolasi (akkred.uz)",
      type: 'url',
      fullWidth: true,
      placeholder: 'https://api-e.akkred.uz/media/file/pdf/...',
    },
    { name: 'issuedAt', label: 'Berilgan sana', type: 'date' },
    { name: 'validUntil', label: 'Amal qilish muddati', type: 'date' },
  ],
};

export const tnVedRegulationConfig = {
  path: 'tnved-reglament',
  title: 'TN VED reglament',
  fields: [
    { name: 'item', label: 'Band raqami', required: true },
    { name: 'nameUz', label: 'Mahsulot nomi', type: 'textarea', fullWidth: true, required: true },
    { name: 'tnVedRaw', label: 'TN VED kodi/oralig\'i', type: 'textarea', fullWidth: true, required: true },
    {
      name: 'category',
      label: 'Talab turi',
      type: 'select',
      required: true,
      options: [
        { value: 'SERTIFIKAT', label: 'Majburiy sertifikat' },
        { value: 'DEKLARATSIYA', label: 'Deklaratsiya' },
      ],
    },
    { name: 'decision', label: "Qaror raqami (43)", required: true },
  ],
  columns: [
    { key: 'item', label: 'Band' },
    { key: 'nameUz', label: 'Mahsulot nomi' },
    { key: 'tnVedRaw', label: 'TN VED' },
    { key: 'category', label: 'Talab', render: (i) => (i.category === 'SERTIFIKAT' ? 'Sertifikat' : 'Deklaratsiya') },
    { key: 'decision', label: 'Qaror' },
  ],
};

export const testIndicatorConfig = {
  path: 'test-indicators',
  title: "Ko'rsatkichlar hovuzi",
  columns: [
    { key: 'positionCode', label: 'Pozitsiya kodi', render: (i) => i.positionCode || '—' },
    { key: 'nameUz', label: 'Nomi' },
    { key: 'standardCode', label: 'Standart kodi', render: (i) => i.standardCode || '—' },
    { key: 'laboratory', label: 'Laboratoriya', render: (i) => i.laboratory?.nameUz || '—' },
    { key: 'unit', label: "O'lchov birligi", render: (i) => i.unit || '—' },
  ],
  fields: [
    { name: 'positionCode', label: 'Pozitsiya kodi' },
    { name: 'nameUz', label: 'Nomi (UZ)', required: true, fullWidth: true },
    { name: 'nameRu', label: 'Nomi (RU)', required: true, fullWidth: true },
    { name: 'nameEn', label: 'Nomi (EN)', required: true, fullWidth: true },
    { name: 'standardCode', label: 'Standart kodi' },
    { name: 'unit', label: "O'lchov birligi" },
    {
      name: 'laboratoryId',
      label: 'Laboratoriya',
      type: 'async-select',
      optionsResource: 'laboratories',
      optionsLabel: (item) => item.nameUz,
    },
    { name: 'method', label: 'Sinov usuli', type: 'textarea', fullWidth: true },
  ],
};

export const productConfig = {
  path: 'products',
  title: 'Mahsulotlar (sinov dasturlari)',
  columns: [
    { key: 'nameUz', label: 'Nomi' },
    { key: 'slug', label: 'Slug' },
    { key: 'laboratory', label: 'Laboratoriya', render: (i) => i.laboratory?.nameUz || '—' },
    { key: 'isActive', label: 'Faol', render: (i) => (i.isActive ? 'Ha' : "Yo'q") },
    {
      key: 'builder',
      label: 'Konstruktor',
      render: (i) =>
        React.createElement(
          Link,
          { to: `/admin/sinov-dasturlari/${i.id}`, className: 'text-primary font-medium hover:underline' },
          'Konstruktor'
        ),
    },
  ],
  fields: [
    { name: 'slug', label: 'Slug', required: true },
    { name: 'nameUz', label: 'Nomi (UZ)', required: true },
    { name: 'nameRu', label: 'Nomi (RU)', required: true },
    { name: 'nameEn', label: 'Nomi (EN)', required: true },
    {
      name: 'laboratoryId',
      label: 'Laboratoriya',
      type: 'async-select',
      optionsResource: 'laboratories',
      optionsLabel: (item) => item.nameUz,
    },
    { name: 'descriptionUz', label: 'Tavsif (UZ)', type: 'textarea', fullWidth: true },
    { name: 'isActive', label: 'Faol', type: 'checkbox' },
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
  SHIKOYAT: 'Shikoyat',
  ICHKI_KUZATUV: 'Ichki kuzatuv',
  NAMUNA_MUAMMOSI: 'Namuna muammosi',
};

const NC_STATUS_LABELS = {
  OCHIQ: 'Ochiq',
  JARAYONDA: 'Jarayonda',
  YOPILDI: 'Yopildi',
  TASDIQLANDI: 'Tasdiqlandi',
};

const NC_STATUS_STYLES = {
  OCHIQ: 'bg-red-50 text-red-700 border-red-200',
  JARAYONDA: 'bg-amber-50 text-amber-700 border-amber-200',
  YOPILDI: 'bg-blue-50 text-blue-700 border-blue-200',
  TASDIQLANDI: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export const nonConformanceConfig = {
  path: 'smk/nonconformances',
  title: 'Nomuvofiqliklar (CAPA)',
  columns: [
    { key: 'code', label: 'Kod' },
    { key: 'source', label: 'Manba', render: (i) => NC_SOURCE_LABELS[i.source] || i.source },
    { key: 'description', label: 'Tavsif' },
    { key: 'responsibleUser', label: "Mas'ul", render: (i) => i.responsibleUser?.fullName || '—' },
    { key: 'dueDate', label: 'Muddat', render: (i) => (i.dueDate ? String(i.dueDate).slice(0, 10) : '—') },
    { key: 'status', label: 'Holati', render: (i) => statusBadge(i.status, NC_STATUS_STYLES, NC_STATUS_LABELS) },
  ],
  fields: [
    {
      name: 'source',
      label: 'Manba',
      type: 'select',
      required: true,
      options: [
        { value: 'AUDIT', label: 'Audit' },
        { value: 'SHIKOYAT', label: 'Shikoyat' },
        { value: 'ICHKI_KUZATUV', label: 'Ichki kuzatuv' },
        { value: 'NAMUNA_MUAMMOSI', label: 'Namuna muammosi' },
      ],
    },
    { name: 'description', label: 'Tavsif', type: 'textarea', fullWidth: true, required: true },
    { name: 'detectedDate', label: 'Aniqlangan sana', type: 'date', required: true },
    {
      name: 'responsibleUserId',
      label: "Mas'ul xodim",
      type: 'async-select',
      optionsResource: 'users',
      optionsLabel: (item) => item.fullName,
    },
    { name: 'rootCauseAnalysis', label: 'Ildiz sabab tahlili', type: 'textarea', fullWidth: true },
    { name: 'correctiveAction', label: "To'g'rilash chorasi", type: 'textarea', fullWidth: true },
    { name: 'dueDate', label: 'Bajarish muddati', type: 'date' },
    { name: 'closedDate', label: 'Yopilgan sana', type: 'date' },
    {
      name: 'status',
      label: 'Holati',
      type: 'select',
      default: 'OCHIQ',
      options: [
        { value: 'OCHIQ', label: 'Ochiq' },
        { value: 'JARAYONDA', label: 'Jarayonda' },
        { value: 'YOPILDI', label: 'Yopildi' },
        { value: 'TASDIQLANDI', label: 'Tasdiqlandi' },
      ],
    },
  ],
};

const COMPLAINT_STATUS_LABELS = {
  QABUL_QILINDI: 'Qabul qilindi',
  TEKSHIRILMOQDA: 'Tekshirilmoqda',
  HAL_QILINDI: 'Hal qilindi',
};

const COMPLAINT_STATUS_STYLES = {
  QABUL_QILINDI: 'bg-blue-50 text-blue-700 border-blue-200',
  TEKSHIRILMOQDA: 'bg-amber-50 text-amber-700 border-amber-200',
  HAL_QILINDI: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export const complaintConfig = {
  path: 'smk/complaints',
  title: 'Sifat shikoyatlari',
  columns: [
    { key: 'code', label: 'Kod' },
    { key: 'fullName', label: 'Mijoz' },
    { key: 'receivedDate', label: 'Qabul qilingan sana', render: (i) => (i.receivedDate ? String(i.receivedDate).slice(0, 10) : '—') },
    { key: 'responsibleUser', label: "Mas'ul", render: (i) => i.responsibleUser?.fullName || '—' },
    {
      key: 'status',
      label: 'Holati',
      render: (i) => statusBadge(i.status, COMPLAINT_STATUS_STYLES, COMPLAINT_STATUS_LABELS),
    },
  ],
  fields: [
    { name: 'fullName', label: 'Mijoz F.I.Sh. / tashkilot', required: true },
    { name: 'phone', label: 'Telefon' },
    { name: 'email', label: 'Email' },
    {
      name: 'relatedApplicationId',
      label: "Bog'liq ariza (ixtiyoriy)",
      type: 'async-select',
      optionsResource: 'applications',
      optionsLabel: (item) => `${item.applicationNumber} — ${item.productName}`,
    },
    { name: 'description', label: 'Shikoyat tavsifi', type: 'textarea', fullWidth: true, required: true },
    { name: 'receivedDate', label: 'Qabul qilingan sana', type: 'date', required: true },
    { name: 'investigationNotes', label: 'Tekshiruv izohlari', type: 'textarea', fullWidth: true },
    { name: 'resolution', label: 'Yechim', type: 'textarea', fullWidth: true },
    {
      name: 'responsibleUserId',
      label: "Mas'ul xodim",
      type: 'async-select',
      optionsResource: 'users',
      optionsLabel: (item) => item.fullName,
    },
    {
      name: 'status',
      label: 'Holati',
      type: 'select',
      default: 'QABUL_QILINDI',
      options: [
        { value: 'QABUL_QILINDI', label: 'Qabul qilindi' },
        { value: 'TEKSHIRILMOQDA', label: 'Tekshirilmoqda' },
        { value: 'HAL_QILINDI', label: 'Hal qilindi' },
      ],
    },
  ],
};

export const contactMessageConfig = {
  path: 'contact-messages',
  title: 'Murojaatlar',
  columns: [
    { key: 'fullName', label: 'F.I.Sh.' },
    { key: 'phone', label: 'Telefon' },
    { key: 'email', label: 'Email' },
    { key: 'message', label: 'Xabar' },
    { key: 'isRead', label: "O'qilgan", render: (i) => (i.isRead ? 'Ha' : "Yo'q") },
  ],
  fields: [
    { name: 'fullName', label: 'F.I.Sh.', required: true },
    { name: 'phone', label: 'Telefon' },
    { name: 'email', label: 'Email' },
    { name: 'message', label: 'Xabar', type: 'textarea', fullWidth: true, required: true },
    { name: 'isRead', label: "O'qilgan", type: 'checkbox' },
  ],
};