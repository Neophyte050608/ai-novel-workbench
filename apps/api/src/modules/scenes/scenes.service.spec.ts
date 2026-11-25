import { strict as assert } from 'node:assert';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ScenesService } from './scenes.service';

type AnyRecord = Record<string, any>;

function createPrismaStub() {
  const now = new Date();
  const projects: AnyRecord[] = [{ id: 'project-1', deletedAt: null }];
  const chapters: AnyRecord[] = [
    { id: 'chapter-1', projectId: 'project-1', deletedAt: null },
    { id: 'chapter-2', projectId: 'project-1', deletedAt: null },
  ];
  const characters: AnyRecord[] = [{ id: 'character-1', projectId: 'project-1', deletedAt: null }];
  const locations: AnyRecord[] = [{ id: 'location-1', projectId: 'project-1', deletedAt: null }];
  const chapterPlans: AnyRecord[] = [{ id: 'chapter-plan-1', projectId: 'project-1', chapterId: 'chapter-1', deletedAt: null }];
  const scenes: AnyRecord[] = [];
  const scenePlans: AnyRecord[] = [];
  const sceneVersions: AnyRecord[] = [];
  const sceneSummaries: AnyRecord[] = [];
  const sceneHandoffs: AnyRecord[] = [];
  let idCounter = 1;

  const matches = (row: AnyRecord, where: AnyRecord): boolean =>
    Object.entries(where ?? {}).every(([key, value]) => {
      if (value && typeof value === 'object' && 'in' in value) return value.in.includes(row[key]);
      if (value && typeof value === 'object' && 'lt' in value) return row[key] < value.lt;
      return row[key] === value;
    });

  const compareRows = (a: AnyRecord, b: AnyRecord, order: AnyRecord) => {
    for (const [field, direction] of Object.entries(order) as [string, 'asc' | 'desc'][]) {
      const av = a[field] instanceof Date ? a[field].getTime() : a[field];
      const bv = b[field] instanceof Date ? b[field].getTime() : b[field];
      if (av === bv) continue;
      return (av > bv ? 1 : -1) * (direction === 'desc' ? -1 : 1);
    }
    return 0;
  };

  const orderRows = (rows: AnyRecord[], orderBy?: AnyRecord | AnyRecord[]) => {
    if (!orderBy) return rows;
    const orders = Array.isArray(orderBy) ? orderBy : [orderBy];
    return [...rows].sort((a, b) => {
      for (const order of orders) {
        const result = compareRows(a, b, order);
        if (result !== 0) return result;
      }
      return 0;
    });
  };

  const selectRow = (row: AnyRecord, select?: AnyRecord) => {
    if (!row || !select) return row;
    return Object.fromEntries(Object.entries(select).filter(([, enabled]) => enabled).map(([key]) => [key, row[key]]));
  };

  const makeModel = (rows: AnyRecord[], prefix: string) => ({
    findFirst: async ({ where, orderBy, select }: AnyRecord) => selectRow(orderRows(rows.filter((row) => matches(row, where)), orderBy)[0] ?? null, select),
    findMany: async ({ where, orderBy, select }: AnyRecord) => orderRows(rows.filter((row) => matches(row, where)), orderBy).map((row) => selectRow(row, select)),
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
    character: makeModel(characters, 'character'),
    location: makeModel(locations, 'location'),
    chapterPlan: makeModel(chapterPlans, 'chapter-plan'),
    scene: makeModel(scenes, 'scene'),
    scenePlan: makeModel(scenePlans, 'scene-plan'),
    sceneVersion: makeModel(sceneVersions, 'scene-version'),
    sceneSummary: makeModel(sceneSummaries, 'scene-summary'),
    sceneHandoff: makeModel(sceneHandoffs, 'scene-handoff'),
    $transaction: async (operations: Promise<unknown>[]) => Promise.all(operations),
  };

  return { data: { scenes, scenePlans, sceneVersions, sceneSummaries, sceneHandoffs }, prisma };
}

async function testChildReadsRejectSoftDeletedParentScene() {
  const { prisma } = createPrismaStub();
  const service = new ScenesService(prisma as any);
  const scene = await service.createScene('project-1', 'chapter-1', { title: '开场' });
  const plan = await service.createPlan('project-1', scene.id, { title: '计划' });
  await service.deleteScene('project-1', scene.id);

  await assert.rejects(
    () => service.getPlan('project-1', plan.id),
    (error) => error instanceof NotFoundException,
  );
}

async function testActivatePlanRequiresSameScene() {
  const { prisma } = createPrismaStub();
  const service = new ScenesService(prisma as any);
  const first = await service.createScene('project-1', 'chapter-1', { title: '一' });
  const second = await service.createScene('project-1', 'chapter-1', { title: '二' });
  const plan = await service.createPlan('project-1', first.id, { title: '计划' });

  await assert.rejects(
    () => service.activatePlan('project-1', second.id, plan.id),
    (error) => error instanceof BadRequestException,
  );
}

async function testProfileReportsReadiness() {
  const { prisma } = createPrismaStub();
  const service = new ScenesService(prisma as any);
  const scene = await service.createScene('project-1', 'chapter-1', {
    title: '开场',
    povCharacterId: 'character-1',
    primaryLocationId: 'location-1',
  });
  const plan = await service.createPlan('project-1', scene.id, {
    goal: '进入遗迹',
    outline: '发现入口',
    conflict: '守卫拦路',
    choice: '冒险进入',
    consequence: '惊动敌人',
    readerPayoff: '看到遗迹真相',
  });
  await service.activatePlan('project-1', scene.id, plan.id);

  const profile = await service.getProfile('project-1', scene.id);

  assert.equal(profile.scene.id, scene.id);
  assert.equal(profile.currentPlan?.id, plan.id);
  assert.equal(profile.readiness.ready, true);
}

async function testScenePatchCannotChangeCurrentVersion() {
  const { prisma } = createPrismaStub();
  const service = new ScenesService(prisma as any);
  const scene = await service.createScene('project-1', 'chapter-1', { title: '一' });
  const version = await service.createVersion('project-1', scene.id, { content: '正文' });

  const updated = await service.updateScene('project-1', scene.id, { title: '二', currentVersionId: version.id } as any);

  assert.equal(updated.title, '二');
  assert.notEqual(updated.currentVersionId, version.id);
}

async function testChildPatchCannotChangeSceneOrCanon() {
  const { prisma } = createPrismaStub();
  const service = new ScenesService(prisma as any);
  const first = await service.createScene('project-1', 'chapter-1', { title: '一' });
  const second = await service.createScene('project-1', 'chapter-1', { title: '二' });
  const plan = await service.createPlan('project-1', first.id, { title: '计划' });
  const version = await service.createVersion('project-1', first.id, { content: '正文' });
  const summary = await service.createSummary('project-1', first.id, { summary: '摘要' });
  const handoff = await service.createHandoff('project-1', first.id, { createdBy: 'me' });

  const updatedPlan = await service.updatePlan('project-1', plan.id, { title: '新计划', sceneId: second.id, canonStatus: 'confirmed' } as any);
  const updatedVersion = await service.updateVersion('project-1', version.id, { content: '新正文', sceneId: second.id, canonStatus: 'confirmed' } as any);
  const updatedSummary = await service.updateSummary('project-1', summary.id, { summary: '新摘要', sceneId: second.id, canonStatus: 'confirmed' } as any);
  const updatedHandoff = await service.updateHandoff('project-1', handoff.id, { createdBy: 'you', sceneId: second.id, canonStatus: 'confirmed' } as any);

  assert.equal(updatedPlan.title, '新计划');
  assert.equal(updatedPlan.sceneId, first.id);
  assert.equal(updatedPlan.canonStatus, 'draft');
  assert.equal(updatedVersion.content, '新正文');
  assert.equal(updatedVersion.sceneId, first.id);
  assert.equal(updatedSummary.summary, '新摘要');
  assert.equal(updatedSummary.sceneId, first.id);
  assert.equal(updatedSummary.canonStatus, 'draft');
  assert.equal(updatedHandoff.createdBy, 'you');
  assert.equal(updatedHandoff.sceneId, first.id);
  assert.equal(updatedHandoff.canonStatus, 'draft');
}

async function testNextSceneAllowsSameProjectAcrossChapter() {
  const { prisma } = createPrismaStub();
  const service = new ScenesService(prisma as any);
  const first = await service.createScene('project-1', 'chapter-1', { title: '一' });
  const next = await service.createScene('project-1', 'chapter-2', { title: '二' });

  const handoff = await service.createHandoff('project-1', first.id, { nextSceneId: next.id });

  assert.equal(handoff.nextSceneId, next.id);
  assert.equal(handoff.chapterId, 'chapter-1');
}

async function testRestoreDoesNotDowngradeConfirmedActiveScene() {
  const { prisma } = createPrismaStub();
  const service = new ScenesService(prisma as any);
  const scene = await service.createScene('project-1', 'chapter-1', { title: '一' });
  await service.confirmScene('project-1', scene.id);

  const restored = await service.restoreScene('project-1', scene.id);

  assert.equal(restored.deletedAt, null);
  assert.equal(restored.canonStatus, 'confirmed');
}

async function testReorderRejectsSubset() {
  const { prisma } = createPrismaStub();
  const service = new ScenesService(prisma as any);
  const first = await service.createScene('project-1', 'chapter-1', { title: '一' });
  await service.createScene('project-1', 'chapter-1', { title: '二' });

  await assert.rejects(
    () => service.reorderScenes('project-1', 'chapter-1', { sceneIds: [first.id] }),
    (error) => error instanceof BadRequestException,
  );
}

async function testProfileUsesConfirmedContextOnly() {
  const { data, prisma } = createPrismaStub();
  const service = new ScenesService(prisma as any);
  const scene = await service.createScene('project-1', 'chapter-1', { title: '一' });
  const draftSummary = await service.createSummary('project-1', scene.id, { summary: '草稿摘要' });
  const confirmedSummary = await service.createSummary('project-1', scene.id, { summary: '确认摘要' });
  const draftHandoff = await service.createHandoff('project-1', scene.id, { createdBy: 'draft' });
  const confirmedHandoff = await service.createHandoff('project-1', scene.id, { createdBy: 'confirmed' });
  data.sceneSummaries.find((item) => item.id === confirmedSummary.id)!.canonStatus = 'confirmed';
  data.sceneHandoffs.find((item) => item.id === confirmedHandoff.id)!.canonStatus = 'confirmed';

  const profile = await service.getProfile('project-1', scene.id);

  assert.notEqual(profile.latestSummary?.id, draftSummary.id);
  assert.equal(profile.latestSummary?.id, confirmedSummary.id);
  assert.notEqual(profile.latestHandoff?.id, draftHandoff.id);
  assert.equal(profile.latestHandoff?.id, confirmedHandoff.id);
}

async function testActivateTrimsIds() {
  const { prisma } = createPrismaStub();
  const service = new ScenesService(prisma as any);
  const scene = await service.createScene('project-1', 'chapter-1', { title: '一' });
  const plan = await service.createPlan('project-1', scene.id, { title: '计划' });
  const version = await service.createVersion('project-1', scene.id, { content: '正文' });

  const withPlan = await service.activatePlan('project-1', scene.id, ` ${plan.id} `);
  const withVersion = await service.activateVersion('project-1', scene.id, ` ${version.id} `);

  assert.equal(withPlan.currentPlanId, plan.id);
  assert.equal(withVersion.currentVersionId, version.id);
}

async function testSummaryLifecycleActions() {
  const { prisma } = createPrismaStub();
  const service = new ScenesService(prisma as any);
  const scene = await service.createScene('project-1', 'chapter-1', { title: '一' });
  const summary = await service.createSummary('project-1', scene.id, { summary: '摘要' });

  const confirmed = await service.confirmSummary('project-1', summary.id);
  assert.equal(confirmed.canonStatus, 'confirmed');

  const archived = await service.archiveSummary('project-1', summary.id);
  assert.equal(archived.canonStatus, 'archived');

  const restored = await service.restoreSummary('project-1', summary.id);
  assert.equal(restored.deletedAt, null);
  assert.equal(restored.canonStatus, 'draft');
}

async function testHandoffLifecycleActions() {
  const { prisma } = createPrismaStub();
  const service = new ScenesService(prisma as any);
  const scene = await service.createScene('project-1', 'chapter-1', { title: '一' });
  const handoff = await service.createHandoff('project-1', scene.id, { createdBy: 'me' });

  const confirmed = await service.confirmHandoff('project-1', handoff.id);
  assert.equal(confirmed.canonStatus, 'confirmed');

  const archived = await service.archiveHandoff('project-1', handoff.id);
  assert.equal(archived.canonStatus, 'archived');

  const restored = await service.restoreHandoff('project-1', handoff.id);
  assert.equal(restored.deletedAt, null);
  assert.equal(restored.canonStatus, 'draft');
}

async function run() {
  await testChildReadsRejectSoftDeletedParentScene();
  await testActivatePlanRequiresSameScene();
  await testProfileReportsReadiness();
  await testScenePatchCannotChangeCurrentVersion();
  await testChildPatchCannotChangeSceneOrCanon();
  await testNextSceneAllowsSameProjectAcrossChapter();
  await testRestoreDoesNotDowngradeConfirmedActiveScene();
  await testReorderRejectsSubset();
  await testProfileUsesConfirmedContextOnly();
  await testActivateTrimsIds();
  await testSummaryLifecycleActions();
  await testHandoffLifecycleActions();
  console.log('scenes service behavior tests passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
