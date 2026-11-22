import { strict as assert } from 'node:assert';
import { BadRequestException } from '@nestjs/common';
import { ChaptersService } from './chapters.service';

type AnyRecord = Record<string, any>;

function createPrismaStub() {
  const now = new Date();
  const projects: AnyRecord[] = [{ id: 'project-1', deletedAt: null }, { id: 'project-2', deletedAt: null }];
  const volumes: AnyRecord[] = [];
  const chapters: AnyRecord[] = [
    { id: 'chapter-1', projectId: 'project-1', title: '第一章', orderIndex: 0, status: 'draft', currentVersionId: null, deletedAt: null, createdAt: now, updatedAt: now },
    { id: 'chapter-2', projectId: 'project-2', title: '他项章节', orderIndex: 0, status: 'draft', currentVersionId: null, deletedAt: null, createdAt: now, updatedAt: now },
  ];
  const chapterVersions: AnyRecord[] = [];
  const scenes: AnyRecord[] = [];
  const sceneVersions: AnyRecord[] = [];
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
    volume: makeModel(volumes, 'volume'),
    chapter: makeModel(chapters, 'chapter'),
    chapterVersion: makeModel(chapterVersions, 'chapter-version'),
    scene: makeModel(scenes, 'scene'),
    sceneVersion: makeModel(sceneVersions, 'scene-version'),
    $transaction: async (operations: Promise<unknown>[]) => Promise.all(operations),
  };

  return { data: { chapters, chapterVersions, scenes, sceneVersions }, prisma };
}

async function testActivateVersionRequiresSameProjectAndChapter() {
  const { prisma } = createPrismaStub();
  const service = new ChaptersService(prisma as any);
  const ownVersion = await service.createVersion('project-1', 'chapter-1', { content: '本章正文' });
  const otherVersion = await service.createVersion('project-2', 'chapter-2', { content: '他项正文' });

  const chapter = await service.activateVersion('project-1', 'chapter-1', ownVersion.id);
  assert.equal(chapter.currentVersionId, ownVersion.id);

  await assert.rejects(
    () => service.activateVersion('project-1', 'chapter-1', otherVersion.id),
    (error) => error instanceof BadRequestException,
  );
}

async function testChapterPatchCannotChangeCurrentVersion() {
  const { prisma } = createPrismaStub();
  const service = new ChaptersService(prisma as any);
  const version = await service.createVersion('project-1', 'chapter-1', { content: '正文' });

  const updated = await service.updateChapter('project-1', 'chapter-1', { title: '新标题', currentVersionId: version.id } as any);

  assert.equal(updated.title, '新标题');
  assert.equal(updated.currentVersionId, null);
}

async function testVersionPatchCannotMoveChapter() {
  const { prisma } = createPrismaStub();
  const service = new ChaptersService(prisma as any);
  const version = await service.createVersion('project-1', 'chapter-1', { content: '正文' });

  const updated = await service.updateVersion('project-1', version.id, { content: '新正文', chapterId: 'chapter-2' } as any);

  assert.equal(updated.content, '新正文');
  assert.equal(updated.chapterId, 'chapter-1');
}

async function testAssembleFromScenesCreatesAndActivatesChapterVersion() {
  const { data, prisma } = createPrismaStub();
  const service = new ChaptersService(prisma as any);
  data.scenes.push(
    { id: 'scene-1', projectId: 'project-1', chapterId: 'chapter-1', title: '开场', orderIndex: 0, currentVersionId: 'scene-version-1', deletedAt: null, createdAt: new Date() },
    { id: 'scene-2', projectId: 'project-1', chapterId: 'chapter-1', title: '冲突', orderIndex: 1, currentVersionId: 'scene-version-2', deletedAt: null, createdAt: new Date() },
  );
  data.sceneVersions.push(
    { id: 'scene-version-1', projectId: 'project-1', chapterId: 'chapter-1', sceneId: 'scene-1', content: '第一段', deletedAt: null },
    { id: 'scene-version-2', projectId: 'project-1', chapterId: 'chapter-1', sceneId: 'scene-2', content: '第二段', deletedAt: null },
  );

  const version = await service.assembleFromScenes('project-1', 'chapter-1', { includeSceneTitles: true, activate: true });

  assert.equal(version.content, '## 开场\n\n第一段\n\n## 冲突\n\n第二段');
  assert.equal(version.source, 'user');
  assert.equal(version.changeSummary, 'assembled from current scene versions');
  assert.equal(data.chapters.find((chapter) => chapter.id === 'chapter-1')?.currentVersionId, version.id);
}

async function testAssembleReportsMissingOrDeletedSceneVersion() {
  const { data, prisma } = createPrismaStub();
  const service = new ChaptersService(prisma as any);
  data.scenes.push({ id: 'scene-1', projectId: 'project-1', chapterId: 'chapter-1', title: '开场', orderIndex: 0, currentVersionId: null, deletedAt: null, createdAt: new Date() });

  await assert.rejects(
    () => service.assembleFromScenes('project-1', 'chapter-1', {}),
    (error) => error instanceof BadRequestException && /missing currentVersionId/.test(error.message),
  );

  data.scenes[0].currentVersionId = 'scene-version-1';
  data.sceneVersions.push({ id: 'scene-version-1', projectId: 'project-1', chapterId: 'chapter-1', sceneId: 'scene-1', content: '正文', deletedAt: new Date() });

  await assert.rejects(
    () => service.assembleFromScenes('project-1', 'chapter-1', {}),
    (error) => error instanceof BadRequestException && /active SceneVersion/.test(error.message),
  );
}

async function run() {
  await testActivateVersionRequiresSameProjectAndChapter();
  await testChapterPatchCannotChangeCurrentVersion();
  await testVersionPatchCannotMoveChapter();
  await testAssembleFromScenesCreatesAndActivatesChapterVersion();
  await testAssembleReportsMissingOrDeletedSceneVersion();
  console.log('chapters.service.spec.ts passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
