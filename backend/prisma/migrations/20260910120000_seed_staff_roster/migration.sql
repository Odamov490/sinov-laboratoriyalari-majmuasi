-- Data migration: seed real staff ("Mutaxassislar") records from the
-- official SLM personnel tabel (slm-xodimlar-tabeli.md, provided by the
-- client), for the 8 testing labs, the center head, and the sample/document
-- intake bureau. Passport/PINFL/birth-date fields are intentionally left
-- NULL -- that data was not provided and must be entered later via the
-- admin panel; these columns are never exposed by the public API.
--
-- One person (Odamov G'ulomjon Ilxom o'g'li, tabel #151, EMC lab) already
-- exists in production and is intentionally skipped here. Every INSERT is
-- additionally guarded by a NOT EXISTS check on fullName + position so
-- this migration cannot create a duplicate row even if re-examined.

INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT 'b9a7d251-5056-4746-bb42-23c89713c506', 'Xakimov Azizjon Axmadjonovich', 'Markaz boshlig''i', 'Markaz rahbariyati', NULL, 1, '353 k', '2026-08-11'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Xakimov Azizjon Axmadjonovich' AND "position" = 'Markaz boshlig''i');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT 'b0c694a4-0196-41df-bb26-a3bd22a14bca', 'Tillayev Anvar Raxmatovich', 'Laboratoriya boshlig''i', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'elektrotexnika'), 2, '295 k', '2026-08-11'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Tillayev Anvar Raxmatovich' AND "position" = 'Laboratoriya boshlig''i');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT '300ea26f-bf1b-40e7-bd93-fd22d36c8b90', 'Ergashev Baxtiyor Ismailovich', 'Bosh mutaxassis', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'elektrotexnika'), 136, '297 k', '2026-08-11'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Ergashev Baxtiyor Ismailovich' AND "position" = 'Bosh mutaxassis');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT '27f52d43-64cf-45bb-9041-fb6c9e9149f8', 'Samatova Svetlana Viktorovna', 'Bosh mutaxassis', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'elektrotexnika'), NULL, '296 k', '2026-08-11'::timestamp, 'Dekretda', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Samatova Svetlana Viktorovna' AND "position" = 'Bosh mutaxassis');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT '2f9b63ea-2ca1-4262-8936-af76752a59f9', 'Mamleyev Amir Maratovich', 'Bosh mutaxassis', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'elektrotexnika'), 137, '281 k', '2026-08-11'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Mamleyev Amir Maratovich' AND "position" = 'Bosh mutaxassis');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT 'f2489c91-d404-4898-9b76-805382915e67', 'Ivanchenko Oksana Viktorovna', 'Bosh mutaxassis', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'elektrotexnika'), NULL, '280 k', '2026-08-11'::timestamp, 'Dekretda', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Ivanchenko Oksana Viktorovna' AND "position" = 'Bosh mutaxassis');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT '012d905d-e675-42db-b764-1d2357f05f8b', 'Sobirov Sobirjon Muxammadjonovich', 'Yetakchi mutaxassis', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'elektrotexnika'), 138, '282 k', '2026-08-11'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Sobirov Sobirjon Muxammadjonovich' AND "position" = 'Yetakchi mutaxassis');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT 'e97ede56-cdae-4ffa-bfcf-3fc6ab99761d', 'Rixsiyev Saidjon Xabibullo o''g''li', 'Yetakchi mutaxassis', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'elektrotexnika'), 139, '284 k', '2026-08-11'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Rixsiyev Saidjon Xabibullo o''g''li' AND "position" = 'Yetakchi mutaxassis');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT '8ecc5e55-1293-49f5-b933-85343e12fbc4', 'Akbaraliyev Oybekjon Adxamjon o''g''li', 'Yetakchi mutaxassis', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'elektrotexnika'), 140, '283 k', '2026-08-11'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Akbaraliyev Oybekjon Adxamjon o''g''li' AND "position" = 'Yetakchi mutaxassis');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT '60f1cef6-12a1-4314-9482-90e1d6cb2294', 'Abdullayev Jaxongir Tashtemirovich', 'Yetakchi mutaxassis', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'elektrotexnika'), 141, '195 k', '2026-08-11'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Abdullayev Jaxongir Tashtemirovich' AND "position" = 'Yetakchi mutaxassis');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT '7b933dd1-50c5-4f8d-adff-aa9d29177509', 'Saida''zamxo''ja Saidakbar o''g''li', 'Mutaxassis', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'elektrotexnika'), 142, '352 k', '2026-08-11'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Saida''zamxo''ja Saidakbar o''g''li' AND "position" = 'Mutaxassis');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT '81ab41bb-b1dd-4a16-a963-e982e76c5eb3', 'Joldasbayev Dastanbek Sag''indiq uli', 'Mutaxassis', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'elektrotexnika'), 143, '257 k', '2026-08-11'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Joldasbayev Dastanbek Sag''indiq uli' AND "position" = 'Mutaxassis');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT '18bf65e0-a5e8-4b9c-bafe-789a2c0d80f8', 'Ahmadjonov Abdurahmon Rustamjon o''g''li', 'Mutaxassis', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'elektrotexnika'), 144, '285 k', '2026-08-11'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Ahmadjonov Abdurahmon Rustamjon o''g''li' AND "position" = 'Mutaxassis');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT 'a4eba96a-8956-431a-8d2d-69e8c73f689a', 'Turakulova Nilufar Xamidjanovna', '1-toifali ish yurituvchi', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'elektrotexnika'), 145, '286 k', '2026-08-11'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Turakulova Nilufar Xamidjanovna' AND "position" = '1-toifali ish yurituvchi');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT '5719edf6-71d4-4857-947d-ff59a389dafe', 'Karimov Suxrob Farxodovich', 'Ish yurituvchi', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'elektrotexnika'), 146, '625 k', '2026-08-13'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Karimov Suxrob Farxodovich' AND "position" = 'Ish yurituvchi');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT '2f741f1e-e2a9-4a94-a4af-7f2238436c00', 'Baxtiyorov Abdulloh Asror o''g''li', 'Ish yurituvchi', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'elektrotexnika'), 147, '256 k', '2026-08-11'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Baxtiyorov Abdulloh Asror o''g''li' AND "position" = 'Ish yurituvchi');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT 'c9109e23-0abc-4516-97a1-86c6ecc77dcb', 'Abdurashidov Davron Abdikarimovich', 'Laboratoriya boshlig''i', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'emc'), 148, '301 k', '2026-08-11'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Abdurashidov Davron Abdikarimovich' AND "position" = 'Laboratoriya boshlig''i');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT 'fb32a17f-d655-4364-93c2-5630d09deb13', 'Suxanov Alijan Aytjanovich', 'Yetakchi mutaxassis', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'emc'), 149, '228 k', '2026-08-11'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Suxanov Alijan Aytjanovich' AND "position" = 'Yetakchi mutaxassis');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT '2c4ca665-d95e-4e53-8430-2c196bde6c0c', 'Reimbayev Xushnudbek Sherali o''g''li', 'Yetakchi mutaxassis', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'emc'), 150, '366 k', '2026-08-11'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Reimbayev Xushnudbek Sherali o''g''li' AND "position" = 'Yetakchi mutaxassis');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT 'd58b973c-061e-47f0-bbc8-b832a25b6d62', 'Alekseyev Andrey Nikolayevich', 'Yetakchi mutaxassis', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'emc'), 152, '227 k', '2026-08-11'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Alekseyev Andrey Nikolayevich' AND "position" = 'Yetakchi mutaxassis');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT '75359273-d873-4940-8a09-e52641f97793', 'Sobirov Dostonjon Nomozboy o''g''li', 'Mutaxassis', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'emc'), 153, '229 k', '2026-08-11'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Sobirov Dostonjon Nomozboy o''g''li' AND "position" = 'Mutaxassis');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT 'b5b44c83-5c14-46f6-a360-256e88fda816', 'Kenjayev Javoxirbek Muxiddin o''g''li', 'Mutaxassis', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'emc'), 154, '299 k', '2026-08-11'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Kenjayev Javoxirbek Muxiddin o''g''li' AND "position" = 'Mutaxassis');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT '543452cb-9a6a-4dbf-8c67-9ef738f11251', 'Ahmatqulov Qodirjon Anvar o''g''li', '1-toifali ish yurituvchi', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'emc'), 155, '298 k', '2026-08-11'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Ahmatqulov Qodirjon Anvar o''g''li' AND "position" = '1-toifali ish yurituvchi');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT '1b862142-cc75-4b25-8d5f-69391b4acc1e', 'Yuldashev Muhammadali Damin o''g''li', 'Ish yurituvchi', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'emc'), 156, '610 k', '2026-08-13'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Yuldashev Muhammadali Damin o''g''li' AND "position" = 'Ish yurituvchi');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT '8e94c6b6-d5d2-4a63-aee5-c3bc619a6f9c', 'Bayonxonov Sobitxon Xamitxon o''g''li', 'Ish yurituvchi', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'emc'), 157, '300 k', '2026-08-11'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Bayonxonov Sobitxon Xamitxon o''g''li' AND "position" = 'Ish yurituvchi');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT '3f683196-9402-4c22-bf8b-66a79014977a', 'Xalmirzayeva Xabiba Ilxamovna', 'Laboratoriya boshlig''i', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'polimer'), 158, '360 k', '2026-08-11'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Xalmirzayeva Xabiba Ilxamovna' AND "position" = 'Laboratoriya boshlig''i');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT '9fe93a4d-a639-4e53-ba18-276b8cb2df66', 'Xudayberganova Feruza Baxtiyor qizi', 'Bosh mutaxassis', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'polimer'), 159, '364 k', '2026-08-11'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Xudayberganova Feruza Baxtiyor qizi' AND "position" = 'Bosh mutaxassis');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT '0fe93733-32c0-4814-9cfa-2f06c38bcadc', 'Normatova Dilnoza Ziyaviddinovna', 'Bosh mutaxassis', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'polimer'), 160, '376 k', '2026-08-11'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Normatova Dilnoza Ziyaviddinovna' AND "position" = 'Bosh mutaxassis');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT '2fa3109a-b6df-4719-9278-94d840c15980', 'Ergashova Nodira Abdukadirovna', 'Yetakchi mutaxassis', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'polimer'), 161, '363 k', '2026-08-11'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Ergashova Nodira Abdukadirovna' AND "position" = 'Yetakchi mutaxassis');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT '628787f6-40eb-498e-b462-5f7a631a3880', 'Nuritdinova Aziza A''zamjon qizi', 'Yetakchi mutaxassis', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'polimer'), 162, '362 k', '2026-08-11'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Nuritdinova Aziza A''zamjon qizi' AND "position" = 'Yetakchi mutaxassis');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT '4967e451-9f05-4fda-9bda-dd8b7c97b06c', 'Turdiyev Aziz Axat o''g''li', 'Mutaxassis', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'polimer'), 163, '349 k', '2026-08-11'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Turdiyev Aziz Axat o''g''li' AND "position" = 'Mutaxassis');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT '0255904c-f639-4bdd-a2f6-1a6a56feddec', 'Aripova Dilshoda Ilg''or qizi', '1-toifali ish yurituvchi', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'polimer'), NULL, '268 k', '2026-08-11'::timestamp, 'DDO PDO', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Aripova Dilshoda Ilg''or qizi' AND "position" = '1-toifali ish yurituvchi');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT 'ddc082b8-22ce-4ade-a793-d1de342c3f61', 'Botirov Axror Botir o''g''li', 'Laboratoriya boshlig''i', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'yengil-sanoat'), 164, '236 k', '2026-08-11'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Botirov Axror Botir o''g''li' AND "position" = 'Laboratoriya boshlig''i');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT '63fa6e72-786f-4e8e-8be9-4382d83310e4', 'Isakxodjayeva Xurshida Pulatovna', 'Bosh mutaxassis', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'yengil-sanoat'), 165, '307 k', '2026-08-11'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Isakxodjayeva Xurshida Pulatovna' AND "position" = 'Bosh mutaxassis');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT 'b5ae8f53-6986-4e2f-834b-7fa1eb82b068', 'Abdullayeva Shahnoza Qaxramonovna', 'Bosh mutaxassis', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'yengil-sanoat'), 166, '288 k', '2026-08-11'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Abdullayeva Shahnoza Qaxramonovna' AND "position" = 'Bosh mutaxassis');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT 'ffaf355c-6ed0-4ba9-82c0-02fd0056ae3d', 'Muxammadgaziyev Axmadjon Muxammadg''ofur o''g''li', 'Yetakchi mutaxassis', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'yengil-sanoat'), 167, '237 k', '2026-08-11'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Muxammadgaziyev Axmadjon Muxammadg''ofur o''g''li' AND "position" = 'Yetakchi mutaxassis');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT '3a863aa2-9cb5-4b73-a453-ba68b7b6449c', 'Azimxo''jayev Saidaziz Saidakbar o''g''li', 'Mutaxassis', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'yengil-sanoat'), 168, '306 k', '2026-08-11'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Azimxo''jayev Saidaziz Saidakbar o''g''li' AND "position" = 'Mutaxassis');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT '7358eb05-c9f2-4513-93b5-4975cebe3084', 'Mirxodiyev Mirsulton Usmon o''g''li', 'Laboratoriya boshlig''i', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'kimyoviy-biologik'), 169, '248 k', '2026-08-11'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Mirxodiyev Mirsulton Usmon o''g''li' AND "position" = 'Laboratoriya boshlig''i');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT '4326c4b6-967d-4040-ae80-fd239638c14e', 'Shukurova Muxfiya Erkinovna', 'Bosh mutaxassis', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'kimyoviy-biologik'), 170, '359 k', '2026-08-11'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Shukurova Muxfiya Erkinovna' AND "position" = 'Bosh mutaxassis');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT 'bbc8641a-68d9-4fc5-8e81-378e94f730fe', 'Alimbayeva Gulchexra Sharipovna', 'Bosh mutaxassis', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'kimyoviy-biologik'), 171, '350 k', '2026-08-11'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Alimbayeva Gulchexra Sharipovna' AND "position" = 'Bosh mutaxassis');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT '053c2eb3-de39-4728-8458-aabc3fa7b63a', 'Hakimov Shahzod Husniddin o''g''li', 'Yetakchi mutaxassis', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'kimyoviy-biologik'), 172, '351 k', '2026-08-11'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Hakimov Shahzod Husniddin o''g''li' AND "position" = 'Yetakchi mutaxassis');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT '98d3c39a-b615-435d-9fac-e5567bfd3653', 'Minbayev Bahodir Bakirovich', 'Yetakchi mutaxassis', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'kimyoviy-biologik'), 173, '247 k', '2026-08-11'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Minbayev Bahodir Bakirovich' AND "position" = 'Yetakchi mutaxassis');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT '93d3e8a0-d108-4a7e-ae59-2f2611dae8aa', 'Kamolov Nizomiddin G''aynitdin o''g''li', 'Mutaxassis', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'kimyoviy-biologik'), 174, '269 k', '2026-08-11'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Kamolov Nizomiddin G''aynitdin o''g''li' AND "position" = 'Mutaxassis');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT 'f57b8171-bd1c-4308-a6b3-4d4d1be0f5e3', 'Jo''rayeva Dilafruz Muxiddin qizi', 'Mutaxassis', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'kimyoviy-biologik'), 175, '361 k', '2026-08-11'::timestamp, 'Dekretda. Manba hujjatda ikkinchi sana/kod ham ko''rsatilgan: 13.08.2026, 527 k', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Jo''rayeva Dilafruz Muxiddin qizi' AND "position" = 'Mutaxassis');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT 'f5cd7b0f-ecd0-492f-aaf3-a08b593c6b1c', 'Azamov Shaxzod Qilichbek o''g''li', 'Ma''lumot yangilanmoqda', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'kimyoviy-biologik'), NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Azamov Shaxzod Qilichbek o''g''li' AND "position" = 'Ma''lumot yangilanmoqda');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT '40a84685-f404-4dc9-b1d0-9c5326aed321', 'Yo''ldoshov Jaxongir Rustam o''g''li', 'Laboratoriya boshlig''i', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'oyinchoqlar'), 176, '242 k', '2026-08-11'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Yo''ldoshov Jaxongir Rustam o''g''li' AND "position" = 'Laboratoriya boshlig''i');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT '0ea24bb2-c13c-4058-91ff-2dd36a4320c2', 'Abdullayeva Durdona Baxtiyorovna', 'Bosh mutaxassis', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'oyinchoqlar'), 177, '309 k', '2026-08-11'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Abdullayeva Durdona Baxtiyorovna' AND "position" = 'Bosh mutaxassis');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT '07dd1e74-cefa-44c0-8090-fd7f52aa7bd4', 'Mirsaitova Naima Mirsabitovna', 'Yetakchi mutaxassis', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'oyinchoqlar'), 178, '240 k', '2026-08-11'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Mirsaitova Naima Mirsabitovna' AND "position" = 'Yetakchi mutaxassis');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT '423dc22b-481a-422f-a2af-aab6fc719324', 'Saidaxmatova Sevara Bahodir qizi', 'Mutaxassis', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'oyinchoqlar'), NULL, '316 k', '2026-08-11'::timestamp, 'Dekretda', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Saidaxmatova Sevara Bahodir qizi' AND "position" = 'Mutaxassis');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT '8d9becf0-209d-497b-afae-40515269f2f0', 'Ochilov Diyorbek Oybek o''g''li', 'Mutaxassis', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'oyinchoqlar'), 179, '308 k', '2026-08-11'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Ochilov Diyorbek Oybek o''g''li' AND "position" = 'Mutaxassis');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT '3c7c60ec-3ab6-4e6d-b311-92ee919505c0', 'Abduvaxobov Ravshan Rustam o''g''li', 'Mutaxassis', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'oyinchoqlar'), 180, '241 k', '2026-08-11'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Abduvaxobov Ravshan Rustam o''g''li' AND "position" = 'Mutaxassis');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT '8ad72828-8d48-4986-b57e-ec5624dd7c75', 'Sodiqov Shahboz Fozil o''g''li', 'Laboratoriya boshlig''i', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'chirchiq'), 181, '368 k', '2026-08-11'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Sodiqov Shahboz Fozil o''g''li' AND "position" = 'Laboratoriya boshlig''i');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT '45c93453-a41f-4398-abb1-42cf299cb596', 'Valiyeva Orasta Sayfullaxonovna', 'Yetakchi mutaxassis', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'chirchiq'), 182, '289 k', '2026-08-11'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Valiyeva Orasta Sayfullaxonovna' AND "position" = 'Yetakchi mutaxassis');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT '8d90f23e-08b1-4d58-9d33-b3a9d902709d', 'Shokir Abdushukur Abdujalil o''g''li', 'Mutaxassis', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'chirchiq'), 183, '294 k', '2026-08-11'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Shokir Abdushukur Abdujalil o''g''li' AND "position" = 'Mutaxassis');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT '3e4120db-a18b-49cf-a5c0-36bd0796fdd0', 'Abdullajonov Asatullo Xikmatullo o''g''li', 'Laboratoriya boshlig''i', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'energiya-samaradorligi'), 184, '266 k', '2026-08-11'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Abdullajonov Asatullo Xikmatullo o''g''li' AND "position" = 'Laboratoriya boshlig''i');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT '7516aca8-8ab3-4482-a6a7-7f663446900a', 'Gadoyev Shuxrat Karimovich', 'Bosh mutaxassis', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'energiya-samaradorligi'), 185, '230 k', '2026-08-11'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Gadoyev Shuxrat Karimovich' AND "position" = 'Bosh mutaxassis');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT 'ef420f24-268f-4d2b-9146-f6e8350235ef', 'Shavkatov Aziz Omon o''g''li', 'Yetakchi mutaxassis', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'energiya-samaradorligi'), 186, '267 k', '2026-08-11'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Shavkatov Aziz Omon o''g''li' AND "position" = 'Yetakchi mutaxassis');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT '6221b004-c240-4c37-a6ca-abd583893b34', 'Guluyev Emin Sadraddin o''g''li', 'Mutaxassis', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'energiya-samaradorligi'), 187, '473 k', '2026-08-12'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Guluyev Emin Sadraddin o''g''li' AND "position" = 'Mutaxassis');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT '26279ecc-93c1-401f-b198-f8188cdab27c', 'Mamajonov Ismoiljon Isroiljon o''g''li', 'Mutaxassis', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'energiya-samaradorligi'), 188, '472 k', '2026-08-12'::timestamp, '0,5 stavka', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Mamajonov Ismoiljon Isroiljon o''g''li' AND "position" = 'Mutaxassis');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT 'd3555452-7b66-4df4-8fe7-9a04a2983c37', 'Po''latxodjayev Sultonmuhammadxon Ziyovuddinxo''ja o''g''li', 'Mutaxassis', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'energiya-samaradorligi'), 189, '355 k', '2026-08-11'::timestamp, '0,5 stavka', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Po''latxodjayev Sultonmuhammadxon Ziyovuddinxo''ja o''g''li' AND "position" = 'Mutaxassis');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT '4984846e-a2d7-42fc-a22a-6b0abe7e9e2b', 'Murodov Aziz Akrom o''g''li', 'Mutaxassis', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'energiya-samaradorligi'), NULL, '234 k', '2026-08-11'::timestamp, '0,5 stavka', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Murodov Aziz Akrom o''g''li' AND "position" = 'Mutaxassis');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT '7aa4a17f-ef5e-4af9-a03b-edc34905426f', 'Yakubov Ildar Shavkatovich', 'Mutaxassis', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'energiya-samaradorligi'), 190, '354 k', '2026-08-11'::timestamp, '0,5 stavka', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Yakubov Ildar Shavkatovich' AND "position" = 'Mutaxassis');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT 'd74f21dc-9015-4a1b-8163-e58f63c54452', 'Utbasarov Komoliddin Mamurovich', 'Mutaxassis', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'energiya-samaradorligi'), NULL, '235 k', '2026-08-11'::timestamp, '0,5 stavka', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Utbasarov Komoliddin Mamurovich' AND "position" = 'Mutaxassis');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT '9644e036-7700-4ef3-ae1d-93bfd5183aa5', 'Ruzimatov Sherzod Ismatullayevich', 'Ish yurituvchi', NULL, (SELECT id FROM "Laboratory" WHERE slug = 'energiya-samaradorligi'), 191, '243 k', '2026-08-11'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Ruzimatov Sherzod Ismatullayevich' AND "position" = 'Ish yurituvchi');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT 'c3f58efc-a2b4-428c-a91d-74a50fe8735b', 'Boboyorova Iroda Shovkatovna', 'Yetakchi mutaxassis', 'Namuna va hujjatlar qabul qilish byurosi', NULL, 192, '303 k', '2026-08-11'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Boboyorova Iroda Shovkatovna' AND "position" = 'Yetakchi mutaxassis');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT 'd0053ca5-769c-4c09-b575-acb4ba93585c', 'Isayeva Shaxnoza Ilxamovna', 'Yetakchi mutaxassis', 'Namuna va hujjatlar qabul qilish byurosi', NULL, 193, '302 k', '2026-08-11'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Isayeva Shaxnoza Ilxamovna' AND "position" = 'Yetakchi mutaxassis');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT '8eff23c0-5fe4-46e1-8777-d8390cac3851', 'G''aybullayeva Muxlisa Kutbullo qizi', 'Mutaxassis', 'Namuna va hujjatlar qabul qilish byurosi', NULL, 194, '304 k', '2026-08-11'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'G''aybullayeva Muxlisa Kutbullo qizi' AND "position" = 'Mutaxassis');
INSERT INTO "Staff" ("id", "fullName", "position", "specialization", "laboratoryId", "staffNumber", "employeeCode", "hireDate", "notes", "updatedAt")
SELECT '3f7f32ce-608f-46e8-bc8d-d46da85b61ff', 'Sharofiddinov Najmiddin Jaxongir o''g''li', 'Ish yurituvchi', 'Namuna va hujjatlar qabul qilish byurosi', NULL, 195, '305 k', '2026-08-11'::timestamp, NULL, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Staff" WHERE "fullName" = 'Sharofiddinov Najmiddin Jaxongir o''g''li' AND "position" = 'Ish yurituvchi');
