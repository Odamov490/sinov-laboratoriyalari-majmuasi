-- Sinovlar jurnali spravochniklarining boshlang'ich qiymatlari (Excel
-- jurnalidagi varaqlar va joylar). Mavjud bo'lsa o'zgartirilmaydi.

INSERT INTO "TestProductType" ("id", "code", "nameUz", "isActive", "createdAt", "updatedAt") VALUES
  (gen_random_uuid()::text, 'KONDITSIONER', 'Konditsioner', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'MUZLATKICH', 'Muzlatkich', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'KIR_YUVISH_MASHINASI', 'Kir yuvish mashinasi', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'BOYLER', 'Boyler', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "TestLocation" ("id", "code", "nameUz", "isActive", "createdAt", "updatedAt") VALUES
  (gen_random_uuid()::text, 'PSKENT', 'Pskent', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'TEXNOPARK', 'Texnopark', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'VALYUTNIY', 'Valyutniy', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;
