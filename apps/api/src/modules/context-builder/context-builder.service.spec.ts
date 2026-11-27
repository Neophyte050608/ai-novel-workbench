import { strict as assert } from 'node:assert';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ContextBuilderService } from './context-builder.service';

type AnyRecord = Record<string, any>;

function createPrismaStub() {
  const now = new Date('2026-11-27T00:00:00.000Z');
  const projects: AnyRecord[] = [{
    id: 'project-1',
    title: '星海遗民',
    logline: '少女在废墟星海中寻找失落王座',
    premise: '王座会选择愿意牺牲的人',
    coreIdea: '权力与记忆互为代价',
    mainPlot: '主角追索星门真相',
    summary: '银河帝国崩塌后的冒险故事',
    worldview: '群星之间存在记忆潮汐',
    writingStyle: '冷峻诗性',
    tone: '史诗、悬疑',
    pov: '第三人称有限视角',
    targetLength: '30万字',
    wordsPerChapter: 5000,
    deletedAt: null,
  }, { id: 'project-2', title: '旁支项目', deletedAt: null }];
  const volumes: AnyRecord[] = [{ id: 'volume-1', projectId: 'project-1', title: '第一卷', summary: '启程', goal: '找到星门', orderIndex: 0, deletedAt: null }];
  const chapters: AnyRecord[] = [
    { id: 'chapter-0', projectId: 'project-1', volumeId: 'volume-1', title: '序章', goal: '展示灾难', orderIndex: 0, deletedAt: null },
    { id: 'chapter-1', projectId: 'project-1', volumeId: 'volume-1', title: '星门之前', goal: '进入遗迹', orderIndex: 1, deletedAt: null },
    { id: 'chapter-other', projectId: 'project-2', volumeId: null, title: '边界', orderIndex: 0, deletedAt: null },
  ];
  const chapterPlans: AnyRecord[] = [
    { id: 'chapter-plan-draft', projectId: 'project-1', chapterId: 'chapter-1', title: '草稿计划', outline: '不应优先', canonStatus: 'draft', createdAt: new Date('2026-11-26T00:00:00Z'), deletedAt: null },
    { id: 'chapter-plan-confirmed', projectId: 'project-1', chapterId: 'chapter-1', title: '确认计划', goal: '揭开第一道门', outline: '潜入、受阻、付出代价', pov: '林眠', canonStatus: 'confirmed', createdAt: new Date('2026-11-25T00:00:00Z'), deletedAt: null },
  ];
  const chapterSummaries: AnyRecord[] = [
    { id: 'chapter-summary-prev', projectId: 'project-1', chapterId: 'chapter-0', summary: '母星陷落，主角带走星图。', canonStatus: 'confirmed', createdAt: new Date('2026-11-24T00:00:00Z'), deletedAt: null },
    { id: 'chapter-summary-draft', projectId: 'project-1', chapterId: 'chapter-0', summary: '未确认摘要不应出现', canonStatus: 'draft', createdAt: new Date('2026-11-26T00:00:00Z'), deletedAt: null },
    { id: 'chapter-summary-current', projectId: 'project-1', chapterId: 'chapter-1', summary: '当前章已有确认摘要。', canonStatus: 'confirmed', createdAt: new Date('2026-11-27T00:00:00Z'), deletedAt: null },
  ];
  const scenes: AnyRecord[] = [
    { id: 'scene-1', projectId: 'project-1', chapterId: 'chapter-1', title: '抵达遗迹', goal: '找到入口', orderIndex: 0, povCharacterId: 'character-1', primaryLocationId: 'location-1', currentPlanId: 'scene-plan-1', canonStatus: 'confirmed', deletedAt: null },
    { id: 'scene-2', projectId: 'project-1', chapterId: 'chapter-1', title: '门前交易', goal: '交换秘密', orderIndex: 1, povCharacterId: 'character-1', primaryLocationId: 'location-1', currentPlanId: 'scene-plan-2', canonStatus: 'confirmed', deletedAt: null },
    { id: 'scene-archived', projectId: 'project-1', chapterId: 'chapter-1', title: '废弃场景', orderIndex: 2, canonStatus: 'archived', deletedAt: new Date('2026-11-27T01:00:00Z') },
  ];
  const scenePlans: AnyRecord[] = [
    { id: 'scene-plan-1', projectId: 'project-1', chapterId: 'chapter-1', sceneId: 'scene-1', title: '进入遗迹', outline: '主角找到入口', canonStatus: 'confirmed', createdAt: new Date('2026-11-25T00:00:00Z'), deletedAt: null },
    { id: 'scene-plan-2', projectId: 'project-1', chapterId: 'chapter-1', sceneId: 'scene-2', title: '秘密交易', outline: '主角用记忆换钥匙', canonStatus: 'confirmed', createdAt: new Date('2026-11-26T00:00:00Z'), deletedAt: null },
  ];
  const sceneSummaries: AnyRecord[] = [
    { id: 'scene-summary-1', projectId: 'project-1', chapterId: 'chapter-1', sceneId: 'scene-1', summary: '主角抵达遗迹入口。', canonStatus: 'confirmed', createdAt: new Date('2026-11-26T00:00:00Z'), deletedAt: null },
    { id: 'scene-summary-draft', projectId: 'project-1', chapterId: 'chapter-1', sceneId: 'scene-2', summary: '未确认场景摘要不应出现', canonStatus: 'draft', createdAt: new Date('2026-11-27T00:00:00Z'), deletedAt: null },
  ];
  const sceneHandoffs: AnyRecord[] = [{ id: 'scene-handoff-1', projectId: 'project-1', chapterId: 'chapter-1', sceneId: 'scene-1', nextSceneId: 'scene-2', readerKnows: ['遗迹需要记忆开门'], nextSceneMust: ['解释代价'], canonStatus: 'confirmed', createdAt: new Date('2026-11-26T01:00:00Z'), deletedAt: null }];
  const characters: AnyRecord[] = [
    { id: 'character-1', projectId: 'project-1', name: '林眠', role: 'protagonist', summary: '失忆的领航员', importance: 10, canonStatus: 'confirmed', deletedAt: null },
    { id: 'character-draft', projectId: 'project-1', name: '草稿角色', summary: '不应出现', importance: 99, canonStatus: 'draft', deletedAt: null },
  ];
  const locations: AnyRecord[] = [{ id: 'location-1', projectId: 'project-1', name: '无光遗迹', summary: '吞噬记忆的星门遗迹', importance: 9, canonStatus: 'confirmed', deletedAt: null }];
  const factions: AnyRecord[] = [{ id: 'faction-1', projectId: 'project-1', name: '旧帝国残党', summary: '追索王座的势力', importance: 8, canonStatus: 'confirmed', deletedAt: null }];
  const species: AnyRecord[] = [{ id: 'species-1', projectId: 'project-1', name: '潮汐民', summary: '能读取记忆潮汐', importance: 7, canonStatus: 'confirmed', deletedAt: null }];
  const worldRules: AnyRecord[] = [{ id: 'world-rule-1', projectId: 'project-1', title: '记忆守恒', summary: '开启星门必须失去一段记忆', importance: 10, canonStatus: 'confirmed', deletedAt: null }];
  const worldItems: AnyRecord[] = [{ id: 'world-item-1', projectId: 'project-1', name: '星图', summary: '指向王座的残片', importance: 6, canonStatus: 'confirmed', deletedAt: null }];
  const storyItems: AnyRecord[] = [{ id: 'story-item-1', projectId: 'project-1', name: '骨钥', summary: '开门道具', importance: 5, canonStatus: 'confirmed', deletedAt: null }];
  const abilities: AnyRecord[] = [{ id: 'ability-1', projectId: 'project-1', name: '潮汐视', summary: '看见过去', importance: 4, canonStatus: 'confirmed', deletedAt: null }];
  const generatedDrafts: AnyRecord[] = [
    { id: 'draft-1', projectId: 'project-1', targetType: 'chapter_version', targetId: 'chapter-1', draftType: 'write', payload: { content: '候选正文' }, textPreview: '候选正文', status: 'pending', deletedAt: null },
    { id: 'draft-applied', projectId: 'project-1', targetType: 'chapter_version', targetId: 'chapter-1', draftType: 'write', payload: { content: '已应用不应出现' }, textPreview: '已应用', status: 'applied', deletedAt: null },
  ];
  const contextSnapshots: AnyRecord[] = [];
  let idCounter = 1;

  const matches = (row: AnyRecord, where: AnyRecord = {}): boolean => Object.entries(where).every(([key, value]) => {
    if (value === undefined) return true;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if ('in' in value) return value.in.includes(row[key]);
      if ('lt' in value) return row[key] < value.lt;
      if ('lte' in value) return row[key] <= value.lte;
      if ('gt' in value) return row[key] > value.gt;
      if ('gte' in value) return row[key] >= value.gte;
    }
    return row[key] === value;
  });

  const orderRows = (rows: AnyRecord[], orderBy?: AnyRecord | AnyRecord[]) => {
    const orders = Array.isArray(orderBy) ? orderBy : orderBy ? [orderBy] : [];
    return [...rows].sort((a, b) => {
      for (const order of orders) {
        for (const [field, direction] of Object.entries(order) as [string, 'asc' | 'desc'][]) {
          const av = a[field] instanceof Date ? a[field].getTime() : a[field];
          const bv = b[field] instanceof Date ? b[field].getTime() : b[field];
          if (av === bv) continue;
          return (av > bv ? 1 : -1) * (direction === 'desc' ? -1 : 1);
        }
      }
      return 0;
    });
  };

  const makeModel = (rows: AnyRecord[], prefix: string) => ({
    findFirst: async ({ where, orderBy }: AnyRecord = {}) => orderRows(rows.filter((row) => matches(row, where)), orderBy)[0] ?? null,
    findMany: async ({ where, orderBy, take }: AnyRecord = {}) => {
      const result = orderRows(rows.filter((row) => matches(row, where)), orderBy);
      return typeof take === 'number' ? result.slice(0, take) : result;
    },
    create: async ({ data }: AnyRecord) => {
      const row = { id: `${prefix}-${idCounter++}`, createdAt: now, updatedAt: now, ...data };
      rows.push(row);
      return row;
    },
  });

  const prisma = {
    project: makeModel(projects, 'project'),
    volume: makeModel(volumes, 'volume'),
    chapter: makeModel(chapters, 'chapter'),
    chapterPlan: makeModel(chapterPlans, 'chapter-plan'),
    chapterSummary: makeModel(chapterSummaries, 'chapter-summary'),
    scene: makeModel(scenes, 'scene'),
    scenePlan: makeModel(scenePlans, 'scene-plan'),
    sceneSummary: makeModel(sceneSummaries, 'scene-summary'),
    sceneHandoff: makeModel(sceneHandoffs, 'scene-handoff'),
    character: makeModel(characters, 'character'),
    location: makeModel(locations, 'location'),
    faction: makeModel(factions, 'faction'),
    species: makeModel(species, 'species'),
    worldRule: makeModel(worldRules, 'world-rule'),
    worldItem: makeModel(worldItems, 'world-item'),
    storyItem: makeModel(storyItems, 'story-item'),
    ability: makeModel(abilities, 'ability'),
    generatedDraft: makeModel(generatedDrafts, 'draft'),
    contextSnapshot: makeModel(contextSnapshots, 'snapshot'),
  };

  return { data: { contextSnapshots }, prisma };
}

function hasSourceRef(result: AnyRecord, type: string, id: string) {
  return result.sourceRefs.some((ref: AnyRecord) => ref.type === type && ref.id === id);
}

async function testGenerateChapterPreviewUsesConfirmedStructuredSources() {
  const { prisma } = createPrismaStub();
  const service = new ContextBuilderService(prisma as any);

  const preview = await service.preview('project-1', { purpose: 'generate_chapter', chapterId: 'chapter-1' });

  assert.equal(preview.projectId, 'project-1');
  assert.equal(preview.purpose, 'generate_chapter');
  assert.equal(preview.targetType, 'chapter');
  assert.equal(preview.targetId, 'chapter-1');
  assert.equal(preview.payload.project.title, '星海遗民');
  assert.equal(preview.payload.chapterPlan.id, 'chapter-plan-confirmed');
  assert.equal(preview.payload.previousChapterSummaries.length, 1);
  assert.equal(preview.payload.previousChapterSummaries[0].id, 'chapter-summary-prev');
  assert.equal(preview.payload.previousChapterSummaries[0].summary.includes('未确认'), false);
  assert.equal(preview.payload.assets.characters.some((character: AnyRecord) => character.id === 'character-draft'), false);
  assert.equal(preview.payload.selectedDrafts.length, 0);
  assert(hasSourceRef(preview, 'project', 'project-1'));
  assert(hasSourceRef(preview, 'chapter', 'chapter-1'));
  assert(hasSourceRef(preview, 'chapter_plan', 'chapter-plan-confirmed'));
  assert(hasSourceRef(preview, 'chapter_summary', 'chapter-summary-prev'));
  assert(hasSourceRef(preview, 'character', 'character-1'));
}

async function testDraftsOnlyEnterWhenExplicitlySelected() {
  const { prisma } = createPrismaStub();
  const service = new ContextBuilderService(prisma as any);

  const defaultPreview = await service.preview('project-1', { purpose: 'generate_chapter', chapterId: 'chapter-1' });
  assert.equal(defaultPreview.payload.selectedDrafts.length, 0);
  assert.equal(hasSourceRef(defaultPreview, 'generated_draft', 'draft-1'), false);

  const selectedPreview = await service.preview('project-1', { purpose: 'generate_chapter', chapterId: 'chapter-1', selectedDraftIds: ['draft-1'] });
  assert.equal(selectedPreview.payload.selectedDrafts.length, 1);
  assert.equal(selectedPreview.payload.selectedDrafts[0].id, 'draft-1');
  assert(hasSourceRef(selectedPreview, 'generated_draft', 'draft-1'));
}

async function testGenerateScenePreviewIncludesPreviousHandoffAndRelatedAssets() {
  const { prisma } = createPrismaStub();
  const service = new ContextBuilderService(prisma as any);

  const preview = await service.preview('project-1', { purpose: 'generate_scene', sceneId: 'scene-2' });

  assert.equal(preview.targetType, 'scene');
  assert.equal(preview.chapterId, 'chapter-1');
  assert.equal(preview.sceneId, 'scene-2');
  assert.equal(preview.payload.scene.id, 'scene-2');
  assert.equal(preview.payload.scenePlan.id, 'scene-plan-2');
  assert.equal(preview.payload.previousSceneHandoffs.length, 1);
  assert.equal(preview.payload.previousHandoff.id, 'scene-handoff-1');
  assert.equal(preview.payload.related.povCharacter.id, 'character-1');
  assert.equal(preview.payload.related.primaryLocation.id, 'location-1');
  assert(hasSourceRef(preview, 'scene', 'scene-2'));
  assert(hasSourceRef(preview, 'scene_plan', 'scene-plan-2'));
  assert(hasSourceRef(preview, 'scene_handoff', 'scene-handoff-1'));
}

async function testUnimplementedPurposeReturnsP1BoundaryErrorWithoutFallback() {
  const { prisma } = createPrismaStub();
  const service = new ContextBuilderService(prisma as any);

  await assert.rejects(
    () => service.preview('project-1', { purpose: 'generate_characters' }),
    (error) => error instanceof BadRequestException && error.message === 'Context purpose generate_characters is not implemented in P1',
  );
}

async function testMissingSceneAndProjectBoundaryErrors() {
  const { prisma } = createPrismaStub();
  const service = new ContextBuilderService(prisma as any);

  await assert.rejects(() => service.preview('project-1', { purpose: 'generate_scene', sceneId: 'missing' }), (error) => error instanceof NotFoundException);
  await assert.rejects(() => service.preview('project-2', { purpose: 'generate_chapter', chapterId: 'chapter-1' }), (error) => error instanceof NotFoundException);
}

async function testCreateSnapshotPersistsBuiltContext() {
  const { data, prisma } = createPrismaStub();
  const service = new ContextBuilderService(prisma as any);

  const snapshot = await service.createSnapshot('project-1', { purpose: 'generate_chapter', chapterId: 'chapter-1', selectedDraftIds: ['draft-1'] });

  assert.equal(data.contextSnapshots.length, 1);
  assert.equal(snapshot.projectId, 'project-1');
  assert.equal(snapshot.purpose, 'generate_chapter');
  assert.equal(snapshot.targetType, 'chapter');
  assert.equal(snapshot.targetId, 'chapter-1');
  assert.equal(snapshot.chapterId, 'chapter-1');
  assert((snapshot.tokenEstimate ?? 0) > 0);
  assert(hasSourceRef(snapshot, 'generated_draft', 'draft-1'));

  const listed = await service.listSnapshots('project-1');
  assert.equal(listed.length, 1);
  const loaded = await service.getSnapshot('project-1', snapshot.id);
  assert.equal(loaded.id, snapshot.id);
}

async function run() {
  await testGenerateChapterPreviewUsesConfirmedStructuredSources();
  await testDraftsOnlyEnterWhenExplicitlySelected();
  await testGenerateScenePreviewIncludesPreviousHandoffAndRelatedAssets();
  await testUnimplementedPurposeReturnsP1BoundaryErrorWithoutFallback();
  await testMissingSceneAndProjectBoundaryErrors();
  await testCreateSnapshotPersistsBuiltContext();
  console.log('context builder service behavior tests passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
