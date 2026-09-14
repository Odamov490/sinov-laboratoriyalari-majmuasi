-- Admin-editable public info pages (reusable model, keyed by slug, for
-- one-off explainer content like the declaration-vs-certificate page).
CREATE TABLE "InfoPage" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titleUz" TEXT NOT NULL,
    "titleRu" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "contentUz" TEXT NOT NULL,
    "contentRu" TEXT NOT NULL,
    "contentEn" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InfoPage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InfoPage_slug_key" ON "InfoPage"("slug");

-- Seed: "Deklaratsiya va sertifikat: farqi nimada?" explainer page.
INSERT INTO "InfoPage" ("id", "slug", "titleUz", "titleRu", "titleEn", "contentUz", "contentRu", "contentEn", "updatedAt")
VALUES (
  'a1e8b5c4-6f2d-4a3b-9c7e-1d5f8a2b3c4d',
  'deklaratsiya-va-sertifikat',
  'Deklaratsiya va sertifikat: farqi nimada?',
  'Декларация и сертификат: в чём разница?',
  'Declaration vs. Certificate: What''s the Difference?',
  '1. Muvofiqlik deklaratsiyasi nima? Muvofiqlik deklaratsiyasi — ishlab chiqaruvchi yoki sotuvchining mahsuloti belgilangan talablarga (standartlarga, texnik reglamentlarga) mos kelishini o''z nomidan, o''z javobgarligi ostida tasdiqlaydigan hujjat. Deklaratsiya akkreditatsiyadan o''tgan sinov laboratoriyasining sinov natijalari (protokoli) asosida rasmiylashtiriladi.
2. Muvofiqlik sertifikati nima? Muvofiqlik sertifikati — mahsulotning talablarga mosligini mustaqil, akkreditatsiyadan o''tgan uchinchi tomon, ya''ni sertifikatlashtirish organi tomonidan tasdiqlangan rasmiy hujjat. Sertifikatlashtirish organi mahsulotni sinovdan o''tkazadi va shundan so''nggina sertifikat beradi.
3. Ular orasidagi asosiy farq. Eng muhim farq — kim tasdiqlaydi va javobgarlikni kim oladi. Deklaratsiyada javobgarlik to''liq ishlab chiqaruvchi yoki sotuvchining zimmasida bo''ladi. Sertifikatda esa mustaqil, akkreditatsiyadan o''tgan tashkilot tekshirib, o''z nomidan tasdiqlaydi.
4. Qaysi mahsulotlar uchun qaysi biri talab qilinadi? Bu O''zbekiston Respublikasi Vazirlar Mahkamasining 2024-yil 14-avgustdagi 502-son va 2021-yil 30-yanvardagi 43-son qarorlari bilan tasdiqlangan ro''yxatlarga asosan belgilanadi. Ushbu qarorlarda mahsulotning TN VED kodi bo''yicha aynan qaysi tartibga solish shakli — deklaratsiya yoki sertifikat — qo''llanilishi ko''rsatilgan.
5. Jarayon qanday ishlaydi? Avval mahsulotingizning TN VED kodi aniqlanadi — buni saytimizdagi "TN VED tekshirish" bo''limi orqali mustaqil yoki mutaxassislarimiz yordamida amalga oshirishingiz mumkin. Kod bo''yicha talab aniqlangach, tegishli sinovlar o''tkaziladi va mos hujjat (deklaratsiya yoki sertifikat) rasmiylashtiriladi.
6. Ariza qanday beriladi? Mahsulotingiz uchun qaysi hujjat kerakligiga aniqlik kiritish yoki sinovdan o''tkazish uchun quyidagi tugma orqali ariza yuboring — mutaxassislarimiz tez orada siz bilan bog''lanadi.',
  '1. Что такое декларация соответствия? Декларация соответствия — это документ, которым сам изготовитель или продавец, от своего имени и под свою ответственность, подтверждает соответствие продукции установленным требованиям (стандартам, техническим регламентам). Декларация оформляется на основании результатов испытаний (протокола) аккредитованной испытательной лаборатории.
2. Что такое сертификат соответствия? Сертификат соответствия — это официальный документ, которым независимая аккредитованная третья сторона — орган по сертификации — подтверждает соответствие продукции установленным требованиям. Орган по сертификации проводит испытания продукции и только после этого выдаёт сертификат.
3. В чём основное различие? Главное отличие — кто подтверждает соответствие и кто несёт ответственность. При декларировании ответственность полностью лежит на изготовителе или продавце. При сертификации независимая аккредитованная организация проверяет продукцию и подтверждает соответствие от своего имени.
4. Для каких товаров что требуется? Это определяется перечнями, утверждёнными постановлениями Кабинета Министров Республики Узбекистан от 14 августа 2024 года №502 и от 30 января 2021 года №43. В этих постановлениях по коду ТН ВЭД товара указано, какая именно форма подтверждения соответствия — декларация или сертификат — применяется.
5. Как проходит процесс? Сначала определяется код ТН ВЭД вашей продукции — это можно сделать самостоятельно через раздел «Проверка ТН ВЭД» на сайте или с помощью наших специалистов. После определения требования проводятся соответствующие испытания и оформляется нужный документ (декларация или сертификат).
6. Как подать заявку? Если вам нужно уточнить, какой документ требуется для вашей продукции, или подать заявку на испытание, воспользуйтесь кнопкой ниже — наши специалисты свяжутся с вами в ближайшее время.',
  '1. What is a declaration of conformity? A declaration of conformity is a document by which the manufacturer or seller confirms, on its own behalf and under its own responsibility, that a product meets the established requirements (standards, technical regulations). The declaration is issued based on test results (a report) from an accredited testing laboratory.
2. What is a certificate of conformity? A certificate of conformity is an official document by which an independent, accredited third party — a certification body — confirms that a product meets the established requirements. The certification body tests the product and issues the certificate only after that.
3. What is the main difference between them? The key difference is who confirms conformity and who bears responsibility. With a declaration, responsibility rests entirely with the manufacturer or seller. With a certificate, an independent accredited organization inspects the product and confirms conformity on its own behalf.
4. Which products require which document? This is determined by the lists approved by Resolutions No. 502 (dated August 14, 2024) and No. 43 (dated January 30, 2021) of the Cabinet of Ministers of the Republic of Uzbekistan. These resolutions specify, by the product''s TN VED (HS) code, exactly which form of conformity assessment — declaration or certificate — applies.
5. How does the process work? First, your product''s TN VED code is determined — you can do this yourself via the "TN VED Check" section on our website, or with the help of our specialists. Once the requirement is identified, the relevant tests are carried out and the appropriate document (declaration or certificate) is issued.
6. How do I submit an application? If you need help determining which document your product requires, or you''re ready to submit it for testing, use the button below — our specialists will contact you shortly.',
  CURRENT_TIMESTAMP
)
ON CONFLICT (slug) DO NOTHING;
