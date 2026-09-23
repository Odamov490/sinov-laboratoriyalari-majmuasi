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

// ===== SMK — FAZA 2: Hujjat boshqaruvi =====

const SMK_DOC_CATEGORY_LABELS = {
  PROTSEDURA: 'Protsedura',
  KORSATMA: "Ko'rsatma",
  FORMA: 'Forma',
  JURNAL: 'Jurnal',
};

const SMK_DOC_STATUS_LABELS = { AMALDA: 'Amalda', QORALAMA: 'Qoralama', BEKOR_QILINGAN: 'Bekor qilingan' };
const SMK_DOC_STATUS_STYLES = {
  AMALDA: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  QORALAMA: 'bg-slate-50 text-slate-600 border-slate-200',
  BEKOR_QILINGAN: 'bg-red-50 text-red-700 border-red-200',
};

export const smkDocumentConfig = {
  path: 'smk/documents',
  title: 'SMK Hujjatlar',
  columns: [
    { key: 'code', label: 'Kod' },
    { key: 'titleUz', label: 'Nomi' },
    { key: 'category', label: 'Turi', render: (i) => SMK_DOC_CATEGORY_LABELS[i.category] || i.category },
    { key: 'ownerUser', label: 'Egasi', render: (i) => i.ownerUser?.fullName || '—' },
    { key: 'status', label: 'Holati', render: (i) => statusBadge(i.status, SMK_DOC_STATUS_STYLES, SMK_DOC_STATUS_LABELS) },
  ],
  fields: [
    { name: 'code', label: 'Kod (masalan SMK-P-01)', required: true },
    { name: 'titleUz', label: 'Nomi (UZ)', required: true, fullWidth: true },
    { name: 'titleRu', label: 'Nomi (RU)', required: true, fullWidth: true },
    { name: 'titleEn', label: 'Nomi (EN)', required: true, fullWidth: true },
    {
      name: 'category',
      label: 'Turi',
      type: 'select',
      required: true,
      options: [
        { value: 'PROTSEDURA', label: 'Protsedura' },
        { value: 'KORSATMA', label: "Ko'rsatma" },
        { value: 'FORMA', label: 'Forma' },
        { value: 'JURNAL', label: 'Jurnal' },
      ],
    },
    {
      name: 'ownerUserId',
      label: 'Egasi',
      type: 'async-select',
      optionsResource: 'users',
      optionsLabel: (item) => item.fullName,
    },
    {
      name: 'status',
      label: 'Holati',
      type: 'select',
      default: 'QORALAMA',
      options: [
        { value: 'AMALDA', label: 'Amalda' },
        { value: 'QORALAMA', label: 'Qoralama' },
        { value: 'BEKOR_QILINGAN', label: 'Bekor qilingan' },
      ],
    },
  ],
};

export const smkDocumentVersionConfig = {
  path: 'smk/document-versions',
  title: 'Hujjat versiyalari',
  columns: [
    { key: 'document', label: 'Hujjat', render: (i) => i.document ? `${i.document.code} — ${i.document.titleUz}` : '—' },
    { key: 'versionNumber', label: 'Versiya' },
    { key: 'approvedByUser', label: 'Tasdiqlagan', render: (i) => i.approvedByUser?.fullName || '—' },
    { key: 'approvedAt', label: 'Tasdiqlangan sana', render: (i) => (i.approvedAt ? String(i.approvedAt).slice(0, 10) : '—') },
  ],
  fields: [
    {
      name: 'documentId',
      label: 'Hujjat',
      type: 'async-select',
      required: true,
      optionsResource: 'smk/documents',
      optionsLabel: (item) => `${item.code} — ${item.titleUz}`,
    },
    { name: 'versionNumber', label: 'Versiya raqami (masalan v2.0)', required: true },
    { name: 'fileUrl', label: 'Fayl', type: 'file' },
    { name: 'changeDescription', label: "O'zgarish tavsifi", type: 'textarea', fullWidth: true },
    {
      name: 'approvedByUserId',
      label: 'Tasdiqlagan',
      type: 'async-select',
      optionsResource: 'users',
      optionsLabel: (item) => item.fullName,
    },
    { name: 'approvedAt', label: 'Tasdiqlangan sana', type: 'date' },
  ],
};

// ===== SMK — FAZA 3: Auditlar =====

const AUDIT_STATUS_LABELS = { REJALASHTIRILGAN: 'Rejalashtirilgan', OTKAZILDI: "O'tkazildi", YAKUNLANDI: 'Yakunlandi' };
const AUDIT_STATUS_STYLES = {
  REJALASHTIRILGAN: 'bg-slate-50 text-slate-600 border-slate-200',
  OTKAZILDI: 'bg-amber-50 text-amber-700 border-amber-200',
  YAKUNLANDI: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export const internalAuditConfig = {
  path: 'smk/audits',
  title: 'Ichki auditlar',
  columns: [
    { key: 'plannedDate', label: 'Rejalashtirilgan sana', render: (i) => String(i.plannedDate).slice(0, 10) },
    { key: 'laboratory', label: 'Laboratoriya', render: (i) => i.laboratory?.nameUz || '—' },
    { key: 'auditorUser', label: 'Auditor', render: (i) => i.auditorUser?.fullName || '—' },
    { key: 'status', label: 'Holati', render: (i) => statusBadge(i.status, AUDIT_STATUS_STYLES, AUDIT_STATUS_LABELS) },
  ],
  fields: [
    { name: 'plannedDate', label: 'Rejalashtirilgan sana', type: 'date', required: true },
    { name: 'actualDate', label: "O'tkazilgan sana", type: 'date' },
    {
      name: 'laboratoryId',
      label: 'Laboratoriya',
      type: 'async-select',
      optionsResource: 'laboratories',
      optionsLabel: (item) => item.nameUz,
    },
    {
      name: 'auditorUserId',
      label: 'Auditor',
      type: 'async-select',
      optionsResource: 'users',
      optionsLabel: (item) => item.fullName,
    },
    {
      name: 'status',
      label: 'Holati',
      type: 'select',
      default: 'REJALASHTIRILGAN',
      options: [
        { value: 'REJALASHTIRILGAN', label: 'Rejalashtirilgan' },
        { value: 'OTKAZILDI', label: "O'tkazildi" },
        { value: 'YAKUNLANDI', label: 'Yakunlandi' },
      ],
    },
    { name: 'summary', label: 'Xulosa', type: 'textarea', fullWidth: true },
  ],
};

const FINDING_SEVERITY_LABELS = { KATTA: 'Katta', KICHIK: 'Kichik', KUZATUV: 'Kuzatuv' };
const FINDING_SEVERITY_STYLES = {
  KATTA: 'bg-red-50 text-red-700 border-red-200',
  KICHIK: 'bg-amber-50 text-amber-700 border-amber-200',
  KUZATUV: 'bg-blue-50 text-blue-700 border-blue-200',
};

export const auditFindingConfig = {
  path: 'smk/audit-findings',
  title: 'Audit topilmalari',
  columns: [
    { key: 'audit', label: 'Audit', render: (i) => (i.audit ? String(i.audit.plannedDate).slice(0, 10) : '—') },
    { key: 'description', label: 'Tavsif' },
    { key: 'severity', label: "Jiddiylik darajasi", render: (i) => statusBadge(i.severity, FINDING_SEVERITY_STYLES, FINDING_SEVERITY_LABELS) },
    { key: 'linkedNonConformance', label: 'Bog\'liq CAPA', render: (i) => i.linkedNonConformance?.code || '—' },
  ],
  fields: [
    {
      name: 'auditId',
      label: 'Audit',
      type: 'async-select',
      required: true,
      optionsResource: 'smk/audits',
      optionsLabel: (item) => `Audit — ${String(item.plannedDate).slice(0, 10)}`,
    },
    { name: 'description', label: 'Tavsif', type: 'textarea', fullWidth: true, required: true },
    {
      name: 'severity',
      label: 'Jiddiylik darajasi',
      type: 'select',
      required: true,
      options: [
        { value: 'KATTA', label: 'Katta' },
        { value: 'KICHIK', label: 'Kichik' },
        { value: 'KUZATUV', label: 'Kuzatuv' },
      ],
    },
    {
      name: 'linkedNonConformanceId',
      label: "Bog'liq nomuvofiqlik (ixtiyoriy)",
      type: 'async-select',
      optionsResource: 'smk/nonconformances',
      optionsLabel: (item) => `${item.code} — ${item.description?.slice(0, 40) || ''}`,
    },
  ],
};

// ===== SMK — FAZA 4: Texnik yadro =====

export const calibrationRecordConfig = {
  path: 'smk/calibration',
  title: 'Uskunalar kalibrlash reestri',
  columns: [
    { key: 'equipment', label: 'Uskuna', render: (i) => i.equipment?.name || '—' },
    { key: 'calibrationDate', label: 'Kalibrlangan sana', render: (i) => String(i.calibrationDate).slice(0, 10) },
    { key: 'nextDueDate', label: 'Keyingi muddat', render: (i) => String(i.nextDueDate).slice(0, 10) },
    {
      key: 'status',
      label: 'Holati',
      render: (i) =>
        new Date(i.nextDueDate) < new Date()
          ? statusBadge('MUDDATI_OTGAN', { MUDDATI_OTGAN: 'bg-red-50 text-red-700 border-red-200' }, { MUDDATI_OTGAN: 'Muddati o\'tgan' })
          : statusBadge('AMALDA', { AMALDA: 'bg-emerald-50 text-emerald-700 border-emerald-200' }, { AMALDA: 'Amalda' }),
    },
  ],
  fields: [
    {
      name: 'equipmentId',
      label: 'Uskuna',
      type: 'async-select',
      required: true,
      optionsResource: 'equipment',
      optionsLabel: (item) => item.name,
    },
    { name: 'calibrationDate', label: 'Kalibrlangan sana', type: 'date', required: true },
    { name: 'nextDueDate', label: 'Keyingi kalibrlash muddati', type: 'date', required: true },
    { name: 'certificateUrl', label: 'Sertifikat', type: 'file' },
    { name: 'performedBy', label: 'Kim bajardi' },
  ],
};

export const trainingRecordConfig = {
  path: 'smk/training',
  title: "Xodimlar malakasi / treninglar",
  columns: [
    { key: 'user', label: 'Xodim', render: (i) => i.user?.fullName || '—' },
    { key: 'trainingTitle', label: 'Trening nomi' },
    { key: 'trainingDate', label: 'Sana', render: (i) => String(i.trainingDate).slice(0, 10) },
    { key: 'expiryDate', label: 'Amal qilish muddati', render: (i) => (i.expiryDate ? String(i.expiryDate).slice(0, 10) : '—') },
  ],
  fields: [
    {
      name: 'userId',
      label: 'Xodim',
      type: 'async-select',
      required: true,
      optionsResource: 'users',
      optionsLabel: (item) => item.fullName,
    },
    { name: 'trainingTitle', label: 'Trening nomi', required: true, fullWidth: true },
    { name: 'trainingDate', label: 'Sana', type: 'date', required: true },
    { name: 'provider', label: "Ta'minlovchi tashkilot" },
    { name: 'certificateUrl', label: 'Sertifikat', type: 'file' },
    { name: 'expiryDate', label: 'Amal qilish muddati', type: 'date' },
  ],
};

export const qualityControlRecordConfig = {
  path: 'smk/qc',
  title: 'Ichki sifat nazorati (QC)',
  columns: [
    { key: 'laboratory', label: 'Laboratoriya', render: (i) => i.laboratory?.nameUz || '—' },
    { key: 'testType', label: 'Sinov turi' },
    { key: 'controlDate', label: 'Sana', render: (i) => String(i.controlDate).slice(0, 10) },
    { key: 'withinLimits', label: 'Me\'yor ichida', render: (i) => (i.withinLimits ? 'Ha' : "Yo'q") },
  ],
  fields: [
    {
      name: 'laboratoryId',
      label: 'Laboratoriya',
      type: 'async-select',
      optionsResource: 'laboratories',
      optionsLabel: (item) => item.nameUz,
    },
    { name: 'testType', label: 'Sinov turi', required: true },
    { name: 'controlDate', label: 'Sana', type: 'date', required: true },
    { name: 'expectedValue', label: 'Kutilgan qiymat' },
    { name: 'actualValue', label: 'Haqiqiy qiymat' },
    { name: 'deviation', label: 'Chetlanish' },
    { name: 'withinLimits', label: "Me'yor ichida", type: 'checkbox' },
    { name: 'notes', label: 'Izoh', type: 'textarea', fullWidth: true },
  ],
};

const PT_RESULT_LABELS = { QONIQARLI: 'Qoniqarli', QONIQARSIZ: 'Qoniqarsiz', OGOHLANTIRISH: 'Ogohlantirish' };
const PT_RESULT_STYLES = {
  QONIQARLI: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  QONIQARSIZ: 'bg-red-50 text-red-700 border-red-200',
  OGOHLANTIRISH: 'bg-amber-50 text-amber-700 border-amber-200',
};

export const proficiencyTestConfig = {
  path: 'smk/proficiency-tests',
  title: 'Malakaviy sinovlar (PT)',
  columns: [
    { key: 'testProgram', label: 'Dastur' },
    { key: 'providerName', label: "Ta'minlovchi" },
    { key: 'testDate', label: 'Sana', render: (i) => String(i.testDate).slice(0, 10) },
    { key: 'resultStatus', label: 'Natija', render: (i) => statusBadge(i.resultStatus, PT_RESULT_STYLES, PT_RESULT_LABELS) },
  ],
  fields: [
    {
      name: 'laboratoryId',
      label: 'Laboratoriya',
      type: 'async-select',
      optionsResource: 'laboratories',
      optionsLabel: (item) => item.nameUz,
    },
    { name: 'testProgram', label: 'Dastur nomi', required: true },
    { name: 'providerName', label: "Ta'minlovchi tashkilot", required: true },
    { name: 'testDate', label: 'Sana', type: 'date', required: true },
    {
      name: 'resultStatus',
      label: 'Natija',
      type: 'select',
      required: true,
      options: [
        { value: 'QONIQARLI', label: 'Qoniqarli' },
        { value: 'QONIQARSIZ', label: 'Qoniqarsiz' },
        { value: 'OGOHLANTIRISH', label: 'Ogohlantirish' },
      ],
    },
    { name: 'reportUrl', label: 'Hisobot', type: 'file' },
  ],
};

export const measurementUncertaintyConfig = {
  path: 'smk/uncertainty',
  title: "O'lchov noaniqligi",
  columns: [
    { key: 'service', label: 'Xizmat / usul', render: (i) => i.service?.nameUz || i.testMethodName || '—' },
    { key: 'uncertaintyValue', label: 'Qiymat' },
    { key: 'unit', label: 'Birlik' },
  ],
  fields: [
    {
      name: 'serviceId',
      label: 'Xizmat (ixtiyoriy)',
      type: 'async-select',
      optionsResource: 'services',
      optionsLabel: (item) => item.nameUz,
    },
    { name: 'testMethodName', label: 'Sinov usuli nomi (xizmat tanlanmasa)' },
    { name: 'uncertaintyValue', label: 'Noaniqlik qiymati', required: true },
    { name: 'unit', label: 'Birlik' },
    { name: 'calculationMethod', label: 'Hisoblash usuli', type: 'textarea', fullWidth: true },
    { name: 'documentUrl', label: 'Hujjat', type: 'file' },
  ],
};

const METHOD_STATUS_LABELS = { TASDIQLANGAN: 'Tasdiqlangan', JARAYONDA: 'Jarayonda' };
const METHOD_STATUS_STYLES = {
  TASDIQLANGAN: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  JARAYONDA: 'bg-amber-50 text-amber-700 border-amber-200',
};

export const methodValidationConfig = {
  path: 'smk/methods',
  title: 'Metodikani tasdiqlash',
  columns: [
    { key: 'methodName', label: 'Metod nomi' },
    { key: 'standardReference', label: 'Standart' },
    { key: 'validationDate', label: 'Sana', render: (i) => String(i.validationDate).slice(0, 10) },
    { key: 'status', label: 'Holati', render: (i) => statusBadge(i.status, METHOD_STATUS_STYLES, METHOD_STATUS_LABELS) },
  ],
  fields: [
    { name: 'methodName', label: 'Metod nomi', required: true, fullWidth: true },
    { name: 'standardReference', label: 'Standart havolasi' },
    { name: 'validationDate', label: 'Sana', type: 'date', required: true },
    { name: 'validatedBy', label: 'Kim tasdiqladi' },
    { name: 'reportUrl', label: 'Hisobot', type: 'file' },
    {
      name: 'status',
      label: 'Holati',
      type: 'select',
      default: 'JARAYONDA',
      options: [
        { value: 'TASDIQLANGAN', label: 'Tasdiqlangan' },
        { value: 'JARAYONDA', label: 'Jarayonda' },
      ],
    },
  ],
};

// ===== SMK — FAZA 5: Tashkiliy =====

export const impartialityDeclarationConfig = {
  path: 'smk/impartiality',
  title: 'Xolislik/maxfiylik deklaratsiyalari',
  columns: [
    { key: 'user', label: 'Xodim', render: (i) => i.user?.fullName || '—' },
    { key: 'declarationYear', label: 'Yil' },
    { key: 'signedDate', label: 'Imzolangan sana', render: (i) => String(i.signedDate).slice(0, 10) },
  ],
  fields: [
    {
      name: 'userId',
      label: 'Xodim',
      type: 'async-select',
      required: true,
      optionsResource: 'users',
      optionsLabel: (item) => item.fullName,
    },
    { name: 'declarationYear', label: 'Yil', type: 'number', required: true },
    { name: 'signedDate', label: 'Imzolangan sana', type: 'date', required: true },
    { name: 'fileUrl', label: 'Fayl', type: 'file' },
  ],
};

export const supplierEvaluationConfig = {
  path: 'smk/suppliers',
  title: "Ta'minotchilarni baholash",
  columns: [
    { key: 'supplierName', label: "Ta'minotchi" },
    { key: 'category', label: 'Kategoriya' },
    { key: 'score', label: 'Baho (1-5)' },
    { key: 'evaluationDate', label: 'Sana', render: (i) => String(i.evaluationDate).slice(0, 10) },
  ],
  fields: [
    { name: 'supplierName', label: "Ta'minotchi nomi", required: true },
    { name: 'category', label: 'Kategoriya' },
    { name: 'evaluationDate', label: 'Baholash sanasi', type: 'date', required: true },
    { name: 'score', label: 'Baho (1-5)', type: 'number', required: true },
    { name: 'notes', label: 'Izoh', type: 'textarea', fullWidth: true },
    { name: 'nextEvaluationDate', label: 'Keyingi baholash sanasi', type: 'date' },
  ],
};

export const subcontractorConfig = {
  path: 'smk/subcontractors',
  title: 'Subpudratchilar reestri',
  columns: [
    { key: 'name', label: 'Nomi' },
    { key: 'servicesProvided', label: 'Xizmatlar' },
    { key: 'validUntil', label: 'Amal qilish muddati', render: (i) => (i.validUntil ? String(i.validUntil).slice(0, 10) : '—') },
  ],
  fields: [
    { name: 'name', label: 'Nomi', required: true, fullWidth: true },
    { name: 'accreditationInfo', label: 'Akkreditatsiya ma\'lumoti', type: 'textarea', fullWidth: true },
    { name: 'servicesProvided', label: "Ko'rsatiladigan xizmatlar", type: 'textarea', fullWidth: true },
    { name: 'contractUrl', label: 'Shartnoma', type: 'file' },
    { name: 'validUntil', label: 'Amal qilish muddati', type: 'date' },
  ],
};

export const environmentLogConfig = {
  path: 'smk/environment',
  title: 'Muhit sharoitlari monitoring',
  columns: [
    { key: 'laboratory', label: 'Laboratoriya', render: (i) => i.laboratory?.nameUz || '—' },
    { key: 'recordedAt', label: 'Sana', render: (i) => String(i.recordedAt).slice(0, 10) },
    { key: 'temperature', label: 'Harorat (°C)', render: (i) => i.temperature ?? '—' },
    { key: 'humidity', label: 'Namlik (%)', render: (i) => i.humidity ?? '—' },
    { key: 'withinLimits', label: "Me'yorda", render: (i) => (i.withinLimits ? 'Ha' : "Yo'q") },
  ],
  fields: [
    {
      name: 'laboratoryId',
      label: 'Laboratoriya',
      type: 'async-select',
      optionsResource: 'laboratories',
      optionsLabel: (item) => item.nameUz,
    },
    { name: 'recordedAt', label: 'Qayd etilgan sana', type: 'date', required: true },
    { name: 'temperature', label: 'Harorat (°C)', type: 'number' },
    { name: 'humidity', label: 'Namlik (%)', type: 'number' },
    { name: 'withinLimits', label: "Me'yorda", type: 'checkbox' },
  ],
};

export const documentAcknowledgmentConfig = {
  path: 'smk/acknowledgments',
  title: 'Hujjat bilan tanishtirish kuzatuvi',
  columns: [
    {
      key: 'documentVersion',
      label: 'Hujjat versiyasi',
      render: (i) => (i.documentVersion ? `${i.documentVersion.document?.code || ''} (${i.documentVersion.versionNumber})` : '—'),
    },
    { key: 'user', label: 'Xodim', render: (i) => i.user?.fullName || '—' },
    { key: 'acknowledgedAt', label: 'Tanishgan sana', render: (i) => String(i.acknowledgedAt).slice(0, 10) },
  ],
  fields: [
    {
      name: 'documentVersionId',
      label: 'Hujjat versiyasi',
      type: 'async-select',
      required: true,
      optionsResource: 'smk/document-versions',
      optionsLabel: (item) => `${item.document?.code || ''} — v${item.versionNumber}`,
    },
    {
      name: 'userId',
      label: 'Xodim',
      type: 'async-select',
      required: true,
      optionsResource: 'users',
      optionsLabel: (item) => item.fullName,
    },
  ],
};

// ===== SMK — FAZA 6: Strategik =====

export const managementReviewConfig = {
  path: 'smk/reviews',
  title: 'Boshqaruv sharhi',
  columns: [
    { key: 'reviewDate', label: 'Sana', render: (i) => String(i.reviewDate).slice(0, 10) },
    { key: 'nextReviewDate', label: 'Keyingi sharh', render: (i) => (i.nextReviewDate ? String(i.nextReviewDate).slice(0, 10) : '—') },
  ],
  fields: [
    { name: 'reviewDate', label: 'Sana', type: 'date', required: true },
    { name: 'participants', label: 'Ishtirokchilar', type: 'textarea', fullWidth: true },
    { name: 'agendaItems', label: "Kun tartibi", type: 'textarea', fullWidth: true },
    { name: 'decisions', label: 'Qarorlar', type: 'textarea', fullWidth: true },
    { name: 'nextReviewDate', label: 'Keyingi sharh sanasi', type: 'date' },
  ],
};

const RISK_STATUS_LABELS = { FAOL: 'Faol', NAZORAT_OSTIDA: 'Nazorat ostida', YOPILDI: 'Yopildi' };
const RISK_STATUS_STYLES = {
  FAOL: 'bg-red-50 text-red-700 border-red-200',
  NAZORAT_OSTIDA: 'bg-amber-50 text-amber-700 border-amber-200',
  YOPILDI: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export const riskItemConfig = {
  path: 'smk/risks',
  title: 'Risklar reestri',
  columns: [
    { key: 'description', label: 'Tavsif' },
    { key: 'category', label: 'Kategoriya' },
    { key: 'riskScore', label: 'Risk bahosi', render: (i) => `${i.likelihood} × ${i.impact} = ${i.riskScore}` },
    { key: 'status', label: 'Holati', render: (i) => statusBadge(i.status, RISK_STATUS_STYLES, RISK_STATUS_LABELS) },
  ],
  fields: [
    { name: 'description', label: 'Tavsif', type: 'textarea', fullWidth: true, required: true },
    { name: 'category', label: 'Kategoriya' },
    { name: 'likelihood', label: 'Ehtimollik (1-5)', type: 'number', required: true },
    { name: 'impact', label: "Ta'sir darajasi (1-5)", type: 'number', required: true },
    { name: 'mitigationPlan', label: 'Kamaytirish rejasi', type: 'textarea', fullWidth: true },
    {
      name: 'ownerUserId',
      label: "Mas'ul",
      type: 'async-select',
      optionsResource: 'users',
      optionsLabel: (item) => item.fullName,
    },
    {
      name: 'status',
      label: 'Holati',
      type: 'select',
      default: 'FAOL',
      options: [
        { value: 'FAOL', label: 'Faol' },
        { value: 'NAZORAT_OSTIDA', label: 'Nazorat ostida' },
        { value: 'YOPILDI', label: 'Yopildi' },
      ],
    },
  ],
};

const OBJECTIVE_STATUS_LABELS = { BAJARILMOQDA: 'Bajarilmoqda', BAJARILDI: 'Bajarildi', BAJARILMADI: 'Bajarilmadi' };
const OBJECTIVE_STATUS_STYLES = {
  BAJARILMOQDA: 'bg-amber-50 text-amber-700 border-amber-200',
  BAJARILDI: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  BAJARILMADI: 'bg-red-50 text-red-700 border-red-200',
};

export const qualityObjectiveConfig = {
  path: 'smk/objectives',
  title: 'Sifat maqsadlari (KPI)',
  columns: [
    { key: 'year', label: 'Yil' },
    { key: 'objectiveText', label: 'Maqsad' },
    { key: 'targetValue', label: 'Reja', render: (i) => i.targetValue || '—' },
    { key: 'actualValue', label: 'Bajarildi', render: (i) => i.actualValue || '—' },
    { key: 'status', label: 'Holati', render: (i) => statusBadge(i.status, OBJECTIVE_STATUS_STYLES, OBJECTIVE_STATUS_LABELS) },
  ],
  fields: [
    { name: 'year', label: 'Yil', type: 'number', required: true },
    { name: 'objectiveText', label: 'Maqsad matni', type: 'textarea', fullWidth: true, required: true },
    { name: 'targetValue', label: 'Reja qiymati' },
    { name: 'actualValue', label: 'Haqiqiy qiymat' },
    {
      name: 'status',
      label: 'Holati',
      type: 'select',
      default: 'BAJARILMOQDA',
      options: [
        { value: 'BAJARILMOQDA', label: 'Bajarilmoqda' },
        { value: 'BAJARILDI', label: 'Bajarildi' },
        { value: 'BAJARILMADI', label: 'Bajarilmadi' },
      ],
    },
  ],
};

const IMPROVEMENT_STATUS_LABELS = {
  KORIB_CHIQILMOQDA: "Ko'rib chiqilmoqda",
  QABUL_QILINDI: 'Qabul qilindi',
  RAD_ETILDI: 'Rad etildi',
};
const IMPROVEMENT_STATUS_STYLES = {
  KORIB_CHIQILMOQDA: 'bg-amber-50 text-amber-700 border-amber-200',
  QABUL_QILINDI: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  RAD_ETILDI: 'bg-red-50 text-red-700 border-red-200',
};

export const improvementSuggestionConfig = {
  path: 'smk/improvements',
  title: 'Yaxshilash takliflari',
  columns: [
    { key: 'submittedByUser', label: 'Taklif bergan', render: (i) => i.submittedByUser?.fullName || '—' },
    { key: 'description', label: 'Tavsif' },
    { key: 'submittedDate', label: 'Sana', render: (i) => String(i.submittedDate).slice(0, 10) },
    { key: 'status', label: 'Holati', render: (i) => statusBadge(i.status, IMPROVEMENT_STATUS_STYLES, IMPROVEMENT_STATUS_LABELS) },
  ],
  fields: [
    {
      name: 'submittedByUserId',
      label: 'Taklif bergan xodim',
      type: 'async-select',
      optionsResource: 'users',
      optionsLabel: (item) => item.fullName,
    },
    { name: 'description', label: 'Tavsif', type: 'textarea', fullWidth: true, required: true },
    { name: 'submittedDate', label: 'Taqdim etilgan sana', type: 'date', required: true },
    {
      name: 'status',
      label: 'Holati',
      type: 'select',
      default: 'KORIB_CHIQILMOQDA',
      options: [
        { value: 'KORIB_CHIQILMOQDA', label: "Ko'rib chiqilmoqda" },
        { value: 'QABUL_QILINDI', label: 'Qabul qilindi' },
        { value: 'RAD_ETILDI', label: 'Rad etildi' },
      ],
    },
    { name: 'implementationNotes', label: "Amalga oshirish izohlari", type: 'textarea', fullWidth: true },
  ],
};

export const retentionPolicyConfig = {
  path: 'smk/retention',
  title: 'Arxiv/saqlash siyosati',
  columns: [
    { key: 'documentType', label: 'Hujjat turi' },
    { key: 'retentionYears', label: 'Saqlash muddati (yil)' },
  ],
  fields: [
    { name: 'documentType', label: 'Hujjat turi', required: true, fullWidth: true },
    { name: 'retentionYears', label: 'Saqlash muddati (yil)', type: 'number', required: true },
    { name: 'notes', label: 'Izoh', type: 'textarea', fullWidth: true },
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