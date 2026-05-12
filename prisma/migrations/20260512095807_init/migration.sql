-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "time" TEXT,
    "placeName" TEXT NOT NULL,
    "address" TEXT,
    "district" TEXT NOT NULL DEFAULT 'Inny',
    "category" TEXT NOT NULL DEFAULT 'Inne',
    "vibe" TEXT NOT NULL DEFAULT 'Kulturalne',
    "source" TEXT NOT NULL DEFAULT 'manual',
    "sourceId" TEXT,
    "score" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Event_district_idx" ON "Event"("district");

-- CreateIndex
CREATE INDEX "Event_category_idx" ON "Event"("category");

-- CreateIndex
CREATE INDEX "Event_vibe_idx" ON "Event"("vibe");

-- CreateIndex
CREATE INDEX "Event_score_idx" ON "Event"("score");

-- CreateIndex
CREATE INDEX "Event_startDate_idx" ON "Event"("startDate");

-- CreateIndex
CREATE UNIQUE INDEX "Event_title_startDate_placeName_key" ON "Event"("title", "startDate", "placeName");
