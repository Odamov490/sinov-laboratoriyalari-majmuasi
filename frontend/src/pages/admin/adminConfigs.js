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