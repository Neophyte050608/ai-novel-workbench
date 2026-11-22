-- Add chapter summary workflow metadata for manual maintenance and scene rollups.
ALTER TABLE "ChapterSummary" ADD COLUMN "canonStatus" "CanonStatus" NOT NULL DEFAULT 'draft';
ALTER TABLE "ChapterSummary" ADD COLUMN "sourceType" TEXT;
ALTER TABLE "ChapterSummary" ADD COLUMN "sourceId" TEXT;
ALTER TABLE "ChapterSummary" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Backfill project relation from the owning chapter and enforce the FK going forward.
UPDATE "ChapterSummary" AS cs
SET "projectId" = c."projectId"
FROM "Chapter" AS c
WHERE cs."chapterId" = c."id";

ALTER TABLE "ChapterSummary" ADD CONSTRAINT "ChapterSummary_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "ChapterSummary_projectId_canonStatus_idx" ON "ChapterSummary"("projectId", "canonStatus");
CREATE INDEX "ChapterSummary_chapterVersionId_idx" ON "ChapterSummary"("chapterVersionId");
CREATE INDEX "ChapterSummary_deletedAt_idx" ON "ChapterSummary"("deletedAt");
