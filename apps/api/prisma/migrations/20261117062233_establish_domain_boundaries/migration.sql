-- CreateEnum
CREATE TYPE "CanonStatus" AS ENUM ('draft', 'confirmed', 'archived');

-- CreateEnum
CREATE TYPE "ChapterStatus" AS ENUM ('draft', 'generating', 'reviewing', 'done', 'archived');

-- CreateEnum
CREATE TYPE "ChapterVersionSource" AS ENUM ('user', 'ai', 'imported');

-- CreateEnum
CREATE TYPE "GenerationTaskType" AS ENUM ('generateChapter', 'continueChapter', 'rewriteChapter', 'polishChapter', 'summarizeChapter', 'extractFacts');

-- CreateEnum
CREATE TYPE "GenerationTaskStatus" AS ENUM ('pending', 'running', 'succeeded', 'failed', 'canceled');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('running', 'succeeded', 'failed', 'canceled');

-- CreateEnum
CREATE TYPE "FactType" AS ENUM ('plot', 'character', 'world', 'relationship', 'item', 'location', 'custom');

-- CreateEnum
CREATE TYPE "WorldItemType" AS ENUM ('location', 'organization', 'rule', 'history', 'magic_system', 'technology', 'item', 'character_note', 'timeline_event', 'custom');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "genre" TEXT,
    "summary" TEXT,
    "writingStyle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Volume" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "summary" TEXT,
    "goal" TEXT,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Volume_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chapter" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "volumeId" TEXT,
    "title" TEXT NOT NULL,
    "plannedTitle" TEXT,
    "goal" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "summary" TEXT,
    "status" "ChapterStatus" NOT NULL DEFAULT 'draft',
    "currentVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChapterVersion" (
    "id" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "generationTaskId" TEXT,
    "source" "ChapterVersionSource" NOT NULL DEFAULT 'user',
    "content" TEXT NOT NULL,
    "changeSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChapterVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChapterPlan" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "chapterId" TEXT,
    "title" TEXT,
    "goal" TEXT,
    "outline" TEXT,
    "pov" TEXT,
    "constraints" JSONB,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ChapterPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChapterSummary" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "chapterVersionId" TEXT,
    "summary" TEXT NOT NULL,
    "keyEvents" JSONB,
    "characterChanges" JSONB,
    "newFacts" JSONB,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChapterSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Character" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "personality" TEXT,
    "motivation" TEXT,
    "appearance" TEXT,
    "voiceStyle" TEXT,
    "relationshipMap" JSONB,
    "arc" TEXT,
    "currentState" JSONB,
    "canonStatus" "CanonStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterState" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "chapterId" TEXT,
    "location" TEXT,
    "physicalState" TEXT,
    "emotionalState" TEXT,
    "goal" TEXT,
    "knownSecrets" JSONB,
    "relationshipChanges" JSONB,
    "statusNote" TEXT,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharacterState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorldItem" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" "WorldItemType" NOT NULL DEFAULT 'custom',
    "name" TEXT NOT NULL,
    "summary" TEXT,
    "content" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "importance" INTEGER NOT NULL DEFAULT 0,
    "canonStatus" "CanonStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "WorldItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fact" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" "FactType" NOT NULL DEFAULT 'custom',
    "content" TEXT NOT NULL,
    "entities" JSONB,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "confidence" DOUBLE PRECISION,
    "canonStatus" "CanonStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Fact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Relationship" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "relationType" TEXT NOT NULL,
    "description" TEXT,
    "strength" INTEGER,
    "canonStatus" "CanonStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Relationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromptTemplate" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromptTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromptVersion" (
    "id" TEXT NOT NULL,
    "promptTemplateId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "userPrompt" TEXT NOT NULL,
    "variablesSchema" JSONB,
    "outputSchema" JSONB,
    "changeLog" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromptVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromptRender" (
    "id" TEXT NOT NULL,
    "generationTaskId" TEXT NOT NULL,
    "promptVersionId" TEXT NOT NULL,
    "variables" JSONB NOT NULL,
    "renderedSystem" TEXT NOT NULL,
    "renderedUser" TEXT NOT NULL,
    "renderedHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromptRender_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContextSnapshot" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "chapterId" TEXT,
    "purpose" TEXT NOT NULL,
    "builderVersion" TEXT,
    "tokenEstimate" INTEGER,
    "sourceRefs" JSONB,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContextSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LLMProvider" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "baseUrl" TEXT,
    "model" TEXT NOT NULL,
    "config" JSONB,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LLMProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GenerationTask" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "chapterId" TEXT,
    "type" "GenerationTaskType" NOT NULL,
    "status" "GenerationTaskStatus" NOT NULL DEFAULT 'pending',
    "input" JSONB,
    "output" JSONB,
    "error" JSONB,
    "contextSnapshotId" TEXT,
    "promptVersionId" TEXT,
    "providerId" TEXT,
    "resultVersionId" TEXT,
    "tokenUsage" JSONB,
    "model" TEXT,
    "temperature" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "GenerationTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GenerationTaskAttempt" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "attemptNo" INTEGER NOT NULL,
    "status" "AttemptStatus" NOT NULL,
    "error" JSONB,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GenerationTaskAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GenerationEvent" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GenerationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeChunk" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "status" "CanonStatus" NOT NULL DEFAULT 'confirmed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeChunk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Project_deletedAt_idx" ON "Project"("deletedAt");

-- CreateIndex
CREATE INDEX "Volume_projectId_orderIndex_idx" ON "Volume"("projectId", "orderIndex");

-- CreateIndex
CREATE INDEX "Volume_deletedAt_idx" ON "Volume"("deletedAt");

-- CreateIndex
CREATE INDEX "Chapter_projectId_orderIndex_idx" ON "Chapter"("projectId", "orderIndex");

-- CreateIndex
CREATE INDEX "Chapter_volumeId_orderIndex_idx" ON "Chapter"("volumeId", "orderIndex");

-- CreateIndex
CREATE INDEX "Chapter_deletedAt_idx" ON "Chapter"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ChapterVersion_generationTaskId_key" ON "ChapterVersion"("generationTaskId");

-- CreateIndex
CREATE INDEX "ChapterVersion_chapterId_createdAt_idx" ON "ChapterVersion"("chapterId", "createdAt");

-- CreateIndex
CREATE INDEX "ChapterPlan_projectId_orderIndex_idx" ON "ChapterPlan"("projectId", "orderIndex");

-- CreateIndex
CREATE INDEX "ChapterPlan_projectId_chapterId_idx" ON "ChapterPlan"("projectId", "chapterId");

-- CreateIndex
CREATE INDEX "ChapterPlan_deletedAt_idx" ON "ChapterPlan"("deletedAt");

-- CreateIndex
CREATE INDEX "ChapterSummary_projectId_chapterId_createdAt_idx" ON "ChapterSummary"("projectId", "chapterId", "createdAt");

-- CreateIndex
CREATE INDEX "Character_projectId_name_idx" ON "Character"("projectId", "name");

-- CreateIndex
CREATE INDEX "Character_projectId_canonStatus_idx" ON "Character"("projectId", "canonStatus");

-- CreateIndex
CREATE INDEX "Character_deletedAt_idx" ON "Character"("deletedAt");

-- CreateIndex
CREATE INDEX "CharacterState_projectId_characterId_createdAt_idx" ON "CharacterState"("projectId", "characterId", "createdAt");

-- CreateIndex
CREATE INDEX "CharacterState_chapterId_idx" ON "CharacterState"("chapterId");

-- CreateIndex
CREATE INDEX "WorldItem_projectId_type_idx" ON "WorldItem"("projectId", "type");

-- CreateIndex
CREATE INDEX "WorldItem_projectId_canonStatus_idx" ON "WorldItem"("projectId", "canonStatus");

-- CreateIndex
CREATE INDEX "WorldItem_deletedAt_idx" ON "WorldItem"("deletedAt");

-- CreateIndex
CREATE INDEX "Fact_projectId_type_idx" ON "Fact"("projectId", "type");

-- CreateIndex
CREATE INDEX "Fact_projectId_canonStatus_idx" ON "Fact"("projectId", "canonStatus");

-- CreateIndex
CREATE INDEX "Fact_deletedAt_idx" ON "Fact"("deletedAt");

-- CreateIndex
CREATE INDEX "Relationship_projectId_sourceType_sourceId_idx" ON "Relationship"("projectId", "sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "Relationship_projectId_targetType_targetId_idx" ON "Relationship"("projectId", "targetType", "targetId");

-- CreateIndex
CREATE INDEX "Relationship_projectId_canonStatus_idx" ON "Relationship"("projectId", "canonStatus");

-- CreateIndex
CREATE INDEX "Relationship_deletedAt_idx" ON "Relationship"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PromptTemplate_projectId_name_key" ON "PromptTemplate"("projectId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "PromptVersion_promptTemplateId_version_key" ON "PromptVersion"("promptTemplateId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "PromptRender_generationTaskId_key" ON "PromptRender"("generationTaskId");

-- CreateIndex
CREATE INDEX "PromptRender_promptVersionId_idx" ON "PromptRender"("promptVersionId");

-- CreateIndex
CREATE INDEX "ContextSnapshot_projectId_createdAt_idx" ON "ContextSnapshot"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "LLMProvider_projectId_isEnabled_idx" ON "LLMProvider"("projectId", "isEnabled");

-- CreateIndex
CREATE UNIQUE INDEX "GenerationTask_resultVersionId_key" ON "GenerationTask"("resultVersionId");

-- CreateIndex
CREATE INDEX "GenerationTask_projectId_status_createdAt_idx" ON "GenerationTask"("projectId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "GenerationTask_providerId_idx" ON "GenerationTask"("providerId");

-- CreateIndex
CREATE INDEX "GenerationTaskAttempt_taskId_status_idx" ON "GenerationTaskAttempt"("taskId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "GenerationTaskAttempt_taskId_attemptNo_key" ON "GenerationTaskAttempt"("taskId", "attemptNo");

-- CreateIndex
CREATE INDEX "GenerationEvent_taskId_createdAt_idx" ON "GenerationEvent"("taskId", "createdAt");

-- CreateIndex
CREATE INDEX "KnowledgeChunk_projectId_sourceType_sourceId_idx" ON "KnowledgeChunk"("projectId", "sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "KnowledgeChunk_projectId_status_idx" ON "KnowledgeChunk"("projectId", "status");

-- AddForeignKey
ALTER TABLE "Volume" ADD CONSTRAINT "Volume_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_volumeId_fkey" FOREIGN KEY ("volumeId") REFERENCES "Volume"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapterVersion" ADD CONSTRAINT "ChapterVersion_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapterVersion" ADD CONSTRAINT "ChapterVersion_generationTaskId_fkey" FOREIGN KEY ("generationTaskId") REFERENCES "GenerationTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapterPlan" ADD CONSTRAINT "ChapterPlan_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapterPlan" ADD CONSTRAINT "ChapterPlan_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapterSummary" ADD CONSTRAINT "ChapterSummary_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapterSummary" ADD CONSTRAINT "ChapterSummary_chapterVersionId_fkey" FOREIGN KEY ("chapterVersionId") REFERENCES "ChapterVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterState" ADD CONSTRAINT "CharacterState_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterState" ADD CONSTRAINT "CharacterState_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterState" ADD CONSTRAINT "CharacterState_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorldItem" ADD CONSTRAINT "WorldItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fact" ADD CONSTRAINT "Fact_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromptTemplate" ADD CONSTRAINT "PromptTemplate_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromptVersion" ADD CONSTRAINT "PromptVersion_promptTemplateId_fkey" FOREIGN KEY ("promptTemplateId") REFERENCES "PromptTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromptRender" ADD CONSTRAINT "PromptRender_generationTaskId_fkey" FOREIGN KEY ("generationTaskId") REFERENCES "GenerationTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromptRender" ADD CONSTRAINT "PromptRender_promptVersionId_fkey" FOREIGN KEY ("promptVersionId") REFERENCES "PromptVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContextSnapshot" ADD CONSTRAINT "ContextSnapshot_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LLMProvider" ADD CONSTRAINT "LLMProvider_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenerationTask" ADD CONSTRAINT "GenerationTask_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenerationTask" ADD CONSTRAINT "GenerationTask_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenerationTask" ADD CONSTRAINT "GenerationTask_contextSnapshotId_fkey" FOREIGN KEY ("contextSnapshotId") REFERENCES "ContextSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenerationTask" ADD CONSTRAINT "GenerationTask_promptVersionId_fkey" FOREIGN KEY ("promptVersionId") REFERENCES "PromptVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenerationTask" ADD CONSTRAINT "GenerationTask_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "LLMProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenerationTaskAttempt" ADD CONSTRAINT "GenerationTaskAttempt_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "GenerationTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenerationEvent" ADD CONSTRAINT "GenerationEvent_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "GenerationTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeChunk" ADD CONSTRAINT "KnowledgeChunk_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
