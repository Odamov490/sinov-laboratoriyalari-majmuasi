-- Corrective fix: regulation item "101" (DEKLARATSIYA) was missing commas
-- between three pairs of glued TN VED codes in its raw range text
-- ("8418 50 190 0 8423", "8428 90 8432 10 000 0", "8433 59 8439 10 000").
-- The range parser reads a comma-less gap as one continuous range, so it
-- was treating the whole span from 8418.50.1900 to 8424.89.0009 (and
-- similarly for the other two gaps) as a single range, incorrectly pulling
-- in unrelated headings such as 8421 (pumps/compressors/centrifuges,
-- correctly covered by item 54/SERTIFIKAT instead) into item 101's
-- DEKLARATSIYA requirement.
UPDATE "TnVedRegulation"
SET "tnVedRaw" = '8417 10 000 0 — 8417 80 700 0, 8418 50 190 0, 8423 — 8424 89 000 9, 8426, 8428 20 800 1, 8428 33 000 0, 8428 90, 8432 10 000 0 — 8432 80 000 0, 8433 30 000 0, 8433 40 000, 8433 51 000, 8433 52 000 0, 8433 59, 8439 10 000 — 8439 30 000 0, 8440 10 — 8440 10 900 0, 8443 31 — 8443 39 390 0 (8443 32 100 дан ташқари), 8444 00 — 8447 90 000 9'
WHERE "id" = '25f70a39-c1bd-4196-ac3f-cb472e718c79';
