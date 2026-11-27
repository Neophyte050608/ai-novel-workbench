-- CreateEnum
CREATE TYPE "GeneratedDraftStatus" AS ENUM ('pending', 'applied', 'discarded', 'superseded');

-- CreateTable
CREATE TABLE "GeneratedDraft" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "draftType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "textPreview" TEXT,
    "status" "GeneratedDraftStatus" NOT NULL DEFAULT 'pending',
    "sourceTaskId" TEXT,
    "feedback" TEXT,
    "previousDraftId" TEXT,
    "appliedTargetType" TEXT,
    "appliedTargetId" TEXT,
    "appliedAt" TIMESTAMP(3),
    "discardedAt" TIMESTAMP(3),
    "supersededAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "GeneratedDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GeneratedDraft_projectId_status_idx" ON "GeneratedDraft"("projectId", "status");

-- CreateIndex
CREATE INDEX "GeneratedDraft_projectId_targetType_targetId_status_idx" ON "GeneratedDraft"("projectId", "targetType", "targetId", "status");

-- CreateIndex
CREATE INDEX "GeneratedDraft_sourceTaskId_idx" ON "GeneratedDraft"("sourceTaskId");

-- CreateIndex
CREATE INDEX "GeneratedDraft_previousDraftId_idx" ON "GeneratedDraft"("previousDraftId");

-- CreateIndex
CREATE INDEX "GeneratedDraft_deletedAt_idx" ON "GeneratedDraft"("deletedAt");

-- AddForeignKey
ALTER TABLE "GeneratedDraft" ADD CONSTRAINT "GeneratedDraft_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedDraft" ADD CONSTRAINT "GeneratedDraft_previousDraftId_fkey" FOREIGN KEY ("previousDraftId") REFERENCES "GeneratedDraft"("id") ON DELETE SET NULL ON UPDATE CASCADE;
