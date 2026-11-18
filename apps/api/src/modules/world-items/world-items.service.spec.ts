import { strict as assert } from 'node:assert';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WorldItemsService } from './world-items.service';

type AnyRecord = Record<string, any>;

function createPrismaStub() {
  const projects = [{ id: 'project-1', deletedAt: null }];
  const worldItems: AnyRecord[] = [
    { id: 'legacy-location', projectId: 'project-1', type: 'location', name: '旧地点条目', deletedAt: null, importance: 0, updatedAt: new Date('2026-01-01') },
  ];
  let idCounter = 1;
  const matches = (row: AnyRecord, where: AnyRecord) => Object.entries(where).every(([key, value]) => row[key] === value);
  const orderRows = (rows: AnyRecord[], orderBy?: AnyRecord | AnyRecord[]) => !orderBy ? rows : [...rows].sort((a, b) => { for (const order of (Array.isArray(orderBy) ? orderBy : [orderBy])) { const [field, direction] = Object.entries(order)[0] as [string, 'asc' | 'desc']; const av = a[field] instanceof Date ? a[field].getTime() : a[field]; const bv = b[field] instanceof Date ? b[field].getTime() : b[field]; if (av !== bv) return (av > bv ? 1 : -1) * (direction === 'desc' ? -1 : 1); } return 0; });
  const makeModel = (rows: AnyRecord[], prefix: string) => ({
    findFirst: async ({ where, orderBy }: AnyRecord) => orderRows(rows.filter((row) => matches(row, where)), orderBy)[0] ?? null,
    findMany: async ({ where, orderBy }: AnyRecord) => orderRows(rows.filter((row) => matches(row, where)), orderBy),
    create: async ({ data }: AnyRecord) => { const now = new Date(); const row = { id: `${prefix}-${idCounter++}`, createdAt: now, updatedAt: now, deletedAt: null, ...data }; rows.push(row); return row; },
    update: async ({ where, data }: AnyRecord) => { const row = rows.find((item) => matches(item, where)); if (!row) throw new Error(`${prefix} not found`); Object.assign(row, data, { updatedAt: new Date() }); return row; },
  });
  return { prisma: { project: makeModel(projects, 'project'), worldItem: makeModel(worldItems, 'world-item') } };
}

async function testCreateTrimAndDefaultType() {
  const { prisma } = createPrismaStub();
  const service = new WorldItemsService(prisma as any);
  const item = await service.createWorldItem('project-1', { name: ' 修炼体系 ', summary: ' 境界分层 ', tags: [' 功法 ', ' '], visibility: ' hidden ' });
  assert.equal(item.name, '修炼体系');
  assert.equal(item.type, 'custom');
  assert.equal(item.summary, '境界分层');
  assert.deepEqual(item.tags, ['功法']);
  assert.equal(item.visibility, 'hidden');
  assert.equal(item.canonStatus, 'draft');
}

async function testAllowedGenericTypesAndLegacyRead() {
  const { prisma } = createPrismaStub();
  const service = new WorldItemsService(prisma as any);
  const created = await service.createWorldItem('project-1', { name: '货币制度', type: 'social_system' });
  const listed = await service.listWorldItems('project-1');
  assert.equal(created.type, 'social_system');
  assert.ok(listed.some((item) => item.id === 'legacy-location'));
  await assert.rejects(() => service.createWorldItem('project-1', { name: '新地点', type: 'location' }), (error) => error instanceof BadRequestException);
  await assert.rejects(() => service.updateWorldItem('project-1', created.id, { type: 'item' }), (error) => error instanceof BadRequestException);
}

async function testBoundariesAndStatusActions() {
  const { prisma } = createPrismaStub();
  const service = new WorldItemsService(prisma as any);
  const item = await service.createWorldItem('project-1', { name: '纪元传说', type: 'history' });
  const confirmed = await service.confirmWorldItem('project-1', item.id);
  assert.equal(confirmed.canonStatus, 'confirmed');
  const archived = await service.archiveWorldItem('project-1', item.id);
  assert.equal(archived.canonStatus, 'archived');
  const deleted = await service.deleteWorldItem('project-1', item.id);
  assert.ok(deleted.deletedAt instanceof Date);
  await assert.rejects(() => service.getWorldItem('project-2', item.id), (error) => error instanceof NotFoundException);
}

async function run() {
  await testCreateTrimAndDefaultType();
  await testAllowedGenericTypesAndLegacyRead();
  await testBoundariesAndStatusActions();
  console.log('world items service behavior tests passed');
}

run().catch((error) => { console.error(error); process.exit(1); });
