-- CreateTable
CREATE TABLE "StoryItem" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "itemType" TEXT,
    "narrativeRole" TEXT,
    "summary" TEXT,
    "description" TEXT,
    "origin" TEXT,
    "appearance" TEXT,
    "function" TEXT,
    "effect" TEXT,
    "cost" TEXT,
    "limitation" TEXT,
    "owner" TEXT,
    "location" TEXT,
    "lifecycleStatus" TEXT,
    "visibility" TEXT,
    "importance" INTEGER NOT NULL DEFAULT 0,
    "canonStatus" "CanonStatus" NOT NULL DEFAULT 'draft',
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "StoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryItemState" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "storyItemId" TEXT NOT NULL,
    "chapterId" TEXT,
    "stage" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "owner" TEXT,
    "location" TEXT,
    "lifecycleStatus" TEXT,
    "visibility" TEXT,
    "condition" TEXT,
    "powerState" TEXT,
    "eventSummary" TEXT,
    "stateNote" TEXT,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoryItemState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryItemRule" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "storyItemId" TEXT NOT NULL,
    "worldRuleId" TEXT NOT NULL,
    "relationType" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "enforcementLevel" TEXT,
    "notes" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoryItemRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ability" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "abilityType" TEXT,
    "narrativeRole" TEXT,
    "summary" TEXT,
    "description" TEXT,
    "effect" TEXT,
    "cost" TEXT,
    "limitation" TEXT,
    "condition" TEXT,
    "source" TEXT,
    "progression" TEXT,
    "masteryNotes" TEXT,
    "countermeasure" TEXT,
    "visibility" TEXT,
    "importance" INTEGER NOT NULL DEFAULT 0,
    "canonStatus" "CanonStatus" NOT NULL DEFAULT 'draft',
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Ability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbilityRule" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "abilityId" TEXT NOT NULL,
    "worldRuleId" TEXT NOT NULL,
    "relationType" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "enforcementLevel" TEXT,
    "notes" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbilityRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StoryItem_projectId_name_idx" ON "StoryItem"("projectId", "name");

-- CreateIndex
CREATE INDEX "StoryItem_projectId_parentId_orderIndex_idx" ON "StoryItem"("projectId", "parentId", "orderIndex");

-- CreateIndex
CREATE INDEX "StoryItem_projectId_itemType_idx" ON "StoryItem"("projectId", "itemType");

-- CreateIndex
CREATE INDEX "StoryItem_projectId_lifecycleStatus_idx" ON "StoryItem"("projectId", "lifecycleStatus");

-- CreateIndex
CREATE INDEX "StoryItem_projectId_canonStatus_idx" ON "StoryItem"("projectId", "canonStatus");

-- CreateIndex
CREATE INDEX "StoryItem_projectId_importance_idx" ON "StoryItem"("projectId", "importance");

-- CreateIndex
CREATE INDEX "StoryItem_deletedAt_idx" ON "StoryItem"("deletedAt");

-- CreateIndex
CREATE INDEX "StoryItemState_projectId_storyItemId_createdAt_idx" ON "StoryItemState"("projectId", "storyItemId", "createdAt");

-- CreateIndex
CREATE INDEX "StoryItemState_projectId_storyItemId_orderIndex_idx" ON "StoryItemState"("projectId", "storyItemId", "orderIndex");

-- CreateIndex
CREATE INDEX "StoryItemState_projectId_chapterId_idx" ON "StoryItemState"("projectId", "chapterId");

-- CreateIndex
CREATE INDEX "StoryItemState_chapterId_idx" ON "StoryItemState"("chapterId");

-- CreateIndex
CREATE INDEX "StoryItemRule_projectId_storyItemId_orderIndex_idx" ON "StoryItemRule"("projectId", "storyItemId", "orderIndex");

-- CreateIndex
CREATE INDEX "StoryItemRule_projectId_worldRuleId_idx" ON "StoryItemRule"("projectId", "worldRuleId");

-- CreateIndex
CREATE INDEX "StoryItemRule_projectId_relationType_idx" ON "StoryItemRule"("projectId", "relationType");

-- CreateIndex
CREATE INDEX "Ability_projectId_name_idx" ON "Ability"("projectId", "name");

-- CreateIndex
CREATE INDEX "Ability_projectId_abilityType_idx" ON "Ability"("projectId", "abilityType");

-- CreateIndex
CREATE INDEX "Ability_projectId_canonStatus_idx" ON "Ability"("projectId", "canonStatus");

-- CreateIndex
CREATE INDEX "Ability_projectId_importance_idx" ON "Ability"("projectId", "importance");

-- CreateIndex
CREATE INDEX "Ability_deletedAt_idx" ON "Ability"("deletedAt");

-- CreateIndex
CREATE INDEX "AbilityRule_projectId_abilityId_orderIndex_idx" ON "AbilityRule"("projectId", "abilityId", "orderIndex");

-- CreateIndex
CREATE INDEX "AbilityRule_projectId_worldRuleId_idx" ON "AbilityRule"("projectId", "worldRuleId");

-- CreateIndex
CREATE INDEX "AbilityRule_projectId_relationType_idx" ON "AbilityRule"("projectId", "relationType");

-- AddForeignKey
ALTER TABLE "StoryItem" ADD CONSTRAINT "StoryItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryItem" ADD CONSTRAINT "StoryItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "StoryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryItemState" ADD CONSTRAINT "StoryItemState_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryItemState" ADD CONSTRAINT "StoryItemState_storyItemId_fkey" FOREIGN KEY ("storyItemId") REFERENCES "StoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryItemState" ADD CONSTRAINT "StoryItemState_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryItemRule" ADD CONSTRAINT "StoryItemRule_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryItemRule" ADD CONSTRAINT "StoryItemRule_storyItemId_fkey" FOREIGN KEY ("storyItemId") REFERENCES "StoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryItemRule" ADD CONSTRAINT "StoryItemRule_worldRuleId_fkey" FOREIGN KEY ("worldRuleId") REFERENCES "WorldRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ability" ADD CONSTRAINT "Ability_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbilityRule" ADD CONSTRAINT "AbilityRule_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbilityRule" ADD CONSTRAINT "AbilityRule_abilityId_fkey" FOREIGN KEY ("abilityId") REFERENCES "Ability"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbilityRule" ADD CONSTRAINT "AbilityRule_worldRuleId_fkey" FOREIGN KEY ("worldRuleId") REFERENCES "WorldRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
