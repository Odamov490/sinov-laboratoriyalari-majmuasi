// Central configuration for each admin CRUD resource: columns for the
// table view and fields for the create/edit form. Consumed by AdminCrudPage.
//
// Relation fields (laboratory, service, category, standard) use type
// 'async-select': a dropdown populated from another admin resource, so the
// user picks a name instead of typing a raw UUID by hand.

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

export const galleryConfig = {
  path: 'gallery',
  title: 'Galereya',
  columns: [{ key: 'title', label: 'Nomi' }],
  searchable: false,
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
    { name: 'issuedAt', label: 'Berilgan sana', type: 'date' },
    { name: 'validUntil', label: 'Amal qilish muddati', type: 'date' },
  ],
};