-- CreateTable
CREATE TABLE "PageViewDaily" (
    "date" DATE NOT NULL,
    "path" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PageViewDaily_pkey" PRIMARY KEY ("date","path")
);

-- CreateIndex
CREATE INDEX "PageViewDaily_date_idx" ON "PageViewDaily"("date");

