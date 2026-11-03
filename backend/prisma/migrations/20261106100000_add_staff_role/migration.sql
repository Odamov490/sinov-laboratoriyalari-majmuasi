-- Xodim (STAFF) roli. Alohida migratsiya: PostgreSQL'da yangi enum qiymati
-- shu tranzaksiyada ishlatilmasligi kerak.
ALTER TYPE "Role" ADD VALUE 'STAFF';
