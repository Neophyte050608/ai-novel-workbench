-- CreateTable
CREATE TABLE "Scene" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "title" TEXT,
    "goal" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "storyTimeLabel" TEXT,
    "povCharacterId" TEXT,
    "primaryLocationId" TEXT,
    "currentPlanId" TEXT,
    "currentVersionId" TEXT,
    "canonStatus" "CanonStatus" NOT NULL DEFAULT 'draft',
    "sourceType" TEXT,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Scene_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScenePlan" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "sceneId" TEXT NOT NULL,
    "chapterPlanId" TEXT,
    "title" TEXT,
    "goal" TEXT,
    "outline" TEXT,
    "conflict" TEXT,
    "choice" TEXT,
    "consequence" TEXT,
    "readerPromise" TEXT,
    "readerPayoff" TEXT,
    "nextHook" TEXT,
    "constraints" JSONB,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "canonStatus" "CanonStatus" NOT NULL DEFAULT 'draft',
    "sourceType" TEXT,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ScenePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SceneVersion" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "sceneId" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'user',
    "sourceType" TEXT,
    "sourceId" TEXT,
    "content" TEXT NOT NULL,
    "wordCount" INTEGER,
    "changeSummary" TEXT,
    "basedOnVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SceneVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SceneSummary" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "sceneId" TEXT NOT NULL,
    "sceneVersionId" TEXT,
    "summary" TEXT NOT NULL,
    "keyEvents" JSONB,
    "characterChanges" JSONB,
    "locationChanges" JSONB,
    "factionChanges" JSONB,
    "worldRuleChanges" JSONB,
    "newFacts" JSONB,
    "readerVisibleInfo" JSONB,
    "canonStatus" "CanonStatus" NOT NULL DEFAULT 'draft',
    "createdBy" TEXT,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SceneSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SceneHandoff" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "sceneId" TEXT NOT NULL,
    "sceneVersionId" TEXT,
    "nextSceneId" TEXT,
    "readerKnows" JSONB,
    "actualChanges" JSONB,
    "openQuestions" JSONB,
    "promisesOpened" JSONB,
    "promisesClosed" JSONB,
    "nextSceneMust" JSONB,
    "riskNotes" JSONB,
    "canonStatus" "CanonStatus" NOT NULL DEFAULT 'draft',
    "createdBy" TEXT,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SceneHandoff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Scene_projectId_chapterId_orderIndex_idx" ON "Scene"("projectId", "chapterId", "orderIndex");

-- CreateIndex
CREATE INDEX "Scene_projectId_status_orderIndex_idx" ON "Scene"("projectId", "status", "orderIndex");

-- CreateIndex
CREATE INDEX "Scene_projectId_canonStatus_idx" ON "Scene"("projectId", "canonStatus");

-- CreateIndex
CREATE INDEX "Scene_projectId_povCharacterId_idx" ON "Scene"("projectId", "povCharacterId");

-- CreateIndex
CREATE INDEX "Scene_projectId_primaryLocationId_idx" ON "Scene"("projectId", "primaryLocationId");

-- CreateIndex
CREATE INDEX "Scene_deletedAt_idx" ON "Scene"("deletedAt");

-- CreateIndex
CREATE INDEX "ScenePlan_projectId_sceneId_orderIndex_idx" ON "ScenePlan"("projectId", "sceneId", "orderIndex");

-- CreateIndex
CREATE INDEX "ScenePlan_projectId_chapterId_orderIndex_idx" ON "ScenePlan"("projectId", "chapterId", "orderIndex");

-- CreateIndex
CREATE INDEX "ScenePlan_projectId_chapterPlanId_idx" ON "ScenePlan"("projectId", "chapterPlanId");

-- CreateIndex
CREATE INDEX "ScenePlan_projectId_canonStatus_idx" ON "ScenePlan"("projectId", "canonStatus");

-- CreateIndex
CREATE INDEX "ScenePlan_deletedAt_idx" ON "ScenePlan"("deletedAt");

-- CreateIndex
CREATE INDEX "SceneVersion_projectId_sceneId_createdAt_idx" ON "SceneVersion"("projectId", "sceneId", "createdAt");

-- CreateIndex
CREATE INDEX "SceneVersion_projectId_chapterId_createdAt_idx" ON "SceneVersion"("projectId", "chapterId", "createdAt");

-- CreateIndex
CREATE INDEX "SceneVersion_projectId_source_idx" ON "SceneVersion"("projectId", "source");

-- CreateIndex
CREATE INDEX "SceneVersion_basedOnVersionId_idx" ON "SceneVersion"("basedOnVersionId");

-- CreateIndex
CREATE INDEX "SceneVersion_deletedAt_idx" ON "SceneVersion"("deletedAt");

-- CreateIndex
CREATE INDEX "SceneSummary_projectId_sceneId_createdAt_idx" ON "SceneSummary"("projectId", "sceneId", "createdAt");

-- CreateIndex
CREATE INDEX "SceneSummary_projectId_chapterId_createdAt_idx" ON "SceneSummary"("projectId", "chapterId", "createdAt");

-- CreateIndex
CREATE INDEX "SceneSummary_projectId_canonStatus_idx" ON "SceneSummary"("projectId", "canonStatus");

-- CreateIndex
CREATE INDEX "SceneSummary_sceneVersionId_idx" ON "SceneSummary"("sceneVersionId");

-- CreateIndex
CREATE INDEX "SceneSummary_deletedAt_idx" ON "SceneSummary"("deletedAt");

-- CreateIndex
CREATE INDEX "SceneHandoff_projectId_sceneId_createdAt_idx" ON "SceneHandoff"("projectId", "sceneId", "createdAt");

-- CreateIndex
CREATE INDEX "SceneHandoff_projectId_chapterId_createdAt_idx" ON "SceneHandoff"("projectId", "chapterId", "createdAt");

-- CreateIndex
CREATE INDEX "SceneHandoff_projectId_nextSceneId_idx" ON "SceneHandoff"("projectId", "nextSceneId");

-- CreateIndex
CREATE INDEX "SceneHandoff_projectId_canonStatus_idx" ON "SceneHandoff"("projectId", "canonStatus");

-- CreateIndex
CREATE INDEX "SceneHandoff_sceneVersionId_idx" ON "SceneHandoff"("sceneVersionId");

-- CreateIndex
CREATE INDEX "SceneHandoff_deletedAt_idx" ON "SceneHandoff"("deletedAt");

-- AddForeignKey
ALTER TABLE "Scene" ADD CONSTRAINT "Scene_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scene" ADD CONSTRAINT "Scene_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScenePlan" ADD CONSTRAINT "ScenePlan_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScenePlan" ADD CONSTRAINT "ScenePlan_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScenePlan" ADD CONSTRAINT "ScenePlan_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "Scene"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScenePlan" ADD CONSTRAINT "ScenePlan_chapterPlanId_fkey" FOREIGN KEY ("chapterPlanId") REFERENCES "ChapterPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SceneVersion" ADD CONSTRAINT "SceneVersion_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SceneVersion" ADD CONSTRAINT "SceneVersion_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SceneVersion" ADD CONSTRAINT "SceneVersion_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "Scene"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SceneVersion" ADD CONSTRAINT "SceneVersion_basedOnVersionId_fkey" FOREIGN KEY ("basedOnVersionId") REFERENCES "SceneVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SceneSummary" ADD CONSTRAINT "SceneSummary_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SceneSummary" ADD CONSTRAINT "SceneSummary_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SceneSummary" ADD CONSTRAINT "SceneSummary_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "Scene"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SceneSummary" ADD CONSTRAINT "SceneSummary_sceneVersionId_fkey" FOREIGN KEY ("sceneVersionId") REFERENCES "SceneVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SceneHandoff" ADD CONSTRAINT "SceneHandoff_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SceneHandoff" ADD CONSTRAINT "SceneHandoff_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SceneHandoff" ADD CONSTRAINT "SceneHandoff_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "Scene"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SceneHandoff" ADD CONSTRAINT "SceneHandoff_sceneVersionId_fkey" FOREIGN KEY ("sceneVersionId") REFERENCES "SceneVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
