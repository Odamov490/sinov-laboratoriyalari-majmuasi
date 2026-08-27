# Sinov Laboratoriyalari Majmuasi

O'zbekiston Standartlar Instituti tarkibidagi **Sinov Laboratoriyalari Majmuasi** uchun to'liq professional, production-ready korporativ web-platforma.

Frontend + Backend + PostgreSQL + REST API + Authentication + Admin Panel + File Upload + Online Application + Application Tracking + Multilingual (UZ/RU/EN) + SEO + Responsive Design.

---

## 1. Loyiha haqida

Platforma quyidagi asosiy flow'ni ta'minlaydi:

```
Laboratoriya → Xizmat → Narx → Ariza → Ariza holatini kuzatish
```

8 ta ixtisoslashgan sinov laboratoriyasi, onlayn ariza tizimi, narxlar tarixi, akkreditatsiya ma'lumotlari, standartlar bazasi va rolga asoslangan (RBAC) admin panel orqali to'liq boshqariladigan tarkib.

**Muhim:** loyiha hech qanday soxta narx, telefon, manzil, akkreditatsiya yoki statistikani real ma'lumot sifatida ko'rsatmaydi. Real ma'lumot mavjud bo'lmagan joylarda **"Ma'lumot yangilanmoqda"** ko'rsatiladi. Barcha real kontent Admin Panel orqali kiritiladi.

---

## 2. Arxitektura

Monorepo tuzilishi:

```
sinov-laboratoriyalari-majmuasi/
├── frontend/     # React + Vite + Tailwind CSS
├── backend/      # Node.js + Express + Prisma + PostgreSQL
├── docker-compose.yml
└── README.md
```

### Texnologik stack

| Qatlam | Texnologiya |
|---|---|
| Frontend | React 18, Vite, React Router, Tailwind CSS, React Hook Form, Axios, i18next, Lucide Icons |
| Backend | Node.js, Express.js, REST API |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT (httpOnly cookies) + argon2 password hashing + RBAC |
| File storage | Local disk (abstraction ready for S3-compatible storage) |

---

## 3. Talablar (Requirements)

- Node.js ≥ 20
- PostgreSQL ≥ 14 (yoki Docker)
- npm ≥ 10
- (Ixtiyoriy) Docker va Docker Compose

---

## 4. O'rnatish (Installation)

### 4.1. Repozitoriyni oching

```bash
cd sinov-laboratoriyalari-majmuasi
```

### 4.2. Backend sozlash

```bash
cd backend
cp .env.example .env
# .env faylida DATABASE_URL, JWT_SECRET va boshqa qiymatlarni to'ldiring
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev
```

Backend `http://localhost:4000` portida ishga tushadi.

### 4.3. Frontend sozlash

```bash
cd frontend
npm install
npm run dev
```

Frontend `http://localhost:5173` portida ishga tushadi (Vite dev server `/api` so'rovlarini backendga proxy qiladi).

---

## 5. Database va Prisma

Schema: `backend/prisma/schema.prisma`

```bash
# Migration yaratish/qo'llash
npx prisma migrate dev --name <migration_nomi>

# Production'da migratsiyalarni qo'llash
npx prisma migrate deploy

# Prisma Studio (ma'lumotlar bazasini vizual ko'rish)
npx prisma studio

# Demo ma'lumotlarni yuklash
npm run seed
```

`prisma/seed.js` faqat **minimal demo data** yaratadi: 1 ta admin foydalanuvchi va 8 ta laboratoriya nomi/tuzilmasi. Xizmatlar, narxlar, xodimlar, uskunalar, akkreditatsiya va boshqa real kontent **admin panel orqali** kiritilishi kerak.

---

## 6. Environment o'zgaruvchilari

`backend/.env.example`:

```
DATABASE_URL="postgresql://slm_user:slm_password@localhost:5432/slm_db?schema=public"
JWT_SECRET="replace-with-a-long-random-secret"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN="7d"
PORT=4000
NODE_ENV=development
CLIENT_URL="http://localhost:5173"
UPLOAD_DIR="uploads"
MAX_FILE_SIZE_MB=10
```

**Hech qachon** `.env` faylini source control'ga qo'shmang. Faqat `.env.example` saqlanadi.

---

## 7. Development

Ikkala serverni parallel ishga tushiring (2 ta terminal):

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

---

## 8. Production build

### Backend

```bash
cd backend
npm install --omit=dev
npx prisma generate
npx prisma migrate deploy
npm start
```

### Frontend

```bash
cd frontend
npm install
npm run build   # dist/ papkasini generate qiladi
npm run preview # production build'ni lokal tekshirish
```

`dist/` papkasini istalgan static hosting (Nginx, Vercel, Netlify va h.k.) orqali serve qiling.

---

## 9. Docker orqali ishga tushirish

```bash
docker compose up --build
```

Bu quyidagilarni ishga tushiradi:

- `postgres` — PostgreSQL 16 (port 5432)
- `backend` — Express API (port 4000), migratsiyalarni avtomatik qo'llaydi
- `frontend` — Nginx orqali serve qilinadigan production build (port 5173)

Birinchi marta ishga tushirgandan so'ng demo ma'lumotlarni yuklash uchun:

```bash
docker compose exec backend npm run seed
```

---

## 10. Admin panelga kirish

```
URL:      http://localhost:5173/admin/login
Email:    admin@slm.uz
Password: Admin@12345
```

**MUHIM: Bu faqat development/demo uchun standart hisob. Production muhitida ushbu parolni darhol almashtiring** (Admin panel → Foydalanuvchilar, yoki to'g'ridan-to'g'ri database orqali).

### Rol tizimi (RBAC)

| Rol | Ruxsatlar |
|---|---|
| Super Admin | Barcha modullar, shu jumladan foydalanuvchilar va sozlamalar |
| Manager | Arizalar, Xizmatlar, Narxlar, Laboratoriyalar, Standartlar, Xodimlar, Uskunalar, Akkreditatsiya |
| Editor | Yangiliklar, Hujjatlar, Galereya, FAQ |

---

## 11. API umumiy ko'rinishi

Barcha endpointlar `/api` prefiksi bilan boshlanadi.

### Public (ochiq)

```
GET  /api/laboratories
GET  /api/laboratories/:slug
GET  /api/services
GET  /api/services/:slug
GET  /api/prices
GET  /api/standards
GET  /api/news
GET  /api/news/:slug
GET  /api/documents
GET  /api/staff
GET  /api/equipment
GET  /api/equipment/:slug
GET  /api/gallery
GET  /api/faq
GET  /api/accreditation
GET  /api/settings
GET  /api/search?q=...

POST /api/applications                       (multipart/form-data, fayl yuklash bilan)
GET  /api/applications/track/:applicationNumber

POST /api/contact
```

### Autentifikatsiya

```
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
GET  /api/auth/me
```

### Admin (autentifikatsiya + RBAC talab qiladi)

Har bir kontent turi uchun standart CRUD:

```
GET    /api/admin/<resource>
GET    /api/admin/<resource>/:id
POST   /api/admin/<resource>
PUT    /api/admin/<resource>/:id
DELETE /api/admin/<resource>/:id
```

`<resource>`: `laboratories`, `services`, `service-categories`, `prices`, `standards`, `news`, `news-categories`, `documents`, `document-categories`, `staff`, `equipment`, `gallery`, `gallery-categories`, `faq`, `accreditation`, `contact-messages`.

Qo'shimcha:

```
GET   /api/admin/applications
GET   /api/admin/applications/:id
PATCH /api/admin/applications/:id/status

POST  /api/admin/uploads          (fayl yuklash)

GET   /api/admin/users
POST  /api/admin/users
PUT   /api/admin/users/:id
DELETE /api/admin/users/:id

PUT   /api/admin/settings
```

---

## 12. Fayl yuklash (File Upload)

Ruxsat etilgan formatlar: **PDF, JPG, JPEG, PNG, WEBP**.

Xavfsizlik choralari:

- Fayl kengaytmasi va MIME turi tekshiriladi
- Fayl signature (magic bytes) tekshiriladi — kengaytma bilan haqiqiy fayl turi mos kelishi shart
- Fayl hajmi `MAX_FILE_SIZE_MB` orqali cheklanadi (standart: 10MB)
- Fayl nomlari UUID asosida generatsiya qilinadi (path traversal va nom to'qnashuvlarining oldini olish uchun)
- Executable fayllar avtomatik ravishda rad etiladi

---

## 13. Ariza raqamlash tizimi

Har bir ariza avtomatik ravishda unique raqam oladi:

```
SLM-2026-00001
```

Raqamlash yil bo'yicha, collision-safe retry logikasi bilan generatsiya qilinadi (`backend/src/utils/applicationNumber.js`).

---

## 14. Narxlar tarixi

Narx yangilanganda eski qiymat **hech qachon o'chirilmaydi** — u avtomatik ravishda `PriceHistory` jadvaliga saqlanadi. Bu narxlar bo'yicha to'liq audit tarixini ta'minlaydi.

---

## 15. Multilingual (UZ / RU / EN)

- UI matnlari: `frontend/src/i18n/locales/{uz,ru,en}.json`
- Database kontenti: har bir tarjima qilinadigan model uchun `nameUz`/`nameRu`/`nameEn` (yoki `titleUz`/... , `questionUz`/... va h.k.) ustunlari
- Yangi til qo'shish uchun: yangi `locales/<til>.json` fayl yarating va tegishli DB ustunlarini (masalan `nameFr`) schema'ga qo'shing

---

## 16. Troubleshooting

| Muammo | Yechim |
|---|---|
| `Prisma Client` xatosi | `npx prisma generate` ishga tushiring |
| Migration xatosi | `DATABASE_URL` to'g'riligini va PostgreSQL ishlab turganini tekshiring |
| CORS xatosi | Backend `.env` dagi `CLIENT_URL` frontend manzili bilan mos kelishini tekshiring |
| Fayl yuklanmayapti | `UPLOAD_DIR` papkasi mavjudligini va yozish huquqini tekshiring |
| Admin login ishlamayapti | `npm run seed` orqali standart admin yaratilganini tekshiring |
| Portlar band | `.env` yoki `docker-compose.yml` da portlarni o'zgartiring |

---

## 17. Xavfsizlik eslatmalari

- Parollar argon2 bilan hash qilinadi, hech qachon plain text saqlanmaydi
- JWT access token qisqa muddatli (15 daqiqa), refresh token httpOnly cookie orqali
- Barcha admin endpointlar autentifikatsiya + RBAC middleware bilan himoyalangan
- Rate limiting: umumiy so'rovlar, login urinishlari va ariza yuborish uchun alohida limitlar
- Helmet, CORS, Zod validatsiya va Prisma orqali SQL injection himoyasi qo'llanilgan

**Production'ga chiqarishdan oldin:**
1. `JWT_SECRET` ni uzun, tasodifiy qiymat bilan almashtiring
2. Standart admin parolini (`Admin@12345`) darhol o'zgartiring
3. `NODE_ENV=production` o'rnating
4. HTTPS orqali serve qiling (cookie'lar `secure` bo'ladi)

---

## 18. Litsenziya

Ushbu loyiha O'zbekiston Standartlar Instituti — Sinov Laboratoriyalari Majmuasi uchun ishlab chiqilgan.
