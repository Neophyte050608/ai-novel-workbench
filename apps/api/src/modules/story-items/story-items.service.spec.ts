import { strict as assert } from 'node:assert';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { StoryItemsService } from './story-items.service';

type AnyRecord = Record<string, any>;
function createPrismaStub() {
  const projects = [{ id: 'project-1', deletedAt: null }];
  const storyItems: AnyRecord[] = [];
  const states: AnyRecord[] = [];
  const rules: AnyRecord[] = [];
  const chapters: AnyRecord[] = [{ id: 'chapter-1', projectId: 'project-1', deletedAt: null }];
  const worldRules: AnyRecord[] = [{ id: 'rule-1', projectId: 'project-1', deletedAt: null }];
  let idCounter = 1;
  const matches = (row: AnyRecord, where: AnyRecord) => Object.entries(where).every(([key, value]) => row[key] === value);
  const orderRows = (rows: AnyRecord[], orderBy?: AnyRecord | AnyRecord[]) => !orderBy ? rows : [...rows].sort((a, b) => { for (const order of (Array.isArray(orderBy) ? orderBy : [orderBy])) { const [field, direction] = Object.entries(order)[0] as [string, 'asc' | 'desc']; const av = a[field] instanceof Date ? a[field].getTime() : a[field]; const bv = b[field] instanceof Date ? b[field].getTime() : b[field]; if (av !== bv) return (av > bv ? 1 : -1) * (direction === 'desc' ? -1 : 1); } return 0; });
  const makeModel = (rows: AnyRecord[], prefix: string) => ({
    findFirst: async ({ where, orderBy }: AnyRecord) => orderRows(rows.filter((row) => matches(row, where)), orderBy)[0] ?? null,
    findMany: async ({ where, orderBy }: AnyRecord) => orderRows(rows.filter((row) => matches(row, where)), orderBy),
    create: async ({ data }: AnyRecord) => { const now = new Date(); const row = { id: `${prefix}-${idCounter++}`, createdAt: now, updatedAt: now, deletedAt: null, ...data }; rows.push(row); return row; },
    update: async ({ where, data }: AnyRecord) => { const row = rows.find((item) => matches(item, where)); if (!row) throw new Error(`${prefix} not found`); Object.assign(row, data, { updatedAt: new Date() }); return row; },
    delete: async ({ where }: AnyRecord) => rows.splice(rows.findIndex((item) => matches(item, where)), 1)[0],
  });
  return { prisma: { project: makeModel(projects, 'project'), storyItem: makeModel(storyItems, 'story-item'), storyItemState: makeModel(states, 'state'), storyItemRule: makeModel(rules, 'rule'), chapter: makeModel(chapters, 'chapter'), worldRule: makeModel(worldRules, 'world-rule') } };
}

async function testCreateProfileAndTrim() {
  const { prisma } = createPrismaStub();
  const service = new StoryItemsService(prisma as any);
  const item = await service.createStoryItem('project-1', { name: ' 太玄剑 ', aliases: [' 神剑 ', ' '] });
  const state = await service.createState('project-1', item.id, { chapterId: ' chapter-1 ', owner: ' 主角 ' });
  const rule = await service.createRule('project-1', item.id, { worldRuleId: ' rule-1 ' });
  const profile = await service.getProfile('project-1', item.id);
  assert.equal(item.name, '太玄剑');
  assert.deepEqual(item.aliases, ['神剑']);
  assert.equal(state.chapterId, 'chapter-1');
  assert.equal(rule.worldRuleId, 'rule-1');
  assert.equal(profile.storyItem.id, item.id);
  assert.equal(profile.latestState?.id, state.id);
  assert.equal(profile.rules[0].id, rule.id);
}

async function testBoundaries() {
  const { prisma } = createPrismaStub();
  const service = new StoryItemsService(prisma as any);
  const item = await service.createStoryItem('project-1', { name: '太玄剑' });
  await assert.rejects(() => service.createRule('project-1', item.id, { worldRuleId: 'foreign-rule' }), (error) => error instanceof BadRequestException);
  await assert.rejects(() => service.getStoryItem('project-2', item.id), (error) => error instanceof NotFoundException);
}

async function run() {
  await testCreateProfileAndTrim();
  await testBoundaries();
  console.log('story items service behavior tests passed');
}
run().catch((error) => { console.error(error); process.exit(1); });
