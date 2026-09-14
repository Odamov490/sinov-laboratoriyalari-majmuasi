-- Reference PDFs (Resolutions No. 502 and No. 43) for the declaration-vs-certificate
-- info page, uploaded by admins via the existing /admin/uploads endpoint.
ALTER TABLE "InfoPage"
  ADD COLUMN "document502Url" TEXT,
  ADD COLUMN "document43Url" TEXT;
