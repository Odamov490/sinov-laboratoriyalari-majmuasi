-- Full redesign of the declaration-vs-certificate InfoPage: repurposes
-- title/content as the new Hero headline/intro, adds comparison-card and
-- FAQ fields, and updates guideTitle to the new section heading.
ALTER TABLE "InfoPage"
  ADD COLUMN "comparisonDeclarationUz" TEXT,
  ADD COLUMN "comparisonDeclarationRu" TEXT,
  ADD COLUMN "comparisonDeclarationEn" TEXT,
  ADD COLUMN "comparisonCertificateUz" TEXT,
  ADD COLUMN "comparisonCertificateRu" TEXT,
  ADD COLUMN "comparisonCertificateEn" TEXT,
  ADD COLUMN "faqUz" TEXT,
  ADD COLUMN "faqRu" TEXT,
  ADD COLUMN "faqEn" TEXT;

UPDATE "InfoPage"
SET
  "titleUz" = 'Deklaratsiya va sertifikat: qaysi biri sizga kerak?',
  "titleRu" = 'Декларация и сертификат: что нужно именно вам?',
  "titleEn" = 'Declaration or Certificate: Which One Do You Need?',
  "contentUz" = 'Mahsulotingizni O''zbekistonga olib kirish yoki bozorga chiqarish uchun uning xavfsizlik va sifat talablariga mosligini rasmiy tasdiqlash — majburiy qadam. Quyida deklaratsiya va sertifikat orasidagi farqni, sizga aynan qaysi biri kerakligini va uni qanday olishni bosqichma-bosqich tushuntiramiz.',
  "contentRu" = 'Чтобы ввезти продукцию в Узбекистан или вывести её на рынок, необходимо официально подтвердить её соответствие требованиям безопасности и качества — это обязательный шаг. Ниже мы объясняем разницу между декларацией и сертификатом, как понять, что нужно именно вам, и как получить нужный документ шаг за шагом.',
  "contentEn" = 'To import your product into Uzbekistan or bring it to market, you must officially confirm that it meets safety and quality requirements — this is a mandatory step. Below we explain the difference between a declaration and a certificate, how to tell which one you need, and how to get it step by step.',
  "guideTitleUz" = 'Ariza qanday beriladi? 10 bosqichda',
  "guideTitleRu" = 'Как подать заявку? В 10 шагов',
  "guideTitleEn" = 'How to Apply? In 10 Steps',
  "comparisonDeclarationUz" = 'Ishlab chiqaruvchi yoki import qiluvchining o''zi, o''z javobgarligi ostida
To''liq deklarant (ishlab chiqaruvchi/sotuvchi) zimmasida
Akkreditatsiyadan o''tgan laboratoriyaning sinov bayonnomasi asosida, deklarant tomonidan rasmiylashtiriladi
Odatda 1 yildan 5 yilgacha, mahsulot turiga qarab
Past va o''rta xavfli mahsulotlar uchun (masalan, ko''pgina maishiy va sanoat buyumlari)',
  "comparisonDeclarationRu" = 'Сам изготовитель или импортёр, под свою ответственность
Полностью на декларанте (изготовителе/продавце)
На основании протокола испытаний аккредитованной лаборатории, оформляется самим декларантом
Обычно от 1 года до 5 лет, в зависимости от вида продукции
Для продукции низкого и среднего риска (например, большинство бытовых и промышленных товаров)',
  "comparisonDeclarationEn" = 'The manufacturer or importer itself, under its own responsibility
Rests entirely with the declarant (manufacturer/seller)
Based on the test report from an accredited laboratory, issued by the declarant
Usually 1 to 5 years, depending on the product type
For low- and medium-risk products (e.g., most household and industrial goods)',
  "comparisonCertificateUz" = 'Akkreditatsiyadan o''tgan mustaqil sertifikatlashtirish organi
Sertifikatlashtirish organi va ishlab chiqaruvchi birgalikda javobgar
Sinov bayonnomasi va ishlab chiqarishni tekshirish asosida, sertifikatlashtirish organi tomonidan beriladi
Odatda 1 yildan 3 yilgacha, mahsulot va sxemaga qarab
Yuqori xavfli mahsulotlar uchun (masalan, bolalar mahsulotlari, elektr xavfsizligi talab qilinadigan buyumlar)',
  "comparisonCertificateRu" = 'Независимый аккредитованный орган по сертификации
Совместно орган по сертификации и изготовитель
На основании протокола испытаний и проверки производства, выдаётся органом по сертификации
Обычно от 1 года до 3 лет, в зависимости от продукции и схемы
Для продукции повышенного риска (например, детские товары, изделия с требованиями электробезопасности)',
  "comparisonCertificateEn" = 'An independent, accredited certification body
Shared by the certification body and the manufacturer
Based on the test report plus a production inspection, issued by the certification body
Usually 1 to 3 years, depending on the product and scheme
For higher-risk products (e.g., children''s products, items requiring electrical safety)',
  "faqUz" = 'Deklaratsiya qancha vaqtda tayyor bo''ladi?
Odatda sinov natijalari tayyor bo''lgandan so''ng, deklaratsiyani rasmiylashtirish bir necha kun ichida amalga oshiriladi. Aniq muddat mahsulot turi va laboratoriya yukiga bog''liq.

Ikkalasi ham — deklaratsiya ham, sertifikat ham — kerak bo''lishi mumkinmi?
Kamdan-kam holatlarda, agar mahsulotingiz bir nechta texnik reglament talabiga tushsa, ha, ikkalasi ham talab qilinishi mumkin. Bunday holatda mutaxassislarimiz bilan bog''lanib aniqlashtiring.

Agar mening TN VED kodim ro''yxatda (502/43-son qarorlarda) bo''lmasa, nima bo''ladi?
Bu ko''pincha sizning mahsulotingiz uchun majburiy deklaratsiya yoki sertifikat talab qilinmasligini bildiradi, lekin buni aniq bilish uchun mutaxassislarimiz bilan bog''lanishni tavsiya qilamiz — ba''zi holatlar kod darajasida aniq ko''rinmasligi mumkin.

Tris.uz orqali ariza berish uchun ERI (elektron raqamli imzo) shart-mi?
Ha, tris.uz tizimida yuridik shaxs sifatida ariza berish uchun elektron raqamli imzo (ERI) talab etiladi.',
  "faqRu" = 'Сколько времени занимает оформление декларации?
Обычно после готовности результатов испытаний оформление декларации занимает несколько дней. Точный срок зависит от вида продукции и загруженности лаборатории.

Может ли понадобиться и декларация, и сертификат одновременно?
В редких случаях, если продукция подпадает под требования нескольких технических регламентов, действительно могут потребоваться оба документа. В таком случае уточните это у наших специалистов.

Что делать, если моего кода ТН ВЭД нет в списках (постановления №502/43)?
Чаще всего это означает, что для вашей продукции обязательная декларация или сертификат не требуются, но для точного ответа рекомендуем связаться с нашими специалистами — некоторые случаи не всегда очевидны на уровне кода.

Обязательна ли ЭЦП (электронная цифровая подпись) для подачи заявки через tris.uz?
Да, для подачи заявки в качестве юридического лица в системе tris.uz требуется электронная цифровая подпись (ЭЦП).',
  "faqEn" = 'How long does it take to get a declaration?
Once the test results are ready, issuing the declaration usually takes a few days. The exact timing depends on the product type and the laboratory''s workload.

Could I need both a declaration and a certificate?
In rare cases, if your product falls under more than one technical regulation, both documents may indeed be required. Contact our specialists to check your specific case.

What if my TN VED code isn''t in the lists (Resolutions No. 502/43)?
This usually means a mandatory declaration or certificate isn''t required for your product, but we recommend contacting our specialists to be sure — some cases aren''t always obvious from the code alone.

Is a digital signature (ERI) required to apply through tris.uz?
Yes, applying as a legal entity in the tris.uz system requires a digital signature (ERI).'
WHERE "slug" = 'deklaratsiya-va-sertifikat';
