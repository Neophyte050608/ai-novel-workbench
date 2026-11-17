-- CreateTable
CREATE TABLE "WorldRule" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "content" TEXT,
    "ruleType" TEXT,
    "category" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'active',
    "condition" TEXT,
    "effect" TEXT,
    "cost" TEXT,
    "exception" TEXT,
    "violationConsequence" TEXT,
    "isHardRule" BOOLEAN NOT NULL DEFAULT false,
    "isRevealed" BOOLEAN NOT NULL DEFAULT false,
    "visibility" TEXT NOT NULL DEFAULT 'hidden',
    "importance" INTEGER NOT NULL DEFAULT 0,
    "canonStatus" "CanonStatus" NOT NULL DEFAULT 'draft',
    "sourceType" TEXT,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "WorldRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "locationType" TEXT,
    "narrativeRole" TEXT,
    "summary" TEXT,
    "description" TEXT,
    "environment" TEXT,
    "atmosphere" TEXT,
    "terrain" TEXT,
    "climate" TEXT,
    "accessRule" TEXT,
    "dangerLevel" TEXT,
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

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationState" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "chapterId" TEXT,
    "stage" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "lifecycleStatus" TEXT,
    "dangerLevel" TEXT,
    "accessRule" TEXT,
    "visibility" TEXT,
    "environmentChanges" TEXT,
    "controlSummary" TEXT,
    "eventSummary" TEXT,
    "stateNote" TEXT,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocationState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationRule" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "worldRuleId" TEXT NOT NULL,
    "relationType" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "enforcementLevel" TEXT,
    "notes" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationFaction" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "factionId" TEXT NOT NULL,
    "relationType" TEXT,
    "influenceLevel" TEXT,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TEXT,
    "endsAt" TEXT,
    "notes" TEXT,
    "canonStatus" "CanonStatus" NOT NULL DEFAULT 'draft',
    "sourceType" TEXT,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "LocationFaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Faction" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "factionType" TEXT,
    "narrativeRole" TEXT,
    "summary" TEXT,
    "description" TEXT,
    "ideology" TEXT,
    "goal" TEXT,
    "structure" TEXT,
    "resources" TEXT,
    "status" TEXT,
    "visibility" TEXT,
    "importance" INTEGER NOT NULL DEFAULT 0,
    "canonStatus" "CanonStatus" NOT NULL DEFAULT 'draft',
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Faction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FactionState" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "factionId" TEXT NOT NULL,
    "chapterId" TEXT,
    "stage" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT,
    "powerLevel" TEXT,
    "influenceLevel" TEXT,
    "resourceState" TEXT,
    "internalState" TEXT,
    "publicReputation" TEXT,
    "goal" TEXT,
    "conflictSummary" TEXT,
    "eventSummary" TEXT,
    "stateNote" TEXT,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FactionState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FactionMembership" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "factionId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "membershipType" TEXT,
    "roleTitle" TEXT,
    "rank" TEXT,
    "department" TEXT,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TEXT,
    "endsAt" TEXT,
    "notes" TEXT,
    "canonStatus" "CanonStatus" NOT NULL DEFAULT 'draft',
    "sourceType" TEXT,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "FactionMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FactionRelation" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "sourceFactionId" TEXT NOT NULL,
    "targetFactionId" TEXT NOT NULL,
    "relationType" TEXT,
    "direction" TEXT,
    "strength" TEXT,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TEXT,
    "endsAt" TEXT,
    "description" TEXT,
    "canonStatus" "CanonStatus" NOT NULL DEFAULT 'draft',
    "sourceType" TEXT,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "FactionRelation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FactionRule" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "factionId" TEXT NOT NULL,
    "worldRuleId" TEXT NOT NULL,
    "relationType" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "enforcementLevel" TEXT,
    "notes" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FactionRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Species" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "speciesType" TEXT,
    "narrativeRole" TEXT,
    "summary" TEXT,
    "description" TEXT,
    "appearance" TEXT,
    "lifespan" TEXT,
    "reproduction" TEXT,
    "socialStructure" TEXT,
    "rarity" TEXT,
    "status" TEXT,
    "visibility" TEXT,
    "importance" INTEGER NOT NULL DEFAULT 0,
    "canonStatus" "CanonStatus" NOT NULL DEFAULT 'draft',
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Species_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpeciesTrait" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "speciesId" TEXT NOT NULL,
    "traitType" TEXT,
    "name" TEXT NOT NULL,
    "summary" TEXT,
    "description" TEXT,
    "isInheritable" BOOLEAN NOT NULL DEFAULT false,
    "isCommon" BOOLEAN NOT NULL DEFAULT true,
    "importance" INTEGER NOT NULL DEFAULT 0,
    "canonStatus" "CanonStatus" NOT NULL DEFAULT 'draft',
    "sourceType" TEXT,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SpeciesTrait_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpeciesAbility" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "speciesId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "abilityType" TEXT,
    "summary" TEXT,
    "description" TEXT,
    "effect" TEXT,
    "cost" TEXT,
    "limitation" TEXT,
    "condition" TEXT,
    "inheritanceType" TEXT,
    "awakeningCondition" TEXT,
    "masteryNotes" TEXT,
    "isCommon" BOOLEAN NOT NULL DEFAULT true,
    "isInheritable" BOOLEAN NOT NULL DEFAULT false,
    "isUnique" BOOLEAN NOT NULL DEFAULT false,
    "visibility" TEXT,
    "importance" INTEGER NOT NULL DEFAULT 0,
    "canonStatus" "CanonStatus" NOT NULL DEFAULT 'draft',
    "sourceType" TEXT,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SpeciesAbility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpeciesRule" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "speciesId" TEXT NOT NULL,
    "worldRuleId" TEXT NOT NULL,
    "relationType" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "enforcementLevel" TEXT,
    "notes" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpeciesRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorldRule_projectId_ruleType_idx" ON "WorldRule"("projectId", "ruleType");

-- CreateIndex
CREATE INDEX "WorldRule_projectId_category_idx" ON "WorldRule"("projectId", "category");

-- CreateIndex
CREATE INDEX "WorldRule_projectId_status_idx" ON "WorldRule"("projectId", "status");

-- CreateIndex
CREATE INDEX "WorldRule_projectId_canonStatus_idx" ON "WorldRule"("projectId", "canonStatus");

-- CreateIndex
CREATE INDEX "WorldRule_projectId_importance_idx" ON "WorldRule"("projectId", "importance");

-- CreateIndex
CREATE INDEX "WorldRule_deletedAt_idx" ON "WorldRule"("deletedAt");

-- CreateIndex
CREATE INDEX "Location_projectId_name_idx" ON "Location"("projectId", "name");

-- CreateIndex
CREATE INDEX "Location_projectId_parentId_orderIndex_idx" ON "Location"("projectId", "parentId", "orderIndex");

-- CreateIndex
CREATE INDEX "Location_projectId_locationType_idx" ON "Location"("projectId", "locationType");

-- CreateIndex
CREATE INDEX "Location_projectId_lifecycleStatus_idx" ON "Location"("projectId", "lifecycleStatus");

-- CreateIndex
CREATE INDEX "Location_projectId_canonStatus_idx" ON "Location"("projectId", "canonStatus");

-- CreateIndex
CREATE INDEX "Location_projectId_importance_idx" ON "Location"("projectId", "importance");

-- CreateIndex
CREATE INDEX "Location_deletedAt_idx" ON "Location"("deletedAt");

-- CreateIndex
CREATE INDEX "LocationState_projectId_locationId_createdAt_idx" ON "LocationState"("projectId", "locationId", "createdAt");

-- CreateIndex
CREATE INDEX "LocationState_projectId_locationId_orderIndex_idx" ON "LocationState"("projectId", "locationId", "orderIndex");

-- CreateIndex
CREATE INDEX "LocationState_projectId_chapterId_idx" ON "LocationState"("projectId", "chapterId");

-- CreateIndex
CREATE INDEX "LocationState_chapterId_idx" ON "LocationState"("chapterId");

-- CreateIndex
CREATE INDEX "LocationRule_projectId_locationId_orderIndex_idx" ON "LocationRule"("projectId", "locationId", "orderIndex");

-- CreateIndex
CREATE INDEX "LocationRule_projectId_worldRuleId_idx" ON "LocationRule"("projectId", "worldRuleId");

-- CreateIndex
CREATE INDEX "LocationRule_projectId_relationType_idx" ON "LocationRule"("projectId", "relationType");

-- CreateIndex
CREATE INDEX "LocationFaction_projectId_locationId_idx" ON "LocationFaction"("projectId", "locationId");

-- CreateIndex
CREATE INDEX "LocationFaction_projectId_factionId_idx" ON "LocationFaction"("projectId", "factionId");

-- CreateIndex
CREATE INDEX "LocationFaction_projectId_relationType_idx" ON "LocationFaction"("projectId", "relationType");

-- CreateIndex
CREATE INDEX "LocationFaction_projectId_isCurrent_idx" ON "LocationFaction"("projectId", "isCurrent");

-- CreateIndex
CREATE INDEX "LocationFaction_projectId_canonStatus_idx" ON "LocationFaction"("projectId", "canonStatus");

-- CreateIndex
CREATE INDEX "LocationFaction_deletedAt_idx" ON "LocationFaction"("deletedAt");

-- CreateIndex
CREATE INDEX "Faction_projectId_name_idx" ON "Faction"("projectId", "name");

-- CreateIndex
CREATE INDEX "Faction_projectId_parentId_orderIndex_idx" ON "Faction"("projectId", "parentId", "orderIndex");

-- CreateIndex
CREATE INDEX "Faction_projectId_factionType_idx" ON "Faction"("projectId", "factionType");

-- CreateIndex
CREATE INDEX "Faction_projectId_status_idx" ON "Faction"("projectId", "status");

-- CreateIndex
CREATE INDEX "Faction_projectId_canonStatus_idx" ON "Faction"("projectId", "canonStatus");

-- CreateIndex
CREATE INDEX "Faction_projectId_importance_idx" ON "Faction"("projectId", "importance");

-- CreateIndex
CREATE INDEX "Faction_deletedAt_idx" ON "Faction"("deletedAt");

-- CreateIndex
CREATE INDEX "FactionState_projectId_factionId_createdAt_idx" ON "FactionState"("projectId", "factionId", "createdAt");

-- CreateIndex
CREATE INDEX "FactionState_projectId_factionId_orderIndex_idx" ON "FactionState"("projectId", "factionId", "orderIndex");

-- CreateIndex
CREATE INDEX "FactionState_projectId_chapterId_idx" ON "FactionState"("projectId", "chapterId");

-- CreateIndex
CREATE INDEX "FactionState_chapterId_idx" ON "FactionState"("chapterId");

-- CreateIndex
CREATE INDEX "FactionMembership_projectId_factionId_idx" ON "FactionMembership"("projectId", "factionId");

-- CreateIndex
CREATE INDEX "FactionMembership_projectId_characterId_idx" ON "FactionMembership"("projectId", "characterId");

-- CreateIndex
CREATE INDEX "FactionMembership_projectId_membershipType_idx" ON "FactionMembership"("projectId", "membershipType");

-- CreateIndex
CREATE INDEX "FactionMembership_projectId_isCurrent_idx" ON "FactionMembership"("projectId", "isCurrent");

-- CreateIndex
CREATE INDEX "FactionMembership_projectId_canonStatus_idx" ON "FactionMembership"("projectId", "canonStatus");

-- CreateIndex
CREATE INDEX "FactionMembership_deletedAt_idx" ON "FactionMembership"("deletedAt");

-- CreateIndex
CREATE INDEX "FactionRelation_projectId_sourceFactionId_idx" ON "FactionRelation"("projectId", "sourceFactionId");

-- CreateIndex
CREATE INDEX "FactionRelation_projectId_targetFactionId_idx" ON "FactionRelation"("projectId", "targetFactionId");

-- CreateIndex
CREATE INDEX "FactionRelation_projectId_relationType_idx" ON "FactionRelation"("projectId", "relationType");

-- CreateIndex
CREATE INDEX "FactionRelation_projectId_isCurrent_idx" ON "FactionRelation"("projectId", "isCurrent");

-- CreateIndex
CREATE INDEX "FactionRelation_projectId_canonStatus_idx" ON "FactionRelation"("projectId", "canonStatus");

-- CreateIndex
CREATE INDEX "FactionRelation_deletedAt_idx" ON "FactionRelation"("deletedAt");

-- CreateIndex
CREATE INDEX "FactionRule_projectId_factionId_orderIndex_idx" ON "FactionRule"("projectId", "factionId", "orderIndex");

-- CreateIndex
CREATE INDEX "FactionRule_projectId_worldRuleId_idx" ON "FactionRule"("projectId", "worldRuleId");

-- CreateIndex
CREATE INDEX "FactionRule_projectId_relationType_idx" ON "FactionRule"("projectId", "relationType");

-- CreateIndex
CREATE INDEX "Species_projectId_name_idx" ON "Species"("projectId", "name");

-- CreateIndex
CREATE INDEX "Species_projectId_parentId_orderIndex_idx" ON "Species"("projectId", "parentId", "orderIndex");

-- CreateIndex
CREATE INDEX "Species_projectId_speciesType_idx" ON "Species"("projectId", "speciesType");

-- CreateIndex
CREATE INDEX "Species_projectId_status_idx" ON "Species"("projectId", "status");

-- CreateIndex
CREATE INDEX "Species_projectId_rarity_idx" ON "Species"("projectId", "rarity");

-- CreateIndex
CREATE INDEX "Species_projectId_canonStatus_idx" ON "Species"("projectId", "canonStatus");

-- CreateIndex
CREATE INDEX "Species_projectId_importance_idx" ON "Species"("projectId", "importance");

-- CreateIndex
CREATE INDEX "Species_deletedAt_idx" ON "Species"("deletedAt");

-- CreateIndex
CREATE INDEX "SpeciesTrait_projectId_speciesId_idx" ON "SpeciesTrait"("projectId", "speciesId");

-- CreateIndex
CREATE INDEX "SpeciesTrait_projectId_traitType_idx" ON "SpeciesTrait"("projectId", "traitType");

-- CreateIndex
CREATE INDEX "SpeciesTrait_projectId_canonStatus_idx" ON "SpeciesTrait"("projectId", "canonStatus");

-- CreateIndex
CREATE INDEX "SpeciesTrait_projectId_importance_idx" ON "SpeciesTrait"("projectId", "importance");

-- CreateIndex
CREATE INDEX "SpeciesTrait_deletedAt_idx" ON "SpeciesTrait"("deletedAt");

-- CreateIndex
CREATE INDEX "SpeciesAbility_projectId_speciesId_idx" ON "SpeciesAbility"("projectId", "speciesId");

-- CreateIndex
CREATE INDEX "SpeciesAbility_projectId_abilityType_idx" ON "SpeciesAbility"("projectId", "abilityType");

-- CreateIndex
CREATE INDEX "SpeciesAbility_projectId_inheritanceType_idx" ON "SpeciesAbility"("projectId", "inheritanceType");

-- CreateIndex
CREATE INDEX "SpeciesAbility_projectId_canonStatus_idx" ON "SpeciesAbility"("projectId", "canonStatus");

-- CreateIndex
CREATE INDEX "SpeciesAbility_projectId_importance_idx" ON "SpeciesAbility"("projectId", "importance");

-- CreateIndex
CREATE INDEX "SpeciesAbility_deletedAt_idx" ON "SpeciesAbility"("deletedAt");

-- CreateIndex
CREATE INDEX "SpeciesRule_projectId_speciesId_orderIndex_idx" ON "SpeciesRule"("projectId", "speciesId", "orderIndex");

-- CreateIndex
CREATE INDEX "SpeciesRule_projectId_worldRuleId_idx" ON "SpeciesRule"("projectId", "worldRuleId");

-- CreateIndex
CREATE INDEX "SpeciesRule_projectId_relationType_idx" ON "SpeciesRule"("projectId", "relationType");

-- AddForeignKey
ALTER TABLE "WorldRule" ADD CONSTRAINT "WorldRule_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationState" ADD CONSTRAINT "LocationState_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationState" ADD CONSTRAINT "LocationState_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationState" ADD CONSTRAINT "LocationState_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationRule" ADD CONSTRAINT "LocationRule_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationRule" ADD CONSTRAINT "LocationRule_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationRule" ADD CONSTRAINT "LocationRule_worldRuleId_fkey" FOREIGN KEY ("worldRuleId") REFERENCES "WorldRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationFaction" ADD CONSTRAINT "LocationFaction_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationFaction" ADD CONSTRAINT "LocationFaction_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationFaction" ADD CONSTRAINT "LocationFaction_factionId_fkey" FOREIGN KEY ("factionId") REFERENCES "Faction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Faction" ADD CONSTRAINT "Faction_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Faction" ADD CONSTRAINT "Faction_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Faction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactionState" ADD CONSTRAINT "FactionState_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactionState" ADD CONSTRAINT "FactionState_factionId_fkey" FOREIGN KEY ("factionId") REFERENCES "Faction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactionState" ADD CONSTRAINT "FactionState_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactionMembership" ADD CONSTRAINT "FactionMembership_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactionMembership" ADD CONSTRAINT "FactionMembership_factionId_fkey" FOREIGN KEY ("factionId") REFERENCES "Faction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactionMembership" ADD CONSTRAINT "FactionMembership_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactionRelation" ADD CONSTRAINT "FactionRelation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactionRelation" ADD CONSTRAINT "FactionRelation_sourceFactionId_fkey" FOREIGN KEY ("sourceFactionId") REFERENCES "Faction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactionRelation" ADD CONSTRAINT "FactionRelation_targetFactionId_fkey" FOREIGN KEY ("targetFactionId") REFERENCES "Faction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactionRule" ADD CONSTRAINT "FactionRule_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactionRule" ADD CONSTRAINT "FactionRule_factionId_fkey" FOREIGN KEY ("factionId") REFERENCES "Faction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactionRule" ADD CONSTRAINT "FactionRule_worldRuleId_fkey" FOREIGN KEY ("worldRuleId") REFERENCES "WorldRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Species" ADD CONSTRAINT "Species_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Species" ADD CONSTRAINT "Species_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Species"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeciesTrait" ADD CONSTRAINT "SpeciesTrait_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeciesTrait" ADD CONSTRAINT "SpeciesTrait_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeciesAbility" ADD CONSTRAINT "SpeciesAbility_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeciesAbility" ADD CONSTRAINT "SpeciesAbility_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeciesRule" ADD CONSTRAINT "SpeciesRule_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeciesRule" ADD CONSTRAINT "SpeciesRule_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "Species"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeciesRule" ADD CONSTRAINT "SpeciesRule_worldRuleId_fkey" FOREIGN KEY ("worldRuleId") REFERENCES "WorldRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
