import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { BuildContextDto, ContextPurpose } from './dto/build-context.dto';

type SourceRef = { type: string; id: string; label?: string };
type JsonRecord = Record<string, any>;
type AnyRecord = Record<string, any>;

type BuiltContext = {
  projectId: string;
  purpose: ContextPurpose;
  targetType: 'chapter' | 'scene';
  targetId: string;
  chapterId?: string;
  sceneId?: string;
  payload: JsonRecord;
  sourceRefs: SourceRef[];
  tokenEstimate: number;
  metadata: JsonRecord;
  builderVersion: string;
};

const builderVersion = 'context-builder-p1';
const supportedPurposes = new Set<ContextPurpose>(['generate_chapter', 'generate_scene']);
const latestOrderBy = [{ createdAt: 'desc' as const }];
const chapterOrderBy = [{ orderIndex: 'asc' as const }, { createdAt: 'asc' as const }];
const importanceOrderBy = [{ importance: 'desc' as const }, { createdAt: 'asc' as const }];
const topAssetLimit = 12;

function trimId(value: string | null | undefined) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function positiveCount(value: number | undefined, fallback: number, max: number) {
  if (value === undefined || value === null) return fallback;
  if (!Number.isInteger(value) || value < 0) throw new BadRequestException('previousChapterCount must be a non-negative integer');
  return Math.min(value, max);
}

function addSourceRef(refs: SourceRef[], type: string, id: string | null | undefined, label?: string | null) {
  if (!id) return;
  if (refs.some((ref) => ref.type === type && ref.id === id)) return;
  refs.push({ type, id, ...(label ? { label } : {}) });
}

function compactRecord<T extends JsonRecord>(record: T): T {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && value !== null && value !== '')) as T;
}

function pickProject(project: AnyRecord) {
  return compactRecord({
    id: project.id,
    title: project.title,
    subtitle: project.subtitle,
    logline: project.logline,
    premise: project.premise,
    coreIdea: project.coreIdea,
    mainPlot: project.mainPlot,
    summary: project.summary,
    worldview: project.worldview,
    writingStyle: project.writingStyle,
    tone: project.tone,
    pov: project.pov,
    targetLength: project.targetLength,
    estimatedChapters: project.estimatedChapters,
    wordsPerChapter: project.wordsPerChapter,
    language: project.language,
    protagonist: project.protagonist,
  });
}

function pickChapter(chapter: AnyRecord) {
  return compactRecord({
    id: chapter.id,
    volumeId: chapter.volumeId,
    title: chapter.title,
    plannedTitle: chapter.plannedTitle,
    goal: chapter.goal,
    orderIndex: chapter.orderIndex,
    summary: chapter.summary,
    status: chapter.status,
  });
}

function pickVolume(volume: AnyRecord | null) {
  if (!volume) return null;
  return compactRecord({ id: volume.id, title: volume.title, orderIndex: volume.orderIndex, summary: volume.summary, goal: volume.goal, status: volume.status });
}

function pickChapterPlan(plan: AnyRecord | null) {
  if (!plan) return null;
  return compactRecord({ id: plan.id, volumeId: plan.volumeId, chapterId: plan.chapterId, title: plan.title, goal: plan.goal, outline: plan.outline, pov: plan.pov, constraints: plan.constraints, canonStatus: plan.canonStatus });
}

function pickChapterSummary(summary: AnyRecord) {
  return compactRecord({ id: summary.id, chapterId: summary.chapterId, summary: summary.summary, keyEvents: summary.keyEvents, characterChanges: summary.characterChanges, newFacts: summary.newFacts, canonStatus: summary.canonStatus });
}

function pickScene(scene: AnyRecord) {
  return compactRecord({
    id: scene.id,
    chapterId: scene.chapterId,
    title: scene.title,
    goal: scene.goal,
    orderIndex: scene.orderIndex,
    status: scene.status,
    storyTimeLabel: scene.storyTimeLabel,
    povCharacterId: scene.povCharacterId,
    primaryLocationId: scene.primaryLocationId,
    currentPlanId: scene.currentPlanId,
    canonStatus: scene.canonStatus,
  });
}

function pickScenePlan(plan: AnyRecord | null) {
  if (!plan) return null;
  return compactRecord({
    id: plan.id,
    chapterId: plan.chapterId,
    sceneId: plan.sceneId,
    chapterPlanId: plan.chapterPlanId,
    title: plan.title,
    goal: plan.goal,
    outline: plan.outline,
    conflict: plan.conflict,
    choice: plan.choice,
    consequence: plan.consequence,
    readerPromise: plan.readerPromise,
    readerPayoff: plan.readerPayoff,
    nextHook: plan.nextHook,
    constraints: plan.constraints,
    canonStatus: plan.canonStatus,
  });
}

function pickSceneSummary(summary: AnyRecord) {
  return compactRecord({
    id: summary.id,
    chapterId: summary.chapterId,
    sceneId: summary.sceneId,
    summary: summary.summary,
    keyEvents: summary.keyEvents,
    characterChanges: summary.characterChanges,
    locationChanges: summary.locationChanges,
    factionChanges: summary.factionChanges,
    worldRuleChanges: summary.worldRuleChanges,
    newFacts: summary.newFacts,
    readerVisibleInfo: summary.readerVisibleInfo,
    canonStatus: summary.canonStatus,
  });
}

function pickSceneHandoff(handoff: AnyRecord) {
  return compactRecord({
    id: handoff.id,
    chapterId: handoff.chapterId,
    sceneId: handoff.sceneId,
    nextSceneId: handoff.nextSceneId,
    readerKnows: handoff.readerKnows,
    actualChanges: handoff.actualChanges,
    openQuestions: handoff.openQuestions,
    promisesOpened: handoff.promisesOpened,
    promisesClosed: handoff.promisesClosed,
    nextSceneMust: handoff.nextSceneMust,
    riskNotes: handoff.riskNotes,
    canonStatus: handoff.canonStatus,
  });
}

function pickNamedAsset(asset: AnyRecord) {
  return compactRecord({
    id: asset.id,
    name: asset.name,
    title: asset.title,
    type: asset.type ?? asset.locationType ?? asset.factionType ?? asset.speciesType ?? asset.itemType ?? asset.abilityType ?? asset.ruleType,
    role: asset.role ?? asset.narrativeRole,
    summary: asset.summary,
    description: asset.description,
    content: asset.content,
    importance: asset.importance,
    canonStatus: asset.canonStatus,
  });
}

function pickDraft(draft: AnyRecord) {
  return compactRecord({ id: draft.id, targetType: draft.targetType, targetId: draft.targetId, draftType: draft.draftType, textPreview: draft.textPreview, payload: draft.payload, status: draft.status });
}

@Injectable()
export class ContextBuilderService {
  constructor(private readonly prisma: PrismaService) {}

  async preview(projectId: string, dto: BuildContextDto): Promise<BuiltContext> {
    const normalized = this.normalizeDto(dto);
    const project = await this.ensureProject(projectId);
    if (normalized.purpose === 'generate_chapter') return this.buildGenerateChapter(project, normalized);
    if (normalized.purpose === 'generate_scene') return this.buildGenerateScene(project, normalized);
    throw new BadRequestException(`Purpose ${normalized.purpose} is not supported in Context Builder P1`);
  }

  async createSnapshot(projectId: string, dto: BuildContextDto) {
    const built = await this.preview(projectId, dto);
    return this.prisma.contextSnapshot.create({
      data: {
        projectId: built.projectId,
        purpose: built.purpose,
        targetType: built.targetType,
        targetId: built.targetId,
        chapterId: built.chapterId ?? null,
        sceneId: built.sceneId ?? null,
        builderVersion: built.builderVersion,
        tokenEstimate: built.tokenEstimate,
        metadata: built.metadata as any,
        sourceRefs: built.sourceRefs as any,
        payload: built.payload as any,
      },
    });
  }

  async listSnapshots(projectId: string) {
    await this.ensureProject(projectId);
    return this.prisma.contextSnapshot.findMany({ where: { projectId }, orderBy: [{ createdAt: 'desc' }] });
  }

  async getSnapshot(projectId: string, snapshotId: string) {
    const id = trimId(snapshotId);
    if (!id) throw new BadRequestException('snapshotId is required');
    const snapshot = await this.prisma.contextSnapshot.findFirst({ where: { id, projectId } });
    if (!snapshot) throw new NotFoundException(`ContextSnapshot ${snapshotId} not found in project ${projectId}`);
    return snapshot;
  }

  private normalizeDto(dto: BuildContextDto): Required<Pick<BuildContextDto, 'purpose' | 'includeDrafts' | 'selectedDraftIds' | 'previousChapterCount'>> & Pick<BuildContextDto, 'chapterId' | 'sceneId'> {
    if (!dto || typeof dto !== 'object') throw new BadRequestException('request body is required');
    const purpose = dto.purpose;
    if (!supportedPurposes.has(purpose)) throw new BadRequestException(`purpose must be one of: ${Array.from(supportedPurposes).join(', ')}`);
    const selectedDraftIds = Array.isArray(dto.selectedDraftIds) ? [...new Set(dto.selectedDraftIds.map((id) => trimId(id)).filter(Boolean) as string[])] : [];
    return {
      purpose,
      chapterId: trimId(dto.chapterId),
      sceneId: trimId(dto.sceneId),
      includeDrafts: dto.includeDrafts === true,
      selectedDraftIds,
      previousChapterCount: positiveCount(dto.previousChapterCount, 3, 3),
    };
  }

  private async buildGenerateChapter(project: AnyRecord, dto: ReturnType<ContextBuilderService['normalizeDto']>): Promise<BuiltContext> {
    if (!dto.chapterId) throw new BadRequestException('chapterId is required for generate_chapter');
    const chapter = await this.ensureChapter(project.id, dto.chapterId);
    const refs: SourceRef[] = [];
    addSourceRef(refs, 'project', project.id, project.title);
    addSourceRef(refs, 'chapter', chapter.id, chapter.title);

    const [volume, chapterPlan, previousChapterSummaries, currentChapterSummary, scenes, assets, selectedDrafts] = await Promise.all([
      chapter.volumeId ? this.prisma.volume.findFirst({ where: { id: chapter.volumeId, projectId: project.id, deletedAt: null } }) : null,
      this.findChapterPlan(project.id, chapter.id),
      this.findPreviousChapterSummaries(project.id, chapter.orderIndex, dto.previousChapterCount),
      this.prisma.chapterSummary.findFirst({ where: { projectId: project.id, chapterId: chapter.id, canonStatus: 'confirmed', deletedAt: null }, orderBy: latestOrderBy }),
      this.prisma.scene.findMany({ where: { projectId: project.id, chapterId: chapter.id, deletedAt: null }, orderBy: chapterOrderBy }),
      this.findTopAssets(project.id),
      this.findSelectedDrafts(project.id, dto, ['chapter', chapter.id]),
    ]);

    if (volume) addSourceRef(refs, 'volume', volume.id, volume.title);
    if (chapterPlan) addSourceRef(refs, 'chapter_plan', chapterPlan.id, chapterPlan.title);
    previousChapterSummaries.forEach((summary) => addSourceRef(refs, 'chapter_summary', summary.id));
    if (currentChapterSummary) addSourceRef(refs, 'chapter_summary', currentChapterSummary.id);

    const sceneContexts = [];
    for (const scene of scenes.filter((item: AnyRecord) => item.canonStatus !== 'archived')) {
      addSourceRef(refs, 'scene', scene.id, scene.title);
      const [scenePlan, summary, handoff] = await Promise.all([
        this.findScenePlan(project.id, scene),
        this.prisma.sceneSummary.findFirst({ where: { projectId: project.id, sceneId: scene.id, canonStatus: 'confirmed', deletedAt: null }, orderBy: latestOrderBy }),
        this.prisma.sceneHandoff.findFirst({ where: { projectId: project.id, sceneId: scene.id, canonStatus: 'confirmed', deletedAt: null }, orderBy: latestOrderBy }),
      ]);
      if (scenePlan) addSourceRef(refs, 'scene_plan', scenePlan.id, scenePlan.title);
      if (summary) addSourceRef(refs, 'scene_summary', summary.id);
      if (handoff) addSourceRef(refs, 'scene_handoff', handoff.id);
      sceneContexts.push(compactRecord({ scene: pickScene(scene), currentPlan: pickScenePlan(scenePlan), confirmedSummary: summary ? pickSceneSummary(summary) : null, confirmedHandoff: handoff ? pickSceneHandoff(handoff) : null }));
    }

    this.addAssetRefs(refs, assets);
    selectedDrafts.forEach((draft) => addSourceRef(refs, 'generated_draft', draft.id, draft.textPreview));

    const payload = compactRecord({
      project: pickProject(project),
      volume: pickVolume(volume),
      chapter: pickChapter(chapter),
      chapterPlan: pickChapterPlan(chapterPlan),
      previousChapterSummaries: previousChapterSummaries.map(pickChapterSummary),
      currentChapterSummary: currentChapterSummary ? pickChapterSummary(currentChapterSummary) : null,
      scenes: sceneContexts,
      assets: this.pickAssets(assets),
      selectedDrafts: selectedDrafts.map(pickDraft),
    });

    return this.completeBuild(project.id, dto.purpose, 'chapter', chapter.id, chapter.id, undefined, payload, refs, dto);
  }

  private async buildGenerateScene(project: AnyRecord, dto: ReturnType<ContextBuilderService['normalizeDto']>): Promise<BuiltContext> {
    if (!dto.sceneId) throw new BadRequestException('sceneId is required for generate_scene');
    const scene = await this.ensureScene(project.id, dto.sceneId);
    const chapter = await this.ensureChapter(project.id, scene.chapterId);
    const refs: SourceRef[] = [];
    addSourceRef(refs, 'project', project.id, project.title);
    addSourceRef(refs, 'chapter', chapter.id, chapter.title);
    addSourceRef(refs, 'scene', scene.id, scene.title);

    const [chapterPlan, scenePlan, previousScenes, assets, povCharacter, primaryLocation, selectedDrafts] = await Promise.all([
      this.findChapterPlan(project.id, chapter.id),
      this.findScenePlan(project.id, scene),
      this.prisma.scene.findMany({ where: { projectId: project.id, chapterId: chapter.id, deletedAt: null }, orderBy: chapterOrderBy }),
      this.findTopAssets(project.id),
      scene.povCharacterId ? this.prisma.character.findFirst({ where: { id: scene.povCharacterId, projectId: project.id, canonStatus: 'confirmed', deletedAt: null } }) : null,
      scene.primaryLocationId ? this.prisma.location.findFirst({ where: { id: scene.primaryLocationId, projectId: project.id, canonStatus: 'confirmed', deletedAt: null } }) : null,
      this.findSelectedDrafts(project.id, dto, ['scene', scene.id]),
    ]);

    if (chapterPlan) addSourceRef(refs, 'chapter_plan', chapterPlan.id, chapterPlan.title);
    if (scenePlan) addSourceRef(refs, 'scene_plan', scenePlan.id, scenePlan.title);
    if (povCharacter) addSourceRef(refs, 'character', povCharacter.id, povCharacter.name);
    if (primaryLocation) addSourceRef(refs, 'location', primaryLocation.id, primaryLocation.name);

    const priorScenes = previousScenes.filter((item: AnyRecord) => item.orderIndex < scene.orderIndex && item.canonStatus !== 'archived');
    const priorSceneOrder = new Map(priorScenes.map((item: AnyRecord, index: number) => [item.id, index]));
    const previousSceneSummariesRaw = await this.prisma.sceneSummary.findMany({ where: { projectId: project.id, chapterId: chapter.id, sceneId: { in: priorScenes.map((item: AnyRecord) => item.id) }, canonStatus: 'confirmed', deletedAt: null }, orderBy: latestOrderBy });
    const previousSceneHandoffsRaw = await this.prisma.sceneHandoff.findMany({ where: { projectId: project.id, chapterId: chapter.id, sceneId: { in: priorScenes.map((item: AnyRecord) => item.id) }, canonStatus: 'confirmed', deletedAt: null }, orderBy: latestOrderBy });
    const previousSceneSummaries = this.latestPerScene(previousSceneSummariesRaw).sort((a, b) => (priorSceneOrder.get(a.sceneId) ?? 0) - (priorSceneOrder.get(b.sceneId) ?? 0));
    const previousSceneHandoffs = this.latestPerScene(previousSceneHandoffsRaw).sort((a, b) => (priorSceneOrder.get(a.sceneId) ?? 0) - (priorSceneOrder.get(b.sceneId) ?? 0));
    const previousHandoff = previousSceneHandoffs[previousSceneHandoffs.length - 1] ?? null;

    previousSceneSummaries.forEach((summary) => addSourceRef(refs, 'scene_summary', summary.id));
    previousSceneHandoffs.forEach((handoff) => addSourceRef(refs, 'scene_handoff', handoff.id));
    this.addAssetRefs(refs, assets);
    selectedDrafts.forEach((draft) => addSourceRef(refs, 'generated_draft', draft.id, draft.textPreview));

    const payload = compactRecord({
      project: pickProject(project),
      chapter: pickChapter(chapter),
      chapterPlan: pickChapterPlan(chapterPlan),
      scene: pickScene(scene),
      scenePlan: pickScenePlan(scenePlan),
      previousSceneSummaries: previousSceneSummaries.map(pickSceneSummary),
      previousSceneHandoffs: previousSceneHandoffs.map(pickSceneHandoff),
      previousHandoff: previousHandoff ? pickSceneHandoff(previousHandoff) : null,
      related: compactRecord({ povCharacter: povCharacter ? pickNamedAsset(povCharacter) : null, primaryLocation: primaryLocation ? pickNamedAsset(primaryLocation) : null }),
      assets: this.pickAssets(assets),
      selectedDrafts: selectedDrafts.map(pickDraft),
    });

    return this.completeBuild(project.id, dto.purpose, 'scene', scene.id, chapter.id, scene.id, payload, refs, dto);
  }

  private completeBuild(projectId: string, purpose: ContextPurpose, targetType: 'chapter' | 'scene', targetId: string, chapterId: string | undefined, sceneId: string | undefined, payload: JsonRecord, sourceRefs: SourceRef[], dto: ReturnType<ContextBuilderService['normalizeDto']>): BuiltContext {
    const tokenEstimate = Math.ceil(JSON.stringify(payload).length / 4);
    return {
      projectId,
      purpose,
      targetType,
      targetId,
      chapterId,
      sceneId,
      payload,
      sourceRefs,
      tokenEstimate,
      metadata: {
        includeDrafts: dto.includeDrafts,
        selectedDraftIds: dto.selectedDraftIds,
        previousChapterCount: dto.previousChapterCount,
        sourceRefCount: sourceRefs.length,
      },
      builderVersion,
    };
  }

  private async ensureProject(projectId: string) {
    const id = trimId(projectId);
    if (!id) throw new BadRequestException('projectId is required');
    const project = await this.prisma.project.findFirst({ where: { id, deletedAt: null } });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
    return project;
  }

  private async ensureChapter(projectId: string, chapterId: string) {
    const chapter = await this.prisma.chapter.findFirst({ where: { id: chapterId, projectId, deletedAt: null } });
    if (!chapter) throw new NotFoundException(`Chapter ${chapterId} not found in project ${projectId}`);
    return chapter;
  }

  private async ensureScene(projectId: string, sceneId: string) {
    const scene = await this.prisma.scene.findFirst({ where: { id: sceneId, projectId, deletedAt: null } });
    if (!scene || scene.canonStatus === 'archived') throw new NotFoundException(`Scene ${sceneId} not found in project ${projectId}`);
    return scene;
  }

  private async findChapterPlan(projectId: string, chapterId: string) {
    const confirmed = await this.prisma.chapterPlan.findFirst({ where: { projectId, chapterId, canonStatus: 'confirmed', deletedAt: null }, orderBy: latestOrderBy });
    if (confirmed) return confirmed;
    const plans = await this.prisma.chapterPlan.findMany({ where: { projectId, chapterId, deletedAt: null }, orderBy: latestOrderBy });
    return plans.find((plan: AnyRecord) => plan.canonStatus !== 'archived') ?? null;
  }

  private async findScenePlan(projectId: string, scene: AnyRecord) {
    if (scene.currentPlanId) {
      const current = await this.prisma.scenePlan.findFirst({ where: { id: scene.currentPlanId, projectId, sceneId: scene.id, deletedAt: null } });
      if (current && current.canonStatus !== 'archived') return current;
    }
    const confirmed = await this.prisma.scenePlan.findFirst({ where: { projectId, sceneId: scene.id, canonStatus: 'confirmed', deletedAt: null }, orderBy: latestOrderBy });
    if (confirmed) return confirmed;
    const plans = await this.prisma.scenePlan.findMany({ where: { projectId, sceneId: scene.id, deletedAt: null }, orderBy: latestOrderBy });
    return plans.find((plan: AnyRecord) => plan.canonStatus !== 'archived') ?? null;
  }

  private async findPreviousChapterSummaries(projectId: string, beforeOrderIndex: number, count: number) {
    if (count === 0) return [];
    const previousChapters = await this.prisma.chapter.findMany({ where: { projectId, orderIndex: { lt: beforeOrderIndex }, deletedAt: null }, orderBy: [{ orderIndex: 'desc' }, { createdAt: 'desc' }], take: count });
    const summaries = [];
    for (const chapter of previousChapters.reverse()) {
      const summary = await this.prisma.chapterSummary.findFirst({ where: { projectId, chapterId: chapter.id, canonStatus: 'confirmed', deletedAt: null }, orderBy: latestOrderBy });
      if (summary) summaries.push(summary);
    }
    return summaries;
  }

  private latestPerScene(rows: AnyRecord[]) {
    const byScene = new Map<string, AnyRecord>();
    for (const row of rows) {
      if (!byScene.has(row.sceneId)) byScene.set(row.sceneId, row);
    }
    return Array.from(byScene.values());
  }

  private async findTopAssets(projectId: string) {
    const [characters, locations, factions, species, worldRules, worldItems, storyItems, abilities] = await Promise.all([
      this.prisma.character.findMany({ where: { projectId, canonStatus: 'confirmed', deletedAt: null }, orderBy: importanceOrderBy, take: topAssetLimit }),
      this.prisma.location.findMany({ where: { projectId, canonStatus: 'confirmed', deletedAt: null }, orderBy: importanceOrderBy, take: topAssetLimit }),
      this.prisma.faction.findMany({ where: { projectId, canonStatus: 'confirmed', deletedAt: null }, orderBy: importanceOrderBy, take: topAssetLimit }),
      this.prisma.species.findMany({ where: { projectId, canonStatus: 'confirmed', deletedAt: null }, orderBy: importanceOrderBy, take: topAssetLimit }),
      this.prisma.worldRule.findMany({ where: { projectId, canonStatus: 'confirmed', deletedAt: null }, orderBy: importanceOrderBy, take: topAssetLimit }),
      this.prisma.worldItem.findMany({ where: { projectId, canonStatus: 'confirmed', deletedAt: null }, orderBy: importanceOrderBy, take: topAssetLimit }),
      this.prisma.storyItem.findMany({ where: { projectId, canonStatus: 'confirmed', deletedAt: null }, orderBy: importanceOrderBy, take: topAssetLimit }),
      this.prisma.ability.findMany({ where: { projectId, canonStatus: 'confirmed', deletedAt: null }, orderBy: importanceOrderBy, take: topAssetLimit }),
    ]);
    return { characters, locations, factions, species, worldRules, worldItems, storyItems, abilities };
  }

  private async findSelectedDrafts(projectId: string, dto: ReturnType<ContextBuilderService['normalizeDto']>, target: ['chapter' | 'scene', string]) {
    const drafts = await this.prisma.generatedDraft.findMany({ where: { projectId, status: 'pending', deletedAt: null }, orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }] });
    const selected = new Set(dto.selectedDraftIds);
    return drafts.filter((draft: AnyRecord) => {
      if (selected.has(draft.id)) return true;
      if (!dto.includeDrafts) return false;
      if (target[0] === 'chapter') return draft.targetId === target[1];
      return draft.targetId === target[1];
    });
  }

  private pickAssets(assets: Awaited<ReturnType<ContextBuilderService['findTopAssets']>>) {
    return {
      characters: assets.characters.map(pickNamedAsset),
      locations: assets.locations.map(pickNamedAsset),
      factions: assets.factions.map(pickNamedAsset),
      species: assets.species.map(pickNamedAsset),
      worldRules: assets.worldRules.map(pickNamedAsset),
      worldItems: assets.worldItems.map(pickNamedAsset),
      storyItems: assets.storyItems.map(pickNamedAsset),
      abilities: assets.abilities.map(pickNamedAsset),
    };
  }

  private addAssetRefs(refs: SourceRef[], assets: Awaited<ReturnType<ContextBuilderService['findTopAssets']>>) {
    assets.characters.forEach((asset) => addSourceRef(refs, 'character', asset.id, asset.name));
    assets.locations.forEach((asset) => addSourceRef(refs, 'location', asset.id, asset.name));
    assets.factions.forEach((asset) => addSourceRef(refs, 'faction', asset.id, asset.name));
    assets.species.forEach((asset) => addSourceRef(refs, 'species', asset.id, asset.name));
    assets.worldRules.forEach((asset) => addSourceRef(refs, 'world_rule', asset.id, asset.title));
    assets.worldItems.forEach((asset) => addSourceRef(refs, 'world_item', asset.id, asset.name));
    assets.storyItems.forEach((asset) => addSourceRef(refs, 'story_item', asset.id, asset.name));
    assets.abilities.forEach((asset) => addSourceRef(refs, 'ability', asset.id, asset.name));
  }
}
