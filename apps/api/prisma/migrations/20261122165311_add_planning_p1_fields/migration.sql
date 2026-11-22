-- AlterTable
ALTER TABLE "ChapterPlan" ADD COLUMN     "canonStatus" "CanonStatus" NOT NULL DEFAULT 'draft',
ADD COLUMN     "sourceId" TEXT,
ADD COLUMN     "sourceType" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'planned',
ADD COLUMN     "volumeId" TEXT;

-- CreateIndex
CREATE INDEX "ChapterPlan_projectId_volumeId_orderIndex_idx" ON "ChapterPlan"("projectId", "volumeId", "orderIndex");

-- CreateIndex
CREATE INDEX "ChapterPlan_projectId_status_idx" ON "ChapterPlan"("projectId", "status");

-- CreateIndex
CREATE INDEX "ChapterPlan_projectId_canonStatus_idx" ON "ChapterPlan"("projectId", "canonStatus");

-- AddForeignKey
ALTER TABLE "ChapterPlan" ADD CONSTRAINT "ChapterPlan_volumeId_fkey" FOREIGN KEY ("volumeId") REFERENCES "Volume"("id") ON DELETE SET NULL ON UPDATE CASCADE;
