-- AlterTable
ALTER TABLE "ContextSnapshot" ADD COLUMN "targetType" TEXT;
ALTER TABLE "ContextSnapshot" ADD COLUMN "targetId" TEXT;
ALTER TABLE "ContextSnapshot" ADD COLUMN "sceneId" TEXT;
ALTER TABLE "ContextSnapshot" ADD COLUMN "metadata" JSONB;

-- DropIndex
DROP INDEX IF EXISTS "ContextSnapshot_projectId_createdAt_idx";

-- CreateIndex
CREATE INDEX "ContextSnapshot_projectId_purpose_createdAt_idx" ON "ContextSnapshot"("projectId", "purpose", "createdAt");

-- CreateIndex
CREATE INDEX "ContextSnapshot_projectId_targetType_targetId_createdAt_idx" ON "ContextSnapshot"("projectId", "targetType", "targetId", "createdAt");

-- CreateIndex
CREATE INDEX "ContextSnapshot_projectId_chapterId_createdAt_idx" ON "ContextSnapshot"("projectId", "chapterId", "createdAt");

-- CreateIndex
CREATE INDEX "ContextSnapshot_projectId_sceneId_createdAt_idx" ON "ContextSnapshot"("projectId", "sceneId", "createdAt");
