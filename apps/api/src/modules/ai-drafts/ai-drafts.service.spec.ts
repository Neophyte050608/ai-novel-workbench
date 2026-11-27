import { strict as assert } from 'node:assert';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AiDraftsService } from './ai-drafts.service';

type AnyRecord = Record<string, any>;

function createPrismaStub() {
  const now = new Date('2026-11-27T00:00:00.000Z');
  const projects: AnyRecord[] = [{ id: 'project-1', deletedAt: null }, { id: 'project-2', deletedAt: null }];
  const chapters: AnyRecord[] = [{ id: 'chapter-1', projectId: 'project-1', currentVersionId: null, deletedAt: null }];
  const scenes: AnyRecord[] = [{ id: 'scene-1', projectId: 'project-1', chapterId: 'chapter-1', currentPlanId: null, currentVersionId: null, deletedAt: null }];
  const generatedDrafts: AnyRecord[] = [];
  const chapterVersions: AnyRecord[] = [];
  const scenePlans: AnyRecord[] = [];
  const sceneVersions: AnyRecord[] = [];
  const chapterSummaries: AnyRecord[] = [];
  let idCounter = 1;

  const matches = (row: AnyRecord, where: AnyRecord): boolean => Object.entries(where ?? {}).every(([key, value]) => {
    if (value && typeof value === 'object' && 'in' in value) return value.in.includes(row[key]);
    if (value === undefined) return true;
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
    findFirst: async ({ where, orderBy }: AnyRecord) => orderRows(rows.filter((row) => matches(row, where)), orderBy)[0] ?? null,
    findMany: async ({ where, orderBy }: AnyRecord) => orderRows(rows.filter((row) => matches(row, where)), orderBy),
    create: async ({ data }: AnyRecord) => {
      const row = { id: `${prefix}-${idCounter++}`, createdAt: now, updatedAt: now, deletedAt: null, ...data };
      rows.push(row);
      return row;
    },
    update: async ({ where, data }: AnyRecord) => {
      const row = rows.find((item) => matches(item, where));
      if (!row) throw new Error(`${prefix} not found`);
      Object.assign(row, data, { updatedAt: now });
      return row;
    },
  });

  const prisma = {
    project: makeModel(projects, 'project'),
    chapter: makeModel(chapters, 'chapter'),
    scene: makeModel(scenes, 'scene'),
    generatedDraft: makeModel(generatedDrafts, 'draft'),
    chapterVersion: makeModel(chapterVersions, 'chapter-version'),
    scenePlan: makeModel(scenePlans, 'scene-plan'),
    sceneVersion: makeModel(sceneVersions, 'scene-version'),
    chapterSummary: makeModel(chapterSummaries, 'chapter-summary'),
    $transaction: async (callbackOrOps: any) => typeof callbackOrOps === 'function' ? callbackOrOps(prisma) : Promise.all(callbackOrOps),
  };

  return { data: { chapters, scenes, generatedDrafts, chapterVersions, scenePlans, sceneVersions, chapterSummaries }, prisma };
}

async function testCreateAndPatchOnlyPendingDraft() {
  const { prisma } = createPrismaStub();
  const service = new AiDraftsService(prisma as any);
  const draft = await service.createDraft('project-1', { targetType: 'chapter_version', targetId: 'chapter-1', draftType: 'continue', payload: { content: '正文' }, textPreview: '预览' });

  assert.equal(draft.status, 'pending');
  assert.equal(draft.projectId, 'project-1');

  const patched = await service.updateDraft('project-1', draft.id, { textPreview: '新预览', feedback: '更燃一点', status: 'applied' } as any);
  assert.equal(patched.textPreview, '新预览');
  assert.equal(patched.feedback, '更燃一点');
  assert.equal(patched.status, 'pending');

  await service.discardDraft('project-1', draft.id);
  await assert.rejects(() => service.updateDraft('project-1', draft.id, { textPreview: '不能改' }), (error) => error instanceof BadRequestException);
}

async function testProjectBoundary() {
  const { prisma } = createPrismaStub();
  const service = new AiDraftsService(prisma as any);
  const draft = await service.createDraft('project-1', { targetType: 'chapter_version', targetId: 'chapter-1', draftType: 'continue', payload: { content: '正文' } });

  await assert.rejects(() => service.getDraft('project-2', draft.id), (error) => error instanceof NotFoundException);
}

async function testApplyChapterVersionActivatesOnlyOnRequest() {
  const { data, prisma } = createPrismaStub();
  const service = new AiDraftsService(prisma as any);
  const draft = await service.createDraft('project-1', { targetType: 'chapter_version', targetId: 'chapter-1', draftType: 'continue', payload: { content: '章节正文' } });

  const applied = await service.applyDraft('project-1', draft.id, { activate: true });

  assert.equal(applied.status, 'applied');
  assert.equal(applied.appliedTargetType, 'chapter_version');
  assert.equal(data.chapterVersions.length, 1);
  assert.equal(data.chapterVersions[0].content, '章节正文');
  assert.equal(data.chapters[0].currentVersionId, data.chapterVersions[0].id);
}

async function testApplyScenePlanAndVersionUseSceneBoundary() {
  const { data, prisma } = createPrismaStub();
  const service = new AiDraftsService(prisma as any);
  const planDraft = await service.createDraft('project-1', { targetType: 'scene_plan', targetId: 'scene-1', draftType: 'create', payload: { title: '计划', outline: '推进冲突' } });
  const versionDraft = await service.createDraft('project-1', { targetType: 'scene_version', targetId: 'scene-1', draftType: 'write', payload: { content: '场景正文' } });

  await service.applyDraft('project-1', planDraft.id, { activate: true });
  await service.applyDraft('project-1', versionDraft.id, { activate: true });

  assert.equal(data.scenePlans.length, 1);
  assert.equal(data.sceneVersions.length, 1);
  assert.equal(data.scenes[0].currentPlanId, data.scenePlans[0].id);
  assert.equal(data.scenes[0].currentVersionId, data.sceneVersions[0].id);
}

async function testRegenerateSupersedesAndCreatesMockPendingDraft() {
  const { prisma } = createPrismaStub();
  const service = new AiDraftsService(prisma as any);
  const draft = await service.createDraft('project-1', { targetType: 'chapter_version', targetId: 'chapter-1', draftType: 'continue', payload: { content: '第一版' } });

  const next = await service.regenerateDraft('project-1', draft.id, { feedback: '加强悬念' });
  const old = await service.getDraft('project-1', draft.id);

  assert.equal(old.status, 'superseded');
  assert.equal(next.status, 'pending');
  assert.equal(next.previousDraftId, draft.id);
  assert.match(next.textPreview ?? '', /基于反馈创建新草稿/);
}

async function run() {
  await testCreateAndPatchOnlyPendingDraft();
  await testProjectBoundary();
  await testApplyChapterVersionActivatesOnlyOnRequest();
  await testApplyScenePlanAndVersionUseSceneBoundary();
  await testRegenerateSupersedesAndCreatesMockPendingDraft();
  console.log('ai drafts service behavior tests passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
