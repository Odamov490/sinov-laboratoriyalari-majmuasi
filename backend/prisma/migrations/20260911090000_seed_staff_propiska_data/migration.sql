-- Data migration: populate the extended HR fields (birth date,
-- passport series/number, PINFL, home address) added in the previous
-- migration, sourced from the official residence-registration document
-- (propiska-royxati.md, provided by the client). Matched to existing
-- "Staff" rows by full name (69 source rows; 67 matched with high
-- confidence, 2 left untouched due to a genuine surname mismatch between
-- the client's two source documents -- see conversation notes, not
-- guessed to avoid attaching the wrong person's passport data).
--
-- CONFIDENTIAL: this migration file contains real passport numbers,
-- PINFL, and home addresses. These columns are never exposed by the
-- public API (see getStaff's explicit select in publicController.js).

UPDATE "Staff" SET
  "birthDate" = '1997-05-27'::timestamp,
  "passportSeries" = 'AE',
  "passportNumber" = '3366606',
  "pinfl" = '32705976610084',
  "address" = 'АБУ БАКР ШОШИЙ МФЙ, САҒБОН, 15 БЕРК КЎЧАСИ, uy:13, Olmazor tumani, Toshkent shahri',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Abdullajonov Asatullo Xikmatullo o''g''li';
UPDATE "Staff" SET
  "birthDate" = '1986-01-16'::timestamp,
  "passportSeries" = 'AD',
  "passportNumber" = '2937070',
  "pinfl" = '31601860220054',
  "address" = 'КОРАСАРОЙ МФЙ, ҚОРАСАРОЙ КЎЧАСИ, uy:1 xonadon:13, ОЛМАЗОР ТУМАНИ, ТОШКЕНТ ШАҲРИ',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Abdullayev Jaxongir Tashtemirovich';
UPDATE "Staff" SET
  "birthDate" = '1986-01-24'::timestamp,
  "passportSeries" = 'AD',
  "passportNumber" = '0927358',
  "pinfl" = '42401861670016',
  "address" = 'Тошкент шаҳри, Мирзо Улуғбек, Туртарик кўчаси, Уй 259, М.Улугбекский район, город Ташкент',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Abdullayeva Durdona Baxtiyorovna';
UPDATE "Staff" SET
  "birthDate" = '1976-02-29'::timestamp,
  "passportSeries" = 'AD',
  "passportNumber" = '4313536',
  "pinfl" = '42902765260014',
  "address" = '1-СОН МУХАММАД НАРШАХИЙ НОМЛИ МФЙ, ЯНГИ ЙУЛ КУЧАСИ, uy:28, Бухоро город, Бухарская область',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Abdullayeva Shahnoza Qaxramonovna';
UPDATE "Staff" SET
  "birthDate" = '1989-02-03'::timestamp,
  "passportSeries" = 'AD',
  "passportNumber" = '6962354',
  "pinfl" = '30302890570012',
  "address" = 'Юлдуз МФЙ, 2-Гунча кучаси, 40"б"-уй, Olmaliq tumani, Toshkent viloyati',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Abdurashidov Davron Abdikarimovich';
UPDATE "Staff" SET
  "birthDate" = '1998-08-13'::timestamp,
  "passportSeries" = 'AD',
  "passportNumber" = '9813952',
  "pinfl" = '31308986610045',
  "address" = 'Богзор МФЙ, 7 мавзеси, 18г-уй, 25-хонадон, Chilonzor tumani, Toshkent shahri',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Abduvaxobov Ravshan Rustam o''g''li';
UPDATE "Staff" SET
  "birthDate" = '2002-08-15'::timestamp,
  "passportSeries" = 'AD',
  "passportNumber" = '1615256',
  "pinfl" = '51508026540019',
  "address" = 'ТИНЧЛИК МФЙ, ШАЙХ ЗАЙНИДДИН КЎЧАСИ, uy:7А, Shayxontoxur tumani, Toshkent shahri',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Ahmadjonov Abdurahmon Rustamjon o''g''li';
UPDATE "Staff" SET
  "birthDate" = '2001-04-10'::timestamp,
  "passportSeries" = 'AB',
  "passportNumber" = '6616974',
  "pinfl" = '51004016790029',
  "address" = 'Ташкентская область, Пскентский район, Пискент г., Лола арик, дом СВТ Мехрибонлик, Piskent tumani, Toshkent viloyati',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Ahmatqulov Qodirjon Anvar o''g''li';
UPDATE "Staff" SET
  "birthDate" = '2001-11-06'::timestamp,
  "passportSeries" = 'AB',
  "passportNumber" = '8171661',
  "pinfl" = '50611016760036',
  "address" = 'Ташкентская область, Куйичирчикский район, Дустобод г., ул. массив Водоканал, дом 78, Quyichirchiq tumani, Toshkent viloyati',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Akbaraliyev Oybekjon Adxamjon o''g''li';
UPDATE "Staff" SET
  "birthDate" = '1980-07-10'::timestamp,
  "passportSeries" = 'AD',
  "passportNumber" = '3159350',
  "pinfl" = '31007800280018',
  "address" = 'МАЪРИФАТ МФЙ, КАШКАДАРЁ КЎЧАСИ, uy:25, Yashnobod tumani, Toshkent shahri',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Alekseyev Andrey Nikolayevich';
UPDATE "Staff" SET
  "birthDate" = '1982-03-09'::timestamp,
  "passportSeries" = 'AD',
  "passportNumber" = '3536469',
  "pinfl" = '40903820840011',
  "address" = 'Умид МФЙ, Восточная кучаси, 47-уй, Чирчик город, Ташкентская область',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Alimbayeva Gulchexra Sharipovna';
UPDATE "Staff" SET
  "birthDate" = '1995-11-01'::timestamp,
  "passportSeries" = 'AB',
  "passportNumber" = '7717478',
  "pinfl" = '40111956610028',
  "address" = 'Аллон МФЙ, Фароби, пр. Ахакчи кучаси, 32а-уй, Olmazor tumani, Toshkent shahri',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Aripova Dilshoda Ilg''or qizi';
UPDATE "Staff" SET
  "birthDate" = '2004-04-23'::timestamp,
  "passportSeries" = 'AC',
  "passportNumber" = '3063071',
  "pinfl" = '52304046610067',
  "address" = 'г. Ташкент, Олмазарский район, ул. Мойарик, Мойарик МСГ, 30- Дом, -, Olmazor tumani, Toshkent shahri',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Azamov Shaxzod Qilichbek o''g''li';
UPDATE "Staff" SET
  "birthDate" = '1999-04-13'::timestamp,
  "passportSeries" = 'AE',
  "passportNumber" = '2776504',
  "pinfl" = '31304996610033',
  "address" = 'ТАРАККИЁТ МФЙ, ТАРАҚҚИЁТ-3 ДАХАСИ, uy:46, Olmazor tumani, Toshkent shahri',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Azimxo''jayev Saidaziz Saidakbar o''g''li';
UPDATE "Staff" SET
  "birthDate" = '2002-10-31'::timestamp,
  "passportSeries" = 'AC',
  "passportNumber" = '1519886',
  "pinfl" = '53110026520027',
  "address" = 'Ташкентская область, Кибрайский район, Ункургон ССГ, Обод МСГ, ул. Ёнгокзор, дом 2, Qibray tumani, Toshkent viloyati',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Baxtiyorov Abdulloh Asror o''g''li';
UPDATE "Staff" SET
  "birthDate" = '1991-03-16'::timestamp,
  "passportSeries" = 'AD',
  "passportNumber" = '3610443',
  "pinfl" = '31603910570023',
  "address" = 'Бекобод МФЙ, Х.Бегматов кучаси, 87-уй, Piskent tumani, Toshkent viloyati',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Bayonxonov Sobitxon Xamitxon o''g''li';
UPDATE "Staff" SET
  "birthDate" = '1993-02-16'::timestamp,
  "passportSeries" = 'AE',
  "passportNumber" = '2715926',
  "pinfl" = '41602932560020',
  "address" = 'ЧАМАНБОҒ МФЙ, БЕШҚЎРҒОН-3 ДАХАСИ, uy:30 xonadon:89, Olmazor tumani, Toshkent shahri',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Boboyorova Iroda Shovkatovna';
UPDATE "Staff" SET
  "birthDate" = '1998-10-12'::timestamp,
  "passportSeries" = 'AD',
  "passportNumber" = '9339828',
  "pinfl" = '31210986540047',
  "address" = 'КАТТА ХОВУЗ МФЙ, МАННОН УЙҒУР КЎЧАСИ, uy:3 xonadon:8, Shayxontoxur tumani, Toshkent shahri',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Botirov Axror Botir o''g''li';
UPDATE "Staff" SET
  "birthDate" = '1984-09-23'::timestamp,
  "passportSeries" = 'AD',
  "passportNumber" = '3451317',
  "pinfl" = '32309840222942',
  "address" = 'ОРЗУ МФЙ, КИЧИК ҲАЛҚА ЙЎЛИ КЎЧАСИ, uy:6 xonadon:15, Olmazor tumani, Toshkent shahri',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Ergashev Baxtiyor Ismailovich';
UPDATE "Staff" SET
  "birthDate" = '1976-01-06'::timestamp,
  "passportSeries" = 'AD',
  "passportNumber" = '6745815',
  "pinfl" = '40601760960021',
  "address" = 'г. Ташкент, Мирзо Улугбекский район, ул. Сайрам, Буюк ипак йули МСГ, 1- Дом, 13- Квартира, Mirzo Ulug''bek tumani, Toshkent shahri',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Ergashova Nodira Abdukadirovna';
UPDATE "Staff" SET
  "birthDate" = '1994-03-16'::timestamp,
  "passportSeries" = 'AD',
  "passportNumber" = '2278562',
  "pinfl" = '31603946710015',
  "address" = 'ЯНГИҚЎРГОН ҚФЙ, УЗБЕКИСТОН МФЙ, ЎЗБЕКИСТОН КЎЧАСИ, uy:Р/С, Bekobod tumani, Toshkent viloyati',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Gadoyev Shuxrat Karimovich';
UPDATE "Staff" SET
  "birthDate" = '1997-06-23'::timestamp,
  "passportSeries" = 'AD',
  "passportNumber" = '4016280',
  "pinfl" = '42306976480018',
  "address" = 'Яккасарой МФЙ, Ш.Руставели кучаси, 120-уй, 38-хонадон, Yakkasaroy tumani, Toshkent shahri',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'G''aybullayeva Muxlisa Kutbullo qizi';
UPDATE "Staff" SET
  "birthDate" = '1993-12-04'::timestamp,
  "passportSeries" = 'AD',
  "passportNumber" = '9036773',
  "pinfl" = '30412930170022',
  "address" = 'ШИРИН МФЙ, 26 МАВЗЕ, uy:9 xonadon:50, Учтепинский район, город Ташкент',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Guluyev Emin Sadraddin o''g''li';
UPDATE "Staff" SET
  "birthDate" = '1997-09-12'::timestamp,
  "passportSeries" = 'AD',
  "passportNumber" = '4687171',
  "pinfl" = '31209975360018',
  "address" = 'РОХАТ МФЙ, ВОДНИК ДАХАСИ, uy:6/2КЛ xonadon:22, Bektemir tumani, Toshkent shahri',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Hakimov Shahzod Husniddin o''g''li';
UPDATE "Staff" SET
  "birthDate" = '1964-10-12'::timestamp,
  "passportSeries" = 'AD',
  "passportNumber" = '3231415',
  "pinfl" = '41210640170028',
  "address" = 'БОҒИЧИНОР МФЙ, ЛОЛАЗОР, 1 ТОР КЎЧАСИ, uy:25, Uchtepa tumani, Toshkent shahri',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Isakxodjayeva Xurshida Pulatovna';
UPDATE "Staff" SET
  "birthDate" = '1994-04-11'::timestamp,
  "passportSeries" = 'KA',
  "passportNumber" = '0560028',
  "pinfl" = '41104943420053',
  "address" = 'НАВОИЙ МФЙ, А.ХУДАЙШУКУРОВ, uy:69, ТЎРТКЎЛ ТУМАНИ, ҚОРАҚАЛПОҒИСТОН РЕСПУБЛИКАСИ',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Isayeva Shaxnoza Ilxamovna';
UPDATE "Staff" SET
  "birthDate" = '1990-11-24'::timestamp,
  "passportSeries" = 'AD',
  "passportNumber" = '3232890',
  "pinfl" = '42411900560028',
  "address" = 'Буз МФЙ, Буз-1 мавзеси, 8-уй, 20-хонадон, М.Улугбекский район, город Ташкент',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Ivanchenko Oksana Viktorovna';
UPDATE "Staff" SET
  "birthDate" = '1999-10-05'::timestamp,
  "passportSeries" = 'AE',
  "passportNumber" = '7236015',
  "pinfl" = '30510997340014',
  "address" = 'Үлгили мәкан МФЙ, Азамат кучаси, 12-уй, Nukus tumani, Qoraqalpog''iston Respublikasi',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Joldasbayev Dastanbek Sag''indiq uli';
UPDATE "Staff" SET
  "birthDate" = '1996-11-26'::timestamp,
  "passportSeries" = 'AB',
  "passportNumber" = '8255554',
  "pinfl" = '42611966540033',
  "address" = 'Кохота МФЙ, Зулфияхоним кучаси, 216-уй, Шайхантохурский район, город Ташкент',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Jo''rayeva Dilafruz Muxiddin qizi';
UPDATE "Staff" SET
  "birthDate" = '1998-10-03'::timestamp,
  "passportSeries" = 'AE',
  "passportNumber" = '1756963',
  "pinfl" = '30310986520034',
  "address" = 'ЯНГИТАРНОВ МФЙ, ГИР-ГИРТЕПА КЎЧАСИ, uy:14, Yunusobod tumani, Toshkent shahri',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Kamolov Nizomiddin G''aynitdin o''g''li';
UPDATE "Staff" SET
  "birthDate" = '2000-11-28'::timestamp,
  "passportSeries" = 'AB',
  "passportNumber" = '6640255',
  "pinfl" = '52811007190035',
  "address" = 'Янги себзор МФЙ, Себзор Ц17/18 мавзеси, 1-уй, 242-хонадон, Olmazor tumani, Toshkent shahri',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Karimov Suxrob Farxodovich';
UPDATE "Staff" SET
  "birthDate" = '1993-08-05'::timestamp,
  "passportSeries" = 'AD',
  "passportNumber" = '9106843',
  "pinfl" = '30508930510040',
  "address" = 'БЎКА Ш., БУНЁДКОР МФЙ, ИБРАТ КЎЧАСИ, uy:38, Bo''ka tumani, Toshkent viloyati',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Kenjayev Javoxirbek Muxiddin o''g''li';
UPDATE "Staff" SET
  "birthDate" = '1996-06-08'::timestamp,
  "passportSeries" = 'AD',
  "passportNumber" = '6129792',
  "pinfl" = '30806966670032',
  "address" = 'Ташкентская область, Зангиатинский район, Каторгол ССГ, Намуна МСГ, ГЕС, ПР. 1, дом 14, Zangiota tumani, Toshkent viloyati',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Mamajonov Ismoiljon Isroiljon o''g''li';
UPDATE "Staff" SET
  "birthDate" = '1992-09-10'::timestamp,
  "passportSeries" = 'AD',
  "passportNumber" = '7861764',
  "pinfl" = '31009920241595',
  "address" = 'ЯККАСАРОЙ-1 МФЙ, БОҒИБЎСТОН КЎЧАСИ, uy:147 xonadon:51, Яккасарайский район, город Ташкент',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Mamleyev Amir Maratovich';
UPDATE "Staff" SET
  "birthDate" = '2000-09-12'::timestamp,
  "passportSeries" = 'AB',
  "passportNumber" = '5057803',
  "pinfl" = '51209008660016',
  "address" = 'КЎКСАРОЙ МФЙ, ТУРТКУЛ КЎЧАСИ, uy:52, Yashnobod tumani, Toshkent shahri',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Minbayev Bahodir Bakirovich';
UPDATE "Staff" SET
  "birthDate" = '1983-05-19'::timestamp,
  "passportSeries" = 'AD',
  "passportNumber" = '1110428',
  "pinfl" = '41905836780012',
  "address" = 'Ташкентская область, Кибрайский район, Кибрай ГСГ, Сохибкор МСГ, Кибрай, Буз сув, дом 13/2, Кибрайский район, Ташкентская область',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Mirsaitova Naima Mirsabitovna';
UPDATE "Staff" SET
  "birthDate" = '1995-11-23'::timestamp,
  "passportSeries" = 'AD',
  "passportNumber" = '1234151',
  "pinfl" = '32311956500021',
  "address" = 'ТЕПАКУРГОН МФЙ, 11 МАВЗЕ, uy:39 xonadon:45, Uchtepa tumani, Toshkent shahri',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Mirxodiyev Mirsulton Usmon o''g''li';
UPDATE "Staff" SET
  "birthDate" = '1996-06-25'::timestamp,
  "passportSeries" = 'AD',
  "passportNumber" = '1517350',
  "pinfl" = '32506966580031',
  "address" = 'ПАРВОЗ МФЙ, АВИАСОЗЛАР-1 МАВЗЕСИ, uy:23 xonadon:10, ЯШНОБОД ТУМАНИ, ТОШКЕНТ ШАҲРИ',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Murodov Aziz Akrom o''g''li';
UPDATE "Staff" SET
  "birthDate" = '2000-12-26'::timestamp,
  "passportSeries" = 'AB',
  "passportNumber" = '5717372',
  "pinfl" = '52612006570019',
  "address" = 'Eshonbuloq MFY, Muqanna ko''chasi, 8а/8-uy, Sirg''ali tumani, Toshkent shahri',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Muxammadgaziyev Axmadjon Muxammadg''ofur o''g''li';
UPDATE "Staff" SET
  "birthDate" = '1980-03-16'::timestamp,
  "passportSeries" = 'AD',
  "passportNumber" = '0410432',
  "pinfl" = '41603800260015',
  "address" = 'Токзор МФЙ, Лойихалаш кучаси, 94-уй, Zangiota tumani, Toshkent viloyati',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Normatova Dilnoza Ziyaviddinovna';
UPDATE "Staff" SET
  "birthDate" = '1990-11-19'::timestamp,
  "passportSeries" = 'AE',
  "passportNumber" = '5133599',
  "pinfl" = '41911900211885',
  "address" = 'УНИВЕРСТИТЕТ МФЙ, ФАРОБИЙ, 17 БЕРК КЎЧАСИ, uy:8, Olmazor tumani, Toshkent shahri',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Nuritdinova Aziza A''zamjon qizi';
UPDATE "Staff" SET
  "birthDate" = '2002-07-22'::timestamp,
  "passportSeries" = 'AC',
  "passportNumber" = '1760379',
  "pinfl" = '52207025820029',
  "address" = 'ДЎРМАН МФЙ, uy:Р/С, Karmana tumani, Navoiy viloyati',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Ochilov Diyorbek Oybek o''g''li';
UPDATE "Staff" SET
  "birthDate" = '1997-10-01'::timestamp,
  "passportSeries" = 'AD',
  "passportNumber" = '6881123',
  "pinfl" = '30110977200017',
  "address" = 'Хорезмская область, Тупраккалинский район, Питнак ССГ, Пастом МСГ, ул. Пахтакор, дом 7, Tuproqqal''a tumani, Xorazm viloyati',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Odamov G''ulomjon Ilxom o''g''li';
UPDATE "Staff" SET
  "birthDate" = '1993-06-27'::timestamp,
  "passportSeries" = 'AD',
  "passportNumber" = '4626218',
  "pinfl" = '32706930270786',
  "address" = 'СУЛТОНИЯ МФЙ, КОРА-СУ-1 ДАХАСИ, uy:2 xonadon:29, Mirzo Ulug''bek tumani, Toshkent shahri',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Po''latxodjayev Sultonmuhammadxon Ziyovuddinxo''ja o''g''li';
UPDATE "Staff" SET
  "birthDate" = '2000-03-01'::timestamp,
  "passportSeries" = 'KA',
  "passportNumber" = '0885120',
  "pinfl" = '50103007340052',
  "address" = 'ДУСТЛИК МФЙ, НУКУС ШАХАР, К.САИПОВ, uy:113, Nukus shahri, Qoraqalpog''iston Respublikasi',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Reimbayev Xushnudbek Sherali o''g''li';
UPDATE "Staff" SET
  "birthDate" = '1997-06-18'::timestamp,
  "passportSeries" = 'AD',
  "passportNumber" = '4301594',
  "pinfl" = '31806976540078',
  "address" = 'ОЛИМ ХУЖАЕВ МФЙ, ЧИЛОНЗОР ОКТЕПА КЎЧАСИ, uy:30 xonadon:10, ШАЙХОНТОХУР ТУМАНИ, ТОШКЕНТ ШАҲРИ',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Rixsiyev Saidjon Xabibullo o''g''li';
UPDATE "Staff" SET
  "birthDate" = '1986-11-27'::timestamp,
  "passportSeries" = 'AD',
  "passportNumber" = '4146143',
  "pinfl" = '32711860450010',
  "address" = 'Ўзбекистон МФЙ, Узбекистон кучаси, 14/1б-уй, Bekobod shahri, Toshkent viloyati',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Ruzimatov Sherzod Ismatullayevich';
UPDATE "Staff" SET
  "birthDate" = '2003-06-15'::timestamp,
  "passportSeries" = 'AD',
  "passportNumber" = '2119031',
  "pinfl" = '51506036520030',
  "address" = 'г. Ташкент, Юнусабадский район, ул. Ниезбек йули, проезд 3, БуюкТурон МСГ, 1- Дом, 6-7- Квартира, Юнусабадский район, город Ташкент',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Saida''zamxo''ja Saidakbar o''g''li';
UPDATE "Staff" SET
  "birthDate" = '1994-04-17'::timestamp,
  "passportSeries" = 'AC',
  "passportNumber" = '2146207',
  "pinfl" = '41704940220041',
  "address" = 'ТЕПАГУЗАР МФЙ, ҚОРА-ҚАМИШ 2/4 ДАХАСИ, uy:2 xonadon:32, Olmazor tumani, Toshkent shahri',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Saidaxmatova Sevara Bahodir qizi';
UPDATE "Staff" SET
  "birthDate" = '2006-07-02'::timestamp,
  "passportSeries" = 'AD',
  "passportNumber" = '2020577',
  "pinfl" = '50207066590037',
  "address" = 'Чархновза МФЙ, Октепа мавзеси, 21-уй, 12-хонадон, Shayxontoxur tumani, Toshkent shahri',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Sharofiddinov Najmiddin Jaxongir o''g''li';
UPDATE "Staff" SET
  "birthDate" = '1998-09-10'::timestamp,
  "passportSeries" = 'AE',
  "passportNumber" = '1376087',
  "pinfl" = '31009986590057',
  "address" = 'ЧИЛОНЗОР МФЙ, ЭСКИ ЧИЛОНЗОР КЎЧАСИ, uy:20, Chilonzor tumani, Toshkent shahri',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Shavkatov Aziz Omon o''g''li';
UPDATE "Staff" SET
  "birthDate" = NULL,
  "passportSeries" = NULL,
  "passportNumber" = NULL,
  "pinfl" = '31508966500076',
  "address" = 'ОҚМАСЖИД МФЙ, АТОИЙ, 4 ТОР КЎЧАСИ, uy:10, УЧТЕПА ТУМАНИ, ТОШКЕНТ ШАҲРИ',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Shokir Abdushukur Abdujalil o''g''li';
UPDATE "Staff" SET
  "birthDate" = '1981-06-08'::timestamp,
  "passportSeries" = 'AD',
  "passportNumber" = '4868043',
  "pinfl" = '40806813960016',
  "address" = 'Sabzavot MFY, Sabzavot ko''chasi, 59/1-uy, I-Блок, 874-xonadon, Toshkent tumani, Toshkent viloyati',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Shukurova Muxfiya Erkinovna';
UPDATE "Staff" SET
  "birthDate" = '1997-07-02'::timestamp,
  "passportSeries" = 'AD',
  "passportNumber" = '5505109',
  "pinfl" = '30207975840010',
  "address" = 'НАВОИ Ш., ОЛТИН ВОДИЙ МФЙ, 7-ДАХА И.КАРИМОВ (Х.ДЎСТЛИГИ) ШОХ КЎЧАСИ, uy:124 xonadon:56, Navoiy shahri, Navoiy viloyati',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Sobirov Dostonjon Nomozboy o''g''li';
UPDATE "Staff" SET
  "birthDate" = '1996-04-06'::timestamp,
  "passportSeries" = 'AD',
  "passportNumber" = '3273554',
  "pinfl" = '30604965320026',
  "address" = 'Бухарская область, Каракульский район, Реге Хайдар МСГ, Урикзор, дом 181, Qorako''l tumani, Buxoro viloyati',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Sobirov Sobirjon Muxammadjonovich';
UPDATE "Staff" SET
  "birthDate" = '1999-11-13'::timestamp,
  "passportSeries" = 'AE',
  "passportNumber" = '5908998',
  "pinfl" = '31311996540055',
  "address" = 'БОҒКЎЧА МФЙ, БОҒКЎЧА МАВЗЕСИ, uy:14 xonadon:11, Shayxontoxur tumani, Toshkent shahri',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Sodiqov Shahboz Fozil o''g''li';
UPDATE "Staff" SET
  "birthDate" = '1991-03-03'::timestamp,
  "passportSeries" = 'AD',
  "passportNumber" = '7821577',
  "pinfl" = '30303910590038',
  "address" = 'ЭШОНОБОД, ЯНГИОБОД КЎЧАСИ, uy:Р/С, Chinoz tumani, Toshkent viloyati',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Suxanov Alijan Aytjanovich';
UPDATE "Staff" SET
  "birthDate" = '1991-01-15'::timestamp,
  "passportSeries" = 'AD',
  "passportNumber" = '3533586',
  "pinfl" = '31501910211062',
  "address" = 'БЕШЧИНОР МФЙ, 5 МАВЗЕ, uy:4 xonadon:34, Chilonzor tumani, Toshkent shahri',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Tillayev Anvar Raxmatovich';
UPDATE "Staff" SET
  "birthDate" = '1981-02-01'::timestamp,
  "passportSeries" = 'AD',
  "passportNumber" = '4780171',
  "pinfl" = '40102810450047',
  "address" = 'Turkiston MFY, 12-daxa ko''chasi, 31-uy, 31-xonadon, Bekobod shahri, Toshkent viloyati',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Turakulova Nilufar Xamidjanovna';
UPDATE "Staff" SET
  "birthDate" = '1997-09-19'::timestamp,
  "passportSeries" = 'AD',
  "passportNumber" = '4849465',
  "pinfl" = '31909976560041',
  "address" = 'г. Ташкент, Янгихаётский район, мас. Дустлик 1, Дустлик МСГ, 4- Дом, 9- Квартира, Yangihayot tumani, Toshkent shahri',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Turdiyev Aziz Axat o''g''li';
UPDATE "Staff" SET
  "birthDate" = '1993-01-02'::timestamp,
  "passportSeries" = 'AE',
  "passportNumber" = '5076966',
  "pinfl" = '30201930181309',
  "address" = 'МИРИШКОР МФЙ, ВОДНИК ДАХАСИ, uy:29 xonadon:158, Bektemir tumani, Toshkent shahri',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Utbasarov Komoliddin Mamurovich';
UPDATE "Staff" SET
  "birthDate" = '1986-09-22'::timestamp,
  "passportSeries" = 'AD',
  "passportNumber" = '3488759',
  "pinfl" = '42209860192096',
  "address" = '5-строительная территория, дом 3, кв. 25, Янгихаятский район, город Ташкент',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Valiyeva Orasta Sayfullaxonovna';
UPDATE "Staff" SET
  "birthDate" = '1981-02-17'::timestamp,
  "passportSeries" = 'AD',
  "passportNumber" = '2120031',
  "pinfl" = '31702810171182',
  "address" = 'ЮСУФ САККОКИЙ МФЙ, ЮСУФ САККОКИЙ, 5 ТОР КЎЧАСИ, uy:3, Uchtepa tumani, Toshkent shahri',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Xakimov Azizjon Axmadjonovich';
UPDATE "Staff" SET
  "birthDate" = '1964-09-08'::timestamp,
  "passportSeries" = 'AD',
  "passportNumber" = '3380538',
  "pinfl" = '40809640220034',
  "address" = 'ГУЗАРБОШИ МФЙ, ФАРОБИЙ, ХУРРИЯТ ТОР, 3 БЕРК КЎЧАСИ, uy:48, Olmazor tumani, Toshkent shahri',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Xalmirzayeva Xabiba Ilxamovna';
UPDATE "Staff" SET
  "birthDate" = '1974-07-25'::timestamp,
  "passportSeries" = 'AD',
  "passportNumber" = '3612940',
  "pinfl" = '42507740170043',
  "address" = 'НАМУНА МФЙ, БОБОЖОНОВ КЎЧАСИ, uy:88А, Olmazor tumani, Toshkent shahri',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Xudayberganova Feruza Baxtiyor qizi';
UPDATE "Staff" SET
  "birthDate" = '1991-08-12'::timestamp,
  "passportSeries" = 'AD',
  "passportNumber" = '8141534',
  "pinfl" = '31208916600017',
  "address" = 'ОЛИЙ ҲИММАТ МФЙ, РАВНАК КЎЧАСИ, uy:105, М.Улугбекский район, город Ташкент',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Yakubov Ildar Shavkatovich';
UPDATE "Staff" SET
  "birthDate" = '1994-03-03'::timestamp,
  "passportSeries" = 'AD',
  "passportNumber" = '4459066',
  "pinfl" = '30303940760023',
  "address" = 'ЎНҚЎРҒОН ҚФЙ, ПАРВОЗ МФЙ, ЎНКУРГАН, МЕВАЗОР, uy:4, Qibray tumani, Toshkent viloyati',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "fullName" = 'Yo''ldoshov Jaxongir Rustam o''g''li';
