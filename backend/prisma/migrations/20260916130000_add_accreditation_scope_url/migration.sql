-- Admin-editable link to the accreditation-scope document on the official
-- akkred.uz system (changes frequently, so it's just a URL, not an upload).
ALTER TABLE "Accreditation" ADD COLUMN "scopeUrl" TEXT;
