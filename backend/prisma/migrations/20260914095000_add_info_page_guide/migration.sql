-- Optional "step-by-step guide" section for the declaration-vs-certificate
-- InfoPage — shown below the existing "declaration vs certificate" content
-- on the same public page. Nullable columns since not every InfoPage needs
-- a guide section.
ALTER TABLE "InfoPage"
  ADD COLUMN "guideTitleUz" TEXT,
  ADD COLUMN "guideTitleRu" TEXT,
  ADD COLUMN "guideTitleEn" TEXT,
  ADD COLUMN "guideContentUz" TEXT,
  ADD COLUMN "guideContentRu" TEXT,
  ADD COLUMN "guideContentEn" TEXT;

-- Seed: "Arizadan deklaratsiyagacha" 10-step tris.uz guide, for the
-- existing "deklaratsiya-va-sertifikat" InfoPage row.
UPDATE "InfoPage"
SET
  "guideTitleUz" = 'Arizadan deklaratsiyagacha: Laboratoriya sinovlaridan o''tkazish yo''riqnomasi',
  "guideTitleRu" = 'От заявки до декларации: Руководство по прохождению лабораторных испытаний',
  "guideTitleEn" = 'From Application to Declaration: A Step-by-Step Guide to Laboratory Testing',
  "guideContentUz" = 'Ariza yaratishdan tortib, sinov dasturini tanlangan laboratoriyaga yuborishgacha bo''lgan barcha bosqichlar. Manba: tris.uz — Texnik tartibga solish milliy axborot tizimi. Aloqa markazi: +998 97 442 44 19.

1. Foydalanuvchi turini tanlang. Formaning yuqori qismidan «Yuridik shaxs»ni tanlang.
2. Ikkala shartni tasdiqlang. «Shartnomada ko''rsatilgan hizmat narxini to''lashni kafolatlayman» va «Sinov o''tkazish uchun kerakli namunalarni taqdim etaman» katakchalarini belgilang, so''ng mahsulot egasining nomini kiriting.
3. Mahsulotlarni qo''shing — soni cheklanmagan. Mahsulot qo''shish tugmasini xohlagancha marta bosib qo''shishingiz mumkin. Har bir mahsulot uchun: Mahsulot nomi, Soni, TIF TN kodi, O''lchov birligi.
4. Fayl yuklab, «Yaratish»ni bosing. Kerakli hujjatlarni biriktiring, so''ng Yaratish tugmasini bosing.
5. «Laboratoriya sinovlaridan o''tkazish» bo''limi ochiladi. Sinov dasturi tugmasini bosing.
6. Har bir mahsulot uchun laboratoriya qo''shing. «+ Laboratoriya qo''shish» tugmasini bosing.
7. Faoliyat sohasi va laboratoriyani tanlang. Mos yo''nalishni tanlang, Laboratoriya qidiruv maydoniga «0309» deb yozib, ro''yxatdan O''ZAK.SL.0309 — «O''zbekiston ilmiy-sinov va sifat nazorati markazi» davlat muassasasining sinov laboratoriyasini tanlang. Mahsulotlar sonini kiriting.
8. Sinov dasturi (ko''rsatkichlar)ni to''ldiring va saqlang. Har bir ko''rsatkich uchun: Ko''rsatkich nomi, Standart, Standart raqami, Standart bandi, Hujjat, Hujjat raqami, Hujjat bandi. Bir nechta mahsulot bo''lsa, 6-8 qadamlarni har biri uchun takrorlang.
9. «Laboratoriyalarga yuborish» → «Tasdiqlash». Barcha mahsulotlar to''ldirilgach, «Laboratoriyalarga yuborish» tugmasini bosing, chiqqan oynada «Tasdiqlash» deb javob bering.
10. Natijani «Sinov dasturi» bo''limida tekshiring. Holat «Yangi» va laboratoriya nomi ostida O''ZAK.SL.0309 ko''rsatilsa — muvaffaqiyatli yuborilgan hisoblanadi.

Eslatma: Ariza va sinov dasturi yuborilgach, laboratoriya so''rovni ko''rib chiqadi, hisob-faktura shakllanadi va to''lovdan so''ng sinov jarayoni boshlanadi.',
  "guideContentRu" = 'Все этапы — от создания заявки до отправки программы испытаний в выбранную лабораторию. Источник: tris.uz — Национальная информационная система технического регулирования. Контакт-центр: +998 97 442 44 19.

1. Выберите тип пользователя. В верхней части формы выберите «Юридическое лицо».
2. Подтвердите оба условия. Отметьте галочки «Гарантирую оплату стоимости услуги, указанной в договоре» и «Предоставлю необходимые образцы для проведения испытаний», затем укажите название владельца продукции.
3. Добавьте продукцию — количество не ограничено. Кнопку «Добавить продукцию» можно нажимать сколько угодно раз. Для каждой продукции заполните: Наименование продукции, Количество, Код ТН ВЭД, Единица измерения.
4. Загрузите файл и нажмите «Создать». Прикрепите необходимые документы, затем нажмите кнопку «Создать».
5. Откроется раздел «Прохождение лабораторных испытаний». Нажмите кнопку «Программа испытаний».
6. Добавьте лабораторию для каждой продукции. Нажмите кнопку «+ Добавить лабораторию».
7. Выберите сферу деятельности и лабораторию. Выберите подходящее направление, в поле поиска лаборатории введите «0309» и из списка выберите испытательную лабораторию государственного учреждения O''ZAK.SL.0309 — «Узбекский центр научных испытаний и контроля качества». Укажите количество продукции.
8. Заполните и сохраните программу испытаний (показатели). Для каждого показателя заполните: Наименование показателя, Стандарт, Номер стандарта, Пункт стандарта, Документ, Номер документа, Пункт документа. Если продукции несколько, повторите шаги 6–8 для каждой отдельно.
9. «Отправить в лаборатории» → «Подтвердить». После заполнения всех продукций нажмите кнопку «Отправить в лаборатории», в появившемся окне ответьте «Подтвердить».
10. Проверьте результат в разделе «Программа испытаний». Если статус «Новый» и под названием лаборатории указано O''ZAK.SL.0309 — программа испытаний считается успешно отправленной.

Примечание: После отправки заявки и программы испытаний лаборатория рассматривает запрос, формируется счёт-фактура, и после оплаты начинается процесс испытаний.',
  "guideContentEn" = 'All the steps from creating an application to sending the test program to the selected laboratory. Source: tris.uz — National Technical Regulation Information System. Contact center: +998 97 442 44 19.

1. Select the user type. At the top of the form, select "Legal Entity".
2. Confirm both conditions. Check the boxes "I guarantee payment of the service price specified in the contract" and "I will provide the samples required for testing", then enter the name of the product owner.
3. Add products — there is no limit on the number. You can click the "Add Product" button as many times as needed. For each product, fill in: Product Name, Quantity, TN VED (HS) Code, Unit of Measurement.
4. Upload a file and click "Create". Attach the required documents, then click the "Create" button.
5. The "Laboratory Testing" section opens. Click the "Test Program" button.
6. Add a laboratory for each product. Click the "+ Add Laboratory" button.
7. Select the field of activity and the laboratory. Choose the matching direction, type "0309" into the laboratory search field, and from the list select the testing laboratory of the state institution O''ZAK.SL.0309 — "Uzbek Center for Scientific Testing and Quality Control". Enter the quantity of products to be tested.
8. Fill in and save the test program (indicators). For each indicator, fill in: Indicator Name, Standard, Standard Number, Standard Clause, Document, Document Number, Document Clause. If there is more than one product, repeat steps 6–8 for each one separately.
9. "Send to Laboratories" → "Confirm". Once all products are filled in, click the "Send to Laboratories" button at the bottom, and in the dialog that appears, respond "Confirm".
10. Check the result in the "Test Program" section. If the status shows "New" and O''ZAK.SL.0309 is listed under the laboratory name, the test program has been successfully sent.

Note: Once the application and test program are submitted, the laboratory reviews the request, an invoice is generated, and after payment the testing process begins.'
WHERE "slug" = 'deklaratsiya-va-sertifikat';
