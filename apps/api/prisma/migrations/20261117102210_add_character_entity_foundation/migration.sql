-- AlterEnum
ALTER TYPE "WorldItemType" ADD VALUE 'species';

-- AlterTable
ALTER TABLE "Character" ADD COLUMN     "background" TEXT,
ADD COLUMN     "importance" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "kind" TEXT,
ADD COLUMN     "lifeStatus" TEXT,
ADD COLUMN     "sourceId" TEXT,
ADD COLUMN     "sourceType" TEXT;

-- AlterTable
ALTER TABLE "CharacterState" ADD COLUMN     "orderIndex" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "stage" TEXT;

-- AlterTable
ALTER TABLE "Relationship" ADD COLUMN     "direction" TEXT,
ADD COLUMN     "endsAt" TEXT,
ADD COLUMN     "evidenceId" TEXT,
ADD COLUMN     "evidenceType" TEXT,
ADD COLUMN     "importance" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isCurrent" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "startsAt" TEXT;

-- CreateTable
CREATE TABLE "CharacterIdentity" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "startsAt" TEXT,
    "endsAt" TEXT,
    "importance" INTEGER NOT NULL DEFAULT 0,
    "canonStatus" "CanonStatus" NOT NULL DEFAULT 'draft',
    "sourceType" TEXT,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CharacterIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CharacterIdentity_projectId_characterId_idx" ON "CharacterIdentity"("projectId", "characterId");

-- CreateIndex
CREATE INDEX "CharacterIdentity_projectId_canonStatus_idx" ON "CharacterIdentity"("projectId", "canonStatus");

-- CreateIndex
CREATE INDEX "CharacterIdentity_projectId_importance_idx" ON "CharacterIdentity"("projectId", "importance");

-- CreateIndex
CREATE INDEX "CharacterIdentity_deletedAt_idx" ON "CharacterIdentity"("deletedAt");

-- CreateIndex
CREATE INDEX "CharacterState_projectId_characterId_orderIndex_idx" ON "CharacterState"("projectId", "characterId", "orderIndex");

-- AddForeignKey
ALTER TABLE "CharacterIdentity" ADD CONSTRAINT "CharacterIdentity_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterIdentity" ADD CONSTRAINT "CharacterIdentity_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;
